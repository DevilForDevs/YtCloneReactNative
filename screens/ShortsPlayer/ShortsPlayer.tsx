import {
    StyleSheet, Text, View, Pressable,
    ActivityIndicator, TouchableOpacity,
    NativeModules
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import IconMat from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from "react-native-video";
import RightControls from './RightControls';
import BottomControls from './BottomControls';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { VideoDescription } from "../../utils/types";
type NavigationProp = RouteProp<RootStackParamList, "ShortsPlayerScreen">;
type Navstack = NativeStackNavigationProp<RootStackParamList, "BottomNav">;
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { createResolutionPlaylistsRN } from '../../utils/createResolutionPlaylists';
import RNFS from 'react-native-fs';
import { fetchHlsUrl } from '../../utils/downloadFunctions';
import { useAskFormat } from '../AskFormatContext';

export default function ShortsPlayer() {
    const route = useRoute<NavigationProp>();
    const navigation = useNavigation<Navstack>();
    const { arrivedVideo } = route.params;
    const [currentVideoId, setCurrentVideoId] = useState("")
    const [mediaUrl, setMediaUrl] = useState("");
    const [paused, setPaused] = useState(false);
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const [buffering, setBuffering] = useState(false);
    const { MyNativeModule } = NativeModules
    const [currentVideoInfo, setCurrentVideoInfo] = useState<VideoDescription>();
    const [resolutions, setResolutions] = useState<string[]>([]);
    const [currentResolutionIndex, setCurrentResolutionIndex] = useState(0);
    const [unusedIds, setUnusedIds] = useState<string[]>([]);
    const [nextVideoInfo, setNextVideoInfo] = useState<VideoDescription>();
    const [prevStack, setPrevStack] = useState<VideoDescription[]>([]);
    const { openAskFormat } = useAskFormat();



    async function playVideo(hlsUrl: string, videoId: string) {
        const resolutions = await createResolutionPlaylistsRN(
            hlsUrl,
            RNFS.DocumentDirectoryPath,
            videoId
        );
        if (resolutions.length > 0) {

            let appropriateResolution: string | undefined;
            let selectedIndex = -1;

            for (let i = 0; i < resolutions.length; i++) {
                const res = resolutions[i];
                console.log(res);

                const height = Number(res.split("x")[0]);
                if (height === 480) {
                    appropriateResolution = res;
                    selectedIndex = i;
                    break;
                }
            }

            console.log("SELECTED:", appropriateResolution);

            if (!appropriateResolution) {
                // fallback (max 360/480, avoid 720+)
                selectedIndex = Math.max(resolutions.length - 1, 0);
                appropriateResolution = resolutions[selectedIndex];
            }

            const localM3u8Path =
                `${RNFS.DocumentDirectoryPath}/${videoId}(${appropriateResolution}).m3u8`;

            setCurrentResolutionIndex(selectedIndex);
            setMediaUrl(`file://${localM3u8Path}`);
            setResolutions(resolutions);
            setCurrentVideoId(videoId);

        } else {
            console.log("fallbackHappened");
            // fallback to original manifest
            setMediaUrl(hlsUrl);
        }
    }







    const decreaseResolution = () => {
        if (resolutions.length === 0) return;

        if (currentResolutionIndex != 0) {
            const nextIndex = currentResolutionIndex - 1;
            if (nextIndex < resolutions.length) {
                const nextRes = resolutions[nextIndex];
                const localM3u8Path = `${RNFS.DocumentDirectoryPath}/${currentVideoId}(${nextRes}).m3u8`;
                setMediaUrl(`file://${localM3u8Path}`);
                setPaused(false);
                setCurrentResolutionIndex(nextIndex);
            }
        }
    };

    async function safeGetShortMeta(videoId: string): Promise<any | null> {
        try {
            const raw = await MyNativeModule.getShortMeta(videoId);
            return typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch (err) {
            return null;
        }
    }

    const refillUnusedIds = async (seedVideoId?: string): Promise<string[]> => {
        const raw = await MyNativeModule.getRelatedShortVideoIds(
            seedVideoId ?? currentVideoId
        );

        let ids: string[] = [];

        try {
            ids = typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
            if (typeof raw === "string" && raw.length === 11) ids = [raw];
        }

        return ids.filter(id => typeof id === "string" && id.length === 11);
    };

    async function playPrev() {
        if (prevStack.length === 0) {
            console.warn("No previous video");
            return;
        }

        const last = prevStack[prevStack.length - 1];
        const remaining = prevStack.slice(0, -1);

        // push current back into "next" slot
        setNextVideoInfo(currentVideoInfo);

        setPrevStack(remaining);
        setCurrentVideoInfo(last);

        await playVideo(
            last.hlsUrl ?? "",
            last.video.videoId
        );
    }


    async function playNextVideo() {
        if (!nextVideoInfo || !nextVideoInfo.hlsUrl) {
            console.warn("Next video not ready yet");
            return;
        }

        setPrevStack(prev => [...prev, currentVideoInfo!]);
        setCurrentVideoInfo(nextVideoInfo);

        await playVideo(
            nextVideoInfo.hlsUrl,
            nextVideoInfo.video.videoId
        );

        preloadNextFromQueue(nextVideoInfo.video.videoId);
    }


    async function preloadNextFromQueue(baseVideoId: string) {
        let queue = [...unusedIds];

        if (queue.length === 0) {
            queue = await refillUnusedIds(baseVideoId);
        }

        while (queue.length > 0) {
            const id = queue.shift()!; // remove immediately

            console.log("preloading", id);

            const meta = await safeGetShortMeta(id);
            if (!meta) continue;

            const hlsUrl = await fetchHlsUrl(id);
            if (!hlsUrl) continue;

            setNextVideoInfo({
                title: meta.title ?? "",
                views: 0,
                uploaded: "unknown",
                hashTags: "",
                likes: meta.likes ?? "",
                dislikes: "",
                subscriber: "",
                commentsCount: meta.comments ?? "",
                channelName: meta.channelName ?? "",
                channelPhoto: meta.channelThumbnail ?? "",
                video: {
                    type: "video",
                    videoId: id,
                    title: meta.title ?? "",
                    views: "",
                },
                hlsUrl
            });

            setUnusedIds(queue); // ✅ clean queue
            console.log("next video ready");
            return;
        }

        setUnusedIds([]);
    }



    const swipeGesture = Gesture.Pan()
        .activeOffsetY([-20, 20])
        .failOffsetX([-20, 20])
        .onEnd((e) => {
            if (e.translationY < -60) {
                if (!buffering) {
                    playNextVideo()
                }
            } else if (e.translationY > 60) {
                playPrev()
            }
        });

    async function loadInitial() {



        const videoId = arrivedVideo.videoId;

        const meta = await safeGetShortMeta(videoId);
        if (!meta) return;

        const hlsUrl = await fetchHlsUrl(videoId);
        if (!hlsUrl) console.log("streamingData not found");

        setCurrentVideoInfo({
            title: meta.title ?? "",
            views: 0,
            uploaded: "unknown",
            hashTags: "",
            likes: meta.likes ?? "",
            dislikes: "",
            subscriber: "",
            commentsCount: meta.comments ?? "",
            channelName: meta.channelName ?? "",
            channelPhoto: meta.channelThumbnail ?? "",
            video: {
                type: "video",
                videoId,
                title: meta.title ?? "",
                views: "",
            },
            hlsUrl: hlsUrl ?? ""
        });

        playVideo(hlsUrl ?? "", videoId);

        const ids = await refillUnusedIds(videoId);
        const remaining: string[] = [];

        for (const id of ids) {
            console.log("loading next", id);

            const nextMeta = await safeGetShortMeta(id);
            if (!nextMeta) {
                console.log(`Dropping videoId ${id}`);
                continue; // ❌ removed
            }

            const nextHlsUrl = await fetchHlsUrl(id);
            if (!nextHlsUrl) {
                console.log(`Dropping videoId ${id}`);
                continue; // ❌ removed
            }

            setNextVideoInfo({
                title: nextMeta.title ?? "",
                views: 0,
                uploaded: "unknown",
                hashTags: "",
                likes: nextMeta.likes ?? "",
                dislikes: "",
                subscriber: "",
                commentsCount: nextMeta.comments ?? "",
                channelName: nextMeta.channelName ?? "",
                channelPhoto: nextMeta.channelThumbnail ?? "",
                video: {
                    type: "video",
                    videoId: id,
                    title: nextMeta.title ?? "",
                    views: "",
                },
                hlsUrl: nextHlsUrl
            });

            console.log("loaded next video");

            // everything AFTER this stays
            const index = ids.indexOf(id);
            remaining.push(...ids.slice(index + 1));
            break;
        }

        setUnusedIds(remaining);
    }



    useEffect(() => {
        setCurrentVideoId(arrivedVideo.videoId);
        setBuffering(true);
        loadInitial()
    }, []);

    const togglePlayPause = () => {
        setPaused(prev => !prev);
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 800);
    }

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name='arrow-back' size={28} color="white" />
                </TouchableOpacity>
                <IconMat name='camera-outline' size={28} color="white" />
            </View>

            <GestureDetector gesture={swipeGesture}>
                <View style={styles.videoContainer}>
                    <Video
                        source={{ uri: mediaUrl }}
                        poster={`https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg`}
                        posterResizeMode="cover"
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        paused={paused}
                        onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
                        onLoadStart={() => setBuffering(true)}
                        onLoad={() => setBuffering(false)}
                        onError={(e) => {
                            const error = e?.error;
                            console.log(error);

                            //24003
                            const isBadHttp =
                                error?.errorCode === "22004" ||
                                error?.errorString?.includes("BAD_HTTP_STATUS");

                            if (isBadHttp) {
                                playNextVideo()
                            }
                        }}
                    />

                    <Pressable
                        onPress={togglePlayPause}
                        style={StyleSheet.absoluteFill} // covers full video
                    >
                        {showPlayIcon && (
                            <View style={styles.centerIcon}>
                                <Icon
                                    name={paused ? "play-circle-outline" : "pause-circle-outline"}
                                    size={80}
                                    color="white"
                                />
                            </View>
                        )}
                    </Pressable>

                    {buffering && (
                        <View style={styles.centerIcon}>
                            <ActivityIndicator size="large" color="red" />
                            <TouchableOpacity onPress={decreaseResolution} style={styles.swithResolution}>
                                <Text>
                                    {resolutions[currentResolutionIndex - 1]
                                        ? `${resolutions[currentResolutionIndex - 1].split("x")[0]}p`
                                        : resolutions.length}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <RightControls
                        likes={currentVideoInfo?.likes ?? "No likes"}
                        commentCount={currentVideoInfo?.commentsCount ?? ""}
                        onDownload={() => openAskFormat(currentVideoInfo?.video!!)}
                    />

                    <BottomControls
                        channelName={currentVideoInfo?.channelName ?? ""}
                        channelThumbnail={currentVideoInfo?.channelPhoto ?? ""}
                        title={currentVideoInfo?.title ?? "NO titel"}
                    />

                </View>
            </GestureDetector>
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#0A0A0A",
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#0A0A0A",
        paddingVertical: 10,
        paddingHorizontal: 10
    },
    videoContainer: {
        position: 'relative',
        backgroundColor: 'black',
        height: "90%"
    },
    centerIcon: {
        position: 'absolute',
        top: '45%',
        left: '45%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000066',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    swithResolution: {
        backgroundColor: "white",
        padding: 7,
        borderRadius: 7
    }
});
