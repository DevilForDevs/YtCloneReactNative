import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/Ionicons';
import { Bar } from "react-native-progress";   // ✅ named import
import { ytThumbs } from '../../../utils/downloadFunctions';

type Props = {
    title: string;
    channelTitle: string;
    duration: string;
    watchedAt: number;
    thumbnail: string;
    onPress: () => void;
};


export default function HistoryItem(props: Props) {
    return (
        <View style={styles.root}>
            <Image source={{ uri: props.thumbnail }} style={styles.img} />
            <Text style={styles.floatingDuration}>{props.duration}</Text>
            <Bar progress={40} color='red' height={2} style={styles.progress} />
            <View>

                <View style={styles.top}>
                    <Text style={styles.title} numberOfLines={2}>{props.title}</Text>
                    <TouchableOpacity>
                        <Icon name="ellipsis-vertical" size={16} color="#555" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.channel}>{props.channelTitle}</Text>

            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    img: {
        height: 80,
        width: 150
    }
    ,
    top: {
        flexDirection: "row",
        marginTop: 5,
        alignItems: "center"
    },
    title: {
        fontFamily: "Roboto-Regular",
        width: 130
    }
    ,
    channel: {
        color: "#6C6C6C",
        fontFamily: "Roboto-Regular",
        fontSize: 12
    }
    ,
    floatingDuration: {
        position: "absolute",
        bottom: "45%",
        right: 7,
        backgroundColor: "rgba(0, 0, 0, 0.64)",
        color: "white",
        paddingVertical: 1,
        paddingHorizontal: 5,
        borderRadius: 5
    }
    ,
    root: {
        width: 150
    }
    ,
    progress: {
        position: "absolute",
        bottom: "40%",
        right: 0,
    }
})

