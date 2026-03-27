import { create } from "zustand"
import { Video, VideoDescription } from "../../utils/types"
import {
    NativeModules
} from 'react-native'
import { fetchHlsUrl } from '../../utils/downloadFunctions';
import { parseShortMeta } from "../../utils/shortsMetaParser";
type ShortsStoreType = {
    mediaUrl: string,
    posterUrl: string,
    buffering: boolean,
    paused: boolean,
    showPlayIcon: boolean,
    currentVideId: string | undefined,
    relatedVideoIds: string[]
    tracks: VideoTrack[],
    currentVideoInfo: VideoDescription | undefined,
    prevVideoInfo: VideoDescription | undefined,
    nextVideoInfo: VideoDescription | undefined,
    selectedTrack: number | "auto",
    showBottomSheet: boolean,
    loadVideo: (item: Video) => void,
    loadNext: () => void,
    preloadNext: () => void,
    loadPrev: () => void,
    setTraks: (traks: VideoTrack[]) => void,
    changeResolution: (res: VideoTrack) => void,
    close: () => void,
    openBottomSheet: () => void,
    setPaused: (value: boolean) => void,
    setShowPlayIcon: (value: boolean) => void,
    togglePlayback: () => void

}

const prefill = {
    buffering: false,
    posterUrl: "",
    paused: false,
    tracks: [],
    currentVideoInfo: undefined,
    showPlayIcon: true,
    currentVideId: undefined,
    relatedVideoIds: [],
    prevVideoInfo: undefined,
    nextVideoInfo: undefined,
    showBottomSheet: false



}

const refillUnusedIds = async (seedVideoId: string): Promise<string[]> => {
    const { MyNativeModule } = NativeModules
    const raw = await MyNativeModule.getRelatedShortVideoIds(
        seedVideoId
    );

    let ids: string[] = [];

    try {
        ids = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
        if (typeof raw === "string" && raw.length === 11) ids = [raw];
    }

    return ids.filter(id => typeof id === "string" && id.length === 11);
};


export const useShortsStore = create<ShortsStoreType>((set, get) => ({
    ...prefill,
    selectedTrack: "auto",
    mediaUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    loadNext: async () => {

        const { nextVideoInfo, preloadNext, currentVideoInfo } = get();

        if (nextVideoInfo) {
            set({ mediaUrl: nextVideoInfo.hlsUrl })
        }

        set({ prevVideoInfo: currentVideoInfo });

        set({
            currentVideoInfo: nextVideoInfo
        })
        preloadNext();
    },
    loadVideo: async (item) => {
        set({ buffering: true })
        const hlsUrl = await fetchHlsUrl(item.videoId);
        if (hlsUrl != null) {
            set({ mediaUrl: hlsUrl })
        }
        set({ buffering: false })
        set({ currentVideId: item.videoId });

        const meta = await safeGetShortMeta(item.videoId);
        const result = parseShortMeta(meta);
        set({
            currentVideoInfo: {
                title: result.title,
                views: 0,
                uploaded: "unknown",
                hashTags: "",
                likes: result.likes,
                dislikes: "",
                subscriber: "",
                commentsCount: result.comments,
                channelName: result.channelName,
                channelPhoto: result.channelThumbnail,
                video: {
                    type: "video",
                    videoId: item.videoId,
                    title: result.title,
                    views: "",
                },
                hlsUrl: hlsUrl ?? "",
                channelId: result.canonicalUrl
            }
        })


    },
    preloadNext: async () => {
        const { currentVideId, relatedVideoIds, loadVideo } = get();

        let ids = relatedVideoIds;

        // If empty, fetch new ids
        if (ids.length === 0 && currentVideId) {
            ids = await refillUnusedIds(currentVideId);
        }

        if (ids.length === 0) return;

        // take first id
        const nextId = ids[0];
        set({ currentVideId: nextId });

        // update queue
        set({
            relatedVideoIds: ids.slice(1)
        });

        const hlsUrl = await fetchHlsUrl(nextId);

        const meta = await safeGetShortMeta(nextId);
        const result = parseShortMeta(meta);
        set({
            nextVideoInfo: {
                title: result.title,
                views: 0,
                uploaded: "unknown",
                hashTags: "",
                likes: result.likes,
                dislikes: "",
                subscriber: "",
                commentsCount: result.comments,
                channelName: result.channelName,
                channelPhoto: result.channelThumbnail,
                video: {
                    type: "video",
                    videoId: nextId,
                    title: result.title,
                    views: "",
                },
                hlsUrl: hlsUrl ?? "",
                channelId: result.canonicalUrl
            }
        })
    },
    loadPrev: () => {
        const { prevVideoInfo, currentVideoInfo } = get();

        if (!prevVideoInfo) return;

        set({
            mediaUrl: prevVideoInfo.hlsUrl,
            nextVideoInfo: currentVideoInfo,
            currentVideoInfo: prevVideoInfo,
            prevVideoInfo: undefined,
        });
    },
    setTraks: (tracks) => {
        let selected: number | "auto" = "auto";

        if (tracks.length >= 3 && tracks[2].trakIndex != null) {
            selected = tracks[2].trakIndex;
        } else if (tracks.length > 0 && tracks[0].trakIndex != null) {
            selected = tracks[Math.floor(tracks.length / 2)].trakIndex!;
        }

        const updatedTracks = tracks.map((t) => ({
            ...t,
            selected: t.trakIndex === selected
        }));

        set({
            tracks: updatedTracks,
            selectedTrack: selected
        });
    },
    changeResolution: (res) => {
        const index = res.trakIndex ?? 0;

        const { tracks } = get();

        const updatedTracks = tracks.map((t) => ({
            ...t,
            selected: t.trakIndex === index
        }));

        set({
            selectedTrack: index,
            tracks: updatedTracks,
            showBottomSheet: false
        });
    },
    close: () => {
        set({ showBottomSheet: false })
    },
    openBottomSheet: () => {
        set({ showBottomSheet: true })
    },
    setPaused: (value) => set({ paused: value }),

    setShowPlayIcon: (value) => set({ showPlayIcon: value }),

    togglePlayback: () => {
        set((state) => ({
            paused: !state.paused,
            showPlayIcon: true
        }))
    },

}))

async function safeGetShortMeta(videoId: string): Promise<any | null> {
    const { MyNativeModule } = NativeModules
    try {
        const raw = await MyNativeModule.getShortMeta(videoId);
        return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
        return null;
    }
}


