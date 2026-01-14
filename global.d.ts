import { channelTabs } from "./utils/channelVideosParser";
import { DownloadItem, ShortVideo, Video } from "./utils/types";
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
        publishedOn?: string
    };

    type ShortsData = {
        title: string | null;
        video_id: string | null;
        views: string | null;
    };

    export type RootStackParamList = {
        SplashScreen: undefined,
        LoginScreen: undefined,
        BrowserScreen: { name: string },
        BottomNav: undefined,
        VideoPlayerScreen: { arrivedVideo: Video, playlistId: string | undefined };
        ShortsPlayerScreen: { arrivedVideo: Video },
        DownloadsScreen: undefined,
        SearchScreen: undefined,
        OfflinePlayer: { item: DownloadItem },
        PlaylistScreen: { playlistlink: string },
        ChannelScreen: { channelUrl: string },
        SitesScreen: undefined,
        CommanScreen: undefined,
        CommanPlayerScreen: { arrivedVideo: Video }
    };

    type navStack = NativeStackNavigationProp<
        RootStackParamList
    >;

    type AskFormatOptions = {
        onSelect: (itag: number) => void;
    };

    type AskFormatContextType = {
        openAskFormat: (options: Video) => void;
        closeAskFormat: () => void;
    };

    export interface Channel {
        name?: string;
        canonicalUrl?: string;
        photo?: string;
        subscribers?: string;
        totalVideos?: string,
        posterUrl?: string,
        channelTabs: ChannelTab[]
    }












}
