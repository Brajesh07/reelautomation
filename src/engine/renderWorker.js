/* ============================================================
 * src/engine/renderWorker.js
 *
 * Web Worker — renders ONE MP4 per render task, off the main thread.
 *
 * A task is an array of signs: one sign = a single reel, several signs = a
 * group reel (intro → card 1 … card N → outro) in one file. Because the work
 * happens in a worker, the UI thread stays responsive and the per-frame canvas
 * never competes with React for main-thread time.
 *
 * Track 1 (primary):  WebCodecs hardware encoder → FFmpeg mux only
 *                     Chrome 94+, Edge 94+, Chrome Android 94+
 *
 * Track 2 (fallback): JPEG sequence → FFmpeg libx264 encode
 *                     Safari, Firefox, any browser without VideoEncoder
 *
 * Receives:  { type: 'START', taskId, signs, fontConfig, date, groupNumber }
 * Emits:     PROGRESS { taskId, stage, percent, engine }
 *            DONE     { taskId, name, filename, blob }
 *            ERROR    { taskId, error }
 * ============================================================ */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import gsap from 'gsap';
import { renderIntroFrame } from '../components/IntroFrame';
import { renderOutroFrame } from '../components/OutroFrame';
import { createZodiacSequenceTimeline } from '../components/ZodiacFrame';
import { buildTaskMeta } from './taskMeta';
import {
  buildIntroTimeline,
  buildOutroTimeline,
  createIntroState,
  createOutroState,
} from './animUtils';

// ── Static asset imports — Vite resolves these to hashed URL strings ───────────
import heartSrc from '../images/heart.png';
import trophySrc from '../images/trophy.png';
import moneyBagSrc from '../images/money-bag.png';
import crystalBallSrc from '../images/crystal-ball.png';
import ariesSrc from '../images/aries.png';
import taurusSrc from '../images/Taurus.png';
import geminiSrc from '../images/Gemini.png';
import cancerSrc from '../images/Cancer.png';
import leoSrc from '../images/Leo.png';
import virgoSrc from '../images/Virgo.png';
import libraSrc from '../images/Libra.png';
import scorpioSrc from '../images/scorpio.png';
import sagittariusSrc from '../images/Sagittarius.png';
import capricornSrc from '../images/Capricorn.png';
import aquariusSrc from '../images/Aquarius.png';
import piscesSrc from '../images/Pisces.png';
// `?url` is required: Vite does not recognise uppercase `.TTF` as an asset
// extension, so a bare import would be parsed as JavaScript and fail the build.
import garamondBoldSrc from '../fonts/Garamond-Bold.TTF?url';
import garamondRegularSrc from '../fonts/Garamond-Regular.TTF?url';
// eslint-disable-next-line import/no-unresolved
import nunitoSrc from '../fonts/NunitoSans-VariableFont_YTLC,opsz,wdth,wght.ttf?url';

// ── Startup: disable GSAP ticker ───────────────────────────────────────────────
// Workers have no requestAnimationFrame. Removing updateRoot prevents RAF errors
// and avoids GSAP auto-advancing its global clock during seek() calls.
gsap.ticker.remove(gsap.updateRoot);

// ── WebCodecs availability (Chrome 94+, Edge 94+) ─────────────────────────────
const useWebCodecs = typeof VideoEncoder !== 'undefined';
const ENCODER_ENGINE = useWebCodecs ? 'webcodecs' : 'jpeg';

// ── Constants ──────────────────────────────────────────────────────────────────
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const ZODIAC_NAMES = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
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

// ── Singletons — loaded once per worker session, never per task ────────────────
let ffmpegInstance = null;
let sessionImages = null;
let fontsLoaded = false;
let busy = false;

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
    new FontFace('Garamond', `url(${garamondRegularSrc})`),
    new FontFace('Garamond', `url(${garamondBoldSrc})`, { weight: 'bold' }),
    new FontFace('NunitoSans', `url(${nunitoSrc})`),
  ];
  const loaded = await Promise.all(faces.map((f) => f.load()));
  // WorkerGlobalScope has its own FontFaceSet; lib.dom only types it on Window.
  const fontSet = /** @type {FontFaceSet} */ (/** @type {any} */ (self).fonts);
  loaded.forEach((f) => fontSet.add(f));
  fontsLoaded = true;
}

/**
 * Return the FFmpeg singleton, loading the WASM core on first call.
 */
async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;

  ffmpegInstance = new FFmpeg();
  await ffmpegInstance.load({
    coreURL: await import('@ffmpeg/core?url').then((m) => m.default),
    wasmURL: await import('@ffmpeg/core/wasm?url').then((m) => m.default),
  });
  return ffmpegInstance;
}

// =============================================================================
// TRACK 1 — WebCodecs hardware-accelerated path
//
// VideoEncoder produces raw H.264 NAL units in the worker (hardware-backed on
// supported devices).  The stream is encoded as Annex-B with in-band SPS/PPS,
// so FFmpeg can mux it with the raw H.264 demuxer and '-c:v copy' — no pixel
// conversion, no re-encoding.  Muxing is nearly instant.
//
// Memory: only compressed chunks are kept (a 3-minute reel is ~170 MB of
// H.264, versus ~700 MB for the equivalent JPEG frame sequence), and each
// chunk is dropped as soon as it has been copied into the contiguous buffer.
// =============================================================================

async function encodeWithWebCodecs(canvas, seekFn, totalFrames, fps, report) {
  /** @type {Array<{ buf: Uint8Array, type: string, timestamp: number } | null>} */
  const chunks = [];
  /** @type {Error|null} */
  let encoderError = null;

  const encoder = new VideoEncoder({
    output: (chunk) => {
      const buf = new Uint8Array(chunk.byteLength);
      chunk.copyTo(buf);
      chunks.push({ buf, type: chunk.type, timestamp: chunk.timestamp });
    },
    // Encoder errors arrive asynchronously; store them and fail the frame loop
    error: (e) => {
      encoderError = e instanceof Error ? e : new Error(String(e));
    },
  });

  encoder.configure({
    codec: 'avc1.4d0028', // H.264 Main profile Level 4.0 — required for 1080×1920
    width: WIDTH,
    height: HEIGHT,
    framerate: fps,
    bitrate: 8_000_000, // 8 Mbps — good quality for 1080×1920
    hardwareAcceleration: 'prefer-hardware',
    // Realtime forbids lookahead/B-frames, so decode order == presentation
    // order and the raw H.264 demuxer can timestamp frames with '-r fps'.
    latencyMode: 'realtime',
    // Annex-B gives in-band SPS/PPS and start codes, which is exactly what
    // FFmpeg's 'h264' demuxer expects.
    avc: { format: 'annexb' },
  });

  for (let frame = 0; frame < totalFrames; frame++) {
    if (encoderError) throw encoderError;

    seekFn(frame);

    // VideoFrame accepts OffscreenCanvas directly — no getImageData copy needed
    const videoFrame = new VideoFrame(canvas, {
      timestamp: Math.round((frame / fps) * 1_000_000), // microseconds
      duration: Math.round(1_000_000 / fps),
    });

    encoder.encode(videoFrame, { keyFrame: frame % 30 === 0 });
    videoFrame.close(); // MUST close every VideoFrame to avoid GPU memory leak

    if (frame % 15 === 0) {
      report('capturing', Math.round((frame / totalFrames) * 100));
    }

    // Let the encoder drain its internal queue so a long group reel cannot
    // build up an unbounded number of pending frames.
    if (frame % 30 === 0) {
      while (encoder.encodeQueueSize > 8) {
        await new Promise((r) => setTimeout(r, 0));
      }
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  await encoder.flush();
  encoder.close();
  if (encoderError) throw encoderError;

  // Concatenate all H.264 NAL unit chunks into a single raw Annex-B stream
  const totalSize = chunks.reduce((sum, chunk) => sum + (chunk ? chunk.buf.byteLength : 0), 0);
  let h264Buffer = new Uint8Array(totalSize);
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    h264Buffer.set(chunk.buf, offset);
    offset += chunk.buf.byteLength;
    chunks[i] = null; // release each compressed chunk as soon as it is copied
  }

  // Mux into MP4 container — '-c:v copy' means NO re-encoding, just wrapping
  const ff = await getFFmpeg();
  report('encoding', 0);

  await ff.writeFile('input.h264', h264Buffer);
  h264Buffer = null; // the WASM FS now owns the only copy

  await ff.exec([
    '-y', // never prompt on an existing output.mp4
    '-f',
    'h264', // tell FFmpeg the input format is raw H.264
    '-r',
    String(fps),
    '-i',
    'input.h264',
    '-c:v',
    'copy', // mux only — NOT re-encoding
    '-movflags',
    '+faststart',
    'output.mp4',
  ]);

  const data = await ff.readFile('output.mp4');
  await ff.deleteFile('input.h264');
  await ff.deleteFile('output.mp4');
  report('encoding', 100);

  return new Blob([data.buffer], { type: 'video/mp4' });
}

// =============================================================================
// TRACK 2 — JPEG sequence → FFmpeg libx264 (Safari / Firefox fallback)
//
// JPEG frames are ~5× smaller than PNG and ~20× smaller than raw RGBA,
// so FFmpeg has far less data to process than the previous PNG/RGBA approach.
// =============================================================================

async function encodeWithJpegFallback(canvas, seekFn, totalFrames, fps, report) {
  const ff = await getFFmpeg();

  // Pipeline: overlap FS write of frame N with convertToBlob of frame N+1.
  // convertToBlob captures the canvas state at call-time, so we can seek immediately
  // after calling it and start the next draw while the compression runs in parallel.
  let pendingWrite = null;
  for (let frame = 0; frame < totalFrames; frame++) {
    seekFn(frame);

    // Kick off async JPEG compression — OffscreenCanvas captures pixels at call-time
    const jpegPromise = canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.85,
    });
    const filename = `frame${String(frame).padStart(5, '0')}.jpg`;

    // Drain previous frame's FS write while JPEG compresses in parallel
    if (pendingWrite) await pendingWrite;

    const jpeg = await jpegPromise;
    pendingWrite = ff.writeFile(filename, new Uint8Array(await jpeg.arrayBuffer()));

    if (frame % 15 === 0) {
      report('capturing', Math.round((frame / totalFrames) * 100));
    }

    // Yield now and then so the worker still services messages and the FS
    // can settle its buffers during a long group reel.
    if (frame % 30 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  if (pendingWrite) await pendingWrite;

  report('encoding', 0);

  await ff.exec([
    '-y', // never prompt on an existing output.mp4
    '-framerate',
    String(fps),
    '-i',
    'frame%05d.jpg', // JPEG sequence input pattern
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast', // 3-4x faster than "fast" in WASM — biggest single win
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    'output.mp4',
  ]);

  const data = await ff.readFile('output.mp4');

  // Cleanup all frame files from FFmpeg's virtual filesystem in parallel
  await Promise.all(
    Array.from({ length: totalFrames }, (_, f) =>
      ff.deleteFile(`frame${String(f).padStart(5, '0')}.jpg`),
    ),
  );
  await ff.deleteFile('output.mp4');
  report('encoding', 100);

  return new Blob([data.buffer], { type: 'video/mp4' });
}

// =============================================================================
// TIMELINE BUILDERS
//
// The intro/outro animations are shared with the main-thread engine and live in
// ./animUtils.js, so both engines always produce the same frames and duration.
// renderIntroFrame / renderOutroFrame are called explicitly in seekFrame() after
// each seek, because this worker has no per-tween repaint hook.
// =============================================================================

/** Best-effort cleanup so a failed encode cannot block the retry with a prompt. */
async function clearTemporaryFiles() {
  if (!ffmpegInstance) return;
  for (const name of ['input.h264', 'output.mp4']) {
    try {
      await ffmpegInstance.deleteFile(name);
    } catch {
      /* file was never written */
    }
  }
}

// =============================================================================
// CORE TASK RENDERER
//
// One task → one MP4:
//   single reel:  Intro → card → Outro
//   group reel:   Intro → card 1 → card 2 → … → card N → Outro
// Frame count is derived from the real timeline durations, so it scales with
// the number of cards without any hard-coded numbers.
// =============================================================================

async function renderTask({ signs, fontConfig = {}, date, groupNumber = null }, report) {
  const signList = Array.isArray(signs) ? signs : [];
  if (signList.length === 0) throw new Error('renderTask: no signs provided');

  const { zodiacBitmaps, decorativeBitmaps, zodiacIconsMap } = await ensureImagesLoaded();

  const canvas = new OffscreenCanvas(WIDTH, HEIGHT);
  // The shared frame renderers are typed for the DOM 2D context; they only use
  // the drawing subset that OffscreenCanvas implements as well.
  const ctx = /** @type {CanvasRenderingContext2D} */ (
    /** @type {any} */ (canvas.getContext('2d'))
  );

  const highlightedNames = signList.map((sign) => sign.name);

  // ── Animation state objects (shared factories, so both engines start equal) ─
  const introState = createIntroState();
  const outroState = createOutroState();

  // ── Build three separate timelines, then pause them (this worker seeks) ─────
  const introTimeline = buildIntroTimeline(introState, signList, date);
  introTimeline.pause();

  // The sequence is what turns "N signs" into one reel: first card brings the
  // decorative row in, last card fades everything out, cards in between slide
  // over the row that is already on screen.
  const zodiacTimeline = createZodiacSequenceTimeline(
    ctx,
    signList,
    {
      decorative: decorativeBitmaps,
      iconFor: (name) => zodiacIconsMap[name] || zodiacIconsMap['Leo'],
    },
    { fontSizes: fontConfig },
  );
  zodiacTimeline.pause();

  const outroTimeline = buildOutroTimeline(outroState);
  outroTimeline.pause();

  // ── Derive actual frame counts from real timeline durations ───────────────
  const introFrames = Math.ceil(introTimeline.totalDuration() * FPS);
  const zodiacFrames = Math.ceil(zodiacTimeline.totalDuration() * FPS);
  const outroFrames = Math.ceil(outroTimeline.totalDuration() * FPS);
  const totalFrames = introFrames + zodiacFrames + outroFrames;

  // Same diagnostic the main-thread engine prints, so the two can be compared
  const totalDuration =
    introTimeline.totalDuration() + zodiacTimeline.totalDuration() + outroTimeline.totalDuration();
  console.log(
    `[renderWorker] ${signList.length} card(s) -> ${totalFrames} frames (${totalDuration.toFixed(2)}s)`,
  );

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

  report('preparing', 0);

  let blob;
  if (useWebCodecs) {
    try {
      blob = await encodeWithWebCodecs(canvas, seekFrame, totalFrames, FPS, report);
    } catch (err) {
      // Hardware encoders can reject a config on some devices; the JPEG track
      // still lives in this worker, so a reel never has to fall back to the UI
      // thread just because WebCodecs was unavailable at runtime.
      console.warn('[renderWorker] WebCodecs path failed, using JPEG track:', err);
      await clearTemporaryFiles();
      report('preparing', 0);
      blob = await encodeWithJpegFallback(canvas, seekFrame, totalFrames, FPS, report);
    }
  } else {
    blob = await encodeWithJpegFallback(canvas, seekFrame, totalFrames, FPS, report);
  }

  // Free GSAP timelines and their internal tween objects
  introTimeline.kill();
  zodiacTimeline.kill();
  outroTimeline.kill();

  return blob;
}

// =============================================================================
// MESSAGE HANDLER
//
// One START message == one task == one video. The queue sends tasks one at a
// time; `busy` guards against overlapping starts (e.g. a double-click).
// =============================================================================

self.onmessage = async (e) => {
  const { type, taskId, signs = [], fontConfig = {}, date, groupNumber = null } = e.data || {};
  if (type !== 'START') return;

  if (busy) {
    self.postMessage({ type: 'ERROR', taskId, error: 'Renderer is already busy with a task' });
    return;
  }

  busy = true;
  const report = (stage, percent) =>
    self.postMessage({ type: 'PROGRESS', taskId, stage, percent, engine: ENCODER_ENGINE });

  try {
    const signList = Array.isArray(signs) ? signs : [];
    // `date` is the human-readable intro date ("21st Oct 2026"); filenames use
    // the ISO day, matching the main-thread renderer.
    const { name, filename } = buildTaskMeta(signList, groupNumber);

    // Load fonts once before the first task
    await ensureFontsLoaded();

    const blob = await renderTask({ signs: signList, fontConfig, date, groupNumber }, report);

    self.postMessage({ type: 'DONE', taskId, name, filename, blob });
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      taskId,
      error: err?.message || 'Unknown worker render error',
    });
  } finally {
    busy = false;
  }
};
