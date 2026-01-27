import { StyleSheet, Text, View, NativeModules } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SarkariResult() {
    const { MyNativeModule } = NativeModules;

    const schema = {
        container: "p.gb-headline a:matchesOwn(.+)",
        title: { attr: "text", required: true },
        url: { attr: "href", required: true }
    }

    async function loadData() {
        try {

            let jsonString: string;

            try {
                jsonString = await MyNativeModule.htmlJsonBridge(
                    "https://sarkariresult.com.cm",
                    JSON.stringify(schema)
                );

            } catch (e) {
                console.error("Native call failed", e);
                return [];
            }



            console.log(JSON.parse(jsonString));
        } catch (e) {
            console.error("Extractor error:", e);
        }
    }



    useEffect(() => {
        loadData()
    }, []);


    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.topVaccancies}>SarkariResult</Text>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',     // horizontal center
    },
    topVaccancies: {
        fontSize: 18,
        fontWeight: '600',
        justifyContent: "center"

    }
})
