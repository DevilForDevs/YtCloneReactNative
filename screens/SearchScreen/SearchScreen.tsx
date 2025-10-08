import { StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons';
import IconMat from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../App';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useVideoStore } from '../../utils/Store';
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BottomNav">;
import { sendYoutubeSearchRequest } from '../../utils/sendYoutubeSearchRequest';
import { Video } from '../../utils/types';

export default function SearchScreen() {
    const { addVideo, setContinuation, clearVideos, setQuery, seenVideosIds, clearSeenVideosIds, addSeenVideoId } = useVideoStore();
    const navigation = useNavigation<NavigationProp>();
    const [query, setquery] = useState("");
    const [loading, setLoading] = useState(false);


    const fetchVideos = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const result = await sendYoutubeSearchRequest(query,"", "8AEB");
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
        setQuery(query)
        setContinuation("")
        clearVideos()
        clearSeenVideosIds()
        await fetchVideos()
        navigation.goBack()


    }




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
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: [{ translateX: -20 }, { translateY: -20 }] //
    }
})