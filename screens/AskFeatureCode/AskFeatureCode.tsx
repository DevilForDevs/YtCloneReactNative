import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useNavigation } from "@react-navigation/native";
import { useAskFeatureStore } from './AskFeatureStore';
import { ToastAndroid } from "react-native";

export default function AskFeatureCode() {
    const navigation = useNavigation<navStack>();
    const { acessCodeText,
        setAccessCodeText,
        insertAcessCode,
        initDb,
        checkValid

    } = useAskFeatureStore()

    async function handleActivate() {
        insertAcessCode(() => {
            ToastAndroid.show("Feature Activated", ToastAndroid.SHORT);
            navigation.navigate("SuggestedSites")
        })

    }

    useEffect(() => {
        initDb()
        checkValid(() => {
        })
    }, [])

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Enter Feature Code</Text>

            <TextInput
                placeholder="Enter feature code"
                value={acessCodeText}
                placeholderTextColor="#000"
                onChangeText={setAccessCodeText}
                style={styles.input}

            />

            <TouchableOpacity style={styles.activateBtn} onPress={handleActivate}>
                <Text style={styles.btnText}>Activate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.navigate("SuggestedSites")}>
                <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20
    },

    title: {
        fontSize: 18,
        marginBottom: 10
    },

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 6,
        marginBottom: 20,
        color: "black"
    },

    activateBtn: {
        backgroundColor: "#4CAF50",
        padding: 14,
        borderRadius: 6,
        alignItems: "center",
        marginBottom: 10
    },

    continueBtn: {
        backgroundColor: "#2196F3",
        padding: 14,
        borderRadius: 6,
        alignItems: "center"
    },

    btnText: {
        color: "#fff",
        fontWeight: "bold"
    }
})