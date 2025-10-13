import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import Icon from "react-native-vector-icons/Ionicons";
import ActionButtons from './ActionButtons';
import ChannelDetails from './ChannelDetails';

type Props={
    title:string,
    viewsAndUploaded:string,
    channelName:string,
    channelPhoto:string,
    onDownloadPress:()=>void

}
export default function VideoDetails({title,viewsAndUploaded,channelName,channelPhoto,onDownloadPress}:Props) {
    return (
        <View style={styles.root}>
            <View style={styles.title}>
                <Text style={{ fontFamily: "Roboto-Medium", fontSize: 18 }}
                    numberOfLines={3}
                    ellipsizeMode="tail">
                    {title}
                </Text>
                <TouchableOpacity>
                    <Icon name="chevron-down" size={28} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.uploadDetails}>
                <View style={styles.firstHasTag}>
                    <Text style={{ fontFamily: "Roboto-Medium", fontSize: 14, color: "#6C6C6C" }}>
                        {viewsAndUploaded}
                    </Text>
                    <Text style={{ fontFamily: "Roboto-Medium", fontSize: 14, color: "#068BFF" }}>
                        #shirat
                    </Text>
                </View>
                <Text style={{ fontFamily: "Roboto-Medium", fontSize: 14, color: "#068BFF" }}>
                    #shirat @Hzmohummad(s) #islamic
                </Text>

            </View>
            <ActionButtons onDownloadPress={()=>onDownloadPress()} />
            <ChannelDetails channelName={channelName} channelPhoto={channelPhoto}/>

            <View style={styles.commentBlock}>

                <View style={styles.cmt}>

                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14 }}>
                        Comments

                    </Text>
                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14, color: "#6C6C6C" }}>
                        149
                    </Text>

                </View>

                <TouchableOpacity>
                    <Image source={require("../../../assets/expand.png")} style={styles.expnad} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    title: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center", // keeps chevron vertically centered
        paddingRight: 30

    }
    ,
    uploadDetails: {

    }
    ,
    commentBlock: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    }
    ,
    cmt: {
        flexDirection: "row",
        gap: 10
    }
    ,
    root: {
        paddingHorizontal: 10,

    }
    ,
    expnad: {
        height: 20,
        width: 15,

    }
,
    firstHasTag: {
        flexDirection:"row",
        gap:5
    }
  })