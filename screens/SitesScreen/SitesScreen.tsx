import React from 'react'
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

/* ------------------ Types ------------------ */



/* ------------------ Data ------------------ */

const SITES: Site[] = [
    {
        id: 'yt',
        name: 'YouTube',
        url: 'https://www.youtube.com',
        route: 'BrowserScreen',
    },
    {
        id: 'xh',
        name: 'xHamster',
        url: 'https://xhamster1.desi/',
        route: 'BrowserScreen',
    },
    {
        id: 'mp',
        name: 'MetaPorn',
        url: 'https://metaporn.com',
        route: 'BrowserScreen',
    },
    {
        id: 'um',
        name: 'Uncutmaza',
        url: 'https://uncutmaza.com.co/',
        route: 'BrowserScreen',
    }
]

/* ------------------ Screen ------------------ */

export default function SitesScreen() {
    const navigation = useNavigation<navStack>()

    function onSelectSite(site: Site) {
        if (site.name == "YouTube") {
            navigation.navigate("BrowserScreen", { name: "Youtube" });
        } else {
            navigation.navigate("CommanScreen", { site });
        }

    }

    const renderItem = ({ item }: { item: Site }) => (
        <Pressable style={styles.card} onPress={() => onSelectSite(item)}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>{item.url}</Text>
        </Pressable>
    )

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.screenTitle}>Platforms</Text>

            <FlatList
                data={SITES}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    )
}

/* ------------------ Styles ------------------ */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: '700',
        padding: 16,
    },
    list: {
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
})

