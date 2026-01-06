import { FlatList, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import TopBar from './widgets/TopBar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { DownloadsStore } from '../../utils/Store'
import DownloadItemView from './widgets/DownloadItem'


export default function DownloadsScreen() {
    const navigation = useNavigation<navStack>();
    const { totalDownloads } = DownloadsStore();
    return (
        <SafeAreaView style={styles.root}>
            <TopBar onLensPress={() => navigation.navigate("SearchScreen")} onBackPress={() => navigation.goBack()} />
            <FlatList
                data={totalDownloads}
                keyExtractor={(item) => item.video.videoId}
                renderItem={({ item }) => <DownloadItemView onMenuPress={() => console.log(item)} item={item} onItemPress={() => navigation.navigate("OfflinePlayer", { item })} />}
                contentContainerStyle={{
                    marginTop: 10,
                    paddingHorizontal: 10,
                    gap: 12
                }}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    root: {
        paddingTop: 10,
        paddingVertical: 10
    }
})