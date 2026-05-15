/* ============================================================
 * src/engine/renderWorker.js
 *
 * Web Worker — bulk zodiac video encoder
 *
 * Track 1 (primary):  WebCodecs hardware encoder → FFmpeg mux only
 *                     Chrome 94+, Edge 94+, Chrome Android 94+
 *
 * Track 2 (fallback): JPEG sequence → FFmpeg libx264 encode
 *                     Safari, Firefox, any browser without VideoEncoder
 *
 * Receives:  { type: 'START', signs: [...], fontConfig: {...}, date: string }
 * Emits:     PROGRESS | SIGN_DONE | ALL_DONE | ERROR
 * ============================================================ */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import gsap from "gsap";
import { renderIntroFrame } from "../components/IntroFrame";
import { renderOutroFrame } from "../components/OutroFrame";
import { createZodiacTimeline } from "../components/ZodiacFrame";

// ── Static asset imports — Vite resolves these to hashed URL strings ───────────
import heartSrc from "../images/heart.png";
import trophySrc from "../images/trophy.png";
import moneyBagSrc from "../images/money-bag.png";
import crystalBallSrc from "../images/crystal-ball.png";
import ariesSrc from "../images/aries.png";
import taurusSrc from "../images/Taurus.png";
import geminiSrc from "../images/Gemini.png";
import cancerSrc from "../images/Cancer.png";
import leoSrc from "../images/Leo.png";
import virgoSrc from "../images/Virgo.png";
import libraSrc from "../images/Libra.png";
import scorpioSrc from "../images/scorpio.png";
import sagittariusSrc from "../images/Sagittarius.png";
import capricornSrc from "../images/Capricorn.png";
import aquariusSrc from "../images/Aquarius.png";
import piscesSrc from "../images/Pisces.png";
import garamondBoldSrc from "../fonts/Garamond-Bold.TTF";
import garamondRegularSrc from "../fonts/Garamond-Regular.TTF";
// eslint-disable-next-line import/no-unresolved
import nunitoSrc from "../fonts/NunitoSans-VariableFont_YTLC,opsz,wdth,wght.ttf";

// ── Startup: disable GSAP ticker ───────────────────────────────────────────────
// Workers have no requestAnimationFrame. Removing updateRoot prevents RAF errors
// and avoids GSAP auto-advancing its global clock during seek() calls.
gsap.ticker.remove(gsap.updateRoot);

// ── WebCodecs availability (Chrome 94+, Edge 94+) ─────────────────────────────
const useWebCodecs = typeof VideoEncoder !== "undefined";

// ── Constants ──────────────────────────────────────────────────────────────────
const ZODIAC_NAMES = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];
const ZODIAC_SRCS = [
  ariesSrc,
  taurusSrc,
  geminiSrc,
  cancerSrc,
  leoSrc,
  virgoSrc,
  libraSrc,
  scorpioSrc,
  sagittariusSrc,
  capricornSrc,
  aquariusSrc,
  piscesSrc,
];
const DECORATIVE_SRCS = [heartSrc, trophySrc, moneyBagSrc, crystalBallSrc];

// ── Singletons — loaded once per worker session, never per sign ────────────────
let ffmpegInstance = null;
let sessionImages = null;
let fontsLoaded = false;

// =============================================================================
// RESOURCE LOADERS
// =============================================================================

/**
 * Load a single image as an ImageBitmap.
 * fetch + createImageBitmap replaces new Image() which is unavailable in Workers.
 */
async function loadBitmap(src) {
  const res = await fetch(src);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

/**
 * Load all zodiac and decorative images once and cache them for the session.
 * Subsequent calls return the cached result immediately.
 */
async function ensureImagesLoaded() {
  if (sessionImages) return sessionImages;

  const [zodiacBitmaps, decorativeBitmaps] = await Promise.all([
    Promise.all(ZODIAC_SRCS.map(loadBitmap)),
    Promise.all(DECORATIVE_SRCS.map(loadBitmap)),
  ]);

  const zodiacIconsMap = {};
  ZODIAC_NAMES.forEach((name, i) => {
    zodiacIconsMap[name] = zodiacBitmaps[i];
  });

  sessionImages = { zodiacBitmaps, decorativeBitmaps, zodiacIconsMap };
  return sessionImages;
}

/**
 * Register fonts into the WorkerGlobalScope font set so canvas text renders
 * with the correct typefaces.  Called once; subsequent calls are no-ops.
 */
async function ensureFontsLoaded() {
  if (fontsLoaded) return;

  const faces = [
    new FontFace("Garamond", `url(${garamondRegularSrc})`),
    new FontFace("Garamond", `url(${garamondBoldSrc})`, { weight: "bold" }),
    new FontFace("NunitoSans", `url(${nunitoSrc})`),
  ];
  const loaded = await Promise.all(faces.map((f) => f.load()));
  loaded.forEach((f) => self.fonts.add(f));
  fontsLoaded = true;
}

/**
 * Return the FFmpeg singleton, loading the WASM core on first call.
 */
async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;

  ffmpegInstance = new FFmpeg();
  await ffmpegInstance.load({
    coreURL: await import("@ffmpeg/core?url").then((m) => m.default),
    wasmURL: await import("@ffmpeg/core/wasm?url").then((m) => m.default),
  });
  return ffmpegInstance;
}

// =============================================================================
// TRACK 1 — WebCodecs hardware-accelerated path
//
// VideoEncoder produces raw H.264 NAL units in the browser (hardware-backed on
// supported devices).  FFmpeg is used only to mux those chunks into an MP4
// container with '-c:v copy' — no pixel conversion, no re-encoding.
// Muxing is nearly instant (milliseconds).
// =============================================================================

async function encodeWithWebCodecs(canvas, seekFn, totalFrames, fps) {
  const chunks = [];

  const encoder = new VideoEncoder({
    output: (chunk) => {
      const buf = new Uint8Array(chunk.byteLength);
      chunk.copyTo(buf);
      chunks.push({ buf, type: chunk.type, timestamp: chunk.timestamp });
    },
    error: (e) => {
      throw new Error("VideoEncoder error: " + e.message);
    },
  });

  encoder.configure({
    codec: "avc1.4d0028", // H.264 Main profile Level 4.0 — required for 1080×1920
    width: 1080,
    height: 1920,
    framerate: fps,
    bitrate: 8_000_000, // 8 Mbps — good quality for 1080×1920
    hardwareAcceleration: "prefer-hardware",
  });

  for (let frame = 0; frame < totalFrames; frame++) {
    seekFn(frame);

    // VideoFrame accepts OffscreenCanvas directly — no getImageData copy needed
    const videoFrame = new VideoFrame(canvas, {
      timestamp: Math.round((frame / fps) * 1_000_000), // microseconds
    });

    encoder.encode(videoFrame, { keyFrame: frame % 30 === 0 });
    videoFrame.close(); // MUST close every VideoFrame to avoid GPU memory leak

    if (frame % 10 === 0) {
      self.postMessage({
        type: "PROGRESS",
        stage: "capturing (hardware)",
        percent: frame / totalFrames,
      });
    }

    // Yield every 30 frames so the encoder can drain its internal queue
    // and prevent unbounded memory buildup in the encoder pipeline
    if (frame % 30 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  await encoder.flush();
  encoder.close();

  // Concatenate all H.264 NAL unit chunks into a single raw stream
  const totalSize = chunks.reduce((s, c) => s + c.buf.byteLength, 0);
  const h264Buffer = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    h264Buffer.set(chunk.buf, offset);
    offset += chunk.buf.byteLength;
  }

  // Mux into MP4 container — '-c:v copy' means NO re-encoding, just wrapping
  const ff = await getFFmpeg();
  self.postMessage({ type: "PROGRESS", stage: "encoding", percent: 0 });

  await ff.writeFile("input.h264", h264Buffer);
  await ff.exec([
    "-f",
    "h264", // tell FFmpeg the input format is raw H.264
    "-r",
    String(fps),
    "-i",
    "input.h264",
    "-c:v",
    "copy", // mux only — NOT re-encoding
    "-movflags",
    "+faststart",
    "output.mp4",
  ]);

  const data = await ff.readFile("output.mp4");
  await ff.deleteFile("input.h264");
  await ff.deleteFile("output.mp4");

  return new Blob([data.buffer], { type: "video/mp4" });
}

// =============================================================================
// TRACK 2 — JPEG sequence → FFmpeg libx264 (Safari / Firefox fallback)
//
// JPEG frames are ~5× smaller than PNG and ~20× smaller than raw RGBA,
// so FFmpeg has far less data to process than the previous PNG/RGBA approach.
// =============================================================================

async function encodeWithJpegFallback(canvas, seekFn, totalFrames, fps) {
  const ff = await getFFmpeg();

  // Pipeline: overlap FS write of frame N with convertToBlob of frame N+1.
  // convertToBlob captures the canvas state at call-time, so we can seek immediately
  // after calling it and start the next draw while the compression runs in parallel.
  let pendingWrite = null;
  for (let frame = 0; frame < totalFrames; frame++) {
    seekFn(frame);

    // Kick off async JPEG compression — OffscreenCanvas captures pixels at call-time
    const jpegPromise = canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.85,
    });
    const filename = `frame${String(frame).padStart(3, "0")}.jpg`;

    // Drain previous frame's FS write while JPEG compresses in parallel
    if (pendingWrite) await pendingWrite;

    const jpeg = await jpegPromise;
    pendingWrite = ff.writeFile(
      filename,
      new Uint8Array(await jpeg.arrayBuffer()),
    );

    if (frame % 10 === 0) {
      self.postMessage({
        type: "PROGRESS",
        stage: "capturing (software)",
        percent: frame / totalFrames,
      });
    }
  }
  if (pendingWrite) await pendingWrite;

  self.postMessage({ type: "PROGRESS", stage: "encoding", percent: 0 });

  await ff.exec([
    "-framerate",
    String(fps),
    "-i",
    "frame%03d.jpg", // JPEG sequence input pattern
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast", // 3-4x faster than "fast" in WASM — biggest single win
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "output.mp4",
  ]);

  const data = await ff.readFile("output.mp4");

  // Cleanup all frame files from FFmpeg's virtual filesystem in parallel
  await Promise.all(
    Array.from({ length: totalFrames }, (_, f) =>
      ff.deleteFile(`frame${String(f).padStart(3, "0")}.jpg`),
    ),
  );
  await ff.deleteFile("output.mp4");

  return new Blob([data.buffer], { type: "video/mp4" });
}

// =============================================================================
// TIMELINE BUILDERS
//
// These build GSAP timelines that update state objects only — no render
// callbacks.  renderIntroFrame / renderOutroFrame are called explicitly in
// seekFrame() after each seek so the canvas reflects the current state.
//
// createZodiacTimeline() (from ZodiacFrame.js) has its own onUpdate that calls
// renderZodiacFrame internally, so no explicit draw is needed for that segment.
// =============================================================================

/**
 * Build a paused GSAP timeline that animates introState properties.
 * Typewriter onUpdate handlers update text state but do NOT draw to canvas.
 */
function buildIntroTimeline(introState, zodiacStr, dateStr) {
  const textCounters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
  const content = {
    l1: "DAILY",
    l2: "HOROSCOPE",
    l3: "FOR",
    l4: zodiacStr,
    l5: dateStr,
  };

  const tl = gsap.timeline({ paused: true });

  // Establish initial state so GSAP knows the "from" values
  tl.set(introState, {
    scale: 0,
    rotation: -60,
    opacity: 0,
    textFade: 1,
    showText: false,
  });

  // Spinning zodiac ring entrance
  tl.to(introState, {
    scale: 1,
    opacity: 1,
    rotation: 120,
    duration: 3.5,
    ease: "power2.out",
  });

  // Reset text counters before typewriter begins
  tl.call(() => {
    introState.text1 = "";
    introState.text2 = "";
    introState.text3 = "";
    introState.text4 = "";
    introState.text5 = "";
  });
  tl.set(introState, { showText: true });

  // Typewriter effect — updates text state only, no canvas draw here
  const addTypeTween = (counterKey, contentStr, label) => {
    tl.to(
      textCounters,
      {
        [counterKey]: contentStr.length,
        duration: contentStr.length * 0.05,
        ease: "none",
        onUpdate: () => {
          const count = Math.ceil(textCounters[counterKey]);
          if (counterKey === "c1")
            introState.text1 = content.l1.substring(0, count);
          if (counterKey === "c2")
            introState.text2 = content.l2.substring(0, count);
          if (counterKey === "c3")
            introState.text3 = content.l3.substring(0, count);
          if (counterKey === "c4")
            introState.text4 = content.l4.substring(0, count);
          if (counterKey === "c5")
            introState.text5 = content.l5.substring(0, count);
        },
      },
      label,
    );
  };

  addTypeTween("c1", content.l1, ">");
  addTypeTween("c2", content.l2, ">+0.1");
  addTypeTween("c3", content.l3, ">+0.1");
  addTypeTween("c4", content.l4, ">+0.1");
  addTypeTween("c5", content.l5, ">+0.2");

  // Fade out intro
  tl.to(
    introState,
    {
      opacity: 0,
      textFade: 0,
      duration: 1.5,
      ease: "power2.inOut",
    },
    "+=0.5",
  );

  return tl;
}

/**
 * Build a paused GSAP timeline that animates outroState properties.
 * The typewriter onUpdate updates outroState.text1 only, no canvas draw.
 */
function buildOutroTimeline(outroState) {
  const outroFullText = "Want a personalised reading?";
  const outroTextCounter = { val: 0 };

  const tl = gsap.timeline({ paused: true });

  // Spinning zodiac ring entrance
  tl.to(outroState, {
    scale: 1,
    opacity: 1,
    rotation: 120,
    duration: 3.5,
    ease: "power2.out",
  });

  // CTA typewriter
  tl.to(outroTextCounter, {
    val: outroFullText.length,
    duration: outroFullText.length * 0.05,
    ease: "none",
    onUpdate: () => {
      outroState.text1 = outroFullText.substring(
        0,
        Math.ceil(outroTextCounter.val),
      );
    },
  });

  // Button reveal
  tl.to(outroState, { boxWidth: 100, duration: 1.5, ease: "power2.out" });

  // Hold
  tl.to({}, { duration: 3 });

  // Fade out
  tl.to(outroState, { opacity: 0, duration: 1.5, ease: "power2.inOut" });

  return tl;
}

// =============================================================================
// CORE SIGN RENDERER
// =============================================================================

async function renderSign(signData, current, total, fontConfig, dateStr) {
  const { zodiacBitmaps, decorativeBitmaps, zodiacIconsMap } =
    await ensureImagesLoaded();

  const canvas = new OffscreenCanvas(1080, 1920);
  const ctx = canvas.getContext("2d");
  const FPS = 30;

  const zodiacStr = signData.name.toUpperCase();
  const highlightedNames = [signData.name];

  // ── Animation state objects ──────────────────────────────────────────────
  const introState = {
    scale: 0,
    rotation: -60,
    opacity: 0,
    showText: false,
    textFade: 1,
    text1: "",
    text2: "",
    text3: "",
    text4: "",
    text5: "",
  };

  const outroState = {
    opacity: 0,
    rotation: -60,
    scale: 0,
    text1: "",
    boxWidth: 0,
  };

  // ── Build three separate paused timelines ──────────────────────────────────
  const introTimeline = buildIntroTimeline(introState, zodiacStr, dateStr);

  const icon = zodiacIconsMap[signData.name] ?? zodiacIconsMap["Leo"];
  const zodiacTimeline = createZodiacTimeline(
    ctx,
    signData,
    { decorative: decorativeBitmaps, icon },
    { isFirst: true, isLast: true, fontSizes: fontConfig },
  );

  const outroTimeline = buildOutroTimeline(outroState);

  // ── Derive actual frame counts from real timeline durations ───────────────
  // Using totalDuration() is more reliable than hard-coded frame counts because
  // intro/outro lengths vary with sign name length and zodiac is exactly 13s.
  const introFrames = Math.ceil(introTimeline.totalDuration() * FPS);
  const zodiacFrames = Math.ceil(zodiacTimeline.totalDuration() * FPS);
  const outroFrames = Math.ceil(outroTimeline.totalDuration() * FPS);
  const totalFrames = introFrames + zodiacFrames + outroFrames;

  const zodiacStart = introFrames;
  const outroStart = introFrames + zodiacFrames;

  // ── Shared seek function — keeps all timeline logic in one place ───────────
  function seekFrame(frame) {
    if (frame < zodiacStart) {
      // Seek intro timeline and draw explicitly
      introTimeline.seek(frame / FPS, false);

      const textData = introState.showText
        ? {
            opacity: introState.textFade,
            line1: introState.text1,
            line2: introState.text2,
            line3: introState.text3,
            line4: introState.text4,
            line5: introState.text5,
          }
        : null;

      renderIntroFrame(
        ctx,
        {
          scale: introState.scale,
          rotation: introState.rotation,
          opacity: introState.opacity,
          images: zodiacBitmaps,
          highlightedNames,
          textData,
        },
        fontConfig,
      );
    } else if (frame < outroStart) {
      // Zodiac timeline renders via its own onUpdate — no explicit draw needed
      zodiacTimeline.seek((frame - zodiacStart) / FPS, false);
    } else {
      // Seek outro timeline and draw explicitly
      outroTimeline.seek((frame - outroStart) / FPS, false);

      renderOutroFrame(
        ctx,
        {
          opacity: outroState.opacity,
          rotation: outroState.rotation,
          scale: outroState.scale,
          text1: outroState.text1,
          boxWidth: outroState.boxWidth,
          images: zodiacBitmaps,
        },
        fontConfig,
      );
    }
  }

  // ── Pick encoding track based on browser support ───────────────────────────
  self.postMessage({
    type: "PROGRESS",
    sign: signData.name,
    current,
    total,
    stage: useWebCodecs ? "capturing (hardware)" : "capturing (software)",
    percent: 0,
  });

  const blob = useWebCodecs
    ? await encodeWithWebCodecs(canvas, seekFrame, totalFrames, FPS)
    : await encodeWithJpegFallback(canvas, seekFrame, totalFrames, FPS);

  // Free GSAP timelines and their internal tween objects
  introTimeline.kill();
  zodiacTimeline.kill();
  outroTimeline.kill();

  return blob;
}

// =============================================================================
// MESSAGE HANDLER
// =============================================================================

self.onmessage = async (e) => {
  const { type, signs, fontConfig = {}, date } = e.data;
  if (type !== "START") return;

  try {
    // Load fonts once before processing any signs
    await ensureFontsLoaded();

    for (let i = 0; i < signs.length; i++) {
      const signData = signs[i];

      const blob = await renderSign(
        signData,
        i + 1,
        signs.length,
        fontConfig,
        date,
      );

      const fileDateStr = new Date().toISOString().split("T")[0];
      const filename = `${signData.name}_${fileDateStr}.mp4`;

      self.postMessage({
        type: "SIGN_DONE",
        sign: signData.name,
        filename,
        blob,
      });
    }

    self.postMessage({ type: "ALL_DONE" });
  } catch (err) {
    self.postMessage({ type: "ERROR", error: err.message });
  }
};
