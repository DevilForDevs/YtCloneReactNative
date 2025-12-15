import React, { useEffect, useRef, useState, useContext } from "react";
import { StyleSheet, NativeEventEmitter, View, FlatList, Text, ActivityIndicator, Animated, Dimensions, Modal, TouchableOpacity, NativeModules } from "react-native";
import { DownloadsStore, useVideoStore } from "../../utils/Store";
import TopBar from "./widgets/TopBar/TopBar";
import Menu from "./widgets/TopBar/widgets/Menu";
import VideoItemView from "./widgets/VideoItemView/VideoItemView";
import ShortsItemView from "./widgets/ShortsItemView/ShortsItemView";
import ShortsHeader from "./widgets/ShortsHeader/ShortsHeader";
import { sendYoutubeSearchRequest } from "../../utils/sendYoutubeSearchRequest";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { DownloadItem, Video } from "../../utils/types";
import { convertBytes, getStreamingData, txt2filename, videoId } from "../../utils/Interact"
import AskFormat from "./widgets/AskFormat/AskFormat";
import { AskFormatModel } from "../../utils/types";
import { mapAdaptiveFormatsToRequired } from "../../utils/praserHelpers";
import { getSelectedFormats } from "../../utils/downloadFunctions";
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { addDownload, createDownloadsTable, initDB, loadDownloads } from "../../utils/dbfunctions";
import RNFS from 'react-native-fs';


type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SearchScreen"
>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { MyNativeModule } = NativeModules;

  const eventEmitter = new NativeEventEmitter();



  const {
    totalVideos,
    addVideo,
    continuation,
    setContinuation,
    query,
    addSeenVideoId, seenVideosIds
  } = useVideoStore();

  const { addDownloadItem, updateItem, totalDownloads } = DownloadsStore();
  const [isLoading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video>();
  const [requiredFmts, setRequiredFmts] = useState<AskFormatModel[]>([]);
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  const screenHeight = Dimensions.get('window').height;
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;

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
      setLoading(true)
    } finally {
      setLoading(false);
    }
  };




  async function loadInfoFromDb() {
    if (db == null) {
      const dbInstance = await initDB();
      await createDownloadsTable(dbInstance);
      const downloadItems = await loadDownloads(dbInstance);
      setDb(dbInstance);
      if (totalVideos.length == 0) {
        for (const element of downloadItems) {
          var mediaType = "Video"
          if (element.folder == "movies") {
            mediaType = "Video"
          } else {
            mediaType = "Audio"
          }
          const vid: Video = {
            videoId: element.videoId,
            title: element.title,
            views: mediaType,
            type: "video",
            duration: element.duration
          };

          let fileSize = 0;



          try {
            if (element.folder === "movies") {
              const movieDir = RNFS.ExternalStorageDirectoryPath + '/Movies';
              const filePath = `${movieDir}/${element.title}`;

              // Check if file exists
              const exists = await RNFS.exists(filePath);
              if (exists) {
                const stats = await RNFS.stat(filePath);
                fileSize = Number(stats.size);
              }
            } else {
              const movieDir = RNFS.ExternalStorageDirectoryPath + '/Music';
              const filePath = `${movieDir}/${element.title}`;

              // Check if file exists
              const exists = await RNFS.exists(filePath);
              if (exists) {
                const stats = await RNFS.stat(filePath);
                fileSize = Number(stats.size);
              } else {
                console.warn("File not found:", filePath);
              }
            }

          } catch (error) {
            console.error("Error reading file size:", error);
          }

          const rDownloadItem: DownloadItem = {
            video: vid,
            speed: "Finished",
            isFinished: true,
            isStopped: false,
            transferInfo: convertBytes(fileSize),
            progressPercent: 100,
            message: "Finished",
          };



          // Insert item into your store at index 0
          addDownloadItem(rDownloadItem, 0);
        }
      }


    }
  }



  useEffect(() => {

    loadInfoFromDb();
    fetchVideos()

  }, []);


  const handleThreeDotClick = async (item: Video) => {
    setSelectedVideo(item);

    const response = await getStreamingData(item.videoId);
    const streamingData = response.playerResponse.streamingData;
    const adaptiveFormats = streamingData.adaptiveFormats || streamingData.adaptiveFromats;


    const mappedFmts = mapAdaptiveFormatsToRequired(adaptiveFormats); // your helper

    setRequiredFmts(mappedFmts); // update state with formats
    openModal();
  };


  useEffect(() => {
    const subscription = eventEmitter.addListener("DownloadProgress", (data) => {
      const { videoId, progress, percent, speed, message } = data;

      updateItem(videoId, {
        transferInfo: progress,
        progressPercent: percent,
        speed: speed,
        message: message
      });


    });

    return () => subscription.remove();
  }, []);




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


  return (
    <View style={styles.root}>
      <TopBar onLensPress={() => navigation.navigate("SearchScreen")} />
      <FlatList
        data={totalVideos}
        keyExtractor={(_, index) => index.toString()}
        ListHeaderComponent={<Menu />}
        renderItem={({ item, index }) =>
          item.type === "video" ? (
            <VideoItemView item={item} progress={0} onItemPress={() => navigation.navigate("VideoPlayerScreen", { arrivedVideo: item })} onDownload={() => handleThreeDotClick(item)} />
          ) : (
            <View style={styles.shortParentContainer}>
              <ShortsHeader />
              <FlatList
                data={item.videos}
                horizontal
                keyExtractor={(short) => short.videoId}
                renderItem={({ item: short }) => (
                  <ShortsItemView item={short} onItemPress={() => navigation.navigate("ShortsPlayerScreen", {
                    mindex: index, shortIndex: item.videos.indexOf(short)
                  })} />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shortsContainer}
              />
            </View>
          )
        }
        contentContainerStyle={{ gap: 10, marginTop: 10 }}
        onEndReached={() => {
          if (continuation != "") {
            fetchVideos()
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="red" style={{ margin: 20 }} />
          ) : null
        }
      />

      {isLoading ? <View /> : <View style={styles.reloadBtn}>
        <TouchableOpacity style={styles.relB} onPress={() => {
          fetchVideos()
        }}>
          <Text style={{ color: "white" }}>Reload</Text>
        </TouchableOpacity>
      </View>}


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

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: 50,
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

  reloadBtn: {
    flex: 1,
    alignItems: "center",
  }
  ,
  relB: {
    backgroundColor: "#3B3B3B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  }
});


