import { create } from "zustand";
import { updateCouponLog, verifyToken } from "../../utils/EndPoints";
import { ToastAndroid } from "react-native";
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { initDB } from "../../utils/dbfunctions";
import DeviceInfo from "react-native-device-info";
import { videoId } from "../../utils/Interact";
import { Video } from '../../utils/types'

async function createFeautsTable(db: SQLiteDatabase): Promise<void> {
    await db.executeSql(`
        CREATE TABLE IF NOT EXISTS feature_codes (
            id INTEGER PRIMARY KEY,
            userId INTEGER,
            coupanItemId INTEGER,
            code TEXT,
            created_on TEXT,
            fordays INTEGER
        );
    `);
}


async function insertCodes(data: any, database: SQLiteDatabase): Promise<number> {
    try {
        const result = await database.executeSql(
            `INSERT OR REPLACE INTO feature_codes
            (id, userId, coupanItemId, code, created_on, fordays)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                data.id,
                data.userId,
                data.coupanItemId,
                data.coupan_code,
                data.created_on,
                data.fordays
            ]
        );

        console.log("RESULT:", result);

        const insertId = result[0].insertId ?? 0;
        return insertId;
    } catch (err) {
        console.log("SQL ERROR:", err);
        return 0;
    }
}

async function validateStoredCodes(database: SQLiteDatabase): Promise<boolean> {
    try {

        const [result] = await database.executeSql(
            `SELECT * FROM feature_codes`
        );

        if (result.rows.length === 0) {
            return true;
        }

        for (let i = 0; i < result.rows.length; i++) {

            const row = result.rows.item(i);

            const response = await verifyToken(row.code);

            if (response.success) {
                const deviceId = await DeviceInfo.getUniqueId();
                if (response.data.loggedsysid != deviceId) {
                    // remove invalid code
                    await database.executeSql(
                        `DELETE FROM feature_codes WHERE id = ?`,
                        [row.id]
                    );

                    console.log("Removed invalid code:", row.code);
                }
            }
        }
        return true

    } catch (err) {
        console.log("Validation error:", err);
        return false
    }
}

async function getActiveFeatureIds(db: SQLiteDatabase | undefined): Promise<number[]> {
    if (!db) return [];

    const [result] = await db.executeSql("SELECT coupanItemId FROM feature_codes");
    const ids: number[] = [];
    for (let i = 0; i < result.rows.length; i++) {
        ids.push(result.rows.item(i).coupanItemId);
    }
    return ids;
}


type AskFeatureState = {
    acessCodeText: string;
    showSpinner: boolean;
    db: SQLiteDatabase | undefined

    setAccessCodeText: (code: string) => void;
    toggleSpinner: () => void;

    insertAcessCode: (taskfinished: () => void) => Promise<void>;
    initDb: () => void;
    checkValid: (checked: () => void) => void;
    handleYtIntents: (files: SharedFile[], short: (video: Video) => void, video: (video: Video) => void) => void;
};

export const useAskFeatureStore = create<AskFeatureState>((set, get) => ({
    db: undefined,
    acessCodeText: "",
    showSpinner: false,

    setAccessCodeText: (code: string) =>
        set({ acessCodeText: code }),

    toggleSpinner: () =>
        set((state) => ({
            showSpinner: !state.showSpinner
        })),

    insertAcessCode: async (taskfinished) => {
        try {
            set({ showSpinner: true });
            const { acessCodeText, db } = get()
            const coupanData = await updateCouponLog(acessCodeText);

            if (coupanData.success) {
                const data = coupanData.data;
                const insertitem = await insertCodes(data, db);

                set({
                    acessCodeText: "",
                    showSpinner: false
                });

                if (insertitem != 0) {
                    taskfinished()
                } else {
                    ToastAndroid.show("Failed to insert to db", ToastAndroid.SHORT);
                }
            } else {
                ToastAndroid.show(coupanData.message || coupanData.error, ToastAndroid.SHORT);
                set({ showSpinner: false });
            }

        } catch (err) {
            console.log("Insert error:", err);
            set({ showSpinner: false });
        }
    },
    initDb: async () => {

    },
    checkValid: async () => {

        const db = await initDB();
        await createFeautsTable(db);
        set({ db })

        await validateStoredCodes(db)
    },
    handleYtIntents: async (files, short, video) => {
        const db = await initDB();
        set({ db })
        const activeFeatures = await getActiveFeatureIds(db);
        console.log(activeFeatures);
        if (activeFeatures.includes(1)) {
            for (const item of files as SharedFile[]) {
                if (item.weblink) {

                    const ytVideoId = videoId(item.weblink)

                    const requiredVideo: Video = {
                        type: 'video',
                        videoId: ytVideoId,
                        title: '',
                        views: 'NO views',
                    };
                    if (item.weblink.includes("shorts")) {
                        short(requiredVideo);
                        // navigation.navigate("ShortsPlayerScreen", { arrivedVideo: requiredVideo })
                    } else {
                        video(requiredVideo);
                        // navigation.navigate("VideoPlayerScreen", { arrivedVideo: requiredVideo, playlistId: undefined })
                    }
                    break;
                }
            }
        }
    }

}));