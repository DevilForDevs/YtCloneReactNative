import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Video } from '../../../../utils/types'
import { ytThumbs } from '../../../../utils/downloadFunctions'

type Props = {
  item: Video,
  onItemPress: () => void;
}

export default function ({ item, onItemPress }: Props) {

  const [thumb, setThumb] = useState(ytThumbs(item.videoId).hq);
  return (
    <View style={styles.root}>
      <TouchableOpacity onPress={onItemPress}>
        <Image
          source={{ uri: thumb }}
          style={styles.img}
          resizeMode="cover"
          onError={() => setThumb(ytThumbs(item.videoId).mq)}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.vertMore}>
        <Icon name="more-vert" size={22} color="#fff" />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={{ fontFamily: "Roboto-Medium", fontSize: 14, color: "#fff" }}>
          {item.title}
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