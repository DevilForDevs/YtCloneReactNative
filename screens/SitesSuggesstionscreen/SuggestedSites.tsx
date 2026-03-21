import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, BackHandler, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { HOME_HTML } from "../../utils/suggestedsiteshtml";
import { useAskFeatureStore } from "../AskFeatureCode/AskFeatureStore";
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { StatusBar } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SuggestedSites() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<navStack>();
    const webViewRef = useRef<WebView>(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);




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


    async function getActiveFeatureIds(db: SQLiteDatabase | undefined): Promise<number[]> {
        if (!db) return [];

        const [result] = await db.executeSql("SELECT coupanItemId FROM feature_codes");
        const ids: number[] = [];
        for (let i = 0; i < result.rows.length; i++) {
            ids.push(result.rows.item(i).coupanItemId);
        }
        return ids;
    }

    useEffect(() => {

        async function checkFeatureNavigation() {
            const { db } = useAskFeatureStore.getState();
            const activeFeatures = await getActiveFeatureIds(db);

            const idsfortoi = [2, 7]
            const idsforjagran = [3, 6, 7]
            const idsforprabhat = [4, 6, 7]
            const idsforyt = [1, 6, 7]
            const idsmcqbuddy = [5, 6, 7]

            if (currentUrl?.includes("https://epaper.indiatimes.com/timesepaper") && idsfortoi.some(id => activeFeatures.includes(id))) {
                navigation.navigate("TOI");
            }
            if (currentUrl?.includes("https://epaper.jagran.com/") && idsforjagran.some(id => activeFeatures.includes(id))) {
                navigation.navigate("TOI");
            }
            if (currentUrl?.includes("https://epaper.prabhatkhabar.com/") && idsforprabhat.some(id => activeFeatures.includes(id))) {
                navigation.navigate("TOI");
            }
            if (currentUrl === "https://m.youtube.com/" && idsforyt.some(id => activeFeatures.includes(id))) {
                navigation.navigate("BrowserScreen", { name: "" });
            }

            if (currentUrl === "https://www.mcqbuddy.com/") {
                if (!idsmcqbuddy.some(id => activeFeatures.includes(id))) {
                    webViewRef.current?.goBack();
                }
            }

        }

        checkFeatureNavigation();




    }, [currentUrl])




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
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar
                backgroundColor="black"     // Android only
                barStyle="light-content"   // white icons
            />

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
        </View>
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
