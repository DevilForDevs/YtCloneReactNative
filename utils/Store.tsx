import { create } from "zustand";
import { Video, ShortVideo, DownloadStoreModel, DownloadItem } from "./types";
import { VideoStore } from "./types";



function addVideoF(state: VideoStore, item: Video | ShortVideo) {
  return {
    totalVideos: [...state.totalVideos, item],
  };
}

function addSeenVideoIdF(state: VideoStore, videoId: string) {
  return {
    seenVideosIds: [...state.seenVideosIds, videoId],
  };
}


export const useVideoStore = create<VideoStore>((set, get) => ({
  totalVideos: [],
  seenVideosIds: [],
  continuation: "",
  query: "tum hi ho",

  addVideo: (item) =>
    set((state) => {
      // ─────────────────────────────
      // 🎥 Single video
      // ─────────────────────────────
      if (item.type === "video") {
        if (state.seenVideosIds.includes(item.videoId)) {
          return state; // ❌ duplicate
        }

        return {
          totalVideos: [...state.totalVideos, item],
          seenVideosIds: [...state.seenVideosIds, item.videoId],
        };
      }

      // ─────────────────────────────
      // 📱 Shorts group
      // ─────────────────────────────
      if (item.type === "shorts") {
        const newVideos = item.videos.filter(
          (v) => !state.seenVideosIds.includes(v.videoId)
        );

        if (newVideos.length === 0) {
          return state; // ❌ all duplicates
        }

        return {
          totalVideos: [
            ...state.totalVideos,
            { ...item, videos: newVideos },
          ],
          seenVideosIds: [
            ...state.seenVideosIds,
            ...newVideos.map((v) => v.videoId),
          ],
        };
      }

      return state;
    }),

  addSeenVideoId: (videoId) =>
    set((state) => {
      if (state.seenVideosIds.includes(videoId)) return state;
      return {
        seenVideosIds: [...state.seenVideosIds, videoId],
      };
    }),

  setContinuation: (continuation) => set({ continuation }),
  setQuery: (query) => set({ query }),

  clearVideos: () => set({ totalVideos: [] }),
  clearSeenVideosIds: () => set({ seenVideosIds: [] }),
}));


function addDownloadItemF(
  state: DownloadStoreModel,
  item: DownloadItem,
  index: number
) {
  const newDownloads = [...state.totalDownloads];
  newDownloads.splice(index, 0, item); // insert at index

  return {
    totalDownloads: newDownloads,
  };
}


export const DownloadsStore = create<DownloadStoreModel>((set) => ({
  totalDownloads: [],

  addDownloadItem: (item, index) => set((state) => addDownloadItemF(state, item, index)),

  updateItem: (videoId, updates) =>
    set((state) => ({
      totalDownloads: state.totalDownloads.map((item) =>
        item.video.videoId === videoId ? { ...item, ...updates } : item
      ),
    })),



  updateFinished: (videoId, isFinished) =>
    set((state) => ({
      totalDownloads: state.totalDownloads.map((item) =>
        item.video.videoId === videoId ? { ...item, isFinished } : item
      ),
    })),

  updateStopped: (videoId, isStopped) =>
    set((state) => ({
      totalDownloads: state.totalDownloads.map((item) =>
        item.video.videoId === videoId ? { ...item, isStopped } : item
      ),
    })),
}));










// export const useVideoStore = create<VideoStore>((set) => ({
//   totalVideos: [],
//   continuation: "",
//   seenVideos: [],

//   setVideos: (videos) => set({ totalVideos: videos }),
//   addVideo: (video) =>
//     set((state) => ({
//       totalVideos: [...state.totalVideos, video],
//     })),
//   clearVideos: () => set({ totalVideos: [] }),

//   setContinuation: (c) => set({ continuation: c }),
//   addSeenVideo: (id) =>
//     set((state) => ({
//       seenVideos: [...state.seenVideos, id],
//     })),
//   clearSeenVideos: () => set({ seenVideos: [] }),
// }));