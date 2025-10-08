import { StyleSheet, Text, View, Pressable, ActivityIndicator, Animated, TouchableOpacity } from 'react-native'
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
type NavigationProp = RouteProp<RootStackParamList, "ShortsPlayerScreen">;

type Navstack = NativeStackNavigationProp<RootStackParamList, "BottomNav">;

export default function ShortsPlayer() {
    const route = useRoute<NavigationProp>();
    const navigation = useNavigation<Navstack>();
    const { mindex, shortIndex } = route.params;
    const [currentVideoId, setCurrentVideoId] = useState("")


    const { totalVideos } = useVideoStore();
    const [mediaUrl, setMediaUrl] = useState("");
    const [paused, setPaused] = useState(false);
    const [showIcon, setShowIcon] = useState(false);
    const [buffering, setBuffering] = useState(false);


    const fetchStreamingData = async (videoId: string) => {
        try {
            const result = await getIosPlayerResponse(videoId);
            const streamingData = result.streamingData;
            setMediaUrl(streamingData.hlsManifestUrl);
        } catch (err) {
            console.error("Failed to fetch player response:", err);
        }
    };

    useEffect(() => {
        const requiredGroup=totalVideos[mindex]
        if(requiredGroup.type=="shorts"){
            fetchStreamingData(requiredGroup.videos[shortIndex].videoId);
        }
    }, [totalVideos, mindex]);


    const togglePlayPause = () => {
        setPaused(prev => !prev);
        setShowIcon(true);
        setTimeout(() => setShowIcon(false), 800); // icon disappears after 0.8s
    }

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name='arrow-back' size={28} color="white" />
                </TouchableOpacity>
                <IconMat name='camera-outline' size={28} color="white" />
            </View>

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

                <RightControls />
                <BottomControls />
            </View>
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
    }
});
