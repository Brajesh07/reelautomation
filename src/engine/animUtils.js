/**
 * src/engine/animUtils.js
 *
 * THE intro and outro animations.
 *
 * Both render engines build these same timelines:
 *   - `renderWorker.js` (Web Worker + WebCodecs, the primary engine)
 *   - `renderSign.js`   (main-thread JPEG + libx264, the fallback)
 *
 * Keeping them here means a reel is frame-for-frame the same whichever engine
 * produced it, and — because the frame count is derived from these durations —
 * both engines also produce the same length of video.
 *
 * These timelines only mutate plain state objects; they never draw. The caller
 * decides how the canvas is repainted:
 *   - `renderSign` passes an `onUpdate` callback, so the canvas repaints on
 *     every tween tick (it plays the timeline on the main thread).
 *   - `renderWorker` passes nothing and repaints once per frame after seeking,
 *     which is both cheaper and required (no rAF in a worker).
 *
 * @typedef {Record<string, any>} AnimState
 */

import gsap from 'gsap';
import { buildIntroNames } from './taskMeta';

/** Fixed intro lines. Line 4 is the sign list, line 5 the display date. */
export const INTRO_COPY = {
  line1: 'DAILY',
  line2: 'HOROSCOPE',
  line3: 'FOR',
};

/** Outro call-to-action, typed out character by character. */
export const OUTRO_CTA = 'Want a personalised reading?';

/** Seconds per typed character — the typewriter speed for both timelines. */
export const TYPE_SECONDS_PER_CHAR = 0.05;

/** Ring entrance: scale 0 → 1 and a 180° spin over 3.5 s. */
const RING_ENTRANCE_SECONDS = 3.5;

/** Initial intro state, matching the `tl.set()` at the top of the timeline. */
export const createIntroState = () => ({
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
});

/** Initial outro state, matching the reset at the top of the outro timeline. */
export const createOutroState = () => ({
  opacity: 0,
  rotation: -60,
  scale: 0,
  text1: '',
  boxWidth: 0,
});

/**
 * Build the intro timeline: ring entrance, five typed lines, fade out.
 *
 * @param {AnimState} state - Intro animation state (mutated in place)
 * @param {Array<{ name: string }>} [signs] - Signs of this task, joined for line 4
 * @param {string} [dateStr] - Human-readable date for line 5 ("21st Oct 2026")
 * @param {(() => void) | null} [onUpdate] - Optional repaint hook, called on every state change
 * @returns {gsap.core.Timeline} Unpaused timeline — the caller owns pausing/seeking
 */
export function buildIntroTimeline(state, signs = [], dateStr = '', onUpdate = null) {
  const lines = [
    INTRO_COPY.line1,
    INTRO_COPY.line2,
    INTRO_COPY.line3,
    buildIntroNames(signs),
    dateStr,
  ];
  // Where each typed line starts. '>' appends to the previous tween; the small
  // offsets make the lines start slightly before the previous one finishes.
  const positions = ['>', '>+0.1', '>+0.1', '>+0.1', '>+0.2'];
  const textKeys = ['text1', 'text2', 'text3', 'text4', 'text5'];
  const counterKeys = ['c1', 'c2', 'c3', 'c4', 'c5'];

  /** @type {Record<string, number>} */
  const counters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };

  // Deliberately NOT created paused: GSAP ignores the duration of a paused child
  // when it is added to another timeline, which silently truncated a reel in
  // `renderSign`. The caller pauses it if it seeks the timeline itself.
  const tl = gsap.timeline();

  // Establish the starting values so GSAP knows the "from" side of the tween
  tl.set(state, {
    scale: 0,
    rotation: -60,
    opacity: 0,
    textFade: 1,
    showText: false,
  });

  // Spinning zodiac ring entrance
  tl.to(state, {
    scale: 1,
    opacity: 1,
    rotation: 120,
    duration: RING_ENTRANCE_SECONDS,
    ease: 'power2.out',
    onUpdate,
  });

  // Clear the typed lines before the typewriter starts
  tl.call(() => {
    textKeys.forEach((key) => {
      state[key] = '';
    });
  });
  tl.set(state, { showText: true });

  // Typewriter: one character every TYPE_SECONDS_PER_CHAR
  lines.forEach((line, index) => {
    const counterKey = counterKeys[index];
    const textKey = textKeys[index];

    tl.to(
      counters,
      {
        [counterKey]: line.length,
        duration: line.length * TYPE_SECONDS_PER_CHAR,
        ease: 'none',
        onUpdate: () => {
          state[textKey] = line.substring(0, Math.ceil(counters[counterKey]));
          if (onUpdate) onUpdate();
        },
      },
      positions[index],
    );
  });

  // Fade the intro out before the first card
  tl.to(
    state,
    {
      opacity: 0,
      textFade: 0,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate,
    },
    '+=0.5',
  );

  return tl;
}

/**
 * Build the paused outro timeline: ring entrance, typed CTA, button reveal,
 * 3 s hold, fade out.
 *
 * @param {AnimState} state - Outro animation state (mutated in place)
 * @param {(() => void) | null} [onUpdate] - Optional repaint hook, called on every state change
 * @returns {gsap.core.Timeline} Unpaused timeline — the caller owns pausing/seeking
 */
export function buildOutroTimeline(state, onUpdate = null) {
  const counter = { val: 0 };

  // Unpaused on purpose — see the note in buildIntroTimeline
  const tl = gsap.timeline();

  // Reset before the entrance, so the timeline can be reused after N cards
  tl.add(() => {
    state.opacity = 0;
    state.rotation = -60;
    state.scale = 0;
    state.text1 = '';
    state.boxWidth = 0;
  });

  // Spinning zodiac ring entrance
  tl.to(state, {
    scale: 1,
    opacity: 1,
    rotation: 120,
    duration: RING_ENTRANCE_SECONDS,
    ease: 'power2.out',
    onUpdate,
  });

  // CTA typewriter
  tl.to(counter, {
    val: OUTRO_CTA.length,
    duration: OUTRO_CTA.length * TYPE_SECONDS_PER_CHAR,
    ease: 'none',
    onUpdate: () => {
      state.text1 = OUTRO_CTA.substring(0, Math.ceil(counter.val));
      if (onUpdate) onUpdate();
    },
  });

  // Button reveal
  tl.to(state, { boxWidth: 100, duration: 1.5, ease: 'power2.out', onUpdate });

  // Hold on the finished card
  tl.to({}, { duration: 3 });

  // Fade everything out
  tl.to(state, { opacity: 0, duration: 1.5, ease: 'power2.inOut', onUpdate });

  return tl;
}
