import { StyleSheet, Text, View, FlatList } from 'react-native'
import React, { useState } from 'react'

import { RootStackParamList } from "../../App";
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Player from '../VideoPlayerScreen/widgets/Player';
import { DownloadsStore } from '../../utils/Store';
import RNFS from 'react-native-fs';
import DownloadItemView from '../DownloadsScreen/widgets/DownloadItem';
type NavigationProp = RouteProp<
    RootStackParamList,
    "OfflinePlayer"
>;

export default function OfflinePlayer() {
    const route = useRoute<NavigationProp>();
    const { downloadIndex } = route.params;
    const { totalDownloads } = DownloadsStore();
   

    var localFile = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    const [showFlatList, setFlatList] = useState(true)

    if (totalDownloads[downloadIndex].message == "Video"||totalDownloads[downloadIndex].message == "Finished") {
        const movieDir = RNFS.ExternalStorageDirectoryPath + '/Movies';
       localFile = `${movieDir}/${totalDownloads[downloadIndex].video.title}`;
    } else {
        //dont play here its audio file
    }

    const toggleFlatList = () => {

        if (showFlatList) {
            setFlatList(false)
        } else {
            setFlatList(true)
        }

    }

    return (
        <SafeAreaView style={styles.container}>

            <Player url={localFile} toggleFlatList={toggleFlatList} videoId={localFile} />
            {
                showFlatList ?
                    <FlatList
                        data={totalDownloads}
                        keyExtractor={(item) => item.video.videoId}
                        renderItem={({ item }) => <DownloadItemView item={item} onItemPress={() => console.log("ranjna")} />}
                        contentContainerStyle={{
                            marginTop: 15,
                            paddingHorizontal: 10,
                            gap: 12
                        }}
                    />
                    : <View />
            }

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})