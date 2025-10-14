import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/Ionicons';
export default function PlaylistItemView() {
    return (
        <View style={styles.root}>
            <View style={styles.imageWrapper}>
                <Image source={{ uri: `https://img.youtube.com/vi/39f9IfQgQAA/hqdefault.jpg` }} style={styles.image} />
                <Text style={styles.floatingDuration}>4:50</Text>
            </View>
            <View style={styles.info}>
                <View style={styles.top}>
                    <Text style={{
                        fontFamily: "Roboto-Regular",
                        fontSize: 16,
                    }}>videotitle</Text>
                    <TouchableOpacity onPress={() => console.log("ranjan")}>
                        <Icon name="ellipsis-vertical" size={22} color="black" />
                    </TouchableOpacity>
                </View>
                <Text style={{
                    fontFamily: "Roboto-Regular",
                    fontSize: 14,
                    color: "#6C6C6C"
                }}>ChannelName</Text>
                <Text style={{
                    fontFamily: "Roboto-Regular",
                    fontSize: 14,
                    color: "#6C6C6C"
                }}>views updated</Text>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    image: {
        height: 80,
        width: 120,
        borderRadius: 10
    }
    ,
    imageWrapper: {
        height: 80,
        width: 120,
    },
    floatingDuration: {
        position: "absolute",
        bottom: 5,
        right: 5,
        backgroundColor: "rgba(10, 10, 10, 0.4)",
        borderRadius: 5,
        color: "white",
        paddingHorizontal: 5
    }
    ,
    root: {
        flexDirection: "row",
        flex: 1,
        gap: 5

    }
    ,
    top: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    }
    ,
    info: {
        flex: 1
    }
})