import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, BackHandler, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { HOME_HTML } from "../../utils/suggestedsiteshtml";

export default function SuggestedSites() {
    const navigation = useNavigation<navStack>();
    const webViewRef = useRef<WebView>(null);
    const [canGoBack, setCanGoBack] = useState(false);

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


    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <WebView
                    ref={webViewRef}
                    source={{ html: HOME_HTML }}
                    javaScriptEnabled
                    domStorageEnabled
                    sharedCookiesEnabled
                    thirdPartyCookiesEnabled
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    startInLoadingState
                    allowsFullscreenVideo
                    scalesPageToFit
                    onNavigationStateChange={(navState) =>
                        setCanGoBack(navState.canGoBack)
                    }
                    style={{ flex: 1 }}
                />

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
