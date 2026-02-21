import RNFS from 'react-native-fs';
import { downloadImage } from '../../EpaperViewerscreen/backends/generatepdf';
import { useMemo } from 'react';


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
