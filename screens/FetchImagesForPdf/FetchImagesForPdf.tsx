import { StyleSheet, View, Text } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import WebViewRnc from './widgets/WebViewRnc';
import { usePdfReaderScreenStore } from './Store';
type NavigationProp = RouteProp<RootStackParamList, "FetchImagesForPdf">;

export default function FetchImagesForPdf() {
    //Actions
    const {
        initiate,
        data,
        setData,
        pdfUri,
        requiredJs,
        requiredUrl,
    } = usePdfReaderScreenStore()

    const route = useRoute<NavigationProp>();
    const { item } = route.params;
    const pdfRef = useRef<any>(null);
    const downloadProgress = usePdfReaderScreenStore(state => state.downloadProgress);


    useEffect(() => {
        initiate(item);
    }, [])

    function onError(err: any) {
        console.log(err);
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {!data && (
                <WebViewRnc
                    uri={requiredUrl}
                    onData={setData}
                    onError={onError}
                    injectedJs={requiredJs}
                />
            )}

            {pdfUri ?
                <View style={{ flex: 1 }}>
                    <Text style={styles.pdfTitle}>{item.editionName}</Text>
                    <View style={{ flex: 1 }}>

                        <Pdf
                            ref={pdfRef}
                            key={pdfUri}
                            source={{ uri: pdfUri }}
                            style={{ flex: 1 }}
                            enablePaging={true}
                            horizontal={true}

                        />
                    </View>
                </View> : <View style={{
                    flex: 1,
                    alignItems: "center",
                    alignContent: "center",
                    marginTop: 200

                }}>
                    <Text style={{
                        textAlign: "center"
                    }}>{downloadProgress}</Text>
                </View>
            }
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
    }
});