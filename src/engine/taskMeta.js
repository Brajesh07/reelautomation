/**
 * Naming helpers shared by both render engines (main-thread `renderSign` and
 * the worker engine in `renderWorker.js`). Keeping them here means a task gets
 * the same gallery label and MP4 filename no matter which engine rendered it.
 */

// Intro line 4 is drawn with a 600px max width, so long sign lists are abbreviated
export const MAX_INTRO_NAMES = 3;

/**
 * Build the intro's bold sign list, e.g. "LEO, VIRGO +7".
 * @param {Array<Object>} signs
 * @returns {string}
 */
export function buildIntroNames(signs = []) {
  const names = signs.map((sign) => sign.name.toUpperCase());
  if (names.length <= MAX_INTRO_NAMES) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

/**
 * Label + filename for one render task (one MP4).
 *
 * @param {Array<Object>} signs - One sign (single reel) or N signs (group reel)
 * @param {number|null} groupNumber - 1-based group number, keeps filenames unique
 * @param {string} [fileDate] - YYYY-MM-DD used in the filename (defaults to today)
 * @returns {{ name: string, filename: string, isGroup: boolean }}
 */
export function buildTaskMeta(signs = [], groupNumber = null, fileDate) {
  const signList = Array.isArray(signs) ? signs : [];
  if (signList.length === 0) throw new Error('buildTaskMeta: no signs provided');

  const isGroup = signList.length > 1;
  const groupTag = Number.isInteger(groupNumber) ? `${groupNumber}_` : '';
  const dateStr = fileDate || new Date().toISOString().split('T')[0];

  const filename = isGroup
    ? `GroupReel_${groupTag}${signList.length}Signs_${dateStr}.mp4`
    : `${signList[0].name}_${dateStr}.mp4`;

  const name = isGroup
    ? `Group Reel${groupNumber ? ` ${groupNumber}` : ''} (${signList
        .map((sign) => sign.name)
        .join(', ')})`
    : signList[0].name;

  return { name, filename, isGroup };
}
