import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Video } from '../../../../utils/types'

type Props = {
  item: Video,
  onItemPress:()=>void;
}

export default function ({ item,onItemPress }: Props) {
  return (
    <View style={styles.root}>
      <TouchableOpacity onPress={onItemPress}>
        <Image source={{ uri: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` }} style={styles.img} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.vertMore}>
        <Icon name="more-vert" size={22} color="#fff" />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={{ fontFamily: "Roboto-Medium", fontSize: 14, color: "#fff" }}>
          {item.title}
        </Text>

        <Text style={{ fontFamily: "Roboto-Medium", fontSize: 12, color: "#fff" }}>
          {item.views}
        </Text>

      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  img: {
    height: 250,
    width: 160
  }
  ,
  vertMore: {
    position: "absolute",
    right: 5,
    top: 5
  }
  ,
  root: {
    height: 250,
    width: 160
  }
  ,
  info: {
    position: "absolute",
    bottom: 5,
    left: 5
  }
})