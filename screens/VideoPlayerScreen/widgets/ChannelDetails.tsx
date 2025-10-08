import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'

type Props={
    channelName:string,
    channelPhoto:string
}
export default function ChannelDetails({channelName,channelPhoto}:Props) {
    return (
        <View style={styles.channelBlock}>
            <View style={styles.channelDetail}>
                <View>
                    <Image source={{uri:channelPhoto}} style={styles.channelPhoto} />

                </View>
                <View>
                    <Text style={{ fontFamily: "Roboto-Medium", fontSize: 16 }}>
                        {channelName}
                    </Text>
                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14, color: "#6C6C6C" }}>
                        289K subscribers
                    </Text>
                </View>
            </View>
            <TouchableOpacity>
                <Text style={{ fontFamily: "Roboto-Medium", fontSize: 16, color: "red" }}>
                    SUBSCRIBE
                </Text>
            </TouchableOpacity>

        </View>
    )
}

const styles = StyleSheet.create({
    channelBlock: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom:10,
        paddingHorizontal:10,
        alignItems:"center"

    }
    ,
    channelPhoto: {
        height: 50,
        width: 50,
        borderRadius:50
    }
    ,
    channelDetail: {
        flexDirection: "row",
        gap:10
    }
})