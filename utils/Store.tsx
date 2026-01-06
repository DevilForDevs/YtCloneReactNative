import { create } from "zustand";
import { Video, ShortVideo, DownloadStoreModel, DownloadItem } from "./types";
import { VideoStore } from "./types";


export const useVideoStore = create<VideoStore>((set, get) => ({
  totalVideos: [],
  continuation: "",
  query: "tum hi ho",
  visitorData: "",

  addVideo: (item) =>
    set((state) => {
      if (item.type === "video") {


        return {
          totalVideos: [...state.totalVideos, item],
        };
      }

      if (item.type === "shorts") {
        const newVideos = item.videos

        if (newVideos.length === 0) return state;

        return {
          totalVideos: [
            ...state.totalVideos,
            { ...item, videos: newVideos },
          ],

        };
      }

      return state;
    }),

  setContinuation: (continuation) => set({ continuation }),
  setQuery: (query) => set({ query }),
  setVisitorData: (visitorData: string) =>
    set((state) => {
      if (!visitorData || visitorData === state.visitorData) {
        return state; // avoid useless updates
      }
      return { visitorData };
    }),
  clearVideos: () => set({ totalVideos: [] }),


  clearAll: () =>
    set({
      totalVideos: [],
      continuation: "",
      visitorData: "",
    }),
}));


export const useVideoStoreForWatch = create<VideoStore>((set, get) => ({

  totalVideos: [],
  continuation: "",
  query: "tum hi ho",
  visitorData: "",
  addVideo: (item) =>
    set((state) => {
      if (item.type === "video") {


        return {
          totalVideos: [...state.totalVideos, item],
        };
      }

      if (item.type === "shorts") {
        const newVideos = item.videos

        if (newVideos.length === 0) return state;

        return {
          totalVideos: [
            ...state.totalVideos,
            { ...item, videos: newVideos },
          ],
        };
      }

      return state;
    }),

  setContinuation: (continuation) => set({ continuation }),
  setQuery: (query) => set({ query }),

  setVisitorData: (visitorData: string) =>
    set((state) => {
      if (!visitorData || visitorData === state.visitorData) {
        return state; // avoid useless updates
      }
      return { visitorData };
    }),
  clearVideos: () => set({ totalVideos: [] }),


  clearAll: () =>
    set({
      totalVideos: [],
      continuation: "",
      visitorData: "",
    }),
}));


export const useVideoStoreForPlaylist = create<VideoStore>((set, get) => ({

  totalVideos: [],
  seenVideosIds: [],
  continuation: "",
  query: "tum hi ho",
  visitorData: "",

  addVideo: (item) =>
    set((state) => {
      if (item.type === "video") {
        return {
          totalVideos: [...state.totalVideos, item],
        };
      }
      if (item.type === "shorts") {
        return {
          totalVideos: [
            ...state.totalVideos,
            { ...item, videos: item.videos },
          ],
        };
      }

      return state;
    }),
  setContinuation: (continuation) => set({ continuation }),
  setQuery: (query) => set({ query }),
  setVisitorData: (visitorData: string) =>
    set((state) => {
      if (!visitorData || visitorData === state.visitorData) {
        return state; // avoid useless updates
      }
      return { visitorData };
    }),

  clearVideos: () => set({ totalVideos: [] }),
  clearAll: () =>
    set({
      totalVideos: [],
      continuation: "",
      visitorData: "",
    }),
}));


export const useVideoStoreForSearch = create<VideoStore>((set, get) => ({
  totalVideos: [],
  seenVideosIds: [],
  continuation: "",
  query: "tum hi ho",
  visitorData: "",
  addVideo: (item) =>
    set((state) => {
      if (item.type === "video") {
        return {
          totalVideos: [...state.totalVideos, item],
        };
      }

      if (item.type === "shorts") {
        return {
          totalVideos: [
            ...state.totalVideos,
            { ...item, videos: item.videos },
          ],
        };
      }

      return state;
    }),
  setContinuation: (continuation) => set({ continuation }),
  setQuery: (query) => set({ query }),

  setVisitorData: (visitorData: string) =>
    set((state) => {
      if (!visitorData || visitorData === state.visitorData) {
        return state; // avoid useless updates
      }
      return { visitorData };
    }),
  clearVideos: () => set({ totalVideos: [] }),


  clearAll: () =>
    set({
      totalVideos: [],
      continuation: "",
      visitorData: "",
    }),
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


export type ChannelStore = {
  tabs: Record<TabKey, VideoStore>
}

const createVideoTabSlice = (
  set: TabSetter<VideoStore>,
  get: TabGetter<VideoStore>
): VideoStore => ({
  totalVideos: [],
  continuation: "",
  query: "",
  visitorData: "",

  addVideo: (item) =>
    set((state) => {
      // ⚡ Check for duplicates
      const exists = state.totalVideos.some(
        (v) => v.videoId === item.videoId
      );
      if (exists) return {}; // do not add if already exists

      if (item.type === "video") {
        return {
          totalVideos: [...state.totalVideos, item],
        };
      }

      if (item.type === "shorts") {
        return {
          totalVideos: [
            ...state.totalVideos,
            { ...item, videos: item.videos },
          ],
        };
      }

      return {};
    }),

  setContinuation: (continuation) => set(() => ({ continuation })),

  setQuery: (query) => set(() => ({ query })),

  setVisitorData: (visitorData) =>
    set((state) => {
      if (!visitorData || visitorData === state.visitorData) {
        return {};
      }
      return { visitorData };
    }),

  clearVideos: () => set(() => ({ totalVideos: [] })),
});



type TabSetter<T> = (fn: (state: T) => Partial<T>) => void
type TabGetter<T> = () => T

export const useChannelStore = create<ChannelStore>((set, get) => ({
  tabs: {
    videos: createVideoTabSlice(
      (fn) =>
        set((state) => ({
          tabs: {
            ...state.tabs,
            videos: { ...state.tabs.videos, ...fn(state.tabs.videos) },
          },
        })),
      () => get().tabs.videos
    ),

    shorts: createVideoTabSlice(
      (fn) =>
        set((state) => ({
          tabs: {
            ...state.tabs,
            shorts: { ...state.tabs.shorts, ...fn(state.tabs.shorts) },
          },
        })),
      () => get().tabs.shorts
    ),

    playlists: createVideoTabSlice(
      (fn) =>
        set((state) => ({
          tabs: {
            ...state.tabs,
            playlists: {
              ...state.tabs.playlists,
              ...fn(state.tabs.playlists),
            },
          },
        })),
      () => get().tabs.playlists
    ),
  },
}))

type TabKey = "videos" | "shorts" | "playlists"


export const useChannelTab = (tab: TabKey) =>
  useChannelStore((state) => state.tabs[tab])

















