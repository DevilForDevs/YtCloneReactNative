import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import Icon from "react-native-vector-icons/Ionicons";
export default function TopConrols() {
    return (
        <View style={styles.topControls}>
            <TouchableOpacity>
                <Icon name="chevron-down" size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.rightIcons}>

                <TouchableOpacity>
                    <Image source={require("../../../assets/autoPlay.png")} style={styles.autoPlay} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Image source={require("../../../assets/cast.png")} style={styles.topIcon} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Image source={require("../../../assets/caption.png")} style={styles.topIcon} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Image source={require("../../../assets/threedot.png")} style={styles.topIcon} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    topControls: {
        position: "absolute",
        top: 10,
        left: 0,
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        zIndex: 10
    }
    ,
    rightIcons: {
        flexDirection: "row",
        gap: 10
    },
    topIcon: {
        height: 25,
        width: 28
    }
    ,
    autoPlay: {
        height: 25,
        width: 35
    }
})