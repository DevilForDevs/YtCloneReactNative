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
export type RootStackParamList = {
  BottomNav: undefined;
  SearchScreen: undefined;
  VideoPlayerScreen: { mindex: number };
  ShortsPlayerScreen: { mindex: number, shortIndex: number },
  DownloadsScreen: undefined

};



const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {

  const [splashEnded, setSplashEnded] = useState(false)
  const scaleY = useRef(new Animated.Value(1)).current

  const { MyNativeModule } = NativeModules;

  const callNative = (arg: any) => {
    MyNativeModule?.someFunction(arg);
  };



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

  return splashEnded ? (

    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={'BottomNav'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="BottomNav" component={BottomNav} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="VideoPlayerScreen" component={VideoPlayerScreen} />
        <Stack.Screen name="ShortsPlayerScreen" component={ShortsPlayer} />
        <Stack.Screen name="DownloadsScreen" component={DownloadsScreen} />
      </Stack.Navigator>
    </NavigationContainer>

  ) : (
    <SafeAreaView style={styles.container}>
      <Animated.Image
        source={require('./assets/Logo.png')}
        resizeMode="contain"
        style={[styles.logo, { transform: [{ scaleY }] }]}
      />
    </SafeAreaView>
  );

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