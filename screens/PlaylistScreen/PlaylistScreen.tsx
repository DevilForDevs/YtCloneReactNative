import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlaylistInfo from './widgets/PlaylistInfo'
import PlaylistItemView from './widgets/PlaylistItemView'
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from '../../App'
type NavigationProp = RouteProp<
    RootStackParamList,
    "PlaylistScreen"
>;

export default function PlaylistScreen() {
    const route = useRoute<NavigationProp>();
    const { playlistlink } = route.params;
    console.log(playlistlink);

    async function fetchPlaylistInfo() {

    }
    
    return (
        <SafeAreaView style={styles.root}>
            <PlaylistInfo />

            <View style={{
                backgroundColor:"red",
                width:80,
                paddingVertical:5,
                paddingHorizontal:5,
                borderRadius:10,
                justifyContent:"center",
                alignItems:"center"
            }}>
                <Text>Retry</Text>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    root: {
        paddingHorizontal: 10
    }
})