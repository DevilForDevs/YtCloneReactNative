import { Image, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { Video } from '../../../../utils/types';

type Props = {
  item: Video;
  onItemPress: () => void;
  progress: number;
  onDownload: () => void;
  
};

export default function VideoItemView({
  item,
  onItemPress,
  progress,
  onDownload,
}: Props) {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible((prev) => !prev);

  const handleOptionClick = (callback: () => void) => {
    callback();
    setMenuVisible(false);
  };

  return (
    <View style={styles.root}>
      <TouchableOpacity onPress={onItemPress}>
        <Image
          source={{ uri: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` }}
          style={styles.img}
        />
      </TouchableOpacity>

      {progress > 0 && (
        <>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.floatingDuration}>{item.duration}</Text>
        </>
      )}

      <View style={styles.info}>
        <Image source={{ uri: item.channel }} style={styles.profile} />

        <View style={styles.rightSection}>
          <View style={styles.titleRow}>
            <Text
              style={{ fontFamily: 'Roboto-Medium', fontSize: 16 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>

            <TouchableOpacity style={styles.vertMore} onPress={toggleMenu}>
              <Icon name="more-vert" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          <Text
            style={{ fontFamily: 'Roboto-Medium', fontSize: 15, color: '#6C6C6C' }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.views} • {item.publishedOn}
          </Text>
        </View>
      </View>

      {menuVisible && (
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleOptionClick(onDownload)}
          >
            <Text>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            
          >
            <Text>Add to Playlist</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
           
          >
            <Text>Subscribe</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 20,
    position: 'relative',
  },
  img: {
    height: 200,
    width: '100%',
    resizeMode: 'cover',
  },
  profile: {
    height: 42,
    width: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  info: {
    marginTop: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rightSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 15,
  },
  vertMore: {
    marginRight: 10,
  },
  floatingDuration: {
    position: 'absolute',
    backgroundColor: 'white',
    paddingHorizontal: 5,
    borderRadius: 3,
    bottom: 85,
    right: 10,
  },
  progressBackground: {
    backgroundColor: '#ddd',
    height: 2,
    width: '100%',
  },
  progressFill: {
    backgroundColor: 'red',
    height: 2,
  },
  menuCard: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    elevation: 5, // shadow for Android
    shadowColor: '#000', // shadow for iOS
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 999,
  },
  menuItem: {
    paddingVertical: 6,
  },
});


// 19,210,251 viewsJul • 1, 2016
