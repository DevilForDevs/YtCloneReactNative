// Store.ts
import { create } from "zustand";
import { Platform, StatusBar } from "react-native";
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { initDB } from "../../utils/dbfunctions";
import { getIosPlayerResponse } from "../../utils/EndPoints";
import { Video } from "../../utils/types";
import { NativeModules } from "react-native";
import { parseWatchHtml } from "../../utils/watchHtmlParser";
import { VideoDescription, ShortVideo } from "../../utils/types";
import { videoId } from "../../utils/Interact";
import { extractPlaylistData } from "../../utils/playlistParser";


const extractPlaylistId = (url: string): string | undefined => {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : undefined;
};



type VideoPlayerState = {
    showBottomSheet: boolean,
    isGoingBack: boolean,
    isPlaylist: boolean,
    continuation: string | undefined;
    watchVisitorData: string;
    isFetchingMore: boolean,
    playerPoster: string,
    suggestedVideos: (Video | ShortVideo)[],
    watchHistory: Video[],
    currentVideo: VideoDescription | undefined,
    db: SQLiteDatabase | undefined,
    containerStyle: object;
    savedPositions: Record<string, number>;
    selectedTrack: number | "auto";
    mediaUrl: string;
    autoplayEnabled: boolean;
    seekTo: number;
    tracks: VideoTrack[];
    endedAsScreen: boolean;
    showFlatList: boolean;
    insets: { top: number; right: number; bottom: number };
    getPosition: (url: string) => number;
    toggleFlatList: () => void;
    setInsets: (top: number, right: number, bottom: number) => void;
    alterStyle: (insetsTop: number, right: number, bottom: number) => void;
    handleMoreVert: () => void;
    setAutoplayEnabled: (val: boolean) => void;
    setEndedAsScreen: (val: boolean) => void;
    setTracks: (tracks: VideoTrack[]) => void;
    setSeekTo: (position: number) => void;
    setMediaUrl: (url: string) => void;
    setSelectedTrack: (track: number | "auto") => void;
    reset: () => void;
    loadVideo: (mvideo: Video) => void;
    loadPlaylist: (link: string) => void;
    nextBrowse: () => void;
    handleYtIntents: (files: SharedFile[], short: (video: Video) => void) => void;
    setShowBottomSheet: (val: boolean) => void,
    changeResolution: (res: VideoTrack) => void,
    handleBackPress: () => boolean,
    setGoingBack: (val: boolean) => void;


};

const initialState = {
    showBottomSheet: false,
    isPlaylist: false,
    continuation: undefined,
    watchVisitorData: "",
    isFetchingMore: false,
    playerPoster: "",
    suggestedVideos: [],
    currentVideo: undefined,
    db: undefined,
    showFlatList: true,
    endedAsScreen: false,
    isGoingBack: false,
    watchHistory: [],
    insets: { top: 0, right: 0, bottom: 0 },
    containerStyle: { flex: 1 },
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    selectedTrack: "auto" as number | "auto",  // ← fixed
    savedPositions: {} as Record<string, number>,
    seekTo: 0,
    autoplayEnabled: true,
    tracks: [] as VideoTrack[],
};

export const useVideoPlayerStore = create<VideoPlayerState>((set, get) => ({

    ...initialState,

    setInsets: (top, right, bottom) => {
        set({ insets: { top, right, bottom } });

    },

    alterStyle: (insetsTop, right, bottom) => {
        const { showFlatList } = get();
        set({
            containerStyle: {
                flex: 1,
                paddingTop: insetsTop,
                paddingRight: !showFlatList ? right : 0,
                paddingBottom: showFlatList ? bottom : 0,


            },
        });
    },

    toggleFlatList: () => {
        const { showFlatList, insets, alterStyle } = get();
        set({ showFlatList: !showFlatList });
        alterStyle(insets.top, insets.right, insets.bottom);
    },

    handleMoreVert: () => {
        const { tracks } = get()
        if (tracks.length === 0) return;
        set({ showBottomSheet: true });
    },



    getPosition: (url) => get().savedPositions[url] ?? 0,

    setAutoplayEnabled: (val) => set({ autoplayEnabled: val }),

    setEndedAsScreen: (val) => {
        set({ endedAsScreen: val })

        const { suggestedVideos, autoplayEnabled,
            currentVideo, loadVideo
        } = get()

        if (!autoplayEnabled) return;

        const currentIndex = suggestedVideos.findIndex(
            (v) => v.type === "video" && v.videoId === currentVideo?.video.videoId
        );

        const nextVideo = suggestedVideos.slice(currentIndex + 1).find(v => v.type === "video");

        if (!nextVideo) {
            console.log("No next video to autoplay");
            return;
        }
        loadVideo(nextVideo);


    },
    setTracks: (tracks) => set({ tracks }),
    setSeekTo: (position) => set({ seekTo: position }),        // ← added
    setMediaUrl: (url) => set({ mediaUrl: url }),              // ← added
    setSelectedTrack: (track) => set({ selectedTrack: track }), // ← added
    reset: () => set(initialState),                            // ← added
    loadVideo: async (mvideo: Video) => {

        set({ playerPoster: mvideo.videoId })
        const { MyNativeModule } = NativeModules;

        const { db, isPlaylist, loadPlaylist,
            loadVideo, currentVideo,
            isGoingBack
        } = get()


        if (!isGoingBack) {
            if (currentVideo) {
                set((state) => {
                    const newVideo = currentVideo.video;

                    // remove if already exists
                    const filtered = state.watchHistory.filter(
                        (v) => v.videoId !== newVideo.videoId
                    );

                    return {
                        watchHistory: [
                            newVideo,
                            ...filtered
                        ].slice(0, 50) // limit to last 50
                    };
                });
            }
        }



        if (mvideo.playlistId) {
            if (mvideo.videoId.includes("PL")) {
                loadPlaylist(`https://www.youtube.com/playlist?list=${mvideo.videoId}`)
            }
            if (mvideo.videoId.includes("RD")) {
                loadVideo({
                    ...mvideo,
                    videoId: mvideo.playlistId
                })
            }
            return;
        }

        if (!db) {
            const db = await initDB();
            set({ db })
        }

        try {

            const playerResponse = await getIosPlayerResponse(mvideo.videoId);
            const streamingData = playerResponse.streamingData
            const videoDetails = playerResponse.videoDetails

            set({ mediaUrl: streamingData.hlsManifestUrl });


            const jsonString = await MyNativeModule.getYtInitialData(
                'https://www.youtube.com/watch?v=' + mvideo.videoId
            )

            const ytInitialData = JSON.parse(jsonString);

            const parseResult = parseWatchHtml(ytInitialData)

            const videoDes: VideoDescription = {
                title: videoDetails.title,
                uploaded: mvideo.publishedOn ? mvideo.publishedOn : "",
                hashTags: Array.isArray(videoDetails.keywords)
                    ? videoDetails.keywords.join(" ")
                    : "",
                dislikes: "Dislikes",
                views: Number(videoDetails.viewCount),
                subscriber: parseResult.channelinfo.subscriberCount,
                likes: parseResult.channelinfo.likes,
                commentsCount: parseResult.channelinfo.commentsCount ?? "",
                channelName: parseResult.channelinfo.channelName,
                channelPhoto: parseResult.channelinfo.channelPhoto,
                video: mvideo,
                channelId: videoDetails.channelId
            }
            set({ currentVideo: videoDes });



            if (!isPlaylist) {
                if (parseResult.items.length == 0) {


                    const delay = (ms: number) => new Promise<void>((res) => setTimeout(() => res(), ms));

                    for (let i = 1; i <= 5; i++) {
                        const jsonString = await MyNativeModule.getYtInitialData(
                            'https://www.youtube.com/watch?v=' + mvideo.videoId
                        );

                        const ytInitialData = JSON.parse(jsonString);
                        const result = parseWatchHtml(ytInitialData);

                        if (result.items.length > 0) {
                            set({ suggestedVideos: result.items });
                            break;
                        }

                        console.log("Retry:", i);
                        await delay(500);
                    }

                } else {
                    set({ suggestedVideos: parseResult.items })
                    set({ watchVisitorData: parseResult.visitorData })
                    set({ continuation: parseResult.continuation ?? undefined })
                }
            }

        } catch (e) {
            console.log(e)
        }

    },
    nextBrowse: async () => {

        const { MyNativeModule } = NativeModules;
        const { isFetchingMore, continuation, playerPoster, watchVisitorData, isPlaylist } = get();

        if (!continuation) return;
        if (isFetchingMore) return;

        set({ isFetchingMore: true });

        try {
            if (isPlaylist) {

                const jsonString = await MyNativeModule.getYtPlaylistBrowse(
                    "continuation",
                    continuation, null
                );
                const result = extractPlaylistData(JSON.parse(jsonString));
                set((state) => ({
                    suggestedVideos: [
                        ...state.suggestedVideos,
                        ...result.videos
                    ],
                    continuation: result.continuationToken ?? undefined
                }));

            } else {

                const raw = await MyNativeModule.fetchFeed(
                    playerPoster,
                    continuation,
                    watchVisitorData
                );

                const ytInitialData = JSON.parse(raw);
                const parseResult = parseWatchHtml(ytInitialData);

                // ✅ append items instead of replacing
                set((state) => ({
                    suggestedVideos: [
                        ...state.suggestedVideos,
                        ...parseResult.items
                    ],
                    continuation: parseResult.continuation ?? undefined
                }));
            }

        } catch (e) {
            console.log(e);
        }

        set({ isFetchingMore: false });
    },
    handleYtIntents: async (files, short) => {

        const db = await initDB();

        const { loadVideo, loadPlaylist } = get();

        set({ db })
        for (const item of files as SharedFile[]) {
            if (item.weblink) {

                if (item.weblink.includes("youtube")) {

                    if (item.weblink.includes("list")) {
                        loadPlaylist(item.weblink)
                    } else {

                        const ytVideoId = videoId(item.weblink)
                        const requiredVideo: Video = {
                            type: 'video',
                            videoId: ytVideoId,
                            title: '',
                            views: 'NO views',
                        };
                        if (item.weblink.includes("shorts")) {
                            short(requiredVideo);
                        } else {
                            loadVideo(requiredVideo);
                        }
                    }
                    break;
                }
            }
        }
    },
    loadPlaylist: async (link: string) => {

        const { loadVideo } = get();
        const { MyNativeModule } = NativeModules;
        set({ isPlaylist: true })
        const playlistId = extractPlaylistId(link);
        const browseId = `VL${playlistId}`;
        const jsonString = await MyNativeModule.getYtPlaylistBrowse(
            "browseId",
            browseId, null
        );
        const result = extractPlaylistData(JSON.parse(jsonString));
        set({ suggestedVideos: result.videos });
        set({ continuation: result.continuationToken ?? undefined });
        loadVideo(result.videos[0]);
    },
    setShowBottomSheet: (val) => {
        set({ showBottomSheet: val });
    },
    changeResolution: (res) => {
        const index = res.trakIndex ?? 0;

        set((state) => ({
            selectedTrack: index,
            tracks: state.tracks.map(t => ({
                ...t,
                selected: t.trakIndex === index,
            })),
            showBottomSheet: false
        }));

    },
    handleBackPress: () => {

        const { loadVideo, watchHistory } = get();

        if (watchHistory.length > 0) {
            const lastVideo = watchHistory[0]; // latest

            set((state) => ({
                isGoingBack: true,
                watchHistory: state.watchHistory.slice(1) // ✅ remove first item
            }));



            loadVideo(lastVideo);

            return true;
        }

        return false;
    },
    setGoingBack: (val) => set({ isGoingBack: val }),

}));

