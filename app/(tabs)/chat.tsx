import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  FlatList, 
  ActivityIndicator,
  Image,
  Pressable
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { TabHeader } from '../../components/tab-header';
import { ChatListItem } from '../../components/chat-list-item';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getChats } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../hooks/useTheme';

interface Chat {
  id: number;
  is_group: boolean;
  group_name?: string;
  group_icon?: string;
  created_at: string;
  Users: Array<{
    id: number;
    name: string;
    profile_pic?: string;
    ChatMember: {
      role: string;
      joined_at: string;
    };
  }>;
  lastMessage?: {
    id: number;
    content: string;
    sent_at: string;
    sender_id: number;
    message_type: string;
    status: string;
    isUnread: boolean;
  } | null;
  unreadCount?: number;
}

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}

const FilterChip = ({ label, isActive, onPress, colors }: FilterChipProps) => (
  <Pressable
    style={[
      styles.chip,
      { backgroundColor: isActive ? colors.bubbleSent : colors.backgroundTertiary }
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.chipText,
        { color: isActive ? colors.buttonPrimaryText : colors.textSecondary }
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

export default function ChatScreen() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = React.useState('All');
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Debug: Log user info
  React.useEffect(() => {
    console.log('👤 Current user:', user ? `ID: ${user.id}, Name: ${user.name}` : 'Not logged in');
  }, [user]);

  // Fetch chats when component mounts
  React.useEffect(() => {
    fetchChats();
  }, []);

  // Refresh chats when screen comes into focus (when returning from chat screen)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Chat screen focused, refreshing chats...');
      fetchChats();
    }, [])
  );

  // Listen for new messages via socket
  React.useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message: any) => {
      console.log('📩 New message received in chat list:', message);
      
      // Update chat list instantly with optimistic update
      setChats(prevChats => {
        const chatIndex = prevChats.findIndex(chat => chat.id === message.chat_id);
        
        if (chatIndex !== -1) {
          // Chat exists - update it
          const updatedChats = [...prevChats];
          const chat = { ...updatedChats[chatIndex] };
          
          // Update last message
          chat.lastMessage = {
            id: message.id,
            content: message.content,
            sent_at: message.sent_at,
            sender_id: message.sender_id,
            message_type: message.message_type,
            status: message.status || 'sent',
            isUnread: message.sender_id !== user?.id
          };
          
          // Increment unread count if message is from someone else
          if (message.sender_id !== user?.id) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
          }
          
          // Move chat to top
          updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(chat);
          
          console.log('✅ Updated chat in list:', {
            chatId: chat.id,
            lastMessage: chat.lastMessage.content,
            unreadCount: chat.unreadCount
          });
          
          return updatedChats;
        } else {
          // New chat - fetch all chats to get complete data
          console.log('🆕 New chat detected, fetching all chats...');
          fetchChats();
          return prevChats;
        }
      });
    };

    const handleMessageRead = (data: any) => {
      console.log('👁️ Messages marked as read event received:', data);
      // Refresh chat list to update unread counts
      // Add small delay to ensure DB transaction is committed
      setTimeout(() => {
        console.log('🔄 Refreshing chat list after messages marked as read...');
        fetchChats();
      }, 100);
    };

    const handleMessageStatusUpdated = (data: {
      message_id: number;
      status: 'delivered' | 'read';
      user_id: number;
    }) => {
      console.log('📊 Message status updated in chat list:', data);
      
      // Update the status of the last message if it matches
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.lastMessage && chat.lastMessage.id === data.message_id) {
            return {
              ...chat,
              lastMessage: {
                ...chat.lastMessage,
                status: data.status
              }
            };
          }
          return chat;
        });
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('messages_read', handleMessageRead);
    socket.on('message_status_updated', handleMessageStatusUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('messages_read', handleMessageRead);
      socket.off('message_status_updated', handleMessageStatusUpdated);
    };
  }, [socket, isConnected, user?.id]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching chats...');
      const response = await getChats();
      console.log('📋 Full API Response:', JSON.stringify(response, null, 2));
      
      // Backend returns { data: { chats: [...] }, meta: {} }
      if (response && response.data && response.data.chats) {
        console.log('✅ Chats found:', response.data.chats.length);
        console.log('📝 First chat:', JSON.stringify(response.data.chats[0], null, 2));
        setChats(response.data.chats);
      } else {
        console.log('⚠️ No chats in response or unexpected format');
        console.log('Response structure:', Object.keys(response || {}));
        setChats([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch chats:', error);
      console.error('Error details:', error.message, error.statusCode);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const getChatName = (chat: Chat): string => {
    if (chat.is_group) {
      return chat.group_name || 'Group Chat';
    }
    
    // For private chat, get the other user's name
    const otherUser = chat.Users.find(u => u.id !== user?.id);
    return otherUser?.name || otherUser?.id.toString() || 'Unknown';
  };

  const getChatAvatar = (chat: Chat): string | undefined => {
    if (chat.is_group) {
      return chat.group_icon;
    }
    
    // For private chat, get the other user's profile pic
    const otherUser = chat.Users.find(u => u.id !== user?.id);
    return otherUser?.profile_pic;
  };

  const getOtherUserId = (chat: Chat): number | undefined => {
    if (chat.is_group) return undefined;
    const otherUser = chat.Users.find(u => u.id !== user?.id);
    return otherUser?.id;
  };

  const handleChatPress = (chat: Chat) => {
    const otherUserId = getOtherUserId(chat);
    const chatName = getChatName(chat);
    
    console.log('🔍 Chat pressed:', {
      chatId: chat.id,
      otherUserId,
      chatName,
      currentUserId: user?.id,
      usersInChat: chat.Users.map(u => ({ id: u.id, name: u.name })),
    });
    
    if (otherUserId) {
      // Get the other user's details
      const otherUser = chat.Users.find(u => u.id !== user?.id);
      
      // Create contact object for navigation
      const contactData = {
        id: otherUserId.toString(),
        name: otherUser?.name || 'Unknown',
        phone: '', // We don't have phone in chat response, but contact-chat doesn't strictly need it
        profile_pic: otherUser?.profile_pic,
      };
      
      console.log('📱 Navigating with contact:', contactData);
      
      // Navigate to contact-chat for private chats
      router.push({
        pathname: '/contact-chat',
        params: { 
          contact: JSON.stringify(contactData),
          chatId: chat.id.toString(),
        },
      });
    } else {
      // Navigate to group-chat for group chats
      console.log('Group chat navigation not implemented yet');
    }
  };

  const filteredChats = React.useMemo(() => {
    console.log('🔍 Filtering chats. Total chats:', chats.length);
    let filtered = chats;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(chat =>
        getChatName(chat).toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('🔍 After search filter:', filtered.length);
    }

    // Apply category filter
    switch (activeFilter) {
      case 'Unread':
        filtered = filtered.filter(chat => (chat.unreadCount || 0) > 0);
        console.log('🔍 After Unread filter:', filtered.length);
        break;
      case 'Groups':
        filtered = filtered.filter(chat => chat.is_group);
        console.log('🔍 After Groups filter:', filtered.length);
        break;
      case 'Favourites':
        // TODO: Implement favourites logic
        filtered = [];
        console.log('🔍 Favourites filter applied (empty)');
        break;
      default:
        console.log('🔍 No filter applied, showing all:', filtered.length);
        break;
    }

    return filtered;
  }, [chats, searchQuery, activeFilter]);

  const renderChatItem = ({ item }: { item: Chat }) => {
    const chatName = getChatName(item);
    const avatar = getChatAvatar(item);
    const otherUserId = getOtherUserId(item);
    
    console.log('🎨 Rendering chat item:', {
      id: item.id,
      name: chatName,
      hasAvatar: !!avatar,
      usersCount: item.Users?.length,
      hasLastMessage: !!item.lastMessage,
      unreadCount: item.unreadCount || 0,
    });
    
    // Format time from sent_at
    const formattedTime = item.lastMessage?.sent_at
      ? new Date(item.lastMessage.sent_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        })
      : undefined;

    // Determine message status for checkmarks (only show for messages sent by current user)
    const isSentByMe = item.lastMessage?.sender_id === user?.id;
    const messageStatus = item.lastMessage?.status;
    const isDelivered = isSentByMe && (messageStatus === 'delivered' || messageStatus === 'read');
    const isRead = isSentByMe && messageStatus === 'read';

    return (
      <ChatListItem
        name={chatName}
        avatar={avatar}
        lastMessage={item.lastMessage?.content}
        time={formattedTime}
        unreadCount={item.unreadCount || 0}
        isDelivered={isDelivered}
        isRead={isRead}
        onPress={() => handleChatPress(item)}
      />
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <TabHeader showProfile={true} />

      {/* Search + Filter */}
      <View style={styles.searchAndFiltersContainer}>
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={[styles.filterContainer, styles.filterContent]}>
          <FilterChip
            label="All"
            isActive={activeFilter === 'All'}
            onPress={() => setActiveFilter('All')}
            colors={colors}
          />
          <FilterChip
            label="Unread"
            isActive={activeFilter === 'Unread'}
            onPress={() => setActiveFilter('Unread')}
            colors={colors}
          />
          <FilterChip
            label="Favourites"
            isActive={activeFilter === 'Favourites'}
            onPress={() => setActiveFilter('Favourites')}
            colors={colors}
          />
          <FilterChip
            label="Groups"
            isActive={activeFilter === 'Groups'}
            onPress={() => setActiveFilter('Groups')}
            colors={colors}
          />
          <FilterChip label="+" isActive={false} onPress={() => {}} colors={colors} />
        </View>
      </View>

      {/* Empty Chat Banner */}
      {loading ? (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color={colors.icon} />
          <Text style={[styles.emptySubtitle, { color: colors.accent }]}>Loading chats...</Text>
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Image
            source={require('../../assets/images/empty_chat_banner.png')}
            style={styles.emptyBanner}
            resizeMode="contain"
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No conversations yet. Let's get the conversation started
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.accent }]}>Start a chat</Text>
          {/* Debug info */}
          {__DEV__ && (
            <Text style={{ marginTop: 10, fontSize: 12, color: colors.textTertiary }}>
              Debug: Total chats: {chats.length}, Filtered: {filteredChats.length}
            </Text>
          )}
        </View>
      ) : (
        <>
          {/* {__DEV__ && (
            <Text style={{ padding: 10, fontSize: 12, color: '#999' }}>
              Showing {filteredChats.length} chats
            </Text>
          )} */}
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderChatItem}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchAndFiltersContainer: {
    paddingTop: 5,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    gap: 8,
  },
  searchContainer: {
    height: 43,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 3,
  },
  searchInput: {
    flex: 1,
    height: 43,
    fontSize: 14,
    fontFamily: 'SF Pro Text',
  },
  filterContainer: {
    height: 34,
    width: '100%',
    flexDirection: 'row',
    // overflowX: 'scroll',
  },
  filterContent: {
    gap: 8,
    justifyContent: 'space-between',
  },
  chip: {
    height: 34,
    borderRadius: 19,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
    letterSpacing: -0.14,
    lineHeight: 19,
  },

  // 🟦 Empty state styles

  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 52,
    paddingBottom: 64
  },
  emptyBanner: {
    width: 300,
    height: 250,
    marginBottom: 24,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.22,
    textAlign: 'center',
  },

  // Chat List Styles
  chatList: {
    paddingBottom: 20,
  },
});
