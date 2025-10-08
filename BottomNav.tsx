import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './screens/HomeScreen/HomeScreen';
import ShortsScreen from './screens/ShortsScreen/ShortsScreen';
import UploadScreen from './screens/UploadScreen/UploadScreen';
import SubscriptionScreen from './screens/SubscriptionScreen/SubscriptionScreen';
import SavedScreen from './screens/SavedScreen/SavedScreen';

const Tab = createBottomTabNavigator();

export default function BottomNav() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let icon;

          switch (route.name) {
            case 'Home':
              icon = focused
                ? require('./assets/filled/home.png')     // selected icon
                : require('./assets/outlined/home.png');  // default icon
              break;
            case 'Shorts':
              icon = focused
                ? require('./assets/filled/shorts.png')
                : require('./assets/outlined/shorts.png');
              break;
            case 'Upload':
              icon = focused
                ? require('./assets/outlined/create.png')
                : require('./assets/outlined/create.png');
              break;
            case 'Subscriptions':
              icon = focused
                ? require('./assets/filled/subs.png')
                : require('./assets/outlined/subs.png');
              break;
            case 'Library':
              icon = focused
                ? require('./assets/filled/vidlib.png')
                : require('./assets/outlined/vidlib.png');
              break;
          }

          return (
            <Image
              source={icon}
              style={{
                width: size,
                height: size,
                tintColor: color,
                resizeMode: 'contain',
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shorts" component={ShortsScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Subscriptions" component={SubscriptionScreen} />
      <Tab.Screen name="Library" component={SavedScreen} />
    </Tab.Navigator>
  );
}


