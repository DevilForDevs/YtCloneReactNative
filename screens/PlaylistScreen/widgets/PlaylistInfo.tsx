import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/Ionicons';
import IconMat from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PlaylistMetadata } from '../../../utils/playlistParser';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BottomNav">;


type Props = {
    info: PlaylistMetadata,
    onClickPlay: () => void;
    onChannelClick: () => void;
}

export default function PlaylistInfo({ info, onClickPlay, onChannelClick }: Props) {
    const navigation = useNavigation<NavigationProp>();
    const assetsFolder = "../../../assets"
    return (
        <View style={styles.root}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.navigate("BottomNav")}>
                    <Icon name="arrow-back" size={26} color="black" />
                </TouchableOpacity>
                <View style={styles.otherIcons}>
                    <Image style={styles.cstIcon} source={require(`${assetsFolder}/topRightIcons/cast.png`)} />

                    <TouchableOpacity onPress={() => console.log("ranjan")}>
                        <Image style={styles.smIcons} source={require(`${assetsFolder}/topRightIcons/lens.png`)} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate("BottomNav")}>
                        <Icon name="ellipsis-vertical" size={22} color="black" />
                    </TouchableOpacity>

                </View>
            </View>
            <View style={styles.imgWrapper}>
                <Image style={styles.banner} source={{ uri: info.heroImage }} />
            </View>
            <Text style={{
                fontFamily: "Roboto-Medium",
                fontSize: 18,
                marginTop: 8
            }}>
                {info.title}
            </Text>
            <View style={styles.channelInfo}>
                <TouchableOpacity onPress={onChannelClick}>
                    <Image style={styles.channelPhoto} source={{ uri: info.channelAvatar }} />
                </TouchableOpacity>
                <Text style={{
                    fontSize: 15
                }}>{info.createdBy}</Text>
            </View>
            <Text style={{
                marginTop: 5,
                alignItems: "center"
            }}>
                Playlist • {info.info1}• {info.info2}
            </Text>
            <Text style={{
                marginTop: 5
            }}>
                Description
            </Text>
            <View style={styles.downloadButton}>
                <TouchableOpacity onPress={onClickPlay}>
                    <IconMat name="play" size={24} color="red" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <IconMat name="download" size={24} color="red" />
                </TouchableOpacity>


            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        marginTop: 20
    },
    otherIcons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    }
    ,
    smIcons: {
        height: 28,
        width: 28
    }
    ,
    cstIcon: {
        height: 22,
        width: 22
    }
    ,
    logoCast: {
        flexDirection: "row",
        justifyContent: "space-between"
    }
    ,
    topBar: {
        justifyContent: "space-between",
        flexDirection: "row"
    }
    ,
    banner: {
        height: 180,

    }
    ,
    imgWrapper: {
        marginTop: 10
    }
    ,
    channelPhoto: {
        height: 40,
        width: 40,
        borderRadius: 20
    }
    ,
    channelInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5
    }
    ,
    downloadButton: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10
    }
})