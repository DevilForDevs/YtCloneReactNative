import React, { useMemo, useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Pressable,
    TextInput,
    Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

/* ------------------ Types ------------------ */

type Site = {
    id: string
    name: string
    route: string
}

/* ------------------ Data ------------------ */

// Always visible (safe / free)
const SAFE_SITES: Site[] = [
    { id: 'yt', name: 'YouTube', route: 'BrowserScreen' },
]

// Hidden behind access code
const RESTRICTED_SITES: Site[] = [
    { id: 'exp', name: 'Build YouTube Algorithm', route: 'BrowserScreen' },
]

/* ------------------ Screen ------------------ */

export default function SitesScreen() {
    const navigation = useNavigation<any>()

    const [accessCode, setAccessCode] = useState('')
    const [unlocked, setUnlocked] = useState(false)

    /* ---------- Unlock Logic ---------- */

    function handleUnlock() {
        // 🔐 example only — validate from server in real app
        if (accessCode.trim() === '1234') {
            setUnlocked(true)
            setAccessCode('')
        } else {
            Alert.alert('Invalid code', 'Please enter a valid access code.')
        }
    }

    /* ---------- Visible Sites ---------- */

    const visibleSites = useMemo(
        () => (unlocked ? [...SAFE_SITES, ...RESTRICTED_SITES] : SAFE_SITES),
        [unlocked]
    )

    /* ---------- Navigation ---------- */

    function navigateToSite(site: Site) {
        navigation.navigate(site.route, { name: site.name })
    }

    /* ---------- Render Item ---------- */

    const renderItem = ({ item }: { item: Site }) => (
        <Pressable style={styles.card} onPress={() => navigateToSite(item)}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>Available</Text>
        </Pressable>
    )

    /* ------------------ UI ------------------ */

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Text style={styles.screenTitle}>Supported Platforms</Text>
            <Text style={styles.description}>
                Safe platforms are available by default.
            </Text>

            {/* Unlock Section */}
            {!unlocked && (
                <View style={styles.unlockBox}>
                    <Text style={styles.unlockTitle}>
                        Unlock additional platforms
                    </Text>

                    <TextInput
                        value={accessCode}
                        onChangeText={setAccessCode}
                        placeholder="Enter access code"
                        placeholderTextColor="#999"
                        style={styles.input}
                    />

                    <Pressable style={styles.unlockButton} onPress={handleUnlock}>
                        <Text style={styles.unlockButtonText}>Unlock</Text>
                    </Pressable>
                </View>
            )}

            {/* Platforms List */}
            <FlatList
                data={visibleSites}
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
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    description: {
        fontSize: 13,
        color: '#666',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    unlockBox: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 2,
    },
    unlockTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        fontSize: 14,
    },
    unlockButton: {
        backgroundColor: '#111',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    unlockButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 16,
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
