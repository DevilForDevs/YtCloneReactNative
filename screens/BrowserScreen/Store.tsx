import { create } from "zustand";
import { parseYTInitialData } from "../../utils/parseYTInitialData";
import { Video } from "../../utils/types";
import { useVideoStore } from "../../utils/Store";

type BrowserScreenStore = {
    chunkBuffers: Record<string, string[]>;
    visitorData: string | null;
    canGoBack: boolean,
    setVisitorData: (data: string) => void;
    onMessage: (event: any, taskCompleted: () => void) => void;
    setCanGoBack: (state: boolean) => void
};

export const useBrowserScreenStore = create<BrowserScreenStore>((set, get) => ({
    canGoBack: false,
    chunkBuffers: {},
    visitorData: null,

    setVisitorData: (data) => set({ visitorData: data }),

    onMessage: (event: any, taskCompleted) => {
        const { addVideo, setContinuation, setVisitorData, totalVideos } = useVideoStore.getState();
        try {
            const msg = JSON.parse(event.nativeEvent.data);
            const { type } = msg;
            const buffers = get().chunkBuffers;

            // 1️⃣ Chunk handling
            if (msg.chunk !== undefined) {
                if (!buffers[type]) buffers[type] = [];
                buffers[type][msg.index] = msg.chunk;

                set({ chunkBuffers: { ...buffers } });
                return;
            }

            // 2️⃣ Chunk done
            if (type?.endsWith("_DONE")) {
                const baseType = type.replace("_DONE", "");
                const chunks = buffers[baseType];
                if (!chunks) return;

                delete buffers[baseType];

                const payload = JSON.parse(chunks.join(""));
                set({ chunkBuffers: { ...buffers } });

                if (baseType === "YT_INITIAL_DATA") {

                    const visitor =
                        payload.data?.responseContext?.webResponseContextExtensionData
                            ?.ytConfigData?.visitorData;

                    setVisitorData(visitor);

                    const videoGroup = parseYTInitialData(payload.data);

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

                    // videoGroup.shorts.forEach((element: any) => {
                    //     if (!element.video_id) return;

                    //     freshShorts.push({
                    //         type: "video",
                    //         videoId: element.video_id,
                    //         title: element.title ?? "",
                    //         views: element.views ?? "null",
                    //     });
                    // });
                    // addVideo({
                    //     type: "shorts",
                    //     videos: freshShorts,
                    //     videoId: freshShorts[0].videoId,
                    // });

                    setContinuation(videoGroup.continuationTokens?.[0] ?? "");
                    console.log("browserscreen")

                    if (totalVideos.length != 0) {
                        taskCompleted();
                    }

                }

                return;
            }
        } catch (err) {
            console.warn("WebView message error:", err);
        }
    },
    setCanGoBack: (state: boolean) => {
        set({ canGoBack: state })
    }
}));
