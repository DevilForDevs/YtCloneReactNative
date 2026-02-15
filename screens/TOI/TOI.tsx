import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';

export default function TOI() {
    const webRef = useRef(null);

    const injectedJS = `
        setTimeout(async () => {
            try {
                const res = await fetch(
                    "https://asset.harnscloud.com/PublicationData/TOI/cap/2026/02/14/DayIndex/14_02_2026_cap.json"
                );
                const data = await res.json();
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
            } catch (e) {
                window.ReactNativeWebView.postMessage("ERROR: " + e.message);
            }
        }, 6000);  // wait for cloudflare
        true;
    `;

    return (
        <View style={{ flex: 1 }}>
            <WebView
                ref={webRef}
                source={{ uri: "https://bcclepaper.indiatimes.com/" }}
                javaScriptEnabled
                domStorageEnabled
                injectedJavaScript={injectedJS}
                onMessage={(event) => {
                    console.log("Received:", JSON.parse(event.nativeEvent.data));
                }}
                style={{
                    height: 100,
                    width: 200
                }}

            />
        </View>
    );
}

const styles = StyleSheet.create({


});