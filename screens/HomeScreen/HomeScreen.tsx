import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, NativeModules, ListRenderItem, Pressable } from "react-native";
import { useVideoStore } from "../../utils/Store";
import { ShortVideo, Video, } from "../../utils/types";
import TopBar from "./widgets/TopBar/TopBar";
import { useNavigation } from "@react-navigation/native";
import Menu from "./widgets/TopBar/widgets/Menu";
import ShortsHeader from "./widgets/ShortsHeader/ShortsHeader";
import VideoItemView from "./widgets/VideoItemView/VideoItemView";
import ShortsItemView from "./widgets/ShortsItemView/ShortsItemView";
import { useAskFormat } from "../AskFormatContext";
import { useHomeScreenStore } from "./Store";
import { ActivityIndicator } from "react-native";
export default function HomeScreen() {

  const navigation = useNavigation<navStack>();
  const totalVideos = useVideoStore(s => s.totalVideos);

  const { openAskFormat } = useAskFormat();
  const { isFetchingMore, retryCount, nextBroswe } = useHomeScreenStore();


  const renderItem: ListRenderItem<Video | ShortVideo> = React.useCallback(
    ({ item }) => {
      if (item.type === "video") {
        return (
          <VideoItemView
            onChannelClick={() =>
              navigation.navigate("ChannelScreen", { channelUrl: item.channelUrl ?? "" })
            }
            item={item}
            progress={0}
            onItemPress={() =>
              navigation.navigate("VideoPlayerScreen", {
                arrivedVideo: item,
                playlistId: undefined,
              })
            }
            onDownload={() => console.log("not supported")}
          />
        );
      }

      return (
        <View style={styles.shortParentContainer}>
          <ShortsHeader />
          <FlatList
            data={item.videos}
            horizontal
            keyExtractor={(short) => short.videoId}
            renderItem={({ item: short }) => (
              <ShortsItemView
                item={short}
                onItemPress={() =>
                  navigation.navigate("ShortsPlayerScreen", {
                    arrivedVideo: short,
                  })
                }
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shortsContainer}
          />
        </View>
      );
    },
    []
  );

  return (
    <View style={styles.root}>
      <TopBar onLensPress={() => navigation.navigate("SearchScreen")} />
      <FlatList
        data={totalVideos}
        keyExtractor={(_, index) => index.toString()}
        ListHeaderComponent={<Menu />}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" />
            </View>
          ) : retryCount >= 3 ? (
            <View style={styles.centerState}>
              <Text style={styles.retryText}>Something went wrong</Text>

              <Pressable style={styles.retryBtn} onPress={nextBroswe}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={renderItem}
        contentContainerStyle={{ gap: 10, marginTop: 10 }}
        onEndReached={nextBroswe}
        onEndReachedThreshold={0.5}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: 50,
  },
  shortParentContainer: {
    paddingLeft: 20,
  },
  shortsContainer: {
    gap: 10,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  retryText: {
    color: "#999",
    marginBottom: 12,
    fontSize: 14,
  },

  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#ff0000", // YouTube red 😉
  },

  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

});
