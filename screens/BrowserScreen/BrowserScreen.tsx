import React, { useEffect, useRef } from "react";
import { StyleSheet, View, BackHandler, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import combinedJsCode from "../../utils/rawJs";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useBrowserScreenStore } from "./Store";



type NavigationProp = RouteProp<
  RootStackParamList,
  "BrowserScreen"
>;

export default function BrowserScreen() {
  const navigation = useNavigation<navStack>();
  const webViewRef = useRef<WebView>(null);
  const route = useRoute<NavigationProp>();
  const { name } = route.params;
  const { onMessage, canGoBack, setCanGoBack } = useBrowserScreenStore()


  useEffect(() => {
    if (Platform.OS !== "android") return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // ⛔ prevent screen pop
        }
        return false; // allow navigation stack to handle
      }
    );

    return () => backHandler.remove();
  }, [canGoBack]);



  async function handleJsons(event: any) {
    onMessage(event, () => {
      navigation.navigate("BottomNav");
    })
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
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
          onMessage={handleJsons}
          onNavigationStateChange={(navState) =>
            setCanGoBack(navState.canGoBack)
          }
          style={{ flex: 1 }}
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
