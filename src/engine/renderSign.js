import { FFmpeg } from "@ffmpeg/ffmpeg";
import gsap from "gsap";
import { renderIntroFrame } from "../components/IntroFrame";
import { renderOutroFrame } from "../components/OutroFrame";
import { createZodiacTimeline } from "../components/ZodiacFrame";
import { formatDate } from "../utils/dateFormatter";

// Static image imports resolved by Vite
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function loadAllImages() {
  const [zodiacImgs, decorativeImgs] = await Promise.all([
    Promise.all(ZODIAC_SRCS.map(loadImage)),
    Promise.all(DECORATIVE_SRCS.map(loadImage)),
  ]);
  const zodiacIconsMap = {};
  ZODIAC_NAMES.forEach((name, i) => {
    zodiacIconsMap[name] = zodiacImgs[i];
  });
  return { zodiacImgs, decorativeImgs, zodiacIconsMap };
}

// FFmpeg MUST be a singleton
let ffmpegInstance = null;

async function getFFmpeg() {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
    await ffmpegInstance.load({
      coreURL: await import("@ffmpeg/core?url").then((m) => m.default),
      wasmURL: await import("@ffmpeg/core/wasm?url").then((m) => m.default),
    });
  }
  return ffmpegInstance;
}

export async function renderSign(signData, onProgress) {
  const ffmpeg = await getFFmpeg();

  // 1. Load all images before building timeline
  const { zodiacImgs, decorativeImgs, zodiacIconsMap } = await loadAllImages();

  // 2. Off-screen canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  // 3. Read font config (same as ReelCanvas)
  let fontConfig = {};
  try {
    const saved = localStorage.getItem("fontConfig");
    if (saved) fontConfig = JSON.parse(saved);
  } catch {
    /* use defaults */
  }

  const fps = 30;
  const dateStr = formatDate(new Date());
  const highlightedNames = [signData.name];
  const zodiacStr = signData.name.toUpperCase();

  // 4. Animation state objects (mirroring ReelCanvas.jsx exactly)
  const introAnimState = {
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

  const outroAnimState = {
    opacity: 0,
    rotation: -60,
    scale: 0,
    text1: "",
    boxWidth: 0,
  };

  const updateIntro = () => {
    const textData = introAnimState.showText
      ? {
          opacity: introAnimState.textFade,
          line1: introAnimState.text1,
          line2: introAnimState.text2,
          line3: introAnimState.text3,
          line4: introAnimState.text4,
          line5: introAnimState.text5,
        }
      : null;
    renderIntroFrame(
      ctx,
      {
        scale: introAnimState.scale,
        rotation: introAnimState.rotation,
        opacity: introAnimState.opacity,
        images: zodiacImgs,
        highlightedNames,
        textData,
      },
      fontConfig,
    );
  };

  const updateOutro = () => {
    renderOutroFrame(
      ctx,
      {
        opacity: outroAnimState.opacity,
        rotation: outroAnimState.rotation,
        scale: outroAnimState.scale,
        text1: outroAnimState.text1,
        boxWidth: outroAnimState.boxWidth,
        images: zodiacImgs,
      },
      fontConfig,
    );
  };

  // 5. Build GSAP timeline (paused) — identical structure to ReelCanvas.jsx
  const tl = gsap.timeline({ paused: true });

  // --- Intro ---
  tl.set(introAnimState, {
    scale: 0,
    rotation: -60,
    opacity: 0,
    textFade: 1,
    showText: false,
  });
  tl.to(introAnimState, {
    scale: 1,
    opacity: 1,
    rotation: 120,
    duration: 3.5,
    ease: "power2.out",
    onUpdate: updateIntro,
  });
  tl.call(() => {
    introAnimState.text1 = "";
    introAnimState.text2 = "";
    introAnimState.text3 = "";
    introAnimState.text4 = "";
    introAnimState.text5 = "";
  });
  tl.set(introAnimState, { showText: true });

  const textCounters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
  const content = {
    l1: "DAILY",
    l2: "HOROSCOPE",
    l3: "FOR",
    l4: zodiacStr,
    l5: dateStr,
  };

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
            introAnimState.text1 = content.l1.substring(0, count);
          if (counterKey === "c2")
            introAnimState.text2 = content.l2.substring(0, count);
          if (counterKey === "c3")
            introAnimState.text3 = content.l3.substring(0, count);
          if (counterKey === "c4")
            introAnimState.text4 = content.l4.substring(0, count);
          if (counterKey === "c5")
            introAnimState.text5 = content.l5.substring(0, count);
          updateIntro();
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

  tl.to(
    introAnimState,
    {
      opacity: 0,
      textFade: 0,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: updateIntro,
    },
    "+=0.5",
  );

  // --- Zodiac section (single sign per video) ---
  const icon = zodiacIconsMap[signData.name] || zodiacIconsMap["Leo"];
  const zodiacTL = createZodiacTimeline(
    ctx,
    signData,
    {
      decorative: decorativeImgs,
      icon,
    },
    { isFirst: true, isLast: true, fontSizes: fontConfig },
  );
  tl.add(zodiacTL);

  // --- Outro ---
  tl.add(() => {
    outroAnimState.opacity = 0;
    outroAnimState.rotation = -60;
    outroAnimState.scale = 0;
    outroAnimState.text1 = "";
    outroAnimState.boxWidth = 0;
  });
  tl.to(outroAnimState, {
    scale: 1,
    opacity: 1,
    rotation: 120,
    duration: 3.5,
    ease: "power2.out",
    onUpdate: updateOutro,
  });

  const outroFullText = "Want a personalised reading?";
  const outroTextCounter = { val: 0 };
  tl.to(outroTextCounter, {
    val: outroFullText.length,
    duration: outroFullText.length * 0.05,
    ease: "none",
    onUpdate: () => {
      outroAnimState.text1 = outroFullText.substring(
        0,
        Math.ceil(outroTextCounter.val),
      );
      updateOutro();
    },
  });
  tl.to(outroAnimState, {
    boxWidth: 100,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: updateOutro,
  });
  tl.to({}, { duration: 3 });
  tl.to(outroAnimState, {
    opacity: 0,
    duration: 1.5,
    ease: "power2.inOut",
    onUpdate: updateOutro,
  });
  tl.add(() => {
    ctx.globalAlpha = 1;
  });

  // 6. Derive total frames from actual timeline duration
  const totalDuration = tl.totalDuration();
  const totalFrames = Math.ceil(totalDuration * fps);

  // 7. Frame capture loop — seek timeline per frame so onUpdate fires
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    onProgress({
      stage: "capturing",
      percent: Math.round((frameIndex / totalFrames) * 100),
    });

    tl.seek(frameIndex / fps, false); // false = don't suppress events → onUpdate fires

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Canvas toBlob failed");

    const fileName = `frame${frameIndex.toString().padStart(5, "0")}.png`;
    const arrayBuffer = await blob.arrayBuffer();
    await ffmpeg.writeFile(fileName, new Uint8Array(arrayBuffer));
  }

  // 8. Encode
  const progressHandler = ({ progress }) => {
    onProgress({ stage: "encoding", percent: Math.round(progress * 100) });
  };
  ffmpeg.on("progress", progressHandler);
  onProgress({ stage: "encoding", percent: 0 });

  await ffmpeg.exec([
    "-framerate",
    "30",
    "-i",
    "frame%05d.png",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "output.mp4",
  ]);

  // 9. Read output
  const outputData = await ffmpeg.readFile("output.mp4");
  const mp4Blob = new Blob([outputData.buffer], { type: "video/mp4" });

  // 10. Cleanup FFmpeg FS
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const fileName = `frame${frameIndex.toString().padStart(5, "0")}.png`;
    await ffmpeg.deleteFile(fileName);
  }
  await ffmpeg.deleteFile("output.mp4");
  ffmpeg.off("progress", progressHandler);

  // Free GSAP timeline
  tl.kill();

  const fileDateStr = new Date().toISOString().split("T")[0];
  const filename = `${signData.name}_${fileDateStr}.mp4`;

  return {
    name: signData.name,
    filename,
    blob: mp4Blob,
    url: URL.createObjectURL(mp4Blob),
  };
}
