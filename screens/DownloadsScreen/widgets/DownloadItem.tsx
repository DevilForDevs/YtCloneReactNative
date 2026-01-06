import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/Ionicons';
import { Bar } from "react-native-progress";   // ✅ named import
import { DownloadItem } from '../../../utils/types';


type Props = {
    item: DownloadItem,
    onItemPress: () => void,
    onMenuPress: () => void;
}
export default function DownloadItemView({ item, onItemPress, onMenuPress }: Props) {
    const videoId = item.video.videoId
    return (
        <View style={styles.root}>

            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }}
                    style={styles.image}
                />

                <Text style={styles.floatingDuration}>{item.video.duration}</Text>
            </View>

            <TouchableOpacity onPress={() => onItemPress()}>

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

                        <TouchableOpacity onPress={onMenuPress}>
                            <Icon name="ellipsis-vertical" size={22} color="black" />
                        </TouchableOpacity>
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



                </View>
            </TouchableOpacity>

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
        height: 90,
        width: 160
    }
    ,
    root: {
        flexDirection: 'row',
        gap: 10,
        alignItems: "center"
    }
    ,
    tileAndMore: {
        flexDirection: "row",
    }
    ,
    info: {
        gap: 2,
        marginBottom: 5
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

})