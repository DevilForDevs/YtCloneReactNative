import { ShortVideo, Video } from "./utils/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
export { };

declare global {


    type SearchModelStore = {
        searchItems: Video | ShortVideo[],
        addSearchItem: (item: Video | ShortVideo[]) => void,
    }
    type initialData = {
        videos: VideoData[];
        shorts: ShortsData[];
        continuationTokens: string[];
    }
    export type BottomTabParamList = {
        Home: { initialData: initialData };
        Shorts: undefined;
        Upload: undefined;
        Subscriptions: undefined;
        Library: undefined;
    };
    type VideoData = {
        title: string | null;
        video_id: string | null;
        views: string | null;
        channel_name: string | null;
        channel_photo: string | null;
        channel_url: string | null;
        duration: string | null;
    };

    type ShortsData = {
        title: string | null;
        video_id: string | null;
        views: string | null;
    };

    export type RootStackParamList = {
        SplashScreen: undefined,
        LoginScreen: undefined,
        BrowserScreen: undefined,
        BottomNav: undefined,
        VideoPlayerScreen: { arrivedVideo: Video };
        ShortsPlayerScreen: { arrivedVideo: Video },
        DownloadsScreen: undefined,
    };

    type navStack = NativeStackNavigationProp<
        RootStackParamList
    >;










}
