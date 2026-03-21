import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import WebViewRnc from './widgets/WebViewRnc';
import { usePdfReaderScreenStore } from './Store';

type NavigationProp = RouteProp<RootStackParamList, "FetchImagesForPdf">;

export default function FetchImagesForPdf() {

    const {
        initiate,
        data,
        setData,
        pdfUri,
        requiredJs,
        requiredUrl,
        setCurrentPage,
        stopDownload
    } = usePdfReaderScreenStore()

    const route = useRoute<NavigationProp>();
    const { item } = route.params;

    const pdfRef = useRef<any>(null);

    const downloadProgress = usePdfReaderScreenStore(state => state.downloadProgress);
    const currentPage = usePdfReaderScreenStore(state => state.currentPage);
    const pagesDownloadedCount = usePdfReaderScreenStore(state => state.pagesDownloadedCount);

    useEffect(() => {
        initiate(item);
    }, [])


    return (
        <SafeAreaView style={styles.container}>

            {!data && (
                <WebViewRnc
                    uri={requiredUrl}
                    onData={setData}
                    injectedJs={requiredJs}
                    onError={(e) => console.log(e)}

                />
            )}

            <View style={styles.header}>
                <Text style={styles.title}>{item.editionName}</Text>
            </View>

            {/* PDF READY */}
            {pdfUri ? (

                <View style={{ flex: 1 }}>
                    <Pdf
                        ref={pdfRef}
                        key={pdfUri}
                        source={{ uri: pdfUri }}
                        style={{ flex: 1 }}
                        enablePaging

                        onPageChanged={(page) => setCurrentPage(page)}
                    />


                    {/* Page indicator */}
                    <View style={styles.pageIndicator}>
                        <Text style={styles.pageText}>
                            Page {currentPage}/{pagesDownloadedCount}
                        </Text>
                    </View>
                </View>

            ) : (

                /* Download screen */

                <View style={styles.downloadContainer}>

                    <Text style={styles.progressText}>
                        {downloadProgress}
                    </Text>

                    <Text style={styles.pagesText}>
                        Pages downloaded: {pagesDownloadedCount}
                    </Text>

                    <TouchableOpacity
                        style={styles.stopButton}
                        onPress={stopDownload}
                    >
                        <Text style={styles.stopText}>
                            Stop & Start Reading
                        </Text>
                    </TouchableOpacity>

                </View>

            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#f3f4f6"
    },

    header: {
        padding: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderColor: "#e5e7eb"
    },

    title: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold"
    },

    downloadContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    progressText: {
        fontSize: 18,
        marginBottom: 10
    },

    pagesText: {
        fontSize: 16,
        marginBottom: 30
    },

    stopButton: {
        backgroundColor: "#2563eb",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 8
    },

    stopText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16
    },

    pageIndicator: {
        position: "absolute",
        bottom: 20,
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20
    },

    pageText: {
        color: "white"
    },

    backgroundDownload: {
        position: "absolute",
        top: 10,
        alignSelf: "center",
        backgroundColor: "#facc15",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10
    },

    bgText: {
        fontSize: 12,
        fontWeight: "600"
    }

});