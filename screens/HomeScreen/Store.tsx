import { create } from "zustand";
import { NativeModules } from "react-native";
import { useVideoStore } from "../../utils/Store";
import { parseYTInitialData } from "../../utils/parseYTInitialData";
import { Video } from "../../utils/types";

type HomeScreenState = {
    isFetchingMore: boolean;
    retryCount: number;
    nextBroswe: () => void;

    // optional helpers
    setFetchingMore: (value: boolean) => void;
    incrementRetry: () => void;
    handleRetry: () => void;
};

export const useHomeScreenStore = create<HomeScreenState>((set, get) => ({
    isFetchingMore: false,
    retryCount: 0,

    setFetchingMore: (value) => set({ isFetchingMore: value }),

    incrementRetry: () =>
        set((state) => ({ retryCount: state.retryCount + 1 })),

    nextBroswe: async () => {

        const { continuation, visitorData, addVideo
            , setContinuation } = useVideoStore.getState()

        const { MyNativeModule } = NativeModules;
        const { retryCount, isFetchingMore, } = get()
        if (retryCount >= 3) return;
        if (isFetchingMore) return;
        try {

            const raw = await MyNativeModule.fetchFeed(null,
                continuation,
                visitorData
            );

            const videoGroup = parseYTInitialData(JSON.parse(raw));
            const freshShorts: Video[] = [];

            videoGroup.videos.forEach((element: any) => {
                if (!element.video_id) return;
                addVideo({
                    type: "video",
                    videoId: element.video_id,
                    title: element.title ?? "",
                    duration: element.duration ?? "",
                    views: element.views ?? "null",
                    channel: element.channel_photo ?? "",
                    publishedOn: element.publishedOn,
                    channelUrl: element.channel_url
                });
            });

            videoGroup.shorts.forEach((element: any) => {
                if (!element.video_id) return;

                freshShorts.push({
                    type: "video",
                    videoId: element.video_id,
                    title: element.title ?? "",
                    views: element.views ?? "null",
                });
            });

            if (freshShorts.length > 0) {
                addVideo({
                    type: "shorts",
                    videos: freshShorts,
                    videoId: freshShorts[0].videoId,
                });
            }
            setContinuation(videoGroup.continuationTokens?.[0] ?? "");

        } catch (e) {
            console.log(e)
        }
    },
    handleRetry: async () => {


    }
}));