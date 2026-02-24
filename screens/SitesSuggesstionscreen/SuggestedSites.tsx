import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, BackHandler, Platform, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { HOME_HTML } from "../../utils/suggestedsiteshtml";
import { useSharedFilesStore } from "../../utils/Store";
import { videoId } from "../../utils/Interact";
import { Video } from '../../utils/types'

export default function SuggestedSites() {
    const navigation = useNavigation<navStack>();
    const webViewRef = useRef<WebView>(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);
    const { files, addFile, setFiles, clearFiles } = useSharedFilesStore();



    useEffect(() => {
        if (Platform.OS !== "android") return;

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                if (canGoBack && webViewRef.current) {
                    webViewRef.current.goBack();
                    return true; // ⛔ prevent screen pop
                }
                return false; // allow navigation stack to handle
            }
        );

        return () => backHandler.remove();
    }, [canGoBack]);

    useEffect(() => {
        console.log(currentUrl);
        if ("https://m.youtube.com/" == currentUrl) {
            navigation.navigate("BrowserScreen", { name: "" })
        }
        if ("https://www.sarkariresult.com/" == currentUrl) {
            navigation.navigate("SarkariResult")
        }
        if (currentUrl?.includes("https://epaper.indiatimes.com/timesepaper")) {
            navigation.navigate("TOI");
        }
        if (currentUrl?.includes("https://epaper.jagran.com/")) {
            navigation.navigate("TOI");
        }
        if (currentUrl?.includes("https://epaper.prabhatkhabar.com/")) {
            navigation.navigate("TOI");
        }




    }, [currentUrl])

    useEffect(() => {
        for (const item of files as SharedFile[]) {
            if (item.weblink) {

                const ytVideoId = videoId(item.weblink)

                const requiredVideo: Video = {
                    type: 'video',
                    videoId: ytVideoId,
                    title: '',
                    views: 'NO views',
                };
                if (item.weblink.includes("shorts")) {
                    navigation.navigate("ShortsPlayerScreen", { arrivedVideo: requiredVideo })
                } else {
                    navigation.navigate("VideoPlayerScreen", { arrivedVideo: requiredVideo, playlistId: undefined })
                }
                break;
            }
        }
    }, [files])


    async function eventOnPageLoad() {

        if (currentUrl?.includes("https://www.mcqbuddy.com/")) {
            const jsCode = `
        (function() {

            // Remove specific Play Store link
            const links = document.querySelectorAll(
                "a[href='https://play.google.com/store/apps/details?id=com.mcqbuddy.grandmaaTales']"
            );
            links.forEach(link => link.remove());

            // Remove footer element
            const footer = document.querySelector("footer");
            if (footer) {
                footer.remove();
            }

        })();
        true;
    `;

            webViewRef.current?.injectJavaScript(jsCode);
        }
    }


    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <View style={styles.urlBar}>
                    <Text style={styles.urlText} numberOfLines={1}>
                        {(!currentUrl || currentUrl === "about:blank") ? "Home" : currentUrl}
                    </Text>
                </View>
                <WebView
                    ref={webViewRef}
                    source={{ html: HOME_HTML }}
                    javaScriptEnabled
                    domStorageEnabled
                    setSupportMultipleWindows={false}
                    onShouldStartLoadWithRequest={(request) => {
                        const url = request.url;

                        if (url.startsWith("http://") || url.startsWith("https://")) {
                            return true;
                        }

                        return false;
                    }}
                    onNavigationStateChange={(navState) => {
                        setCanGoBack(navState.canGoBack);
                        setCurrentUrl(navState.url);
                    }}
                    onLoadEnd={eventOnPageLoad}
                />

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    urlBar: {
        height: 40,
        justifyContent: "center",
        paddingHorizontal: 10,
        backgroundColor: "#f2f2f2",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        marginVertical: 5
    },
    urlText: {
        fontSize: 15,
        color: "#333",
        textAlign: "center"
    }
});
