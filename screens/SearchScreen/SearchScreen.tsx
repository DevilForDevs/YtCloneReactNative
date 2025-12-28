import { StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import React, { useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons';
import IconMat from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useVideoStore } from '../../utils/Store';
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BottomNav">;
import { sendYoutubeSearchRequest } from '../../utils/sendYoutubeSearchRequest';
import { videoId } from '../../utils/Interact';
import { Video } from '../../utils/types';
import { useAskFormat } from '../AskFormatContext';

export default function SearchScreen() {
    const { addVideo, continuation, setContinuation, clearVideos, setQuery, seenVideosIds, clearSeenVideosIds, addSeenVideoId } = useVideoStore();
    const navigation = useNavigation<NavigationProp>();
    const [query, setquery] = useState("");
    const [loading, setLoading] = useState(false);
    const { openAskFormat } = useAskFormat();


    const fetchVideos = async () => {
        try {
            const jsonBody: any = continuation
                ? { continuation }
                : { query }; // 👈 REQUIRED

            jsonBody.context = {
                request: { internalExperimentFlags: [], useSsl: true },
                client: {
                    utcOffsetMinutes: 0,
                    hl: "en-GB",
                    gl: "IN",
                    clientName: "WEB",
                    clientVersion: "2.20250613.00.00",
                    platform: "DESKTOP",
                },
                user: { lockedSafetyMode: false },
            };

            const response = await fetch(
                "https://www.youtube.com/youtubei/v1/search?prettyPrint=false", // 👈 REQUIRED
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept-Language": "en-GB,en;q=0.9",
                    },
                    body: JSON.stringify(jsonBody),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log("SEARCH RESULT:", data);

        } catch (err) {
            console.error("fetchVideos error:", err);
        }
    };


    const handleSubmit = async () => {
        if (query.includes("playlist?list=")) {
            //
        } else {
            var vid = videoId(query);
            if (vid == null) {
                await fetchVideos()
            } else {
                openAskFormat({
                    videoId: vid,
                    type: "video",
                    title: "Notitle",
                    views: "no views",
                    duration: "no duration"
                })
            }


        }
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
        flex: 1,
        marginTop: 100
    }
})