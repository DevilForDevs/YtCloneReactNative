import { StyleSheet, Text, View, TouchableOpacity, Image, Pressable, ToastAndroid } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Video, { OnLoadData, OnProgressData } from "react-native-video";
import Icon from "react-native-vector-icons/Ionicons";
import Slider from "@react-native-community/slider"; // optional but recommended

import { BackHandler } from "react-native";
import { ActivityIndicator } from 'react-native';
import TopConrols from './TopConrols';
import { formatSeconds } from '../../../utils/misfunction';
import throttle from "lodash.throttle";
import Orientation from "react-native-orientation-locker"



type Props = {
    url: string,
    toggleFlatList: () => void;
    videoId: string,
    showMenu: () => void;
    onProgressSave: (videoId: string, position: number) => void;
    seekTo?: number; // restore position
    distroyScreen: () => void;
    onToggle?: (enabled: boolean) => void;
    videoEnded?: (endedAsScreen: boolean) => void,
    startAsScreen: boolean,
    pageUrl?: string
}

export default function Player(props: Props) {

    const videoRef = useRef<React.ElementRef<typeof Video>>(null); // ✅ works
    const [isBuffering, setIsBuffering] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullscreen, setFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [paused, setPaused] = useState(false);
    const lastTap = useRef<number>(0);
    const singleTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const DOUBLE_TAP_DELAY = 300;

    const reportProgress = useRef(
        throttle((time: number) => {
            props.onProgressSave(props.videoId, time);
        }, 2000)
    ).current;


    function seekBy(seconds: number) {
        const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
        videoRef.current?.seek(newTime);
        setCurrentTime(newTime);
    }

    const toggleFullscreen = () => {
        props.toggleFlatList();
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
                Orientation.lockToPortrait();
                setFullScreen(false);

                props.toggleFlatList(); // ✅ SHOW FlatList again

                return true; // consume back press
            }
            return false;
        };

        const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            onBackPress
        );


        return () => subscription.remove();
    }, [isFullscreen]);


    function onLoad(data: OnLoadData) {
        if (props.startAsScreen) {
            toggleFullscreen();
        }
        setDuration(data.duration);
        setIsBuffering(false);


        // 👇 restore seek
        if (props.seekTo && props.seekTo > 3) {
            videoRef.current?.seek(props.seekTo);
        }
    }


    function onProgress(data: OnProgressData) {
        setCurrentTime(data.currentTime);
        reportProgress(data.currentTime);
    }


    function onBuffer({ isBuffering }: { isBuffering: boolean }) {
        setIsBuffering(isBuffering);
    }


    function onEnd() {
        if (isFullscreen) {
            toggleFullscreen();
        }
        setPaused(true);
        videoRef.current?.seek(0);
        props.videoEnded?.(isFullscreen);
    }

    function onSlidingComplete(value: number) {
        videoRef.current?.seek(value);
        setCurrentTime(value);
    }
    function togglePlayPause() {
        setPaused((p) => !p);

    }



    return (
        <View>
            <View style={isFullscreen ? styles.fullScreenWrapper : styles.videoWrapper}>
                <Video
                    ref={videoRef}
                    source={{
                        uri: props.url,
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
                            "Origin": props.pageUrl ?? "",
                            "Referer": props.pageUrl ?? "https://xhamster1.desi/",
                            "Accept": "*/*",
                            "Platform": "Windows",
                            "Sec-CH-UA": `"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"`,
                            "Sec-CH-UA-Mobile": "?0",
                            "Sec-CH-UA-Platform": `"Windows"`,
                            "Sec-CH-UA-Platform-Version": `"10.0.0"`,
                            "Cache-Control": "no-cache",
                            "Pragma": "no-cache",
                            "Accept-Encoding": "gzip, deflate, br, zstd",
                            "Accept-Language": "en-GB,en;q=0.9",
                        },

                    }}
                    style={styles.video}
                    resizeMode="contain"
                    paused={paused}
                    onLoad={onLoad}
                    onProgress={onProgress}
                    onBuffer={onBuffer}
                    onEnd={onEnd}
                    poster={`https://i.ytimg.com/vi/${props.videoId}/hqdefault.jpg`} // optional poster
                    posterResizeMode="cover"
                    onError={(e) => {
                        console.log("Video error:", e);

                        // Access nested error properties safely
                        const errorMessage =
                            e.error?.errorString?.replace("ExoPlaybackException:", "") ??
                            e.error?.errorException ??
                            e.error?.errorCode ??
                            "Unable to play video";

                        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
                    }}


                />

                <Pressable
                    onPress={(e) => {
                        const now = Date.now();

                        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
                            if (singleTapTimeout.current) {
                                clearTimeout(singleTapTimeout.current);
                                singleTapTimeout.current = null;
                            }

                            const { locationX } = e.nativeEvent;
                            const screenWidth = e.nativeEvent.pageX * 2;

                            if (locationX < screenWidth / 2) seekBy(-10);
                            else seekBy(15);
                        } else {
                            singleTapTimeout.current = setTimeout(() => {
                                setShowControls(s => !s);
                            }, DOUBLE_TAP_DELAY);
                        }

                        lastTap.current = now;
                    }}
                    style={StyleSheet.absoluteFill}
                />


                {showControls ? <TouchableOpacity onPress={togglePlayPause} style={styles.controlBtn}>
                    <Image source={paused ? require("../../../assets/play.png") : require("../../../assets/pause.png")} style={styles.playPause} />
                    {isBuffering ? (
                        <ActivityIndicator size="large" color="red" />
                    ) : null}
                </TouchableOpacity> : <View />}
                {
                    showControls ?
                        <TopConrols distroyScreen={props.distroyScreen} showMenu={props.showMenu} onToggle={(val) => props.onToggle?.(val)} /> : <View />
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
                    style={isFullscreen ? styles.fullSlider : styles.slider}
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
        backgroundColor: "black"
    },
    video: {
        ...StyleSheet.absoluteFillObject,
    },
    slider: {
        marginTop: -10,
        marginLeft: -15,
        marginRight: -15
    },
    fullSlider: {
        marginTop: -20,
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
        bottom: 5,
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