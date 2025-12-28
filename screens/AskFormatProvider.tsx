import { useState, useCallback } from "react";
import { Modal, View, StyleSheet, Pressable, Text, NativeModules } from "react-native";
import AskFormat from "./HomeScreen/widgets/AskFormat/AskFormat";
import { AskFormatContext } from "./AskFormatContext";
import { Video } from "../utils/types";
import { getStreamingData, txt2filename } from "../utils/Interact";
import { mapAdaptiveFormatsToRequired } from "../utils/praserHelpers";
import { AskFormatModel } from "../utils/types";
import { ActivityIndicator } from "react-native";
import { getSelectedFormats } from "../utils/downloadFunctions";
import { DownloadItem } from "../utils/types";
import { DownloadsStore } from "../utils/Store";
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { addDownload, initDB } from "../utils/dbfunctions";

export const AskFormatProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {

    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [requiredFmts, setRequiredFmts] = useState<AskFormatModel[]>([]);
    const [currentVideo, setCurrentVideo] = useState<Video>();
    const { addDownloadItem, totalDownloads } = DownloadsStore();
    const [db, setDb] = useState<SQLiteDatabase | null>(null);
    const { MyNativeModule } = NativeModules;

    const fetchStreamingInfo = useCallback(async (video: Video) => {
        try {
            setLoading(true);
            let database = db;

            if (!database) {
                database = await initDB();
                setDb(database);
            }
            const response = await getStreamingData(video.videoId);
            const player = response?.playerResponse;
            const streamingData = player?.streamingData;

            if (!streamingData?.adaptiveFormats) {
                console.warn("No adaptiveFormats found", streamingData);
                setRequiredFmts([]);
                return;
            }

            setVideoTitle(player.videoDetails?.title ?? "");
            setRequiredFmts(mapAdaptiveFormatsToRequired(
                streamingData.adaptiveFormats
            ));
            setCurrentVideo(video);
        } catch (err) {
            console.error("fetchStreamingInfo failed:", err);
            setRequiredFmts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    async function mhandleFormatSelect(itag: number) {
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
                    title: videoInformation != audioInformation ? `${txt2filename(videoTitle)}(${selectedVideoFmt.info}).mp4` : `${txt2filename(videoTitle)}.mp3`
                }
            }
            console.log(DownloadItmm);



            const prasedFileName = txt2filename(currentVideo.title);
            if (videoInformation == audioInformation) {
                console.log("audiofmt");

                const exists = totalDownloads.some(
                    item => item.video.videoId === currentVideo.videoId
                );

                if (!exists) {
                    const insertedId = await addDownload(db, prasedFileName + ".mp3", "music", currentVideo.videoId, 0, 0, "unknown");
                    addDownloadItem(DownloadItmm, 0);
                }


            } else {


                const exists = totalDownloads.some(
                    item => item.video.videoId === currentVideo.videoId
                );
                console.log(exists);

                if (!exists) {
                    const insertedId = await addDownload(db, `${prasedFileName}(${selectedVideoFmt.info}).mp4`, "movies", currentVideo.videoId, 0, 0, "unknown");
                    addDownloadItem(DownloadItmm, 0);
                }


            }

            MyNativeModule.native_fileDownloader(videoInformation, audioInformation, currentVideo.videoId, prasedFileName);

        }
    }

    /**
     * Open bottom sheet
     */
    const openAskFormat = (video: Video) => {
        setVisible(true);
        fetchStreamingInfo(video);
    };

    /**
     * Close bottom sheet & cleanup
     */
    const closeAskFormat = () => {
        setVisible(false);
        setRequiredFmts([]);
        setVideoTitle("");
        setLoading(false);
    };

    return (
        <AskFormatContext.Provider value={{ openAskFormat, closeAskFormat }}>
            {children}

            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={closeAskFormat}
            >
                <View style={styles.overlay}>
                    {/* backdrop */}
                    <Pressable style={styles.backdrop} onPress={closeAskFormat} />

                    {/* bottom sheet */}
                    <View style={styles.halfSheet}>
                        {loading && (
                            <ActivityIndicator size="large" style={{ marginTop: 24 }} />
                        )}

                        {!loading && requiredFmts.length === 0 && (
                            <Text style={styles.emptyText}>
                                No formats available
                            </Text>
                        )}

                        {!loading && requiredFmts.length > 0 && (
                            <AskFormat
                                videoTitle={videoTitle}
                                requiredFormats={requiredFmts}
                                closeRequest={closeAskFormat}
                                onFormatSelection={(itag) => {
                                    mhandleFormatSelect(itag);
                                    closeAskFormat();
                                }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </AskFormatContext.Provider>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    backdrop: {
        flex: 1,
    },
    halfSheet: {
        height: "50%",
        backgroundColor: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 12,
        overflow: "hidden",
    },
    emptyText: {
        textAlign: "center",
        marginTop: 32,
        color: "#666",
    },
});
