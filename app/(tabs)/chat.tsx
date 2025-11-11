import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { 
  Image, 
  Pressable, 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getChats } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

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
    content: string;
    sent_at: string;
    isUnread?: boolean;
  };
}

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const FilterChip = ({ label, isActive, onPress }: FilterChipProps) => (
  <Pressable
    style={[styles.chip, isActive ? styles.activeChip : styles.inactiveChip]}
    onPress={onPress}
  >
    <ThemedText
      style={[
        styles.chipText,
        isActive ? styles.activeChipText : styles.inactiveChipText,
      ]}
    >
      {label}
    </ThemedText>
  </Pressable>
);

export default function ChatScreen() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeFilter, setActiveFilter] = React.useState('All');
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch chats when component mounts
  React.useEffect(() => {
    fetchChats();
  }, [user?.id]);

  // Listen for new messages via socket
  React.useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message: any) => {
      console.log('📩 New message received:', message);
      // Update the chat list with new message
      fetchChats();
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected]);

  const fetchChats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await getChats(user.id);
      console.log('📋 Fetched chats:', response);
      
      if (response.success && response.data?.chats) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
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
    
    if (otherUserId) {
      // Navigate to contact-chat for private chats
      router.push({
        pathname: '/contact-chat',
        params: {
          contactId: otherUserId.toString(),
          contactName: getChatName(chat),
          chatId: chat.id.toString(),
        },
      });
    } else {
      // Navigate to group-chat for group chats
      console.log('Group chat navigation not implemented yet');
    }
  };

  const filteredChats = React.useMemo(() => {
    let filtered = chats;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(chat =>
        getChatName(chat).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'Unread':
        filtered = filtered.filter(chat => chat.lastMessage?.isUnread);
        break;
      case 'Groups':
        filtered = filtered.filter(chat => chat.is_group);
        break;
      case 'Favourites':
        // TODO: Implement favourites logic
        filtered = [];
        break;
      default:
        break;
    }

    return filtered;
  }, [chats, searchQuery, activeFilter]);

  const renderChatItem = ({ item }: { item: Chat }) => {
    const chatName = getChatName(item);
    const avatar = getChatAvatar(item);
    const initials = chatName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {chatName}
            </Text>
            <Text style={styles.chatTime}>
              {item.lastMessage?.sent_at
                ? new Date(item.lastMessage.sent_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : ''}
            </Text>
          </View>
          
          <View style={styles.chatFooter}>
            <Text style={styles.chatMessage} numberOfLines={1}>
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
            {item.lastMessage?.isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>1</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/Logo_icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#1A1A1A" />
          </Pressable>
          <Pressable style={[styles.iconButton, styles.plusButton]} onPress={() => router.push('/add-contacts')}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchAndFiltersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#767779" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#767779"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={[styles.filterContainer, styles.filterContent]}>
          <FilterChip
            label="All"
            isActive={activeFilter === 'All'}
            onPress={() => setActiveFilter('All')}
          />
          <FilterChip
            label="Unread"
            isActive={activeFilter === 'Unread'}
            onPress={() => setActiveFilter('Unread')}
          />
          <FilterChip
            label="Favourites"
            isActive={activeFilter === 'Favourites'}
            onPress={() => setActiveFilter('Favourites')}
          />
          <FilterChip
            label="Groups"
            isActive={activeFilter === 'Groups'}
            onPress={() => setActiveFilter('Groups')}
          />
          <FilterChip label="+" isActive={false} onPress={() => {}} />
        </View>
      </View>

      {/* Empty Chat Banner */}
      {loading ? (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Image
            source={require('../../assets/images/empty_chat_banner.png')}
            style={styles.emptyBanner}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>
            No conversations yet. Let's get the conversation started
          </Text>
          <Text style={styles.emptySubtitle}>Start a chat</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChatItem}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 62,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  logo: {
    width: 46.87,
    height: 24.7,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 48,
    backgroundColor: 'rgba(26, 26, 26, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    backgroundColor: '#1A1A1A',
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
    backgroundColor: '#F4F4F4',
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
    color: '#1A1A1A',
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
  activeChip: {
    backgroundColor: '#1A1A1A',
  },
  inactiveChip: {
    backgroundColor: '#F4F4F4',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
    letterSpacing: -0.14,
    lineHeight: 19,
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  inactiveChipText: {
    color: '#767779',
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
    color: '#1A1A1A',
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#016EEB',
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.22,
    textAlign: 'center',
  },

  // Chat List Styles
  chatList: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F4',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#767779',
    fontFamily: 'SF Pro Text',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'SF Pro Text',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#767779',
    fontFamily: 'SF Pro Text',
    marginLeft: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    color: '#767779',
    fontFamily: 'SF Pro Text',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'SF Pro Text',
  },
});
