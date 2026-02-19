import React, { useEffect, useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    ActivityIndicator,
    Text
} from 'react-native';
import Pdf from 'react-native-pdf';
import { makePdfFromImages } from './backends/generatepdf';
import RNFS from 'react-native-fs';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function ViewerScreen() {
    const [pdfPath, setPdfPath] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);

    const pdfRef = useRef<any>(null);

    useEffect(() => {
        generate();
    }, []);

    const generate = async () => {
        try {
            const folderPath = `${RNFS.DocumentDirectoryPath}/imagesForPdf`;

            const exists = await RNFS.exists(folderPath);
            if (!exists) {
                throw new Error('imagesForPdf folder does not exist');
            }

            const files = await RNFS.readDir(folderPath);

            const imagePaths = files
                .filter(file =>
                    file.isFile() &&
                    (file.name.endsWith('.jpg') ||
                        file.name.endsWith('.jpeg') ||
                        file.name.endsWith('.png'))
                )
                .sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, { numeric: true })
                )
                .map(file => file.path);

            if (imagePaths.length === 0) {
                console.log('Error:', "no images found");
            }
            setTotalPages(imagePaths.length);

            const generatedPdfPath = await makePdfFromImages(imagePaths);
            setPdfPath(`file://${generatedPdfPath}`);

        } catch (error) {
            console.log('Error:', error);
        }
    };

    if (!pdfPath) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" />
                <Text>
                    Converting {totalPages} images to pdf
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Pdf
                ref={pdfRef}
                source={{ uri: pdfPath }}
                style={styles.pdf}
                enablePaging={true}
                horizontal={true}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },

    pdf: { width, height: height - 60 },

    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});