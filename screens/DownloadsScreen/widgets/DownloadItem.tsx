import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/Ionicons';
import { Bar } from "react-native-progress";   // ✅ named import
import { DownloadItem } from '../../../utils/types';


type Props = {
    item: DownloadItem
}
export default function DownloadItemView({ item }: Props) {
    const videoId = item.video.videoId
    return (
        <View style={styles.root}>

            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                    style={styles.image}
                />

                <Text style={styles.floatingDuration}>0:14</Text>
                <Bar progress={0.5} color='red' height={3} style={styles.pg} borderColor='transparent' />
            </View>

            <View style={styles.info}>

                <View style={styles.tileAndMore}>
                    <Text
                        style={{
                            width: 180,
                            fontFamily: "Roboto-Regular",
                            fontSize: 16,
                        }}
                        numberOfLines={2} // ✅ Number of lines to show before truncating
                        ellipsizeMode="tail" // ✅ Show "..." at the end
                    >
                        {item.video.title}
                    </Text>

                    <Icon name="ellipsis-vertical" size={22} color="black" />
                </View>
                <Text style={{
                    fontFamily: "Roboto-Regular",
                    fontSize: 14,
                    color: "#6C6C6C"
                }}>
                    {item.transferInfo}
                </Text>
                <Text style={{
                    fontFamily: "Roboto-Regular",
                    fontSize: 14,
                    color: "#6C6C6C"
                }}>
                    {item.isFinished ? item.video.views : item.message}

                </Text>
                <Bar progress={item.progressPercent / 100} height={3} />


            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    imageWrapper: {
        height: 90,
        width: 160
    }
    ,
    image: {
        height: 105,
        width: 160
    }
    ,
    root: {
        flexDirection: 'row',
        gap: 10,
        alignItems:"center"
    }
    ,
    tileAndMore: {
        flexDirection: "row",
    }
    ,
    info: {
        gap: 2,
        marginBottom:5
    }
    ,
    floatingDuration: {
        position: "absolute",
        bottom: 5,
        right: 10,
        backgroundColor: "rgba(10, 10, 10, 0.4)",
        borderRadius: 5,
        color: "white",
        paddingHorizontal: 5
    }
    ,
    pg: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: "102%",
    }
})