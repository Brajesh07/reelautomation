import { FFmpeg } from '@ffmpeg/ffmpeg';
import gsap from 'gsap';
import { renderIntroFrame } from '../components/IntroFrame';
import { renderOutroFrame } from '../components/OutroFrame';
import { createZodiacSequenceTimeline } from '../components/ZodiacFrame';
import { formatDate } from '../utils/dateFormatter';
import { buildTaskMeta } from './taskMeta';
import { FPS, HEIGHT, WIDTH, planFrames } from './renderConfig';
import {
  buildIntroTimeline,
  buildOutroTimeline,
  createIntroState,
  createOutroState,
} from './animUtils';

// Static image imports resolved by Vite
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Images are cached for the entire session — no reload between signs
let cachedImages = null;

async function loadAllImages() {
  if (cachedImages) return cachedImages;
  const [zodiacImgs, decorativeImgs] = await Promise.all([
    Promise.all(ZODIAC_SRCS.map(loadImage)),
    Promise.all(DECORATIVE_SRCS.map(loadImage)),
  ]);
  const zodiacIconsMap = {};
  ZODIAC_NAMES.forEach((name, i) => {
    zodiacIconsMap[name] = zodiacImgs[i];
  });
  cachedImages = { zodiacImgs, decorativeImgs, zodiacIconsMap };
  return cachedImages;
}

// FFmpeg MUST be a singleton
let ffmpegInstance = null;

async function getFFmpeg() {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
    await ffmpegInstance.load({
      coreURL: await import('@ffmpeg/core?url').then((m) => m.default),
      wasmURL: await import('@ffmpeg/core/wasm?url').then((m) => m.default),
    });
  }
  return ffmpegInstance;
}

/**
 * Renders ONE video from one or more zodiac entries.
 *
 * A single sign renders Intro -> card -> Outro. A group renders
 * Intro -> card 1 -> card 2 -> ... -> card N -> Outro. Everything else —
 * frame count, capture loop, encode args — is identical, because the frame
 * count is derived from the timeline's real duration.
 *
 * @param {Object|Array<Object>} signs - One sign or an array of signs (group reel)
 * @param {(progress: {stage: string, percent: number}) => void} onProgress
 * @param {{ groupNumber?: number }} [options] - 1-based group number, used to keep
 *   the filename of each group in a multi-group batch unique
 */
export async function renderSign(signs, onProgress, options = {}) {
  const signList = Array.isArray(signs) ? signs : [signs];
  if (signList.length === 0) throw new Error('renderSign: no signs provided');

  const { groupNumber = null } = options;
  const ffmpeg = await getFFmpeg();

  // 1. Load all images before building timeline
  const { zodiacImgs, decorativeImgs, zodiacIconsMap } = await loadAllImages();

  // 2. Off-screen canvas
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  // 3. Read font config
  let fontConfig = {};
  try {
    const saved = localStorage.getItem('fontConfig');
    if (saved) fontConfig = JSON.parse(saved);
  } catch {
    /* use defaults */
  }

  const dateStr = formatDate(new Date());
  const highlightedNames = signList.map((sign) => sign.name);

  // 4. Animation state objects (shared factories, so both engines start equal)
  const introAnimState = createIntroState();
  const outroAnimState = createOutroState();

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

  // 5. Build GSAP timeline (paused) from the same segments the worker uses
  const tl = gsap.timeline({ paused: true });

  // --- Intro / Outro come from animUtils.js, the same code the worker runs ---
  const introTL = buildIntroTimeline(introAnimState, signList, dateStr, updateIntro);
  tl.add(introTL);

  // --- Zodiac section: 1 card for a single reel, N cards for a group reel ---
  const zodiacTL = createZodiacSequenceTimeline(
    ctx,
    signList,
    {
      decorative: decorativeImgs,
      iconFor: (name) => zodiacIconsMap[name] || zodiacIconsMap['Leo'],
    },
    { fontSizes: fontConfig },
  );
  tl.add(zodiacTL);

  const outroTL = buildOutroTimeline(outroAnimState, updateOutro);
  tl.add(outroTL);

  // The frame renderers save/restore their own alpha; this is only a safety net
  tl.add(() => {
    ctx.globalAlpha = 1;
  });

  // 6. Derive total frames from actual timeline durations, with the shared
  //    per-segment rounding so both engines produce the same reel length
  const totalDuration = tl.totalDuration();
  const totalFrames = planFrames([
    introTL.totalDuration(),
    zodiacTL.totalDuration(),
    outroTL.totalDuration(),
  ]).total;
  console.log(
    `[renderSign] ${signList.length} card(s) -> ${totalFrames} frames (${totalDuration.toFixed(2)}s)`,
  );

  // 7. Frame capture loop — pipeline JPEG compression with FS writes
  // toBlob with JPEG is 5-8x faster than PNG and captures canvas state at call-time,
  // so we can overlap the FS write of frame N with the seek+draw of frame N+1.
  let pendingWrite = null;
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    onProgress({
      stage: 'capturing',
      percent: Math.round((frameIndex / totalFrames) * 100),
    });

    tl.seek(frameIndex / FPS, false); // false = don't suppress events → onUpdate fires

    // Kick off async JPEG compression immediately — canvas pixels captured at call-time
    const blobPromise = new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    const fileName = `frame${frameIndex.toString().padStart(5, '0')}.jpg`;

    // Drain previous frame's FS write while JPEG compresses in parallel
    if (pendingWrite) await pendingWrite;

    const blob = await blobPromise;
    if (!blob) throw new Error('Canvas toBlob failed');

    // Start writing without awaiting — it will run while next frame is being drawn
    pendingWrite = ffmpeg.writeFile(fileName, new Uint8Array(await blob.arrayBuffer()));
  }
  if (pendingWrite) await pendingWrite;

  // 8. Encode
  const progressHandler = ({ progress }) => {
    onProgress({ stage: 'encoding', percent: Math.round(progress * 100) });
  };
  ffmpeg.on('progress', progressHandler);
  onProgress({ stage: 'encoding', percent: 0 });

  await ffmpeg.exec([
    '-framerate',
    String(FPS),
    '-i',
    'frame%05d.jpg', // JPEG sequence input
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

  // 9. Read output
  const outputData = await ffmpeg.readFile('output.mp4');
  const mp4Blob = new Blob([outputData.buffer], { type: 'video/mp4' });

  // 10. Cleanup FFmpeg FS — delete all frame files in parallel
  await Promise.all(
    Array.from({ length: totalFrames }, (_, frameIndex) =>
      ffmpeg.deleteFile(`frame${frameIndex.toString().padStart(5, '0')}.jpg`),
    ),
  );
  await ffmpeg.deleteFile('output.mp4');
  ffmpeg.off('progress', progressHandler);

  // Free GSAP timeline
  tl.kill();

  // Same label + filename the worker engine produces for the same task
  const { name, filename } = buildTaskMeta(signList, groupNumber);

  return {
    name,
    filename,
    blob: mp4Blob,
    url: URL.createObjectURL(mp4Blob),
  };
}
