import { create } from "zustand";
import { renderSign } from "./renderSign";
import {
  saveVideoToDB,
  getAllVideosFromDB,
  deleteVideoFromDB,
} from "../utils/videoDB";
import {
  requestNotifyPermission,
  notifySignDone,
  notifyComplete,
} from "../utils/notify";

export const useRenderStore = create((set, get) => ({
  signsData: [],
  renderedVideos: [],
  isRendering: false,
  currentRenderIndex: 0,
  progress: { stage: "idle", percent: 0 },
  isComplete: false,

  setSignsData: (data) =>
    set({
      signsData: data,
      isComplete: false,
      renderedVideos: [],
      currentRenderIndex: 0,
      progress: { stage: "idle", percent: 0 },
    }),

  startRendering: async (navigate) => {
    const { signsData, isRendering } = get();
    if (signsData.length === 0 || isRendering) return;

    // Ask for browser notification permission (once, before rendering starts)
    await requestNotifyPermission();

    set({
      isRendering: true,
      currentRenderIndex: 0,
      isComplete: false,
      renderedVideos: [],
    });

    // SEQUENTIAL QUEUE RULE:
    // Signs must render one at a time only.
    for (let i = 0; i < signsData.length; i++) {
      set({ currentRenderIndex: i });

      try {
        const video = await renderSign(signsData[i], (progressState) => {
          set({ progress: progressState });
        });

        // Persist to IndexedDB so the video survives tab changes and refreshes
        await saveVideoToDB(video);

        set((state) => ({
          renderedVideos: [...state.renderedVideos, video],
        }));

        // Optional: Fire a silent notification after each sign completes
        notifySignDone(signsData[i].name, i + 1, signsData.length);
      } catch (error) {
        console.error(`Failed to render sign ${signsData[i].name}:`, error);
      }
    }

    set({
      isRendering: false,
      isComplete: true,
      progress: { stage: "idle", percent: 0 },
    });

    // Fire completion notification
    notifyComplete(get().renderedVideos.length, navigate);
  },

  deleteVideo: (filename) => {
    set((state) => {
      const videoToDelete = state.renderedVideos.find(
        (v) => v.filename === filename,
      );
      if (videoToDelete) {
        URL.revokeObjectURL(videoToDelete.url);
      }
      const newVideos = state.renderedVideos.filter(
        (v) => v.filename !== filename,
      );
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
      console.error("Failed to load videos from IndexedDB:", err);
    }
  },
}));
