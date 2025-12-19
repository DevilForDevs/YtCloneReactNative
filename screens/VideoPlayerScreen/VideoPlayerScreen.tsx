import React, { use, useEffect, useRef, useState } from "react";
import RNFS from 'react-native-fs';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StatusBar,
    Image, FlatList, Modal, Animated, Dimensions, NativeModules
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Player from "./widgets/Player";
import VideoItemView from "../HomeScreen/widgets/VideoItemView/VideoItemView";
import ShortsHeader from "../HomeScreen/widgets/ShortsHeader/ShortsHeader";
import ShortsItemView from "../HomeScreen/widgets/ShortsItemView/ShortsItemView";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { parseWatchNext, ParseResult } from "../../utils/watchHtmlParser";
import { getIosPlayerResponse } from "../../utils/EndPoints";
import VideoDetails from "./widgets/VideoDetails";
import { Video, VideoDescription } from "../../utils/types";
import { createResolutionPlaylistsRN } from "../../utils/createResolutionPlaylists";
import ResolutionBottomSheet from "./widgets/ResolutionBottomSheet";
import AskFormat from "../HomeScreen/widgets/AskFormat/AskFormat";
import { AskFormatModel } from "../../utils/types";
import { getSelectedFormats } from "../../utils/downloadFunctions";
import { getStreamingData, txt2filename, videoId } from "../../utils/Interact";
import { DownloadItem } from "../../utils/types";
import { DownloadsStore } from "../../utils/Store";
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { addDownload, initDB, createDownloadsTable, deleteOldM3U8Files } from "../../utils/dbfunctions";
import { mapAdaptiveFormatsToRequired } from "../../utils/praserHelpers";



type NavigationProp = RouteProp<
    RootStackParamList,
    "VideoPlayerScreen"
>;




export default function VideoPlayerScreen() {
    const route = useRoute<NavigationProp>();
    const { arrivedVideo } = route.params;
    const navigation = useNavigation<navStack>();
    const [wathHtmlVideos, setWathHtmlVideos] = useState<ParseResult>();
    const { MyNativeModule } = NativeModules;
    const [currentVideo, setCurrentVideo] = useState<VideoDescription>();
    const [mediaUrl, setMediaUrl] = useState("")
    const [resolutions, setResolutions] = useState<string[]>([]);
    const [selectedResolution, setSelectedResolution] = useState<string | null>(null);
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
    const [requiredFmts, setRequiredFmts] = useState<AskFormatModel[]>([]);
    const { addDownloadItem, totalDownloads } = DownloadsStore();
    const [db, setDb] = useState<SQLiteDatabase | null>(null);
    const [showFlatList, setFlatList] = useState(true);
    const [savedPositions, setSavedPositions] = useState<Record<string, number>>({});
    const seekTo = savedPositions[currentVideo?.video.videoId ?? ""] ?? 0;


    async function loadData(mvideo: Video) {
        let database = db;

        if (!database) {
            database = await initDB();
            await createDownloadsTable(database);
            setDb(database);
        }
        setCurrentVideo(undefined);
        setWathHtmlVideos(undefined);
        try {
            await deleteOldM3U8Files()

            const playerResponse = await getIosPlayerResponse(mvideo.videoId);
            const streamingData = playerResponse.streamingData
            const videoDetails = playerResponse.videoDetails

            const resolutions = await createResolutionPlaylistsRN(
                streamingData.hlsManifestUrl,
                RNFS.DocumentDirectoryPath
            );

            if (resolutions.length > 0) {
                const firstResolution = resolutions[0];
                const localM3u8Path = `${RNFS.DocumentDirectoryPath}/${firstResolution}.m3u8`;

                // IMPORTANT: use file:// prefix

                setMediaUrl(`file://${localM3u8Path}`);
                setResolutions(resolutions);
                setSelectedResolution(resolutions[0])
            } else {
                console.log("fallbackHappened");
                // fallback to original manifest
                setMediaUrl(streamingData.hlsManifestUrl);
            }


            const jsonString = await MyNativeModule.getYtInitialData(
                'https://www.youtube.com/watch?v=' + mvideo.videoId
            );
            const ytInitialData = JSON.parse(jsonString);
            const result = parseWatchNext(ytInitialData.results);
            const videoDes: VideoDescription = {
                title: videoDetails.title,
                views: Number(videoDetails.viewCount),
                uploaded: mvideo.publishedOn ? mvideo.publishedOn : "",
                hashTags: Array.isArray(videoDetails.keywords)
                    ? videoDetails.keywords.join(" ")
                    : "",
                dislikes: ytInitialData.videoDetails.dislikes,
                likes: ytInitialData.videoDetails.likes,
                subscriber: ytInitialData.videoDetails.subscriberCount,
                commentsCount: ytInitialData.videoDetails.commentsCount,
                channelPhoto: mvideo.channel ? mvideo.channel : "",
                channelName: ytInitialData.videoDetails.channelName,
                video: mvideo
            }
            setCurrentVideo(videoDes)
            setWathHtmlVideos(result);
        } catch (e) {
            console.error(e);
        }
    }




    useEffect(() => {
        loadData(arrivedVideo);
    }, []);

    function changeResolution(res: string) {
        setSelectedResolution(res);
        const localM3u8Path = `${RNFS.DocumentDirectoryPath}/${res}.m3u8`;
        setMediaUrl(`file://${localM3u8Path}`);
        setShowBottomSheet(false);
    }

    function handleMoreVert() {
        if (resolutions.length === 0) return;
        setShowBottomSheet(true);
    }
    const openModal = () => {
        setModalVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleThreeDotClick = async (item: Video) => {

        const response = await getStreamingData(item.videoId);
        const streamingData = response.playerResponse.streamingData;
        const adaptiveFormats = streamingData.adaptiveFormats || streamingData.adaptiveFromats;


        const mappedFmts = mapAdaptiveFormatsToRequired(adaptiveFormats); // your helper

        setRequiredFmts(mappedFmts); // update state with formats
        openModal();
    };

    const closeModal = () => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setModalVisible(false));
    };


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
                    ...currentVideo.video,
                    title: videoInformation != audioInformation ? `${txt2filename(currentVideo.title)}(${selectedVideoFmt.info}).mp4` : `${txt2filename(currentVideo.title)}.mp3`
                }
            }
            console.log(DownloadItmm);

            const prasedFileName = txt2filename(currentVideo.title);
            if (videoInformation == audioInformation) {
                console.log("audiofmt");

                const exists = totalDownloads.some(
                    item => item.video.videoId === currentVideo.video.videoId
                );

                if (!exists) {
                    const insertedId = await addDownload(db, prasedFileName + ".mp3", "music", currentVideo.video.videoId, 0, 0, "unknown");
                    addDownloadItem(DownloadItmm, 0);
                }


            } else {


                const exists = totalDownloads.some(
                    item => item.video.videoId === currentVideo.video.videoId
                );
                console.log(exists);

                if (!exists) {
                    const insertedId = await addDownload(db, `${prasedFileName}(${selectedVideoFmt.info}).mp4`, "movies", currentVideo.video.videoId, 0, 0, "unknown");
                    addDownloadItem(DownloadItmm, 0);
                }


            }

            MyNativeModule.native_fileDownloader(videoInformation, audioInformation, currentVideo.video.videoId, prasedFileName);

        }
    }

    const toggleFlatList = () => {

        if (showFlatList) {
            setFlatList(false)
        } else {
            setFlatList(true)
        }

    }
    function handleProgressSave(videoId: string, position: number) {
        setSavedPositions(prev => ({
            ...prev,
            [videoId]: position,
        }));

    }


    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Player
                url={mediaUrl}
                videoId={currentVideo?.video.videoId ?? ""}
                toggleFlatList={toggleFlatList}
                showMenu={handleMoreVert}
                onProgressSave={handleProgressSave}
                seekTo={seekTo}
                key={currentVideo?.video.videoId}   // ✅ stable
            />

            {
                showFlatList ? <View>
                    <View>
                        <FlatList
                            data={wathHtmlVideos?.items}
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={({ item, index }) => {
                                if (item.type === "video") {
                                    return (
                                        <VideoItemView
                                            item={item}
                                            progress={0}
                                            onItemPress={() => loadData(item)}
                                            onDownload={() => console.log("downloadClicked")}
                                        />
                                    );
                                } else {
                                    return (
                                        <View style={styles.shortParentContainer}>
                                            <ShortsHeader />
                                            <FlatList
                                                data={item.videos}
                                                horizontal
                                                keyExtractor={(short) => short.videoId}
                                                renderItem={({ item: short }) => (
                                                    <ShortsItemView
                                                        item={short}
                                                        onItemPress={() =>
                                                            navigation.navigate("ShortsPlayerScreen", {
                                                                arrivedVideo: short
                                                            })
                                                        }
                                                    />
                                                )}
                                                showsHorizontalScrollIndicator={false}
                                                contentContainerStyle={styles.shortsContainer}
                                            />
                                        </View>
                                    );
                                }
                            }}
                            contentContainerStyle={{ gap: 10, paddingBottom: 250, }}
                            ListHeaderComponent={
                                currentVideo ? (
                                    <VideoDetails
                                        videoDes={currentVideo}
                                        onDownloadPress={() =>
                                            handleThreeDotClick(currentVideo.video)
                                        }
                                    />
                                ) : (
                                    <ActivityIndicator size="large" color="red" style={{ margin: 20 }} />
                                )
                            }
                        />
                    </View>
                    <ResolutionBottomSheet
                        visible={showBottomSheet}
                        resolutions={resolutions}
                        selectedResolution={selectedResolution}
                        onSelect={changeResolution}
                        onClose={() => setShowBottomSheet(false)}
                    />
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
                </View> : <View />
            }

        </SafeAreaView>


    );

}


const styles = StyleSheet.create({
    shortsContainer: {
        gap: 10,
    },
    shortParentContainer: {
        paddingLeft: 20,
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


