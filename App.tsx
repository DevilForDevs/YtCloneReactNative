import React, { useEffect, useState } from 'react';
import { StyleSheet, NativeEventEmitter } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import RNFS from 'react-native-fs';
import { SQLiteDatabase } from 'react-native-sqlite-storage';

import SplashScreen from './screens/SplashScreen/SplashScreen';
import LoginScreen from './screens/LoginScreen/LoginScreen';
import BrowserScreen from './screens/BrowserScreen/BrowserScreen';
import BottomNav from './screens/BottomNav/BottomNav';
import VideoPlayerScreen from './screens/VideoPlayerScreen/VideoPlayerScreen';
import ShortsPlayer from './screens/ShortsPlayer/ShortsPlayer';
import DownloadsScreen from './screens/DownloadsScreen/DownloadsScreen';

import {
  initDB,
  createDownloadsTable,
  loadDownloads,
} from './utils/dbfunctions';

import { DownloadsStore } from './utils/Store';
import { Video, DownloadItem } from './utils/types';
import { convertBytes } from './utils/Interact';

const Stack = createNativeStackNavigator<RootStackParamList>();
const eventEmitter = new NativeEventEmitter();

export default function App() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const { addDownloadItem, updateItem, totalDownloads } = DownloadsStore();

  /* ---------------- DOWNLOAD PROGRESS LISTENER ---------------- */
  useEffect(() => {
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

  /* ---------------- RESTORE DOWNLOADS FROM DB ---------------- */
  useEffect(() => {
    restoreDownloads();
  }, []);

  async function restoreDownloads() {
    if (db || totalDownloads.length > 0) return;

    const dbInstance = await initDB();
    await createDownloadsTable(dbInstance);
    setDb(dbInstance);

    const items = await loadDownloads(dbInstance);

    for (const item of items) {
      const fileSize = await getFileSize(item.folder, item.title);

      const video: Video = {
        videoId: item.videoId,
        title: item.title,
        views: item.folder === 'movies' ? 'Video' : 'Audio',
        type: 'video',
        duration: item.duration,
      };

      const downloadItem: DownloadItem = {
        video,
        speed: 'Finished',
        isFinished: true,
        isStopped: false,
        transferInfo: convertBytes(fileSize),
        progressPercent: 100,
        message: 'Finished',
      };

      addDownloadItem(downloadItem, 0);
    }
  }

  /* ---------------- FILE SIZE HELPER ---------------- */
  async function getFileSize(folder: string, fileName: string) {
    try {
      const baseDir =
        folder === 'movies'
          ? `${RNFS.ExternalStorageDirectoryPath}/Movies`
          : `${RNFS.ExternalStorageDirectoryPath}/Music`;

      const path = `${baseDir}/${fileName}`;

      if (!(await RNFS.exists(path))) return 0;

      const stats = await RNFS.stat(path);
      return Number(stats.size);
    } catch (e) {
      console.warn('File size error:', e);
      return 0;
    }
  }

  /* ---------------- NAVIGATION ---------------- */
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SplashScreen"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="BrowserScreen" component={BrowserScreen} />
          <Stack.Screen name="BottomNav" component={BottomNav} />
          <Stack.Screen name="VideoPlayerScreen" component={VideoPlayerScreen} />
          <Stack.Screen name="ShortsPlayerScreen" component={ShortsPlayer} />
          <Stack.Screen name="DownloadsScreen" component={DownloadsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});
