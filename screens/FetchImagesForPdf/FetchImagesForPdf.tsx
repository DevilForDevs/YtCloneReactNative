import { StyleSheet, View, Text, ToastAndroid, TouchableOpacity, } from 'react-native';
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import WebView from 'react-native-webview';
import RNFS from 'react-native-fs';
import { downloadImage } from '../EpaperViewerscreen/backends/generatepdf';
import { SafeAreaView } from 'react-native-safe-area-context';
type NavigationProp = RouteProp<RootStackParamList, "FetchImagesForPdf">;

export default function FetchImagesForPdf() {
    const route = useRoute<NavigationProp>();
    const { item } = route.params;
    const navigation = useNavigation<navStack>();
    const webRef = useRef<WebView>(null);

    const [data, setData] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Generate date once
    const { year, month, day, jsonUrl } = useMemo(() => {
        const date = new Date();
        if (item.day === "yesterday") date.setDate(date.getDate() - 1);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        const jsonUrl = `https://asset.harnscloud.com/PublicationData/TOI/${item.edition}/${year}/${month}/${day}/DayIndex/${day}_${month}_${year}_${item.edition}.json`;
        return { year, month, day, jsonUrl };
    }, [item.day, item.edition]);

    // Injected JS for WebView
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

    // Delete all files in folder
    const clearFolder = async (folderPath: string) => {
        try {
            const exists = await RNFS.exists(folderPath);
            if (!exists) return;

            const files = await RNFS.readDir(folderPath);
            for (const file of files) {
                if (file.isFile()) await RNFS.unlink(file.path);
            }
        } catch (err) {
            console.log("Error clearing folder:", err);
        }
    };

    useEffect(() => {
        if (!data || !data.DayIndex) return;

        const downloadAllPages = async () => {
            try {
                const pages = data.DayIndex;
                setTotalPages(pages.length);
                setCurrentPage(0);

                const folderPath = `${RNFS.DocumentDirectoryPath}/imagesForPdf`;
                await clearFolder(folderPath);

                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i];
                    const imageUrl = `https://asset.harnscloud.com/PublicationData/TOI/${item.edition}/${year}/${month}/${day}/Page/${page.PageName}.jpg`;

                    setCurrentPage(i + 1); // update UI
                    await downloadImage(
                        imageUrl,
                        i + 1,
                        {
                            Referer: "https://bcclepaper.indiatimes.com/",
                            "User-Agent": "Mozilla/5.0",
                        }
                    );
                }

                // Navigate after all pages are downloaded
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
            {!data && (
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
            )}

            {!data && (
                <View style={styles.overlay}>
                    <Text style={styles.overlayText}>Fetching Information…</Text>
                </View>
            )}

            {data && (
                <View style={styles.subControls}>
                    <Text style={styles.titleText}>Times of India {item.editionName}</Text>
                    <Text style={styles.progressText}>
                        Downloading Pages {currentPage}/{totalPages}
                    </Text>

                    {currentPage === totalPages && (
                        <TouchableOpacity
                            style={styles.viewPdfButton}
                            onPress={() => navigation.navigate("ViewerScreen")}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.viewPdfButtonText}>View PDF</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    subControls: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        backgroundColor: "#f5f5f5",
    },
    titleText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#222",
        marginBottom: 10,
    },
    progressText: {
        fontSize: 16,
        color: "#555",
        marginBottom: 20,
    },
    viewPdfButton: {
        backgroundColor: "#1E90FF",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    viewPdfButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },

    // Overlay styles
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)", // semi-transparent dark overlay
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    overlayText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFD700", // bright gold/yellow text
    },
});