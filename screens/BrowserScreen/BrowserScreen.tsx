

import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { parseYTInitialData } from '../../utils/parseYTInitialData';


export default function BrowserScreen() {
  const webViewRef = useRef(null);

  const chunkBuffers = useRef<Record<string, string[]>>({});

  const combinedJsCode = `
(function () {
  const CHUNK_SIZE = 50000;
  
  // Wait for ReactNativeWebView to be available
  function waitForRNWebView(callback) {
    if (window.ReactNativeWebView) {
      callback();
      return;
    }
    setTimeout(() => waitForRNWebView(callback), 100);
  }
  
  function postInChunks(type, payload) {
    try {
      const jsonString = JSON.stringify(payload);
      const total = Math.ceil(jsonString.length / CHUNK_SIZE);
      
      for (let i = 0; i < total; i++) {
        const chunk = jsonString.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ 
            type, 
            index: i, 
            total, 
            chunk,
            timestamp: Date.now()
          })
        );
      }
      
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ 
          type: type + "_DONE",
          timestamp: Date.now()
        })
      );
    } catch (error) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ 
          type: "ERROR",
          error: error.message,
          timestamp: Date.now()
        })
      );
    }
  }
  
  // 1️⃣ Wait for and send ytInitialData
  function waitForYtData() {
    try {
      // Try different possible names for YouTube's data object
      const ytData = window.ytInitialData || window.ytplayer || window.ytInitialPlayerResponse;
      
      if (ytData) {
        postInChunks("YT_INITIAL_DATA", { 
          data: ytData,
          url: window.location.href,
          title: document.title
        });
        return;
      }
      
      // If not found, check again
      setTimeout(waitForYtData, 500);
    } catch (error) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ 
          type: "YT_DATA_ERROR",
          error: error.message,
          timestamp: Date.now()
        })
      );
    }
  }
  
  // Intercept fetch requests for YouTube API data
  function setupFetchInterceptor() {
    const originFetch = window.fetch;
    
    function fakeFetch(input, init) {
      const req = input instanceof Request ? input : new Request(input, init);
      
      return originFetch(req).then((response) => {
        try {
          const url = response.url;
          const ct = response.headers.get("content-type") || "";
          
          if (
            ct.includes("application/json") &&
            url.includes("/youtubei/v1/")
          ) {
            response.clone().json().then((data) => {
              // Check if data is large enough to chunk
              const jsonStr = JSON.stringify(data);
              if (jsonStr.length > CHUNK_SIZE) {
                postInChunks("YT_FETCH_JSON", {
                  url,
                  data,
                  timestamp: Date.now()
                });
              } else {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({
                    type: "YT_FETCH_JSON",
                    url,
                    data,
                    timestamp: Date.now()
                  })
                );
              }
            }).catch(() => {});
          }
        } catch (_) {}
        
        return response;
      });
    }
    
    fakeFetch.toString = () => originFetch.toString();
    window.fetch = fakeFetch;
  }
  
  // Start everything when ReactNativeWebView is ready
  waitForRNWebView(() => {
    // Send a ready signal
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ 
        type: "SCRIPT_LOADED",
        timestamp: Date.now()
      })
    );
    
    // Setup fetch interceptor
    setupFetchInterceptor();
    
    // Start waiting for YouTube data
    waitForYtData();
    
    // Also listen for page changes (for SPA navigation)
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(waitForYtData, 1000); // Wait for page to load
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
`;


  function handlePayload(type: string, payload: any) {
    switch (type) {
      case "YT_INITIAL_DATA":
        console.log(
          parseYTInitialData(payload.data)
        );
        break;

      case "YT_FETCH_JSON":
        console.log(parseYTInitialData(payload.data));
        break;

      case "SCRIPT_LOADED":
        console.log("WebView script loaded");
        break;

      default:
        console.log("Unknown type:", type);
    }
  }



  const onMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      const { type } = msg;

      // ───────────────────────────────
      // 1️⃣ Chunked messages
      // ───────────────────────────────
      if (msg.chunk !== undefined) {
        if (!chunkBuffers.current[type]) {
          chunkBuffers.current[type] = [];
        }

        chunkBuffers.current[type][msg.index] = msg.chunk;
        return;
      }

      // ───────────────────────────────
      // 2️⃣ Chunk completion
      // ───────────────────────────────
      if (type.endsWith("_DONE")) {
        const baseType = type.replace("_DONE", "");
        const chunks = chunkBuffers.current[baseType];
        if (!chunks) return;

        const fullJson = chunks.join("");
        delete chunkBuffers.current[baseType];

        const payload = JSON.parse(fullJson); // ✅ ONLY place we parse again
        handlePayload(baseType, payload);
        return;
      }

      // ───────────────────────────────
      // 3️⃣ Non-chunked messages
      // ───────────────────────────────
      handlePayload(type, msg);

    } catch (e) {
      console.warn("onMessage parse error", e);
    }
  };





  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://www.youtube.com' }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          injectedJavaScript={combinedJsCode}
          onLoadEnd={() => console.log("loaded")}
          startInLoadingState={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);

          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('HTTP error:', nativeEvent.statusCode);
          }}
          style={{ flex: 1 }}
          allowsFullscreenVideo={true}
          scalesPageToFit={true}
          onMessage={onMessage}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 6,
  },
  floatingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
