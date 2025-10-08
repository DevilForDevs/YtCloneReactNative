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


export const useVideoStore = create<VideoStore>((set) => ({
  totalVideos: [],
  seenVideosIds: [],
  continuation: "",
  query: "tum hi ho",
  addVideo: (item) => set((state) => addVideoF(state, item)),
  addSeenVideoId: (videoId) => set((state) => addSeenVideoIdF(state, videoId)),
  setContinuation: (continuation) => set(() => ({ continuation })),
  setQuery: (query) => set(() => ({ query })),
  clearVideos: () => set(() => ({ totalVideos: [] })),
  clearSeenVideosIds: () => set(() => ({ seenVideosIds: [] }))
}))


function addDownloadItemF(state: DownloadStoreModel, item: DownloadItem) {
  return {
    totalDownloads: [...state.totalDownloads, item],
  };
}

export const DownloadsStore = create<DownloadStoreModel>((set) => ({
  totalDownloads: [],

  addDownloadItem: (item) => set((state) => addDownloadItemF(state, item)),

  updateItem: (videoId, updates) =>
    set((state) => ({
      totalDownloads: state.totalDownloads.map((item) =>
        item.video.videoId === videoId ? { ...item, ...updates } : item
      ),
    })),

  

  updateFinished: (videoId, isFinished) =>
    set((state) => ({
      totalDownloads: state.totalDownloads.map((item) =>
        item.video.videoId ===videoId ? { ...item, isFinished } : item
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