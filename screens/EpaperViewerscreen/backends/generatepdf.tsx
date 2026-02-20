import RNFS from 'react-native-fs';
import { createPdf } from 'react-native-images-to-pdf';

export async function makePdfFromImages(
    imagePaths: string[]
): Promise<string> {
    try {
        if (!imagePaths || imagePaths.length === 0) {
            throw new Error('No images provided');
        }

        const pdfPath = `${RNFS.DocumentDirectoryPath}/output.pdf`;

        // Convert string[] → required format
        const pages = imagePaths.map((path) => ({
            imagePath: path,
        }));

        const result = await createPdf({
            pages,
            outputPath: pdfPath,
        });

        return result; // returns file path of generated PDF
    } catch (error) {
        console.error('PDF generation failed:', error);
        return "failure"

    }
}

export async function downloadImage(
    url: string,
    pageNumber: number,
    headers?: Record<string, string>
): Promise<string> {

    // 📁 Create folder
    const folderPath = `${RNFS.DocumentDirectoryPath}/imagesForPdf`;
    const exists = await RNFS.exists(folderPath);

    if (!exists) {
        await RNFS.mkdir(folderPath);
    }

    // 📄 Unique file name
    const filePath = `${folderPath}/page_${String(pageNumber).padStart(3, '0')}.jpg`;

    const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        headers: headers || {},
        background: true,
    }).promise;

    if (result.statusCode === 200) {
        return filePath;
    } else {
        console.log(result.statusCode)
        return "failure"
    }
}