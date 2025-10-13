import React, { use, useEffect, useRef, useState } from "react";
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
import VideoDetails from "./widgets/VideoDetails";
import VideoItemView from "../HomeScreen/widgets/VideoItemView/VideoItemView";
import ShortsHeader from "../HomeScreen/widgets/ShortsHeader/ShortsHeader";
import ShortsItemView from "../HomeScreen/widgets/ShortsItemView/ShortsItemView";
import { useVideoStore } from "../../utils/Store";
import { sendYoutubeSearchRequest } from "../../utils/sendYoutubeSearchRequest";
import { Video } from "../../utils/types";
import { RootStackParamList } from "../../App";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { getIosPlayerResponse } from "../../utils/EndPoints";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AskFormat from "../HomeScreen/widgets/AskFormat/AskFormat";
import { getSelectedFormats } from "../../utils/downloadFunctions";
import { AskFormatModel } from "../../utils/types";
import { DownloadsStore } from "../../utils/Store";
import { DownloadItem } from "../../utils/types";
import { txt2filename, getStreamingData } from "../../utils/Interact";
import { mapAdaptiveFormatsToRequired } from "../../utils/praserHelpers";

type NavigationProp = RouteProp<
    RootStackParamList,
    "VideoPlayerScreen"
>;

type navStack = NativeStackNavigationProp<
    RootStackParamList,
    "SearchScreen"
>;

export default function VideoPlayerScreen() {
    const route = useRoute<NavigationProp>();
    const navigation = useNavigation<navStack>();
    const { MyNativeModule } = NativeModules;
    const { mindex } = route.params;
    const [showFlatList, setFlatList] = useState(true)
    const [mediaUrl, setMediaUrl] = useState("")
    const [currentVideoId, setCurrentVideoId] = useState("")
    const [currentVideoChannelName, setcurrentVideoChannelName] = useState("")
    const [currentVideoTitle, setCurrentVideoTitle] = useState("")
    const [currentVideoViewsAndUploadDate, setCurrentVideoViewsAndUploadDate] = useState("")
    const [currentChannelPhoto, setCurrentChannelPhoto] = useState("")
    const [currentChannelSubcriberNo, setCurrentChanelSubscriberNo] = useState(0)
    const [currentVideoLikes, setCurrentVideoLikes] = useState(0)
    const [currentVideoDisLikes, setCurrentVideoDisLikes] = useState(0)
    const [modalVisible, setModalVisible] = useState(false);
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
    const [selectedVideo, setSelectedVideo] = useState<Video>();
    const [requiredFmts, setRequiredFmts] = useState<AskFormatModel[]>([]);
    const { addDownloadItem, updateItem } = DownloadsStore();
    const [currentVideo,setCurrentVideo]=useState<Video>();


    const {
        totalVideos,
        addVideo,
        continuation,
        setContinuation,
        query,
        addSeenVideoId, seenVideosIds,
    } = useVideoStore();
    const [isLoading, setLoading] = useState(true);

    const toggleFlatList = () => {

        if (showFlatList) {
            setFlatList(false)
        } else {
            setFlatList(true)
        }

    }

    const fetchStreamingData = async (index: number) => {

        if (!totalVideos[index]) return; // safety check

        try {
            const requiredVideoId = totalVideos[index].videoId
            if(totalVideos[index].type=="video"){
               setCurrentVideo(totalVideos[index])
            }
            setCurrentVideoId(requiredVideoId)
            const result = await getIosPlayerResponse(requiredVideoId);
            const streamingData = result.streamingData
            const videoDetails = result.videoDetails
            setCurrentVideoTitle(videoDetails.title)
            setcurrentVideoChannelName(videoDetails.author)
            const formattedViews = Number(videoDetails.viewCount).toLocaleString();
            if (totalVideos[index].type == "video") {
                const viewInfo = `${formattedViews} Views • ${totalVideos[index].publishedOn}`
                setCurrentVideoViewsAndUploadDate(viewInfo)
                if (totalVideos[index].channel != null) {
                    setCurrentChannelPhoto(totalVideos[index].channel)
                }
            }
            setMediaUrl(streamingData.hlsManifestUrl);
        } catch (err) {
            console.error("Failed to fetch player response:", err);
        }
    };

    useEffect(() => {
        fetchStreamingData(mindex);
    }, [totalVideos, mindex]);




    const fetchVideos = async () => {
        if (isLoading) return;
        setLoading(true);
        try {
            const result = await sendYoutubeSearchRequest(query, continuation, "8AEB");
            const shortsAndVideos = result.videos;
            const token = result.continuation;

            if (token != null) {
                setContinuation(token);
            }

            shortsAndVideos.forEach((element) => {
                if (element.type === "shorts") {
                    const freshShorts: Video[] = [];
                    let shortsHeaderVideoId = "videoId1";

                    element.videos.forEach(short => {
                        if (!seenVideosIds.includes(short.videoId)) {
                            addSeenVideoId(short.videoId);
                            freshShorts.push(short);
                            shortsHeaderVideoId = short.videoId;
                        }
                    });

                    if (freshShorts.length > 0) {
                        addVideo({ type: "shorts", videos: freshShorts, videoId: shortsHeaderVideoId });
                    }

                } else {
                    if (!seenVideosIds.includes(element.videoId)) {
                        addSeenVideoId(element.videoId);
                        addVideo(element);
                    }
                }
            });
        } catch (err) {
            console.error("Error fetching videos:", err);
        } finally {
            setLoading(false);
        }
    };

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

    const mhandleFormatSelect = (itag: number) => {
        if (selectedVideo != undefined) {
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
                video: selectedVideo
            }

            addDownloadItem(DownloadItmm,0);

            MyNativeModule.native_fileDownloader(videoInformation, audioInformation, selectedVideo.videoId, txt2filename(selectedVideo.title));



        }
    }

    const handleThreeDotClick = async (item: Video) => {

        setSelectedVideo(item);

        const response = await getStreamingData(item.videoId);
        const streamingData = response.playerResponse.streamingData;
        const adaptiveFormats = streamingData.adaptiveFormats || streamingData.adaptiveFromats;


        const mappedFmts = mapAdaptiveFormatsToRequired(adaptiveFormats); // your helper

        setRequiredFmts(mappedFmts); // update state with formats
        openModal();
    };




    return (
        <SafeAreaView style={styles.container}>
            <Player url={mediaUrl} toggleFlatList={toggleFlatList} videoId={currentVideoId} />

            {
                showFlatList ? <View>
                    <FlatList
                        data={totalVideos}
                        keyExtractor={(_, index) => index.toString()}
                        ListHeaderComponent={
                            <VideoDetails title={currentVideoTitle}
                                channelName={currentVideoChannelName}
                                viewsAndUploaded={currentVideoViewsAndUploadDate}
                                channelPhoto={currentChannelPhoto} onDownloadPress={() =>handleThreeDotClick(currentVideo!!)} />
                        }
                        renderItem={({ item, index }) => {
                            if (item.type === "video") {
                                return <VideoItemView item={item} progress={0} onItemPress={() => fetchStreamingData(index)} onDownload={() =>handleThreeDotClick(currentVideo!!)} />;
                            } else {
                                return (
                                    <View style={styles.shortParentContainer}>
                                        <ShortsHeader />
                                        <FlatList
                                            data={item.videos}
                                            horizontal
                                            keyExtractor={(short) => short.videoId}
                                            renderItem={({ item: short }) => <ShortsItemView item={short} onItemPress={() => navigation.navigate("ShortsPlayerScreen", {
                                                mindex: index, shortIndex: item.videos.indexOf(short)
                                            })} />}
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.shortsContainer}
                                        />
                                    </View>
                                );
                            }
                        }}
                        contentContainerStyle={{ gap: 10, marginTop: 10 }}
                        onEndReached={fetchVideos}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            isLoading ? <ActivityIndicator size="large" color="red" style={{ margin: 20 }} /> : null
                        }
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
                            <AskFormat onFormatSelection={(itag) => mhandleFormatSelect(itag)} closeRequest={closeModal} videoTitle={selectedVideo?.title ?? ""}
                                requiredFormats={requiredFmts} />
                        </Animated.View>

                    </Modal>
                </View> : <View />
            }




        </SafeAreaView>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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


