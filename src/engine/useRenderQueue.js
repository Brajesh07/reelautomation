import { create } from 'zustand';
import { renderSign } from './renderSign';
import { saveVideoToDB, getAllVideosFromDB, deleteVideoFromDB } from '../utils/videoDB';
import { requestNotifyPermission, notifySignDone, notifyComplete } from '../utils/notify';

/**
 * Turns the uploaded signs plus the render options picked in the UI into an
 * ordered list of render tasks. ONE TASK == ONE MP4.
 *
 *   { type: "single", data: [sign] }             -> one video per sign
 *   { type: "group",  data: [sign, sign, ...] }  -> one video, all cards back-to-back
 *
 * Both kinds can be produced by the same run, and a run may contain ANY number
 * of groups: `groups: [{ indices: [...] }, { indices: [...] }]`. Members are
 * referenced by index (not name) so duplicate sign names in one upload stay
 * addressable, and `groupNumber` keeps labels + filenames unique per group.
 *
 * @param {Array<Object>} signsData - Validated zodiac entries
 * @param {Object} options - { single: boolean, groups: Array<{ indices: number[] }> }
 * @returns {Array<{type: "single"|"group", data: Object[], label: string, groupNumber?: number}>}
 */
export function buildRenderTasks(signsData = [], options = {}) {
  const { single = true, groups = [] } = options;
  const tasks = [];

  if (single) {
    signsData.forEach((sign) => {
      tasks.push({ type: 'single', data: [sign], label: sign.name });
    });
  }

  groups.forEach((group, index) => {
    const indices = Array.isArray(group?.indices) ? group.indices : [];
    const selected = indices
      .filter((i) => Number.isInteger(i) && i >= 0 && i < signsData.length)
      .map((i) => signsData[i]);

    // A "group" of one is just a single reel; the UI blocks this, and the
    // queue ignores it defensively.
    if (selected.length < 2) return;

    tasks.push({
      type: 'group',
      groupNumber: index + 1,
      data: selected,
      label: `Group Reel ${index + 1} (${selected.length} signs)`,
    });
  });

  return tasks;
}

export const useRenderStore = create((set, get) => ({
  signsData: [],
  renderedVideos: [],
  isRendering: false,
  tasks: [],
  currentTaskIndex: 0,
  progress: { stage: 'idle', percent: 0 },
  isComplete: false,
  errors: [],

  setSignsData: (data) =>
    set({
      signsData: data,
      tasks: [],
      currentTaskIndex: 0,
      isComplete: false,
      renderedVideos: [],
      errors: [],
      progress: { stage: 'idle', percent: 0 },
    }),

  /**
   * @param {Function} navigate - react-router navigate (used by notifications)
   * @param {Object} options - { single: boolean, groups: [{ indices }] }; defaults to single reels
   */
  startRendering: async (navigate, options = {}) => {
    const { signsData, isRendering } = get();
    if (signsData.length === 0 || isRendering) return;

    const tasks = buildRenderTasks(signsData, {
      single: true,
      groups: [],
      ...options,
    });
    if (tasks.length === 0) return;

    // Ask for browser notification permission (once, before rendering starts)
    await requestNotifyPermission();

    set({
      isRendering: true,
      tasks,
      currentTaskIndex: 0,
      isComplete: false,
      renderedVideos: [],
      errors: [],
      progress: { stage: 'idle', percent: 0 },
    });

    // SEQUENTIAL QUEUE RULE:
    // Tasks must render one at a time only.
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      set({ currentTaskIndex: i });

      try {
        // A task always hands renderSign an array of signs (1 for single reels)
        const video = await renderSign(
          task.data,
          (progressState) => {
            set({ progress: progressState });
          },
          // Group number keeps "GroupReel_1_…" / "GroupReel_2_…" distinct when
          // two groups in the same batch hold the same number of signs
          { groupNumber: task.groupNumber },
        );

        // Persist to IndexedDB so the video survives tab changes and refreshes
        await saveVideoToDB(video);

        set((state) => ({
          renderedVideos: [...state.renderedVideos, video],
        }));

        // Optional: Fire a silent notification after each reel completes
        notifySignDone(task.label, i + 1, tasks.length);
      } catch (error) {
        console.error(`Failed to render ${task.label}:`, error);
        set((state) => ({
          errors: [
            ...state.errors,
            {
              label: task.label,
              message: error?.message || 'Unknown render error',
            },
          ],
        }));
      }
    }

    set({
      isRendering: false,
      isComplete: true,
      progress: { stage: 'idle', percent: 0 },
    });

    // Fire completion notification
    notifyComplete(get().renderedVideos.length, navigate);
  },

  deleteVideo: (filename) => {
    set((state) => {
      const videoToDelete = state.renderedVideos.find((v) => v.filename === filename);
      if (videoToDelete) {
        URL.revokeObjectURL(videoToDelete.url);
      }
      const newVideos = state.renderedVideos.filter((v) => v.filename !== filename);
      return { renderedVideos: newVideos };
    });
    deleteVideoFromDB(filename).catch(console.error);
  },

  loadPersistedVideos: async () => {
    // Only load if we are not currently rendering and store is empty
    const { isRendering, renderedVideos } = get();
    if (isRendering || renderedVideos.length > 0) return;
    try {
      const videos = await getAllVideosFromDB();
      if (videos.length > 0) {
        set({ renderedVideos: videos });
      }
    } catch (err) {
      console.error('Failed to load videos from IndexedDB:', err);
    }
  },
}));
