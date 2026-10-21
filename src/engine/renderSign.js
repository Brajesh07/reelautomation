import { FFmpeg } from '@ffmpeg/ffmpeg';
import gsap from 'gsap';
import { renderIntroFrame } from '../components/IntroFrame';
import { renderOutroFrame } from '../components/OutroFrame';
import { createZodiacSequenceTimeline } from '../components/ZodiacFrame';
import { formatDate } from '../utils/dateFormatter';

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

// Intro line 4 is drawn with a 600px max width, so long sign lists are abbreviated
const MAX_INTRO_NAMES = 3;

function buildIntroNames(signs) {
  const names = signs.map((sign) => sign.name.toUpperCase());
  if (names.length <= MAX_INTRO_NAMES) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
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
  const isGroup = signList.length > 1;
  const ffmpeg = await getFFmpeg();

  // 1. Load all images before building timeline
  const { zodiacImgs, decorativeImgs, zodiacIconsMap } = await loadAllImages();

  // 2. Off-screen canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // 3. Read font config
  let fontConfig = {};
  try {
    const saved = localStorage.getItem('fontConfig');
    if (saved) fontConfig = JSON.parse(saved);
  } catch {
    /* use defaults */
  }

  const fps = 30;
  const dateStr = formatDate(new Date());
  const highlightedNames = signList.map((sign) => sign.name);

  // 4. Animation state objects
  const introAnimState = {
    scale: 0,
    rotation: -60,
    opacity: 0,
    showText: false,
    textFade: 1,
    text1: '',
    text2: '',
    text3: '',
    text4: '',
    text5: '',
  };

  const outroAnimState = {
    opacity: 0,
    rotation: -60,
    scale: 0,
    text1: '',
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

  // 5. Build GSAP timeline (paused)
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
    ease: 'power2.out',
    onUpdate: updateIntro,
  });
  tl.call(() => {
    introAnimState.text1 = '';
    introAnimState.text2 = '';
    introAnimState.text3 = '';
    introAnimState.text4 = '';
    introAnimState.text5 = '';
  });
  tl.set(introAnimState, { showText: true });

  const textCounters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
  const content = {
    l1: 'DAILY',
    l2: 'HOROSCOPE',
    l3: 'FOR',
    l4: buildIntroNames(signList),
    l5: dateStr,
  };

  const addTypeTween = (counterKey, contentStr, label) => {
    tl.to(
      textCounters,
      {
        [counterKey]: contentStr.length,
        duration: contentStr.length * 0.05,
        ease: 'none',
        onUpdate: () => {
          const count = Math.ceil(textCounters[counterKey]);
          if (counterKey === 'c1') introAnimState.text1 = content.l1.substring(0, count);
          if (counterKey === 'c2') introAnimState.text2 = content.l2.substring(0, count);
          if (counterKey === 'c3') introAnimState.text3 = content.l3.substring(0, count);
          if (counterKey === 'c4') introAnimState.text4 = content.l4.substring(0, count);
          if (counterKey === 'c5') introAnimState.text5 = content.l5.substring(0, count);
          updateIntro();
        },
      },
      label,
    );
  };
  addTypeTween('c1', content.l1, '>');
  addTypeTween('c2', content.l2, '>+0.1');
  addTypeTween('c3', content.l3, '>+0.1');
  addTypeTween('c4', content.l4, '>+0.1');
  addTypeTween('c5', content.l5, '>+0.2');

  tl.to(
    introAnimState,
    {
      opacity: 0,
      textFade: 0,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: updateIntro,
    },
    '+=0.5',
  );

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

  // --- Outro ---
  tl.add(() => {
    outroAnimState.opacity = 0;
    outroAnimState.rotation = -60;
    outroAnimState.scale = 0;
    outroAnimState.text1 = '';
    outroAnimState.boxWidth = 0;
  });
  tl.to(outroAnimState, {
    scale: 1,
    opacity: 1,
    rotation: 120,
    duration: 3.5,
    ease: 'power2.out',
    onUpdate: updateOutro,
  });

  const outroFullText = 'Want a personalised reading?';
  const outroTextCounter = { val: 0 };
  tl.to(outroTextCounter, {
    val: outroFullText.length,
    duration: outroFullText.length * 0.05,
    ease: 'none',
    onUpdate: () => {
      outroAnimState.text1 = outroFullText.substring(0, Math.ceil(outroTextCounter.val));
      updateOutro();
    },
  });
  tl.to(outroAnimState, {
    boxWidth: 100,
    duration: 1.5,
    ease: 'power2.out',
    onUpdate: updateOutro,
  });
  tl.to({}, { duration: 3 });
  tl.to(outroAnimState, {
    opacity: 0,
    duration: 1.5,
    ease: 'power2.inOut',
    onUpdate: updateOutro,
  });
  tl.add(() => {
    ctx.globalAlpha = 1;
  });

  // 6. Derive total frames from actual timeline duration
  //    (scales automatically with the number of cards in the reel)
  const totalDuration = tl.totalDuration();
  const totalFrames = Math.ceil(totalDuration * fps);
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

    tl.seek(frameIndex / fps, false); // false = don't suppress events → onUpdate fires

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
    '30',
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

  const fileDateStr = new Date().toISOString().split('T')[0];
  const groupTag = Number.isInteger(groupNumber) ? `${groupNumber}_` : '';
  const filename = isGroup
    ? `GroupReel_${groupTag}${signList.length}Signs_${fileDateStr}.mp4`
    : `${signList[0].name}_${fileDateStr}.mp4`;

  return {
    // Human-readable label used by the gallery and notifications
    name: isGroup
      ? `Group Reel${groupNumber ? ` ${groupNumber}` : ''} (${signList
          .map((sign) => sign.name)
          .join(', ')})`
      : signList[0].name,
    filename,
    blob: mp4Blob,
    url: URL.createObjectURL(mp4Blob),
  };
}
