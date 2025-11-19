import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getChats } from '@/services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useSocket } from '@/hooks/useSocket';
import { useTheme } from '@/hooks/useTheme';
import { 
  CallsIcon, 
  CallsFilledIcon, 
  ContactsIcon, 
  ContactsFilledIcon, 
  ChatsIcon, 
  ChatsFilledIcon, 
  SettingsIcon, 
  SettingsFilledIcon 
} from '@/components/icons/tab-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { colors, isDark } = useTheme();
  const [totalUnreadCount, setTotalUnreadCount] = React.useState(0);
  const { socket, isConnected } = useSocket();

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

  // Listen for socket events to update badge count in real-time
  React.useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = () => {
      console.log('📩 New message received, updating badge count...');
      fetchUnreadCount();
    };

    const handleMessageRead = () => {
      console.log('👁️ Messages marked as read, updating badge count...');
      fetchUnreadCount();
    };

    // Listen for new messages and read events
    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('messages_read', handleMessageRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('messages_read', handleMessageRead);
    };
  }, [socket, isConnected, fetchUnreadCount]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? colors.tabIconSelected : colors.accent,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.footerTabBackground,
          height: 100,
          paddingHorizontal: 4,
          paddingTop: 3,
          paddingBottom: 2,
          borderTopWidth: 0.33,
          borderTopColor: colors.borderLight,
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
          fontWeight: '600',
          marginTop: 6,
        },
        tabBarInactiveTintColor: colors.tabIconDefault,
      }}
      initialRouteName="chat">
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconWrapper,
              isDark && focused && { backgroundColor: colors.accent, borderRadius: 20 }
            ]}>
              {focused ? (
                <CallsFilledIcon 
                  width={26} 
                  height={26} 
                  color={isDark ? '#fff' : colors.accent} 
                />
              ) : (
                <CallsIcon 
                  width={26} 
                  height={26} 
                  color={colors.tabIconDefault} 
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconWrapper,
              isDark && focused && { backgroundColor: colors.accent, borderRadius: 20 }
            ]}>
              {focused ? (
                <ContactsFilledIcon 
                  width={26} 
                  height={26} 
                  color={isDark ? '#fff' : colors.accent} 
                />
              ) : (
                <ContactsIcon 
                  width={26} 
                  height={26} 
                  color={colors.tabIconDefault} 
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <View style={[
                styles.iconWrapper,
                isDark && focused && { backgroundColor: colors.accent, borderRadius: 20 }
              ]}>
                {focused ? (
                  <ChatsFilledIcon 
                    width={26} 
                    height={26} 
                    color={isDark ? '#fff' : colors.accent} 
                  />
                ) : (
                  <ChatsIcon 
                    width={26} 
                    height={26} 
                    color={colors.tabIconDefault} 
                  />
                )}
              </View>
              {totalUnreadCount > 0 && (
                <View style={[styles.badge, { 
                  backgroundColor: colors.unreadBadge,
                  borderColor: colors.footerTabBackground 
                }]}>
                  <Text style={[styles.badgeText, { color: colors.unreadBadgeText }]}>
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
            <View style={[
              styles.iconWrapper,
              isDark && focused && { backgroundColor: colors.accent, borderRadius: 20 }
            ]}>
              {focused ? (
                <SettingsFilledIcon 
                  width={26} 
                  height={26} 
                  color={isDark ? '#fff' : colors.accent} 
                />
              ) : (
                <SettingsIcon 
                  width={26} 
                  height={26} 
                  color={colors.tabIconDefault} 
                />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 56,
    height: 40,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 56,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 6,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
