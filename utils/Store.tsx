import { create } from "zustand";
import { DownloadStoreModel, DownloadItem, Video, VideoStore } from "./types";
import RNFS from 'react-native-fs';
import { initDB, loadDownloads, createDownloadsTable } from "./dbfunctions";
import { createHistoryTable } from "../screens/SavedScreen/backend/dbo";
import { convertBytes } from "./Interact";

async function getFileSize(folder: string, fileName: string) {
  try {
    const baseDir =
      folder === 'movies'
        ? `${RNFS.ExternalStorageDirectoryPath}/Movies`
        : `${RNFS.ExternalStorageDirectoryPath}/Music`;

    const path = `${baseDir}/${fileName}`;

    if (!(await RNFS.exists(path))) return 0;

    const stats = await RNFS.stat(path);
    return Number(stats.size);
  } catch (e) {
    console.warn('File size error:', e);
    return 0;
  }
}

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
  continuation: "",
  query: "tum hi ho",
  visitorData: "",

  addVideo: (item) =>
    set((state) => {
      // ---------- SINGLE VIDEO ----------
      if (item.type === "video") {
        const exists = state.totalVideos.some(
          (v: any) => v.type === "video" && v.videoId === item.videoId
        );

        if (exists) return state; // ⛔ already added

        return {
          totalVideos: [...state.totalVideos, item],
        };
      }

      // ---------- SHORTS GROUP ----------
      if (item.type === "shorts") {
        // collect all existing videoIds (videos + shorts)
        const existingIds = new Set<string>();

        state.totalVideos.forEach((v: any) => {
          if (v.type === "video") {
            existingIds.add(v.videoId);
          } else if (v.type === "shorts") {
            v.videos.forEach((sv: any) => existingIds.add(sv.videoId));
          }
        });

        const newShorts = item.videos.filter(
          (v: any) => !existingIds.has(v.videoId)
        );

        if (newShorts.length === 0) return state; // ⛔ nothing new

        return {
          totalVideos: [
            ...state.totalVideos,
            { ...item, videos: newShorts },
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
        return state;
      }
      return { visitorData };
    }),

  clearVideos: () =>
    set({
      totalVideos: [],
    }),

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
  loadDownloads: async () => {
    const dbInstance = await initDB();
    await createDownloadsTable(dbInstance);
    await createHistoryTable(dbInstance);
    const items = await loadDownloads(dbInstance);

    const downloads: DownloadItem[] = [];

    for (const item of items) {
      const fileSize = await getFileSize(item.folder, item.title);

      const video: Video = {
        videoId: item.videoId,
        title: item.title,
        views: item.folder === 'movies' ? 'Video' : 'Audio',
        type: 'video',
        duration: item.duration,
      };

      const downloadItem: DownloadItem = {
        video,
        speed: 'Finished',
        isFinished: true,
        isStopped: false,
        transferInfo: convertBytes(fileSize),
        progressPercent: 100,
        message: 'Finished',
      };
      downloads.push(downloadItem);
    }
    set({ totalDownloads: downloads });

  }
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

type SharedFilesStore = {
  files: SharedFile[];

  setFiles: (files: SharedFile[]) => void;
  addFile: (file: SharedFile) => void;
  clearFiles: () => void;
};

export const useSharedFilesStore = create<SharedFilesStore>((set) => ({
  files: [],

  setFiles: (files) => set({ files }),

  addFile: (file) =>
    set((state) => ({
      files: [...state.files, file],
    })),

  clearFiles: () => set({ files: [] }),
}));















