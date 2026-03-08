import {
    StyleSheet, Text, View,
    StatusBar, FlatList,
    ActivityIndicator
} from 'react-native'
import React from 'react'
import { useVideoPlayerStore } from './Store'
import { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Player from './widgets/Player';
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { ShortVideo, Video } from '../../utils/types';
import VideoDetails from './widgets/VideoDetails';
import VideoItemView from '../HomeScreen/widgets/VideoItemView/VideoItemView';
import ShortsHeader from '../HomeScreen/widgets/ShortsHeader/ShortsHeader';
import ShortsItemView from '../HomeScreen/widgets/ShortsItemView/ShortsItemView';
import { useSharedFilesStore } from '../../utils/Store';
import ResolutionBottomSheet from './widgets/ResolutionBottomSheet';
type NavigationProp = RouteProp<
    RootStackParamList,
    "VideoPlayerScreen"
>;


export default function VideoPlayerScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<NavigationProp>();
    const { arrivedVideo, playlistId } = route.params;
    const navigation = useNavigation<navStack>();
    const flatListRef = React.useRef<FlatList>(null);
    const { files, clearFiles } = useSharedFilesStore();

    //actions
    const {
        toggleFlatList,
        handleMoreVert,
        savePosition,
        setAutoplayEnabled,
        setEndedAsScreen,
        setTracks,
        alterStyle,
        loadVideo,
        currentVideo,
        isFetchingMore,
        nextBrowse,
        handleYtIntents,
        loadPlaylist,
        setShowBottomSheet,
        changeResolution
    } = useVideoPlayerStore()

    const suggestedVideos = useVideoPlayerStore(state => state.suggestedVideos);

    //fields
    const containerStyle = useVideoPlayerStore(state => state.containerStyle);
    const showFlatList = useVideoPlayerStore(state => state.showFlatList);
    const endedAsScreen = useVideoPlayerStore(state => state.endedAsScreen);
    const mediaUrl = useVideoPlayerStore(state => state.mediaUrl);
    const selectedTrack = useVideoPlayerStore(state => state.selectedTrack);
    const seekTo = useVideoPlayerStore(state => state.seekTo);
    const posterUrl = useVideoPlayerStore(state => state.playerPoster);
    const traks = useVideoPlayerStore(state => state.tracks);
    const showBottomSheet = useVideoPlayerStore(state => state.showBottomSheet);


    useEffect(() => {
        alterStyle(insets.top, insets.right, insets.bottom);
    }, [insets]);

    useEffect(() => {

        alterStyle(insets.top, insets.right, insets.bottom);
        if (playlistId) {
            loadPlaylist(playlistId)
        } else {
            loadVideo(arrivedVideo);
        }

    }, [])

    function handleDestroy() { }

    const handleLoadVideo = React.useCallback((video: Video) => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        loadVideo(video);
    }, []);

    useEffect(() => {

        handleYtIntents(files, (short) => {
            console.log("shorts")
        })

    }, [files])

    function handleChannleClick(item: Video) {
        if (item.channelUrl) {
            navigation.navigate("ChannelScreen", { channelUrl: item.channelUrl })
        }
    }


    const renderItem = React.useCallback(({ item, index }: { item: Video | ShortVideo; index: number }) => {
        if (item.type === "video") {
            return (
                <VideoItemView
                    item={item}
                    progress={0}
                    onItemPress={() => handleLoadVideo(item)}
                    onDownload={() => console.log("not supported")}
                    onChannelClick={() => handleChannleClick(item)}
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
    }, []);




    return (
        // ✅ flex: 1 ensures the container fills the screen
        <View style={[containerStyle, { flex: 1 }]}>
            <StatusBar hidden={!showFlatList} />
            <Player
                startAsScreen={endedAsScreen}
                url={mediaUrl}
                videoId={posterUrl}
                toggleFlatList={toggleFlatList}
                showMenu={handleMoreVert}
                onProgressSave={savePosition}
                seekTo={seekTo}
                distroyScreen={handleDestroy}
                onToggle={(val) => setAutoplayEnabled(val)}
                videoEnded={(endedAsScreen) => {
                    setEndedAsScreen(endedAsScreen);
                }}
                onTracks={setTracks}
                selectedTrack={selectedTrack}

            />

            {showFlatList && (
                // ✅ flex: 1 fills remaining space after Player
                <FlatList
                    style={{ flex: 1 }}
                    data={suggestedVideos}
                    ref={flatListRef}
                    keyExtractor={(item) => item.videoId}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        currentVideo ? (
                            <VideoDetails
                                videoDes={currentVideo}
                                onDownloadPress={() => console.log("notsupported")}
                                onChannelClick={() => navigation.navigate("ChannelScreen", { channelUrl: currentVideo.channelId ?? "" })}
                            />
                        ) : (
                            <ActivityIndicator size="large" color="red" style={{ margin: 20 }} />
                        )
                    }
                    contentContainerStyle={{
                        gap: 10,
                    }}
                    ListFooterComponent={
                        isFetchingMore ? (
                            <View style={styles.centerState}>
                                <ActivityIndicator size="large" />
                            </View>
                        ) : <View />
                    }
                    onEndReached={nextBrowse}
                    onEndReachedThreshold={0.5}
                />
            )}
            <ResolutionBottomSheet
                visible={showBottomSheet}
                resolutions={traks}
                onSelect={changeResolution}
                onClose={() => setShowBottomSheet(false)}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderColor: "#ddd"
    },
    text: {
        fontSize: 16
    },
    shortsContainer: {
        gap: 10,
    },
    shortParentContainer: {
        paddingLeft: 20,

    },
    centerState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
})