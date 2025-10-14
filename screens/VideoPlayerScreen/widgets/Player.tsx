import { StyleSheet, Text, View, TouchableOpacity, Image, Pressable } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Video, { OnLoadData, OnProgressData } from "react-native-video";
import Icon from "react-native-vector-icons/Ionicons";
import Slider from "@react-native-community/slider"; // optional but recommended
import Orientation from 'react-native-orientation-locker';
import { BackHandler } from "react-native";
import { ActivityIndicator } from 'react-native';
import TopConrols from './TopConrols';
import { formatSeconds } from '../../../utils/misfunction';
type Props = {
    url: string,
    toggleFlatList: () => void;
    videoId: string


}

export default function Player({ url, toggleFlatList, videoId }: Props) {
    const videoRef = useRef<React.ElementRef<typeof Video>>(null); // ✅ works
    const [isBuffering, setIsBuffering] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullscreen, setFullScreen] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [paused, setPaused] = useState(false);

    

    const toggleFullscreen = () => {
        toggleFlatList()
        if (isFullscreen) {
            Orientation.lockToPortrait(); // exit fullscreen
            setFullScreen(false);
        } else {
            Orientation.lockToLandscape(); // enter fullscreen
            setFullScreen(true);
        }
    }

    useEffect(() => {
        const onBackPress = () => {
            if (isFullscreen) {
                // Exit fullscreen instead of going back
                Orientation.lockToPortrait();
                setFullScreen(false);
                return true; // prevent default back action
            }
            // Allow default back action
            return false;
        };

        const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            onBackPress
        );

        return () => subscription.remove(); // clean up
    }, [isFullscreen]);

    function onLoad(data: OnLoadData) {
        setDuration(data.duration);
        setIsBuffering(false);
    }

    function onProgress(data: OnProgressData) {
        setCurrentTime(data.currentTime);
    }

    function onBuffer({ isBuffering }: { isBuffering: boolean }) {
        setIsBuffering(isBuffering);
    }


    function onEnd() {
        setPaused(true);
        videoRef.current?.seek(0);
    }

    function onSlidingComplete(value: number) {
        videoRef.current?.seek(value);
        setCurrentTime(value);
    }
    function togglePlayPause() {
        setPaused((p) => !p);

    }
    const click3edONvideo = () => {
        if (showControls) {
            setShowControls(false)
        } else {
            setShowControls(true)
        }
    }

    return (
        <View>
            <View style={isFullscreen ? styles.fullScreenWrapper : styles.videoWrapper}>
                <Video
                    ref={videoRef}
                    source={{ uri: url }}
                    style={styles.video}
                    resizeMode="contain"
                    paused={paused}
                    onLoad={onLoad}
                    onProgress={onProgress}
                    onBuffer={onBuffer}
                    onEnd={onEnd}
                    poster={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} // optional poster
                    posterResizeMode="cover"

                />

                <Pressable
                    onPress={click3edONvideo}
                    style={StyleSheet.absoluteFill} // covers the whole video
                >
                </Pressable>

                {showControls ? <TouchableOpacity onPress={togglePlayPause} style={styles.controlBtn}>
                    <Image source={paused ? require("../../../assets/play.png") : require("../../../assets/pause.png")} style={styles.playPause} />
                    {isBuffering ? (
                        <ActivityIndicator size="large" color="red" />
                    ) : null}
                </TouchableOpacity> : <View />}
                {
                    showControls ?
                        <TopConrols /> : <View />
                }
                {
                    showControls ? <View style={isFullscreen ? styles.fullScrren : styles.bottomControls}>
                        <Text style={styles.durationLabel}>{formatSeconds(duration)}</Text>
                        <TouchableOpacity onPress={toggleFullscreen}>
                            {isFullscreen ? (
                                <Icon name="contract" size={24} color="white" />
                            ) : (
                                <Icon name="expand" size={24} color="white" />
                            )}
                        </TouchableOpacity>
                    </View> : <View />

                }
            </View>
            {(!isFullscreen || showControls) && (
                <Slider
                    style={styles.slider}
                    value={currentTime}
                    minimumValue={0}
                    maximumValue={Math.max(duration, 0.0001)}
                    onSlidingComplete={onSlidingComplete}
                    minimumTrackTintColor="red"   // progress bar color
                    maximumTrackTintColor="lightgray" // background bar
                    thumbTintColor="transparent"  // hides the thumb ball
                />
            )}

        </View>
    )
}

const styles = StyleSheet.create({
    videoWrapper: {
        width: "100%",
        height: 250,
        justifyContent: "center",
        alignItems: "center",
        resizeMode: "stretch",
        backgroundColor:"black"
    },
    video: {
        ...StyleSheet.absoluteFillObject,
    },
    slider: {

        marginTop: -22,
        marginLeft: -15,
        marginRight: -15

    },
    controlBtn: {
        padding: 8,
    },
    playPause: {
        height: 35,
        width: 35
    }
    ,
    durationLabel: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        borderRadius: 5,
        paddingVertical: 2,
        paddingHorizontal: 5,
        color: "white"
    }
    ,
    bottomControls: {
        position: "absolute",
        bottom: 20,
        right: 10,
        flexDirection: "row",
        gap: 10,
        zIndex: 10
    }
    ,
    fullScrren: {
        position: "absolute",
        bottom: 20,
        right: 10,
        flexDirection: "row",
        gap: 10
    }
    ,
    fullScreenWrapper: {
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        resizeMode: "cover"
    }
})