import React, { useEffect } from "react";
import { StyleSheet, Text, View, Button, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVideoStore } from "../../utils/Store";
import { Video, ShortVideo } from "../../utils/types";
import TopBar from "./widgets/TopBar/TopBar";
import { useNavigation } from "@react-navigation/native";
import Menu from "./widgets/TopBar/widgets/Menu";
import ShortsHeader from "./widgets/ShortsHeader/ShortsHeader";
import VideoItemView from "./widgets/VideoItemView/VideoItemView";
import ShortsItemView from "./widgets/ShortsItemView/ShortsItemView";
import { useAskFormat } from "../AskFormatContext";

export default function HomeScreen() {
  const navigation = useNavigation<navStack>();
  const {
    totalVideos,
    addVideo,
    clearVideos,
  } = useVideoStore();
  const { openAskFormat } = useAskFormat();
  return (
    <View style={styles.root}>
      <TopBar onLensPress={() => navigation.navigate("SearchScreen")} />
      <FlatList
        data={totalVideos}
        keyExtractor={(_, index) => index.toString()}
        ListHeaderComponent={<Menu />}
        renderItem={({ item, index }) =>
          item.type === "video" ? (
            <VideoItemView item={item} progress={0} onItemPress={() => navigation.navigate("VideoPlayerScreen", { arrivedVideo: item })} onDownload={() => openAskFormat(item)} />
          ) : (
            <View style={styles.shortParentContainer}>
              <ShortsHeader />
              <FlatList
                data={item.videos}
                horizontal
                keyExtractor={(short) => short.videoId}
                renderItem={({ item: short }) => (
                  <ShortsItemView item={short} onItemPress={() => navigation.navigate("ShortsPlayerScreen", { arrivedVideo: short })} />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shortsContainer}
              />

            </View>
          )
        }
        contentContainerStyle={{ gap: 10, marginTop: 10 }}

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
});
