import { create } from "zustand";
import { verifyToken } from "../../utils/EndPoints";
import { ToastAndroid } from "react-native";
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { initDB } from "../../utils/dbfunctions";



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
    const insertId = result[0].insertId ?? 0;
    return insertId;
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

            if (!response.success) {

                // remove invalid code
                await database.executeSql(
                    `DELETE FROM feature_codes WHERE id = ?`,
                    [row.id]
                );

                console.log("Removed invalid code:", row.code);
            }
        }
        return true

    } catch (err) {
        console.log("Validation error:", err);
        return false
    }
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
            const coupanData = await verifyToken(acessCodeText);

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
                ToastAndroid.show(coupanData.message, ToastAndroid.SHORT);
                set({ showSpinner: false });
            }

        } catch (err) {
            console.log("Insert error:", err);
            set({ showSpinner: false });
        }
    },
    initDb: async () => {
        const db = await initDB();
        await createFeautsTable(db);
        set({ db })
    },
    checkValid: async () => {
        const { db } = get()
        await validateStoredCodes(db)
    }

}));