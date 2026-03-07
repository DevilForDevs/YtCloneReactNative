import { StyleSheet, View, Text, ToastAndroid, TouchableOpacity, TextInput } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import WebViewRnc from './widgets/WebViewRnc';
import { clearPdfFolder, downloadImageToPdf, downloadPdf, getInjectedJsForToi, getRequiredDate, handleDainikJagran, handlePrabhatKhabar } from './backends/imgDownloader';
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
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [pdfScale, setPdfScale] = useState(1.5);
    const [isZoomed, setIsZoomed] = useState(false);


    async function doOnLoadStuffs() {

        await clearPdfFolder()

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

        if (item.url.includes("prabhatkhabar")) {
            const requiredUrl = `https://epaper.prabhatkhabar.com/api/published-editions/slug/${item.edition}/${date.year}-${date.month}-${date.day}`
            console.log(requiredUrl);
            const pdfsUrls = await handlePrabhatKhabar(requiredUrl)
            setData({});
            setTotalPages(pdfsUrls.length)
            for (let i = 0; i < pdfsUrls.length; i++) {
                console.log(pdfsUrls[i])
                const newPdfUri = await downloadPdf(pdfsUrls[i], `prabhatKhabar${i}.pdf`)
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

        if (item.url.includes("https://economictimes")) {
            setRequiredUrl("https://bcclepaper.indiatimes.com/")
            console.log(item);
            const jsonUrl = `https://asset.harnscloud.com/PublicationData/ET/${item.edition}/${date.year}/${date.month}/${date.day}/DayIndex/${date.day}_${date.month}_${date.year}_${item.edition}.json`;
            console.log(jsonUrl);
            setRequiredJs(getInjectedJsForToi(jsonUrl));
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

        if (item.url.includes("https://economictimes")) {
            console.log("et");
            const pages = data.DayIndex;
            const headers = {
                Referer: "https://bcclepaper.indiatimes.com/",
                "User-Agent": "Mozilla/5.0",
            };
            setTotalPages(pages.length)

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const imageUrl = `https://asset.harnscloud.com/PublicationData/ET/${item.edition}/${date.year}/${date.month}/${date.day}/Page/${page.PageName}.jpg`;

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




    function sleep(ms: number) {
        return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }

    async function goNextPage() {
        if (currentPage >= pdfUris.length - 1) return; // already at last page

        setPdfScale(1); // reset zoom first
        await sleep(500); // wait 500ms before changing page

        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        setPdfUri(pdfUris[nextPage]);
    }

    async function goPrevPage() {
        if (currentPage <= 0) return; // already at first page

        setPdfScale(1); // reset zoom first
        await sleep(500); // wait 500ms before changing page

        const prevPage = currentPage - 1;
        setCurrentPage(prevPage);
        setPdfUri(pdfUris[prevPage]);
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
                    <View>
                        <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>
                    </View>
                    <View style={{ flex: 1 }}>

                        <Pdf
                            ref={pdfRef}
                            key={pdfUri}
                            source={{ uri: pdfUri }}
                            style={{ flex: 1 }}
                            scale={pdfScale}

                        />

                        {isPdfLoading && (
                            <View style={styles.loaderOverlay}>
                                <Text style={styles.loaderText}>Loading PDF...</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.button} onPress={goPrevPage}>
                            <Text style={styles.buttonText}>Previous</Text>
                        </TouchableOpacity>

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
        textAlign: 'center',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    loaderOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
});