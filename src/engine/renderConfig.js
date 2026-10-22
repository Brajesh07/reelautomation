/**
 * src/engine/renderConfig.js
 *
 * The output format of every reel, in one place.
 *
 * Both render engines — `renderWorker.js` (Web Worker + WebCodecs) and
 * `renderSign.js` (main-thread fallback) — build their canvas and their frame
 * loop from these values, and both hand the same `FPS` to FFmpeg. Changing the
 * resolution or frame rate here changes both engines identically.
 */

/** Output width in pixels (Instagram Reels / vertical 9:16). */
export const WIDTH = 1080;

/** Output height in pixels. */
export const HEIGHT = 1920;

/** Frames per second, for capture, seeking and the FFmpeg mux/encode. */
export const FPS = 30;

/**
 * Frames needed to play `seconds` at FPS. Rounds up: a partial final frame
 * still has to be rendered, otherwise the last fraction of a tween is lost.
 *
 * @param {number} seconds
 * @returns {number}
 */
export function framesFor(seconds) {
  return Math.ceil(seconds * FPS);
}

/**
 * Frame plan for one reel. Each segment (intro, the card sequence, outro) is
 * rounded up on its own and the segment counts are summed — the same math in
 * both engines, so they always produce the same number of frames for a task.
 *
 * Why per-segment rather than one rounding of the total: the worker seeks each
 * timeline separately and needs to know where each segment starts, and keeping
 * the rounding identical in both engines is what makes durations match.
 *
 * @param {number[]} segmentSeconds - Duration of each segment in seconds
 * @returns {{ segments: number[], total: number }}
 */
export function planFrames(segmentSeconds) {
  const segments = segmentSeconds.map(framesFor);
  return { segments, total: segments.reduce((sum, frames) => sum + frames, 0) };
}
