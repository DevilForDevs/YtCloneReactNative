import {
    StyleSheet, Text, View, Pressable,
    ActivityIndicator, Animated, TouchableOpacity,
    Dimensions, Modal, NativeModules
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { useVideoStore } from '../../utils/Store';
import { RootStackParamList } from '../../App';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import IconMat from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from "react-native-video";
import { getIosPlayerResponse } from '../../utils/EndPoints';
import RightControls from './RightControls';
import BottomControls from './BottomControls';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { VideoDescription, Video as VideoType } from "../../utils/types";
type NavigationProp = RouteProp<RootStackParamList, "ShortsPlayerScreen">;
import AskFormat from '../HomeScreen/widgets/AskFormat/AskFormat';
import { AskFormatModel, Video as Mvideo } from "../../utils/types";
import { mapAdaptiveFormatsToRequired } from "../../utils/praserHelpers";
import { getSelectedFormats } from "../../utils/downloadFunctions";
import { DownloadItem } from '../../utils/types';
import { txt2filename, getStreamingData } from '../../utils/Interact';
type Navstack = NativeStackNavigationProp<RootStackParamList, "BottomNav">;
import { DownloadsStore } from '../../utils/Store';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { addDownload, createDownloadsTable, initDB, loadDownloads } from "../../utils/dbfunctions";


export default function ShortsPlayer() {
    const route = useRoute<NavigationProp>();
    const navigation = useNavigation<Navstack>();
    const { arrivedVideo } = route.params;
    const [currentVideoId, setCurrentVideoId] = useState("")
    const { addDownloadItem } = DownloadsStore();
    const [mediaUrl, setMediaUrl] = useState("");
    const [title, setTitle] = useState("");
    const [paused, setPaused] = useState(false);
    const [showIcon, setShowIcon] = useState(false);
    const [buffering, setBuffering] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<VideoType>();
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
    const [modalVisible, setModalVisible] = useState(false);
    const { MyNativeModule } = NativeModules;
    const [requiredFmts, setRequiredFmts] = useState<AskFormatModel[]>([]);
    const [db, setDb] = useState<SQLiteDatabase | null>(null);
    const [shortQueue, setShortQueue] = useState<string[]>([]);
    const [currentVideoInfo, setCurrentVideoInfo] = useState<VideoDescription>();



    const playNextShorts = async (): Promise<void> => {
        setMediaUrl("");
        setCurrentVideoId("");
        try {
            let nextVideoId: string | undefined;

            // 1️⃣ Use queue if available
            if (shortQueue.length > 0) {
                setCurrentVideoId(shortQueue[0]);
                nextVideoId = shortQueue[0];
                setShortQueue(prev => prev.slice(1));
            } else {
                // 2️⃣ Fetch from native
                const raw = await MyNativeModule.getRelatedShortVideoIds(currentVideoId);
                console.log(raw);

                let ids: string[] = [];

                // Native returned JSON string
                if (typeof raw === "string") {
                    try {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            ids = parsed;
                        } else if (raw.length === 11) {
                            ids = [raw];
                        }
                    } catch {
                        // Not JSON → maybe single ID
                        if (raw.length === 11) ids = [raw];
                    }
                }

                // Native returned array
                if (Array.isArray(raw)) {
                    ids = raw;
                }

                // Filter valid YouTube IDs only
                ids = ids.filter(id => typeof id === "string" && id.length === 11);

                if (ids.length === 0) return;

                nextVideoId = ids[0];
                setShortQueue(ids.slice(1));
            }

            if (!nextVideoId || nextVideoId.length !== 11) {
                console.warn("Invalid videoId:", nextVideoId);
                return;
            }

            const rawMeta = await MyNativeModule.getShortMeta(nextVideoId);

            const shortInfo =
                typeof rawMeta === "string"
                    ? JSON.parse(rawMeta)
                    : rawMeta;

            const mvideo: Mvideo = {
                type: "video",
                videoId: nextVideoId,
                title: shortInfo.title,
                views: ""
            }
            const currentVideoInfo: VideoDescription = {
                title: shortInfo.title,
                views: 0,
                uploaded: "unknown",
                hashTags: "unknown",
                likes: shortInfo.likes,
                dislikes: "",
                subscriber: "",
                commentsCount: shortInfo.comments,
                channelName: shortInfo.channelName,
                channelPhoto: shortInfo.channelThumbnail,
                video: mvideo
            }
            setCurrentVideoInfo(currentVideoInfo)
            setCurrentVideo(mvideo)
            setCurrentVideoId(nextVideoId);
            fetchStreamingData(nextVideoId);
        } catch (e) {
            console.error("playNextShorts failed:", e);
        }
    };


    const swipeGesture = Gesture.Pan()
        .activeOffsetY([-20, 20])
        .failOffsetX([-20, 20])
        .onEnd((e) => {
            if (e.translationY < -50) {
                playNextShorts();
            }
        });

    const openModal = () => {
        setModalVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setModalVisible(false));
    };


    const fetchStreamingData = async (videoId: string) => {
        try {
            if (!videoId) return;

            const result = await getIosPlayerResponse(videoId);
            const streamingData = result?.streamingData;
            setTitle(result?.videoDetails.title)

            if (!streamingData?.hlsManifestUrl) {
                console.warn("No HLS for video:", videoId);
                return;
            }

            setMediaUrl(streamingData.hlsManifestUrl);

        } catch (err) {
            console.error("Failed to fetch player response:", err);
        }
    };


    async function loadDb() {
        if (db == null) {
            const dbInstance = await initDB();
            await createDownloadsTable(dbInstance);
            setDb(dbInstance);
        }
    }


    useEffect(() => {
        setCurrentVideoId(arrivedVideo.videoId);
        loadDb()
        setCurrentVideo(arrivedVideo);
        fetchStreamingData(arrivedVideo.videoId);
    }, []);


    const togglePlayPause = () => {
        setPaused(prev => !prev);
        setShowIcon(true);
        setTimeout(() => setShowIcon(false), 800); // icon disappears after 0.8s
    }

    const mhandleFormatSelect = async (itag: number) => {
        if (currentVideo != undefined) {
            const { selectedVideoFmt, selectedAudioFmt } = getSelectedFormats(itag, requiredFmts);
            const videoInformation = JSON.stringify(selectedVideoFmt);
            const audioInformation = JSON.stringify(selectedAudioFmt);

            const DownloadItmm: DownloadItem = {
                transferInfo: "Initiating",
                progressPercent: 0,
                isFinished: false,
                isStopped: false,
                speed: "500KB/s",
                message: "Video",
                video: {
                    ...currentVideo,
                    title: videoInformation != audioInformation ? `${txt2filename(currentVideo.title)}(${selectedVideoFmt.info}).mp4` : `${txt2filename(currentVideo.title)}.mp3`
                }
            }

            const prasedFileName = txt2filename(currentVideo.title);
            if (videoInformation == audioInformation) {
                const insertedId = await addDownload(db, prasedFileName + ".mp3", "music", currentVideo.videoId, 0, 0, currentVideo.duration!!);
                addDownloadItem(DownloadItmm, 0);

            } else {
                const insertedId = await addDownload(db, `${prasedFileName}(${selectedVideoFmt.info}).mp4`, "movies", currentVideo.videoId, 0, 0, currentVideo.duration!!);
                addDownloadItem(DownloadItmm, 0);
                console.log(insertedId);
            }
            MyNativeModule.native_fileDownloader(videoInformation, audioInformation, currentVideo.videoId, prasedFileName);

        }
    }

    const handleThreeDotClick = async (item: VideoType) => {
        setCurrentVideo(item);

        const response = await getStreamingData(item.videoId);
        const streamingData = response.playerResponse.streamingData;
        const adaptiveFormats = streamingData.adaptiveFormats || streamingData.adaptiveFromats;


        const mappedFmts = mapAdaptiveFormatsToRequired(adaptiveFormats); // your helper

        setRequiredFmts(mappedFmts); // update state with formats
        openModal();
    };

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
                        poster={`https://img.youtube.com/vi/${currentVideoId}/hqdefault.jpg`}
                        posterResizeMode="cover"
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        paused={paused}
                        onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
                        onLoadStart={() => setBuffering(true)}
                        onLoad={() => setBuffering(false)}
                    />

                    <Pressable
                        onPress={togglePlayPause}
                        style={StyleSheet.absoluteFill} // covers full video
                    >
                        {showIcon && (
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
                        </View>
                    )}

                    <RightControls
                        likes={currentVideoInfo?.likes ?? "No likes"}
                        commentCount={currentVideoInfo?.commentsCount ?? ""}
                        onDownload={() => handleThreeDotClick(currentVideo!)}
                    />

                    <BottomControls
                        channelName={currentVideoInfo?.channelName ?? ""}
                        channelThumbnail={currentVideoInfo?.channelPhoto ?? ""}
                        title={title}
                    />

                </View>
            </GestureDetector>

            <Modal
                transparent
                visible={modalVisible}
                animationType="none"
                onRequestClose={closeModal}
            >

                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal} />

                <Animated.View
                    style={[
                        styles.bottomSheet,
                        {
                            height: screenHeight / 2, // Half screen height
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <AskFormat onFormatSelection={(itag) => mhandleFormatSelect(itag)} closeRequest={closeModal} videoTitle={currentVideo?.title ?? ""}
                        requiredFormats={requiredFmts} />
                </Animated.View>

            </Modal>

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
});
