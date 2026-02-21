import RNFS from 'react-native-fs';
import { downloadImage } from '../../EpaperViewerscreen/backends/generatepdf';
import { createPdf } from 'react-native-images-to-pdf';
import {
    NativeModules,
} from 'react-native'


export interface TOIData {
    data: any,
    edition: string;
    year: string | number;
    month: string | number;
    day: string | number;
}

export async function handleToi(
    paras: TOIData,
    downloadingPageNumber: (pageNumber: number) => void,
    error: (errorMsg: string) => void

) {
    try {
        const folderPath = `${RNFS.DocumentDirectoryPath}/imagesForPdf`;
        const exists = await RNFS.exists(folderPath);
        if (!exists) return;

        const files = await RNFS.readDir(folderPath);
        for (const file of files) {
            if (file.isFile()) await RNFS.unlink(file.path);
        }
        const pages = paras.data.DayIndex;
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const imageUrl = `https://asset.harnscloud.com/PublicationData/TOI/${paras.edition}/${paras.year}/${paras.month}/${paras.day}/Page/${page.PageName}.jpg`;

            await downloadImage(
                imageUrl,
                i + 1,
                {
                    Referer: "https://bcclepaper.indiatimes.com/",
                    "User-Agent": "Mozilla/5.0",
                }
            );
            downloadingPageNumber(i + 1); // update UI
        }


    } catch (err) {
        error(String(err))
    }


}

export function getInjectedJsForToi(jsonUrl: string): string {
    const injectedJSForToi = `
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
    return injectedJSForToi

}

export function getRequiredDate(item: epaperItem) {
    const date = new Date();

    if (item.day === "yesterday") {
        date.setDate(date.getDate() - 1);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return { year, month, day };
}



export async function downloadImageToPdf(
    imageUrl: string,
    headers: Record<string, string> = {},
    pdfFileName: string = 'output.pdf'
): Promise<string | undefined> {
    try {
        // 1️⃣ Download image to cache
        const tempImagePath = `${RNFS.CachesDirectoryPath}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.jpg`;

        const downloadResult = await RNFS.downloadFile({
            fromUrl: imageUrl,
            toFile: tempImagePath,
            headers,
        }).promise;

        if (downloadResult.statusCode !== 200) {
            console.warn(`Image download failed with status ${downloadResult.statusCode}`);
            return undefined;
        }

        // 2️⃣ Build pages array as required by createPdf
        const pages = [{ imagePath: tempImagePath }];

        // 3️⃣ Ensure directory for PDFs exists
        const pdfDir = `${RNFS.DocumentDirectoryPath}/pdfs`;
        await RNFS.mkdir(pdfDir);

        // 4️⃣ Construct absolute output path (without file:// prefix)
        const outputPath = `${pdfDir}/${pdfFileName}`;

        // 5️⃣ Create PDF
        const createdPdfPath = await createPdf({
            pages,
            outputPath,
        });

        console.log('PDF created at:', createdPdfPath);

        // 6️⃣ Clean up temporary image
        await RNFS.unlink(tempImagePath);

        return createdPdfPath; // may be undefined if createPdf fails internally
    } catch (error) {
        console.error('downloadImageToPdf error:', error);
        return undefined; // return undefined instead of throwing
    }
}


export async function handleDainikJagran(url: string): Promise<string[]> {
    const { MyNativeModule } = NativeModules;
    const pdfsUrlslist: string[] = []
    const schema2 = {
        sections: [
            {
                key: "pdfsUrl",
                selector: "#menu-toc",
                items: {
                    selector: "li",
                    fields: {
                        imageUrl: {
                            selector: "img",
                            attr: "data-src"
                        }
                    }
                }
            }
        ]
    };

    const schema = {
        url,
        schema: schema2,
    };

    // ✅ Convert object to string before passing to native module
    const schemaJson = JSON.stringify(schema);

    const resultString: string = await MyNativeModule.htmlExtractor(schemaJson);
    const pages = JSON.parse(resultString).sections.pdfsUrl.items

    for (let i = 0; i < pages.length; i++) {
        const originalUrl = pages[i].imageUrl;

        // 1️⃣ Remove 'ss' before the extension
        const cleanedUrl = originalUrl.replace(/ss\.png$/, '.pdf');
        pdfsUrlslist.push(cleanedUrl)
    }
    return pdfsUrlslist
}

export async function downloadPdf(
    pdfUrl: string,
    pdfFileName: string = 'output.pdf',
    headers: Record<string, string> = {}
): Promise<string | undefined> {
    try {
        // Ensure the pdfs directory exists
        const pdfDir = `${RNFS.DocumentDirectoryPath}/pdfs`;
        await RNFS.mkdir(pdfDir);

        // Construct the full output path
        const outputPath = `${pdfDir}/${pdfFileName}`;

        // Download the PDF file
        const downloadResult = await RNFS.downloadFile({
            fromUrl: pdfUrl,
            toFile: outputPath,
            headers,
        }).promise;

        if (downloadResult.statusCode !== 200) {
            console.warn(`PDF download failed with status ${downloadResult.statusCode}`);
            return undefined;
        }

        console.log('PDF downloaded at:', outputPath);
        return outputPath;
    } catch (error) {
        console.error('downloadPdf error:', error);
        return undefined;
    }
}