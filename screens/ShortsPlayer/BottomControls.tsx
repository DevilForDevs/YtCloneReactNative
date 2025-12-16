import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'

type props = {
  title: string,
  channelName: string,
  channelThumbnail: string
}
export default function BottomControls({ title, channelName, channelThumbnail }: props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.bottomBar}>


        <View style={styles.firstGroup}>
          <View style={styles.channelPhotoContainer}>
            <Image source={{ uri: channelThumbnail }} style={styles.channelPhoto} />
          </View>
          <Text style={styles.channelName}>
            {channelName}
          </Text>
          <View style={styles.subscribeBtn}>
            <Text style={{ color: "white" }}>SUBSCRIBE</Text>
          </View>
        </View>

        <Image source={require("../../assets/shortsIcons/audioWave.png")} style={styles.audioWave} />

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 25,
    left: 20,
    width: "100%"
  }
  ,
  title: {
    color: "white",
    width: 250,
    fontFamily: "Roboto-Medium"
  }
  ,
  channelPhotoContainer: {
    height: 30,
    width: 30
  }
  ,
  channelPhoto: {
    height: 40,
    width: 40
  }
  ,
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-between",
    paddingRight: 35
  }
  ,
  channelName: {
    color: "white",
    marginLeft: 10
  }
  ,
  subscribeBtn: {
    backgroundColor: "red",
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 5
  }
  ,
  audioWave: {
    height: 30,
    width: 30,
  }
  ,
  firstGroup: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  }
})