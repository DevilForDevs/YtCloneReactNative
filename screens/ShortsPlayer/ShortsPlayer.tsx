import {
    StyleSheet, Text, View, PanResponder,
    TouchableOpacity, ActivityIndicator
} from 'react-native'
import React, { useEffect, useRef } from "react";
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useShortsStore } from './Store';
import Icon from 'react-native-vector-icons/Ionicons';
import IconMat from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    SelectedVideoTrackType,
} from "react-native-video";
import RightControls from './RightControls';
import BottomControls from './BottomControls';
import Video, { OnLoadData, OnProgressData } from "react-native-video";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ResolutionBottomSheet from '../VideoPlayerScreen/widgets/ResolutionBottomSheet';
type NavigationProp = RouteProp<RootStackParamList, "ShortsPlayerScreen">;

export default function ShortsPlayer() {
    const insets = useSafeAreaInsets();
    const route = useRoute<NavigationProp>();
    const navigation = useNavigation<navStack>();
    const { arrivedVideo } = route.params;

    const { loadVideo, loadNext,
        loadPrev, setTraks,
        changeResolution, close, openBottomSheet } = useShortsStore()
    const mediaUrl = useShortsStore((state) => state.mediaUrl)
    const selectedTrack = useShortsStore((state) => state.selectedTrack)
    const buffering = useShortsStore((state) => state.buffering)
    const currentVideoInfo = useShortsStore((state) => state.currentVideoInfo)
    const showPlayIcon = useShortsStore((state) => state.showPlayIcon)
    const paused = useShortsStore((state) => state.paused)
    const currentVideId = useShortsStore((state) => state.currentVideId)
    const tracks = useShortsStore((state) => state.tracks)
    const showBottomSheet = useShortsStore((state) => state.showBottomSheet)

    useEffect(() => {
        loadVideo(arrivedVideo)
    }, [])

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 10; // only vertical swipe
            },
            onPanResponderRelease: (_, gestureState) => {
                const { dy, vy } = gestureState;

                // require distance OR velocity
                if (dy > 80 || vy > 0.8) {
                    loadPrev();
                } else if (dy < -80 || vy < -0.8) {
                    loadNext();
                }
            }
        })
    ).current;

    function onLoad(data: OnLoadData) {

        if (!data.videoTracks?.length) return;

        const naturalHeight = data.naturalSize?.height;
        const naturalWidth = data.naturalSize?.width;

        const unique = new Map<number, VideoTrack>();

        data.videoTracks.forEach((t) => {
            if (!t.height) return;

            const existing = unique.get(t.height);

            // mark as active if this track matches naturalSize
            const isActive =
                t.height === naturalHeight && t.width === naturalWidth;


            const isBetterBitrate =
                !existing || (t.bitrate ?? 0) > (existing.bitrate ?? 0);

            if (isBetterBitrate) {
                unique.set(t.height, {
                    width: t.width,
                    height: t.height,
                    bitrate: t.bitrate,
                    trakIndex: t.index,
                    selected: isActive,
                });
            } else if (isActive && existing) {
                existing.selected = true;
            }
        });

        const tracks: VideoTrack[] = Array.from(unique.values()).sort(
            (a, b) => (a.height ?? 0) - (b.height ?? 0)
        );
        setTraks(tracks);
    }

    const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const toggleControls = () => {
        const { paused, setPaused, setShowPlayIcon } = useShortsStore.getState();

        // toggle pause
        setPaused(!paused);

        // show controls
        setShowPlayIcon(true);

        // clear old timer
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
        }

        // auto hide after 2 sec
        hideTimeout.current = setTimeout(() => {
            useShortsStore.getState().setShowPlayIcon(false);
        }, 2000);
    };


    return (
        <View style={[styles.container, { bottom: insets.bottom }]}>

            <Video
                paused={paused}
                key={mediaUrl}
                source={{
                    uri: mediaUrl
                }}
                resizeMode="cover"
                repeat
                style={styles.video}
                selectedVideoTrack={
                    selectedTrack === "auto" || selectedTrack == null
                        ? { type: SelectedVideoTrackType.AUTO }
                        : {
                            type: SelectedVideoTrackType.INDEX,
                            value: selectedTrack,
                        }
                }
                onError={(error) => loadNext()}
                onLoad={onLoad}
                posterResizeMode='cover'
                poster={`https://i.ytimg.com/vi/${currentVideoInfo?.video.videoId ?? currentVideId}/maxresdefault.jpg`}
            />


            <View
                style={styles.gestureLayer}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={{ flex: 1 }}
                    onPress={toggleControls}
                />
            </View>

            <View style={[
                styles.topBar,
                {
                    paddingTop: insets.top,

                } // 👈 safe spacing
            ]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
                <IconMat name="camera-outline" size={28} color="white" />
            </View>

            {buffering && (
                <View style={styles.centerIcon}>
                    <ActivityIndicator size="large" color="red" />
                </View>
            )}

            <RightControls
                likes={currentVideoInfo?.likes ?? "No likes"}
                commentCount={currentVideoInfo?.commentsCount ?? ""}
                onDownload={() => console.log("nts")}
                onMenuPress={openBottomSheet}
            />
            <BottomControls
                channelName={currentVideoInfo?.channelName ?? ""}
                channelThumbnail={currentVideoInfo?.channelPhoto ?? ""}
                title={currentVideoInfo?.title ?? "Loading..."}
                onChannePress={() => navigation.navigate("ChannelScreen", { channelUrl: currentVideoInfo?.channelId ?? "" })}
            />

            {showPlayIcon && (
                <TouchableOpacity style={styles.centerIcon} onPress={() => console.log("toggle")}>
                    <Icon
                        name={paused ? "play-circle-outline" : "pause-circle-outline"}
                        size={80}
                        color="white"
                    />
                </TouchableOpacity>
            )}

            <ResolutionBottomSheet
                visible={showBottomSheet}
                resolutions={tracks}
                onSelect={changeResolution}
                onClose={() => close()}
            />

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",

    },

    video: {
        ...StyleSheet.absoluteFillObject
    },

    gestureLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 5
    },

    topBar: {
        position: "absolute",
        top: 5, // important
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        zIndex: 10
    },
    centerIcon: {
        position: 'absolute',
        top: '45%',
        left: '37%',
        justifyContent: 'center',
        alignItems: 'center',
    },
})