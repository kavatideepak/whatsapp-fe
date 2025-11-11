import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, StyleSheet } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A1A1A',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#F3F3F3',
          height: 100,
          paddingHorizontal: 4,
          paddingTop: 3,
          paddingBottom: 2,
          borderTopWidth: 0.33,
          borderTopColor: 'rgba(26, 26, 26, 0.1)',
        },
        tabBarItemStyle: {
          height: 44,
          padding: 0,
        },
        tabBarIconStyle: {
          width: 32,
          height: 32,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'SF Pro Text',
          fontWeight: '500',
        },
        tabBarInactiveTintColor: '#767779',
      }}
      initialRouteName="chat">
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={require('../../assets/images/calls.png')}
              style={[styles.tabIcon, focused && styles.activeIcon]} 
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={require('../../assets/images/contacts.png')}
              style={[styles.tabIcon, focused && styles.activeIcon]} 
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={focused ? require('../../assets/images/chat_filled.png') : require('../../assets/images/chat_filled.png')}
              style={[styles.tabIcon, focused && styles.activeIcon]} 
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={require('../../assets/images/gear.png')}
              style={[styles.tabIcon, focused && styles.activeIcon]} 
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 32,
    height: 32,
  },
  activeIcon: {
    opacity: 1,
    tintColor: '#1A1A1A',
  },
});
