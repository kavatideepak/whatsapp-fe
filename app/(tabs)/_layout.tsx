import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getChats } from '@/services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [totalUnreadCount, setTotalUnreadCount] = React.useState(0);

  // Fetch total unread count
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const response = await getChats();
      if (response && response.data && response.data.chats) {
        // Count how many chats have unread messages (not total unread messages)
        const unreadChatsCount = response.data.chats.filter((chat: any) => {
          return (chat.unreadCount || 0) > 0;
        }).length;
        setTotalUnreadCount(unreadChatsCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch on mount and when tab comes into focus
  React.useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

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
              source={focused ? require('../../assets/images/contacts_filled.png') : require('../../assets/images/contacts.png')}
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
            <View style={styles.iconContainer}>
              <Image 
                source={focused ? require('../../assets/images/chat_filled.png') : require('../../assets/images/chat.png')}
                style={[styles.tabIcon, focused && styles.activeIcon]} 
                resizeMode="contain"
              />
              {totalUnreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Text>
                </View>
              )}
            </View>
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
  iconContainer: {
    width: 32,
    height: 32,
    position: 'relative',
  },
  tabIcon: {
    width: 32,
    height: 32,
  },
  activeIcon: {
    opacity: 1,
    tintColor: '#1A1A1A',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#000',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F3F3',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
