import { StyleSheet, View, Text, ToastAndroid } from 'react-native';
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import WebView from 'react-native-webview';
import { downloadImage } from '../EpaperViewerscreen/backends/generatepdf';
import { SafeAreaView } from 'react-native-safe-area-context';
type NavigationProp = RouteProp<
    RootStackParamList,
    "FetchImagesForPdf"
>;

export default function FetchImagesForPdf() {

    const route = useRoute<NavigationProp>();
    const { item } = route.params;
    const navigation = useNavigation<navStack>();
    const webRef = useRef<WebView>(null);

    const [data, setData] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // ✅ Generate date once
    const { year, month, day, jsonUrl } = useMemo(() => {
        const date = new Date();

        // ✅ Handle today / yesterday
        if (item.day === "yesterday") {
            date.setDate(date.getDate() - 1);
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        const jsonUrl = `https://asset.harnscloud.com/PublicationData/TOI/${item.edition}/${year}/${month}/${day}/DayIndex/${day}_${month}_${year}_${item.edition}.json`;

        return { year, month, day, jsonUrl };
    }, [item.day, item.edition]);

    // ✅ Injected JS
    const injectedJS = `
        setTimeout(async () => {
            try {
                const res = await fetch("${jsonUrl}");
                const data = await res.json();
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
            } catch (e) {
                window.ReactNativeWebView.postMessage("ERROR: " + e.message);
            }
        }, 6000);
        true;
    `;

    // ✅ Handle Data Safely
    useEffect(() => {

        if (!data || !data.DayIndex) return;

        const downloadAllPages = async () => {
            try {

                setTotalPages(data.DayIndex.length)

                for (let i = 0; i < totalPages; i++) {

                    const page = data.DayIndex[i];
                    console.log(page);

                    const imageUrl =
                        `https://asset.harnscloud.com/PublicationData/TOI/${item.edition}/${year}/${month}/${day}/Page/${page.PageName}.jpg`;

                    setCurrentPage(i + 1);

                    await downloadImage(
                        imageUrl,
                        i + 1,
                        {
                            Referer: "https://bcclepaper.indiatimes.com/",
                            "User-Agent": "Mozilla/5.0"
                        },
                    );
                }
                navigation.navigate("ViewerScreen");

            } catch (err) {
                ToastAndroid.show("Unexpected Error", ToastAndroid.SHORT);
                console.log("Download error:", err);
            }
        };

        downloadAllPages();

    }, [data]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {!data ? (
                <WebView
                    ref={webRef}
                    source={{ uri: "https://bcclepaper.indiatimes.com/" }}
                    javaScriptEnabled
                    domStorageEnabled
                    injectedJavaScript={injectedJS}
                    onMessage={(event) => {
                        try {
                            const parsed = JSON.parse(event.nativeEvent.data);
                            setData(parsed);
                        } catch (err) {
                            ToastAndroid.show("Unexpected Error", ToastAndroid.SHORT);
                            console.log("WebView Error:", event.nativeEvent.data);
                        }
                    }}
                />
            ) : (
                <View style={styles.subControls}>
                    <Text>
                        Downloading Pages {currentPage}/{totalPages}
                    </Text>
                </View>
            )}


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    subControls: {
        flex: 1,
        justifyContent: "center", // vertical center
        alignItems: "center",     // horizontal center
    }
});

