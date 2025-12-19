import React, { useRef, useState, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { parseYTInitialData } from "../../utils/parseYTInitialData";
import combinedJsCode from "../../utils/rawJs";
import { useVideoStore } from "../../utils/Store";
import { Video } from "../../utils/types";


export default function BrowserScreen() {
  const navigation = useNavigation<navStack>();
  const webViewRef = useRef<WebView>(null);
  const chunkBuffers = useRef<Record<string, string[]>>({});
  const [webViewAlive, setWebViewAlive] = useState(true);
  const [foundVideos, setFoundVideos] = useState(0);
  const [prevContinuation, setPrevContinuaton] = useState("")
  const {
    addVideo,

  } = useVideoStore();


  function processVideoGroup(videoGroup: any, isInitial = false) {
    const freshShorts: Video[] = [];

    videoGroup.videos.forEach((element: any) => {
      if (!element.video_id) return;

      addVideo({
        type: "video",
        videoId: element.video_id,
        title: element.title ?? "",
        duration: element.duration ?? "",
        views: element.views ?? "null",
        channel: element.channel_photo ?? "",
        publishedOn: "10 years ago",
      });
    });

    videoGroup.shorts.forEach((element: any) => {
      if (!element.video_id) return;

      freshShorts.push({
        type: "video",
        videoId: element.video_id,
        title: element.title ?? "",
        views: element.views ?? "null",
      });
    });

    if (freshShorts.length > 0) {
      addVideo({
        type: "shorts",
        videos: freshShorts,
        videoId: freshShorts[0].videoId,
      });
    }

    setFoundVideos(prev =>
      isInitial ? videoGroup.videos.length : prev + videoGroup.videos.length
    );

    setPrevContinuaton(videoGroup.continuationTokens?.[0] ?? "");
  }

  async function onMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      const { type } = msg;

      // 1️⃣ Chunk handling
      if (msg.chunk !== undefined) {
        chunkBuffers.current[type] ??= [];
        chunkBuffers.current[type][msg.index] = msg.chunk;
        return;
      }

      // 2️⃣ Chunk done
      if (type?.endsWith("_DONE")) {
        const baseType = type.replace("_DONE", "");
        const chunks = chunkBuffers.current[baseType];
        if (!chunks) return;

        delete chunkBuffers.current[baseType];
        const payload = JSON.parse(chunks.join(""));

        if (baseType === "YT_INITIAL_DATA") {
          const videoGroup = parseYTInitialData(payload.data);
          processVideoGroup(videoGroup, true);
        }
        return;
      }

      // 3️⃣ Continuation fetch
      if (type === "YT_FETCH_JSON") {
        const videoGroup = parseYTInitialData(msg.data);
        const nextContinuation = videoGroup.continuationTokens?.[0];

        if (!nextContinuation || nextContinuation === prevContinuation) {
          return;
        }

        processVideoGroup(videoGroup);
      }

    } catch (err) {
      console.warn("WebView message error:", err);
    }
  }

  function goToHomeScreen() {
    navigation.navigate("BottomNav")
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        {webViewAlive && (
          <WebView
            ref={webViewRef}
            source={{ uri: "https://www.youtube.com" }}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            allowsFullscreenVideo
            scalesPageToFit
            injectedJavaScript={combinedJsCode}
            onMessage={onMessage}
            style={{ flex: 1 }}
          />
        )}
        <TouchableOpacity style={[
          styles.fab,
          foundVideos === 0 && { opacity: 0.5 }
        ]}
          disabled={foundVideos === 0} onPress={goToHomeScreen}>
          <Text style={{ fontWeight: "600" }}>
            {`Load ${foundVideos} items in native`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    elevation: 4,
  }
});
