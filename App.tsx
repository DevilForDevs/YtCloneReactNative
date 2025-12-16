import { StyleSheet, Text, View, Animated, NativeModules } from 'react-native'
import React, { useEffect, useRef, useState, createContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomNav from './BottomNav'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from './screens/SearchScreen/SearchScreen'
import VideoPlayerScreen from './screens/VideoPlayerScreen/VideoPlayerScreen'
import ShortsPlayer from './screens/ShortsPlayer/ShortsPlayer'
import DownloadsScreen from './screens/DownloadsScreen/DownloadsScreen'
import OfflinePlayer from './screens/OfflinePlayer/OfflinePlayer'
import PlaylistScreen from './screens/PlaylistScreen/PlaylistScreen'
import ShortsScreen from './screens/ShortsScreen/ShortsScreen'
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Video } from './utils/types'
import LoginScreen from './screens/LoginScreen/LoginScreen'
import BrowserScreen from './screens/BrowserScreen/BrowserScreen'
export type RootStackParamList = {
  BottomNav: undefined;
  SearchScreen: undefined;
  VideoPlayerScreen: { arrivedVideo: Video };
  ShortsPlayerScreen: { arrivedVideo: Video },
  DownloadsScreen: undefined,
  OfflinePlayer: { downloadIndex: number },
  PlaylistScreen: { playlistlink: string },
  BrowserScreen: undefined;


};



const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {

  const AppStack = () => (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="BrowserScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="BrowserScreen" component={BrowserScreen} />
        <Stack.Screen name="BottomNav" component={BottomNav} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="VideoPlayerScreen" component={VideoPlayerScreen} />
        <Stack.Screen name="ShortsPlayerScreen" component={ShortsPlayer} />
        <Stack.Screen name="DownloadsScreen" component={DownloadsScreen} />
        <Stack.Screen name="OfflinePlayer" component={OfflinePlayer} />
        <Stack.Screen name="PlaylistScreen" component={PlaylistScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )


  const [splashEnded, setSplashEnded] = useState(false)
  const scaleY = useRef(new Animated.Value(1)).current
  const [isLoggedIn, setIsLoggedIn] = useState(false) // ✅ ADD





  useEffect(() => {

    Animated.sequence([
      Animated.timing(scaleY, {
        toValue: 0.1,
        duration: 700,
        useNativeDriver: true
      }),
      Animated.timing(scaleY, {
        toValue: 0.1,
        duration: 700,
        useNativeDriver: true
      })
    ]).start(
      () => {
        setSplashEnded(true)
      }
    )



  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!splashEnded ? (
        // 🔵 SPLASH
        <SafeAreaView style={styles.container}>
          <Animated.Image
            source={require('./assets/Logo.png')}
            resizeMode="contain"
            style={[styles.logo, { transform: [{ scaleY }] }]}
          />
        </SafeAreaView>
      ) : !isLoggedIn ? (
        // 🔐 LOGIN
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      ) : (
        // 🚀 MAIN APP
        <AppStack />
      )}
    </GestureHandlerRootView>
  )


}

const styles = StyleSheet.create({
  logo: {
    width: 140,
    height: 140,
  }
  ,
  container: {
    flex: 1,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center"
  }
})