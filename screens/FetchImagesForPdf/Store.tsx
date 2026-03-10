import { create } from "zustand";
import {
    downloadImageToPdf,
    downloadPdf,
    getInjectedJsForToi, getRequiredDate,
    handleDainikJagran, handlePrabhatKhabar
} from "./backends/imgDownloader";
import { NativeModules } from "react-native";
import RNFS from 'react-native-fs';


type PdfReaderScreenState = {
    pagesDownloadedCount: number,
    currentPage: number,
    pdfUri: string | undefined,
    continueDownloading: boolean,
    downloadProgress: string,
    initiate: (item: epaperItem) => void;
    requiredJs: string,
    requiredUrl: string,
    item: epaperItem | undefined,
    data: any,
    handleWebViewResponse: () => void;
    setData: (data: any) => void,
    setCurrentPage: (p: number) => void,
    stopDownload: () => void,
    resetStore: () => void
};

const initialData = {
    pagesDownloadedCount: 0,
    currentPage: 1,
    pdfUri: undefined,
    downloadProgress: "Downloding .... 0/0",
    requiredJs: "",
    requiredUrl: "https://epaper.indiatimes.com/",
    data: "",
    item: undefined,
    continueDownloading: true

}

export const usePdfReaderScreenStore = create<PdfReaderScreenState>((set, get) => ({
    ...initialData,
    initiate: async (item) => {
        const { resetStore } = get();
        resetStore(); // reset previous state
        const { MyNativeModule } = NativeModules;

        set({ item })
        const date = getRequiredDate(item);
        const pdfUris: string[] = []



        if (item.url.includes("indiatimes")) {
            const jsonUrl = `https://asset.harnscloud.com/PublicationData/TOI/${item.edition}/${date.year}/${date.month}/${date.day}/DayIndex/${date.day}_${date.month}_${date.year}_${item.edition}.json`;
            set({ requiredJs: getInjectedJsForToi(jsonUrl) })
        }

        if (item.url.includes("jagran")) {
            set({ data: {} })
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthIndex = parseInt(date.month, 10) - 1;
            const monthStr = monthNames[monthIndex] || "Jan";
            const formattedEditionName = item.editionName?.replace(/\s+/g, "-") ?? "";
            const url = `https://epaper.jagran.com/epaper/${date.day}-${monthStr}-${date.year}-${item.edition}-edition-${formattedEditionName}.html`;

            const pdfsUrls = await handleDainikJagran(url);


            for (let i = 0; i < pdfsUrls.length; i++) {
                const { continueDownloading } = get()
                const downloadProgress = `Downloading page ${i + 1}/${pdfsUrls.length}`
                set({ downloadProgress })
                if (continueDownloading) {
                    const newPdfUri = await downloadPdf(pdfsUrls[i], `jagranpdf${i}.pdf`)
                    if (newPdfUri) {
                        const fileExists = await RNFS.exists(newPdfUri.replace('file://', '')); // remove file:// prefix for RNFS
                        if (fileExists) {
                            pdfUris.push(newPdfUri);
                            set({ pagesDownloadedCount: i + 1 })
                        }
                    }
                }
            }
        }

        if (item.url.includes("https://economictimes")) {
            const jsonUrl = `https://asset.harnscloud.com/PublicationData/ET/${item.edition}/${date.year}/${date.month}/${date.day}/DayIndex/${date.day}_${date.month}_${date.year}_${item.edition}.json`;

            set({ requiredJs: getInjectedJsForToi(jsonUrl) })
        }

        if (item.url.includes("prabhatkhabar")) {
            set({ data: {} })
            const requiredUrl = `https://epaper.prabhatkhabar.com/api/published-editions/slug/${item.edition}/${date.year}-${date.month}-${date.day}`
            const pdfsUrls = await handlePrabhatKhabar(requiredUrl)

            for (let i = 0; i < pdfsUrls.length; i++) {
                const { continueDownloading } = get()
                const downloadProgress = `Downloading page ${i + 1}  ${i + 1}/${pdfsUrls.length}`
                set({ downloadProgress })
                if (continueDownloading) {
                    const newPdfUri = await downloadPdf(pdfsUrls[i], `prabhatkhabar${i + 1}.pdf`)
                    if (newPdfUri) {
                        const fileExists = await RNFS.exists(newPdfUri.replace('file://', '')); // remove file:// prefix for RNFS
                        if (fileExists) {
                            pdfUris.push(newPdfUri)
                            set({ pagesDownloadedCount: i + 1 })
                        }
                    }
                }
            }
        }

        if (pdfUris.length > 0) {

            const downloadProgress = `Merging ${pdfUris.length} pages`
            set({ downloadProgress });
            try {
                const outputPath = `${RNFS.DocumentDirectoryPath}/merged.pdf`;

                const mergedPath = await MyNativeModule.mergePdfs(
                    pdfUris,
                    outputPath
                );

                set({ pdfUri: mergedPath });

            } catch (error) {
                console.error("Failed to merge PDFs:", error);
                set({ downloadProgress: "Merge failed" });
            }

        } else {

            set({ downloadProgress: "No PDFs to merge" });
        }


    },
    handleWebViewResponse: async () => {

        const { MyNativeModule } = NativeModules;
        const { item, data } = get()
        if (!item) return;
        const date = getRequiredDate(item);


        const pdfUris: string[] = []


        if (item.url.includes("indiatimes")) {


            const pages = data.DayIndex;
            const headers = {
                Referer: "https://bcclepaper.indiatimes.com/",
                "User-Agent": "Mozilla/5.0",
            };

            for (let i = 0; i < pages.length; i++) {

                const { continueDownloading } = get()
                const page = pages[i];
                if (continueDownloading) {
                    const downloadProgress = `Downloading ${page.PageName}  ${i + 1}/${pages.length}`
                    set({ downloadProgress })

                    const imageUrl = `https://asset.harnscloud.com/PublicationData/TOI/${item.edition}/${date.year}/${date.month}/${date.day}/Page/${page.PageName}.jpg`;
                    const newPdfUri = await downloadImageToPdf(imageUrl, headers, `${page.PageName}.pdf`);
                    if (newPdfUri) {
                        const fileExists = await RNFS.exists(newPdfUri.replace('file://', ''));
                        if (fileExists) {
                            pdfUris.push(newPdfUri)
                            set({ pagesDownloadedCount: i + 1 })
                        }
                    }
                }


            }
        }

        if (item.url.includes("https://economictimes")) {
            const pages = data.DayIndex;

            const headers = {
                Referer: "https://bcclepaper.indiatimes.com/",
                "User-Agent": "Mozilla/5.0",
            };

            for (let i = 0; i < pages.length; i++) {

                const { continueDownloading } = get()
                const page = pages[i];
                if (continueDownloading) {
                    const downloadProgress = `Downloading ${page.PageName}  ${i + 1}/${pages.length}`
                    set({ downloadProgress })
                    const imageUrl = `https://asset.harnscloud.com/PublicationData/ET/${item.edition}/${date.year}/${date.month}/${date.day}/Page/${page.PageName}.jpg`;
                    const newPdfUri = await downloadImageToPdf(imageUrl, headers, `${page.PageName}.pdf`);
                    if (newPdfUri) {

                        const fileExists = await RNFS.exists(newPdfUri.replace('file://', ''));
                        if (fileExists) {
                            pdfUris.push(newPdfUri)
                            set({ pagesDownloadedCount: i + 1 })
                        }

                    }
                }


            }
        }

        if (pdfUris.length > 0) {
            const downloadProgress = `Merging ${pdfUris.length} pages`
            set({ downloadProgress });
            try {
                const outputPath = `${RNFS.DocumentDirectoryPath}/merged.pdf`;

                const mergedPath = await MyNativeModule.mergePdfs(
                    pdfUris,
                    outputPath
                );

                set({ pdfUri: mergedPath });

            } catch (error) {
                console.error("Failed to merge PDFs:", error);
                set({ downloadProgress: "Merge failed" });
            }

        } else {

            set({ downloadProgress: "No PDFs to merge" });
        }

    },
    setData: (data) => {
        set({ data })
        const { handleWebViewResponse } = get()
        handleWebViewResponse();
    },
    setCurrentPage: (p) => set({ currentPage: p }),
    stopDownload: () => {
        set({ continueDownloading: false })
    },
    resetStore: () => {
        set({
            pagesDownloadedCount: 0,
            currentPage: 1,
            pdfUri: undefined,
            downloadProgress: "Downloading ... 0/0",
            requiredJs: "",
            requiredUrl: "https://epaper.indiatimes.com/",
            data: "",
            item: undefined,
            continueDownloading: true,
        });
    },

}));