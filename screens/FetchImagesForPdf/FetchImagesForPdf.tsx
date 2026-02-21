import { StyleSheet, View, Text, ToastAndroid, TouchableOpacity } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import WebViewRnc from './widgets/WebViewRnc';
import { downloadImageToPdf, downloadPdf, getInjectedJsForToi, getRequiredDate, handleDainikJagran } from './backends/imgDownloader';
import RNFS from 'react-native-fs';
type NavigationProp = RouteProp<RootStackParamList, "FetchImagesForPdf">;

export default function FetchImagesForPdf() {
    const route = useRoute<NavigationProp>();
    const { item } = route.params;
    const [data, setData] = useState<any>(null);
    const [requiredJs, setRequiredJs] = useState("");
    const date = getRequiredDate(item);
    const [pdfUri, setPdfUri] = useState<string | null>("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
    const pdfRef = useRef<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pdfUris, setPdfUris] = useState<string[]>([]);
    const [requiredUrl, setRequiredUrl] = useState("");


    async function doOnLoadStuffs() {
        if (item.url.includes("indiatimes")) {
            setRequiredUrl("https://bcclepaper.indiatimes.com/")
            const jsonUrl = `https://asset.harnscloud.com/PublicationData/TOI/${item.edition}/${date.year}/${date.month}/${date.day}/DayIndex/${date.day}_${date.month}_${date.year}_${item.edition}.json`;
            setRequiredJs(getInjectedJsForToi(jsonUrl));
        }

        if (item.url.includes("jagran")) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthIndex = parseInt(date.month, 10) - 1;
            const monthStr = monthNames[monthIndex] || "Jan";
            const formattedEditionName = item.editionName?.replace(/\s+/g, "-") ?? "";
            const url = `https://epaper.jagran.com/epaper/${date.day}-${monthStr}-${date.year}-${item.edition}-edition-${formattedEditionName}.html`;

            const pdfsUrls = await handleDainikJagran(url);
            setData({});
            setTotalPages(pdfsUrls.length)
            for (let i = 0; i < pdfsUrls.length; i++) {
                console.log(pdfsUrls[i])
                const newPdfUri = await downloadPdf(pdfsUrls[i], `jagranpdf${i}.pdf`)
                if (newPdfUri) {
                    // ✅ Verify that the PDF file actually exists
                    const fileExists = await RNFS.exists(newPdfUri.replace('file://', '')); // remove file:// prefix for RNFS
                    if (fileExists) {
                        if (i === 0) setPdfUri(newPdfUri);
                        setPdfUris(prevList => [...prevList, newPdfUri]);

                    } else {
                        console.warn('PDF file not found:', newPdfUri);
                    }
                }

            }

        }
    }

    async function doStuffs() {

        if (item.url.includes("indiatimes")) {
            const pages = data.DayIndex;
            const headers = {
                Referer: "https://bcclepaper.indiatimes.com/",
                "User-Agent": "Mozilla/5.0",
            };
            setTotalPages(pages.length)

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const imageUrl = `https://asset.harnscloud.com/PublicationData/TOI/${item.edition}/${date.year}/${date.month}/${date.day}/Page/${page.PageName}.jpg`;

                try {
                    const newPdfUri = await downloadImageToPdf(imageUrl, headers, `${page.PageName}.pdf`);

                    if (newPdfUri) {
                        // ✅ Verify that the PDF file actually exists
                        const fileExists = await RNFS.exists(newPdfUri.replace('file://', '')); // remove file:// prefix for RNFS
                        if (fileExists) {
                            if (i === 0) setPdfUri(newPdfUri);
                            setPdfUris(prevList => [...prevList, newPdfUri]);
                            console.log('PDF exists and added:', newPdfUri);
                        } else {
                            console.warn('PDF file not found:', newPdfUri);
                        }
                    }
                } catch (err) {
                    console.error('Error processing page:', page.PageName, err);
                }
            }
        }



    }


    useEffect(() => {
        doOnLoadStuffs();
    }, []);


    useEffect(() => {
        if (!data) return;
        doStuffs()

    }, [data]);



    function goNextPage() {
        if (currentPage < pdfUris.length) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            setPdfUri(pdfUris[nextPage - 1]); // arrays are 0-indexed
        } else {

            if (pdfUris.length < totalPages) {
                ToastAndroid.show("Page not ready", ToastAndroid.SHORT);
            } else {
                ToastAndroid.show("Reached End", ToastAndroid.SHORT);
            }
        }
    }

    function goPrevPage() {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            setPdfUri(pdfUris[prevPage - 1]); // arrays are 0-indexed
        } else {
            ToastAndroid.show("Already at first page", ToastAndroid.SHORT);
        }
    }

    function handleData(data: any) {
        setData(data);
    }

    function onError(err: any) {
        console.log(err);
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {!data && (
                <WebViewRnc
                    uri={requiredUrl}
                    onData={handleData}
                    onError={onError}
                    injectedJs={requiredJs}
                />
            )}

            {pdfUri && (
                <View style={{ flex: 1 }}>
                    <Text style={styles.pdfTitle}>{item.editionName}</Text>

                    <Pdf
                        ref={pdfRef}
                        key={pdfUri}
                        source={{ uri: pdfUri }}
                        style={{ flex: 1, width: '100%' }}
                        enablePaging
                        horizontal
                    />

                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.button} onPress={goPrevPage}>
                            <Text style={styles.buttonText}>Previous</Text>
                        </TouchableOpacity>

                        <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>

                        <TouchableOpacity style={styles.button} onPress={goNextPage}>
                            <Text style={styles.buttonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    pdfTitle: {
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        backgroundColor: '#f2f2f2',
        paddingVertical: 8,
        borderRadius: 6,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#eee',
    },
    button: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: '#4a90e2',
        borderRadius: 4,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    pageInfo: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});