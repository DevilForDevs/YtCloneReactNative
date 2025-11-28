import { StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator, Animated, Dimensions, Modal, NativeModules } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons';
import IconMat from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../App';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DownloadsStore, useVideoStore } from '../../utils/Store';
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BottomNav">;
import { sendYoutubeSearchRequest } from '../../utils/sendYoutubeSearchRequest';
import { getStreamingData, txt2filename, videoId } from '../../utils/Interact';
import { mapAdaptiveFormatsToRequired } from '../../utils/praserHelpers';
import { AskFormatModel, DownloadItem, Video } from "../../utils/types";
import AskFormat from '../HomeScreen/widgets/AskFormat/AskFormat';
import { getSelectedFormats } from '../../utils/downloadFunctions';
import { addDownload, initDB } from "../../utils/dbfunctions";
import { SQLiteDatabase } from 'react-native-sqlite-storage';

export default function SearchScreen() {
    const { addVideo, setContinuation, clearVideos, setQuery, seenVideosIds, clearSeenVideosIds, addSeenVideoId } = useVideoStore();
    const navigation = useNavigation<NavigationProp>();
    const [query, setquery] = useState("");
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
    const [selectedVideo, setSelectedVideo] = useState<Video>();
    const [requiredFmts, setRequiredFmts] = useState<AskFormatModel[]>([]);
    const { addDownloadItem, updateItem, totalDownloads } = DownloadsStore();
    const { MyNativeModule } = NativeModules;
    const [db, setDb] = useState<SQLiteDatabase | null>(null);




    const fetchVideos = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const result = await sendYoutubeSearchRequest(query, "", "8AEB");
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

    const handleSubmit = async () => {
        if (query.includes("playlist?list=")) {
            navigation.navigate("PlaylistScreen", {
                playlistlink: query
            })
        } else {
            var vid = videoId(query)
            console.log(vid)
            if (vid == null) {
                setQuery(query)
                setContinuation("")
                clearVideos()
                clearSeenVideosIds()
                await fetchVideos()
                navigation.goBack()
            } else {
                setLoading(true)
                const response = await getStreamingData(vid);
                const streamingData = response.playerResponse.streamingData;
                const adaptiveFormats = streamingData.adaptiveFormats || streamingData.adaptiveFromats;
                var item: Video = {
                    videoId: vid,
                    type: "video",
                    title: response.playerResponse.videoDetails.title,
                    views: "220k"
                }
                setSelectedVideo(item);
                const mappedFmts = mapAdaptiveFormatsToRequired(adaptiveFormats); // your helper
                setRequiredFmts(mappedFmts);
                setLoading(false)
                openModal();
            }


        }


    }

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



    const mhandleFormatSelect = async (itag: number) => {
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
                video: {
                    ...selectedVideo,
                    title: videoInformation != audioInformation ? `${txt2filename(selectedVideo.title)}(${selectedVideoFmt.info}).mp4` : `${txt2filename(selectedVideo.title)}.mp3`
                }
            }

            const prasedFileName = txt2filename(selectedVideo.title);
            if (videoInformation == audioInformation) {

                const exists = totalDownloads.some(
                    item => item.video.videoId === selectedVideo.videoId
                );

                if (!exists) {
                    const insertedId = await addDownload(db, prasedFileName + ".mp3", "music", selectedVideo.videoId, 0, 0, selectedVideo.duration!!);
                    addDownloadItem(DownloadItmm, 0);
                }

            } else {

                const exists = totalDownloads.some(
                    item => item.video.videoId === selectedVideo.videoId
                );

                if (!exists) {
                    const insertedId = await addDownload(db, `${prasedFileName}(${selectedVideoFmt.info}).mp4`, "movies", selectedVideo.videoId, 0, 0, selectedVideo.duration!!);
                    addDownloadItem(DownloadItmm, 0);
                }

            }
            console.log(videoInformation);
            console.log(audioInformation);
            MyNativeModule.native_fileDownloader(videoInformation, audioInformation, selectedVideo.videoId, prasedFileName);

        }
    }

    async function loadInfoFromDb() {
        if (db == null) {
            const dbInstance = await initDB();
            setDb(dbInstance);
        }
    }

    useEffect(() => {
        loadInfoFromDb()
    }, []);




    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.navigate("BottomNav")}>
                    <Icon name="arrow-back" size={26} color="black" />
                </TouchableOpacity>
                <TextInput placeholder='Search Youtube' value={query}
                    onChangeText={setquery}
                    returnKeyType="search"
                    onSubmitEditing={handleSubmit} style={styles.txtInput} />
                <View style={styles.iconContainer}>
                    <Icon name="mic" size={26} color="black" />
                </View>
                <View>
                    <IconMat name="cast" size={26} color="black" />
                </View>

            </View>
            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#FF0000" />
                </View>
            )}
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


        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        paddingTop: 10
    }
    ,
    txtInput: {
        backgroundColor: "#ECECEC",
        borderRadius: 50,
        paddingLeft: 10,
        flex: 1,
        fontFamily: "Roboto-Medium",
        fontSize: 16
    }
    ,
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    }
    ,
    iconContainer: {
        backgroundColor: "#ECECEC",
        padding: 5,
        borderRadius: 50
    }
    ,
    loader: {
        flex: 1,
        marginTop: 100
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
})