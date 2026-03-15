import React, { useEffect } from 'react';
import { NativeEventEmitter } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  BrowserScreen,
  BottomNav,
  VideoPlayerScreen,
  ShortsPlayer,
  DownloadsScreen,
  SearchScreen,
  OfflinePlayer,
  PlaylistScreen,
  ChannelScreen,
  SarkariResult,
  PageDetailsSr,
  SuggestedSites,
  TOI,
  FetchImagesForPdf,
  AskFeatureCode
} from "./screens";

import { useShareIntent } from './ApplevelBackends/shareIntent';
import { DownloadsStore } from './utils/Store';
import { AskFormatProvider } from './screens/AskFormatProvider';
import { navigationRef } from './ApplevelBackends/NavigationRef';

import ExoPlayer2 from './screens/NativeVideoPlayer/NativePlayer';


const Stack = createNativeStackNavigator<RootStackParamList>();
const eventEmitter = new NativeEventEmitter();



export default function App() {
  useShareIntent();
  const { updateItem, loadDownloads } = DownloadsStore();

  useEffect(() => {
    loadDownloads()
    const sub = eventEmitter.addListener('DownloadProgress', data => {
      const { videoId, progress, percent, speed, message } = data;

      updateItem(videoId, {
        transferInfo: progress,
        progressPercent: percent,
        speed,
        message,
      });
    });
    return () => sub.remove();

  }, []);


  /* ---------------- NAVIGATION ---------------- */
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AskFormatProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName="NativePlayer"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="BrowserScreen" component={BrowserScreen} />
            <Stack.Screen name="BottomNav" component={BottomNav} />
            <Stack.Screen name="VideoPlayerScreen" component={VideoPlayerScreen} />
            <Stack.Screen name="ShortsPlayerScreen" component={ShortsPlayer} />
            <Stack.Screen name="DownloadsScreen" component={DownloadsScreen} />
            <Stack.Screen name="SearchScreen" component={SearchScreen} />
            <Stack.Screen name="OfflinePlayer" component={OfflinePlayer} />
            <Stack.Screen name="PlaylistScreen" component={PlaylistScreen} />
            <Stack.Screen name="ChannelScreen" component={ChannelScreen} />
            <Stack.Screen name="SarkariResult" component={SarkariResult} />
            <Stack.Screen name="PageDetailsSr" component={PageDetailsSr} />
            <Stack.Screen name="SuggestedSites" component={SuggestedSites} />
            <Stack.Screen name="TOI" component={TOI} />
            <Stack.Screen name="FetchImagesForPdf" component={FetchImagesForPdf} />
            <Stack.Screen name="AskFeatureCode" component={AskFeatureCode} />
            <Stack.Screen name="NativePlayer" component={ExoPlayer2} />
          </Stack.Navigator>
        </NavigationContainer>
      </AskFormatProvider>
    </GestureHandlerRootView>
  );
}

