import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import TopBar from '../HomeScreen/widgets/TopBar/TopBar'
import { SafeAreaView } from 'react-native-safe-area-context'
import HistoryItem from './widgets/HistoryItem'
import MenuItem from './widgets/MenuItem'
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from '../../App'
import { useNavigation } from '@react-navigation/native'

type navStack = NativeStackNavigationProp<
  RootStackParamList,
  "SearchScreen"
>;

export default function SavedScreen() {
  
  const navigation = useNavigation<navStack>();

  return (
    <SafeAreaView style={styles.root}>
      <TopBar onLensPress={() => console.log("lens clicked")} />
      <HistoryItem />
      <View style={styles.horizontalLine} />

      <MenuItem showCheck={false} icon='history' title='History' subtitle='' onItemClick={() => console.log("ranjan")} />
      <MenuItem showCheck={false} icon='yourVideo' title='Your Videos' subtitle='' onItemClick={() => console.log("ranjan")} />
      <MenuItem showCheck={true} icon='downloads' title='Downloads' subtitle='67 videos' onItemClick={() =>navigation.navigate("DownloadsScreen")} />
      <MenuItem showCheck={false} icon='yourMovies' title='Your Movies' subtitle='' onItemClick={() => console.log("ranjan")} />
      <MenuItem showCheck={false} icon='watchLater' title='Watch Later' subtitle='4 unwatched  videos' onItemClick={() => console.log("ranjan")} />
      <View style={styles.horizontalLine} />

      <View style={styles.playlistHeader}>
        <Text style={styles.playlist}>Playlist</Text>
        <View style={styles.downchev}>
          <Text style={{ color: "#0A0A0A", fontFamily: "Roboto-Regular", fontSize: 15 }}>Recently added</Text>
          <Icon name='chevron-down' size={24} />
        </View>
      </View>

      <View style={styles.np}>
        <Icon name='add' size={24} color={"#068BFF"} />
        <Text style={styles.newp}>New Playlist</Text>
      </View>

      <View style={styles.lkv}>
        <Image source={require("../../assets/beach.png")} style={{ height: 50, width: 60 }} />
        <View>
          <Text style={styles.lv}>Liked Videos</Text>
          <Text style={styles.noVideos}>60 videos</Text>
        </View>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 10,
    paddingHorizontal: 10
  },
  horizontalLine: {
    backgroundColor: "#CECECE",
    height: 1,
    marginBottom: 10,
    marginTop: 10
  }
  ,
  playlistHeader: {
    flexDirection: "row",
    justifyContent: "space-between"
  }
  ,
  downchev: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  }
  ,
  playlist: {
    fontFamily: "Roboto-Medium",
    fontSize: 18
  }
  ,
  newp: {
    color: "#068BFF",
    fontFamily: "Roboto-Medium",
    fontSize: 16
  }
  ,
  np: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  }
  ,
  lv: {
    fontFamily: "Roboto-Medium",
    fontSize: 16
  }
  ,
  noVideos: {
    color: "#6C6C6C"
  }
  ,
  lkv: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  }
})