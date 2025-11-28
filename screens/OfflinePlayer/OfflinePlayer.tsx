import { StyleSheet, Text, View, FlatList } from 'react-native'
import React, { useState, useEffect } from 'react'

import { RootStackParamList } from "../../App";
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Player from '../VideoPlayerScreen/widgets/Player';
import { DownloadsStore } from '../../utils/Store';
import RNFS from 'react-native-fs';
import DownloadItemView from '../DownloadsScreen/widgets/DownloadItem';
import { DownloadItem } from '../../utils/types';

type NavigationProp = RouteProp<
    RootStackParamList,
    "OfflinePlayer"
>;

export default function OfflinePlayer() {
    const route = useRoute<NavigationProp>();
    const { downloadIndex } = route.params;
    const { totalDownloads } = DownloadsStore();

    // Reactive URL
    const [localFile, setLocalFile] = useState(
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    );

    const [showFlatList, setShowFlatList] = useState(true);

    // Set the initial video based on the incoming downloadIndex
    useEffect(() => {
        const item = totalDownloads[downloadIndex];

        if (item.message === "Video" || item.message === "Finished") {
            const movieDir = RNFS.ExternalStorageDirectoryPath + '/Movies';
            setLocalFile(`${movieDir}/${item.video.title}`);
        }
    }, [downloadIndex]);

    const toggleFlatList = () => {
        setShowFlatList(prev => !prev);
    };

    const handleItemClick = (item: DownloadItem) => {
        const movieDir = RNFS.ExternalStorageDirectoryPath + '/Movies';
        const file = `${movieDir}/${item.video.title}`;

        setLocalFile(file);    // 🔥 REACTIVE UPDATE
        console.log("Now playing:", file);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Player
                url={localFile}           // reactive
                toggleFlatList={toggleFlatList}
                videoId={localFile}       // also reactive
            />

            {showFlatList ? (
                <FlatList
                    data={totalDownloads}
                    keyExtractor={(item) => item.video.videoId}
                    renderItem={({ item }) => (
                        <DownloadItemView
                            item={item}
                            onItemPress={() => handleItemClick(item)}
                        />
                    )}
                    contentContainerStyle={{
                        marginTop: 15,
                        paddingHorizontal: 10,
                        gap: 12
                    }}
                />
            ) : (
                <View />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
