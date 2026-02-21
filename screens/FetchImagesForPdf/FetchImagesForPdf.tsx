import { StyleSheet, View, Text, ToastAndroid, TouchableOpacity, } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import WebView from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getInjectedJsForToi, getRequiredDate, handleToi, TOIData } from './backends/imgDownloader';
import WebViewRnc from './widgets/WebViewRnc';
import DownloadStatus from './widgets/DownloadStatus';
import Pdf from 'react-native-pdf';

type NavigationProp = RouteProp<RootStackParamList, "FetchImagesForPdf">;

export default function FetchImagesForPdf() {
    const route = useRoute<NavigationProp>();
    const { item } = route.params;
    const navigation = useNavigation<navStack>();
    const webRef = useRef<WebView>(null);
    const [data, setData] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [requiredJs, setRequiredJs] = useState("");
    const date = getRequiredDate(item)
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const pdfRef = useRef<any>(null);


    async function doStuffs() {

        setTotalPages(data.DayIndex.length)

        const paras: TOIData = {
            data,
            edition: item.edition,
            year: date.year,
            month: date.month,
            day: date.day
        };

        await handleToi(
            paras,
            (pageNumber) => {
                setCurrentPage(pageNumber)


            },
            (errorMsg) => {
                ToastAndroid.show(errorMsg, ToastAndroid.SHORT);
            }
        );

    }

    async function doOnLoadStuffs() {

        if (item.url.includes("indiatimes")) {
            const jsonUrl = `https://asset.harnscloud.com/PublicationData/TOI/${item.edition}/${date.year}/${date.month}/${date.day}/DayIndex/${date.day}_${date.month}_${date.year}_${item.edition}.json`;
            setRequiredJs(getInjectedJsForToi(jsonUrl))

        }

        if (item.url.includes("jagran")) {
            setData({})
        }

    }

    useEffect(() => {
        doOnLoadStuffs()

    }, [])


    useEffect(() => {
        if (!data || !data.DayIndex) return;
        doStuffs()

    }, [data]);

    function handleData(data: any) {
        setData(data)
    }

    function onError(err: any) {
        console.log(err)
    }

    const handlePageChanged = (page: number, numberOfPages: number) => {
        console.log(`Current page: ${page} of ${numberOfPages}`);

        // Detect last page
        if (page === numberOfPages) {
            console.log('Reached end of PDF!');

        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {!data && (
                <WebViewRnc
                    uri='https://bcclepaper.indiatimes.com/'
                    onData={handleData}
                    onError={onError}
                    injectedJs={requiredJs}
                />
            )}



            {pdfUri && (
                <View>
                    <Pdf
                        ref={pdfRef}
                        source={{ uri: pdfUri }}
                        style={styles.pdf}
                        enablePaging={true}
                        horizontal={true}
                        onPageChanged={handlePageChanged}
                        onError={(err) => onError(String(err))}
                    />
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    pdf: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});