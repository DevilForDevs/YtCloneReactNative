import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { create } from "zustand";
import {
    initDB,
    createDownloadsTable,
    loadDownloads,
} from './utils/dbfunctions';
import { createHistoryTable } from './screens/SavedScreen/backend/dbo';
import { Video, DownloadItem } from './utils/types';
import RNFS from 'react-native-fs';
import { convertBytes } from './utils/Interact';



type AppState = {
    db: SQLiteDatabase,
    loadDownloads: (addToDownload: (item: DownloadItem) => void) => void
}

async function getFileSize(folder: string, fileName: string) {
    try {
        const baseDir =
            folder === 'movies'
                ? `${RNFS.ExternalStorageDirectoryPath}/Movies`
                : `${RNFS.ExternalStorageDirectoryPath}/Music`;

        const path = `${baseDir}/${fileName}`;

        if (!(await RNFS.exists(path))) return 0;

        const stats = await RNFS.stat(path);
        return Number(stats.size);
    } catch (e) {
        console.warn('File size error:', e);
        return 0;
    }
}

export const useAppStore = create<AppState>((set, get) => ({
    db: null,

    loadDownloads: async (addToDownload) => {
        const dbInstance = await initDB();
        await createDownloadsTable(dbInstance);
        await createHistoryTable(dbInstance);
        const items = await loadDownloads(dbInstance);

        for (const item of items) {
            const fileSize = await getFileSize(item.folder, item.title);

            const video: Video = {
                videoId: item.videoId,
                title: item.title,
                views: item.folder === 'movies' ? 'Video' : 'Audio',
                type: 'video',
                duration: item.duration,
            };

            const downloadItem: DownloadItem = {
                video,
                speed: 'Finished',
                isFinished: true,
                isStopped: false,
                transferInfo: convertBytes(fileSize),
                progressPercent: 100,
                message: 'Finished',
            };
            addToDownload(downloadItem);
        }
    }


}));