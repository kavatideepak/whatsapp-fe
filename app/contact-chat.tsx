// app/contact-chat.tsx
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useSocket } from '@/hooks/useSocket';
import { Message as MessageType } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../components/themed-view';

export const options = {
  headerShown: false,
};

type Contact = {
  id: string;
  name: string;
  phone: string;
};

type ChatParams = {
  contact?: string;
  chatId?: string;
};

export default function ContactChatScreen() {
  const params = useLocalSearchParams<ChatParams>();
  const router = useRouter();
  const { user } = useAuth();

  // Initialize socket connection
  const { isConnected, isAuthenticated } = useSocket();

  const contact: Contact | null = React.useMemo(() => {
    if (params.contact) {
      try {
        return JSON.parse(params.contact as string) as Contact;
      } catch {
        return null;
      }
    }
    return null;
  }, [params.contact]);

  const chatId = params.chatId ? parseInt(params.chatId) : null;

  // Use chat hook for messaging functionality
  const {
    messages,
    isLoading,
    error: chatError,
    sendMessage,
    markAsRead,
    setTyping,
    typingUsers,
  } = useChat({
    chatId,
    autoMarkDelivered: true,
    autoMarkRead: true, // Auto-mark messages as read in this chat
  });

  const [input, setInput] = React.useState('');
  const [recipientPresence, setRecipientPresence] = React.useState<{
    is_online: boolean;
    last_seen?: string;
  }>({ is_online: false });
  const flatListRef = React.useRef<FlatList>(null);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show connection status
  React.useEffect(() => {
    console.log('🔌 Socket status:', {
      isConnected,
      isAuthenticated,
      chatId,
    });
  }, [isConnected, isAuthenticated, chatId]);

  // Listen for presence updates from socket
  React.useEffect(() => {
    if (!isConnected || !contact?.id) {
      return;
    }

    const socket = require('@/services/socket').getSocket();
    if (!socket) return;

    // Request presence info for the contact
    const { getPresenceInfo } = require('@/services/socket');
    getPresenceInfo([parseInt(contact.id)]);

    // Listen for presence updates
    const handlePresenceUpdated = (data: {
      user_id: number;
      is_online: boolean;
      last_seen?: string;
    }) => {
      if (data.user_id === parseInt(contact.id)) {
        console.log('📊 Presence updated for contact:', {
          user_id: data.user_id,
          is_online: data.is_online,
          last_seen: data.last_seen,
        });
        setRecipientPresence({
          is_online: data.is_online,
          last_seen: data.last_seen,
        });
      }
    };

    const handlePresenceInfo = (presenceData: Array<{
      user_id: number;
      is_online: boolean;
      last_seen?: string;
    }>) => {
      const contactPresence = presenceData.find(
        (p) => p.user_id === parseInt(contact.id)
      );
      if (contactPresence) {
        console.log('📊 Presence info received:', contactPresence);
        setRecipientPresence({
          is_online: contactPresence.is_online,
          last_seen: contactPresence.last_seen,
        });
      }
    };

    socket.on('presence_updated', handlePresenceUpdated);
    socket.on('presence_info', handlePresenceInfo);

    return () => {
      socket.off('presence_updated', handlePresenceUpdated);
      socket.off('presence_info', handlePresenceInfo);
    };
  }, [isConnected, contact?.id]);

  // Note: Auto-scroll not needed with inverted FlatList
  // Latest messages automatically appear at the bottom (which is now top in inverted mode)

  // Handle input change and typing indicator
  const handleInputChange = (text: string) => {
    setInput(text);

    // Send typing indicator
    if (text.length > 0) {
      setTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    } else {
      setTyping(false);
    }
  };

  // Handle send message
  const handleSend = () => {
    if (!input.trim()) return;

    // Stop typing indicator
    setTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send message via socket
    sendMessage(input.trim(), 'text');
    setInput('');

    // Scroll to bottom (index 0 in inverted list)
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
    }, 100);
  };

  // Format timestamp
  const formatTime = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString().padStart(2, '0')}`;
  };

  // Format last seen
  const formatLastSeen = (): string => {
    // Always show "Online" if user is connected (regardless of screen)
    if (recipientPresence.is_online) {
      return 'Online';
    }
    
    if (!recipientPresence.last_seen) {
      return 'Offline';
    }

    const lastSeen = new Date(recipientPresence.last_seen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // If less than 1 minute ago and not online, still show time
    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    return `Last seen ${diffDays}d ago`;
  };

  const renderMessage = ({ item }: { item: MessageType }) => {
    const isFromMe = item.sender_id === user?.id;
    const bubbleStyle = [
      styles.bubble,
      isFromMe ? styles.bubbleRight : styles.bubbleLeft,
    ];
    const textStyle = [
      styles.bubbleText,
      isFromMe ? styles.textRight : styles.textLeft,
    ];

    // Render message status icon (WhatsApp-like)
    const renderStatus = () => {
      if (!isFromMe) return null;

      switch (item.status) {
        case 'sending':
          return <Ionicons name="time-outline" size={14} color="#9A9A9A" />;
        case 'sent':
          return <Ionicons name="checkmark" size={14} color="#9A9A9A" />;
        case 'delivered':
          return (
            <View style={{ flexDirection: 'row', marginLeft: -4 }}>
              <Ionicons name="checkmark" size={14} color="#9A9A9A" />
              <Ionicons name="checkmark" size={14} color="#9A9A9A" style={{ marginLeft: -8 }} />
            </View>
          );
        case 'read':
          return (
            <View style={{ flexDirection: 'row', marginLeft: -4 }}>
              <Ionicons name="checkmark" size={14} color="#4FC3F7" />
              <Ionicons name="checkmark" size={14} color="#4FC3F7" style={{ marginLeft: -8 }} />
            </View>
          );
        case 'failed':
          return <Ionicons name="alert-circle" size={14} color="#F44336" />;
        default:
          return null;
      }
    };

    return (
      <View
        style={[
          styles.messageRow,
          isFromMe
            ? { justifyContent: 'flex-end' }
            : { justifyContent: 'flex-start' },
        ]}
      >
        <View style={bubbleStyle}>
          {item.is_deleted ? (
            <Text style={[textStyle, { fontStyle: 'italic', opacity: 0.6 }]}>
              {item.content}
            </Text>
          ) : (
            <Text style={textStyle}>{item.content}</Text>
          )}
          <View style={styles.messageFooter}>
            <Text style={styles.timeText}>
              {formatTime(item.sent_at || item.created_at || '')}
            </Text>
            {renderStatus()}
          </View>
        </View>
      </View>
    );
  };

return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7F7' }} edges={['top', 'bottom']}>
    <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatar}>
            <Ionicons name="person-circle-outline" size={40} color="#9A9A9A" />
          </View>

          <View style={styles.headerTitle}>
            <Text style={styles.contactName}>
              {contact?.name ?? 'Unknown'}
            </Text>
            <Text style={styles.contactSub}>
              {!isConnected
                ? 'Connecting...'
                : !isAuthenticated
                ? 'Authenticating...'
                : typingUsers.size > 0
                ? 'Typing...'
                : formatLastSeen()}
            </Text>
          </View>

          <TouchableOpacity style={styles.menuBtn}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Chat Background */}
        <ImageBackground
          source={require('@/assets/images/chat_bg.png')}
          style={styles.chatBackground}
          imageStyle={styles.chatBackgroundImage}
          resizeMode="repeat"
        >
          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1A1A1A" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          )}

          {/* Error message */}
          {chatError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{chatError}</Text>
            </View>
          )}

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            inverted // WhatsApp-style: renders from bottom, newest messages appear instantly
            initialNumToRender={20} // Only render 20 messages initially for performance
            maxToRenderPerBatch={10} // Render 10 items per batch when scrolling
            windowSize={10} // Keep 10 screens worth of items in memory
            removeClippedSubviews={true} // Unmount off-screen items for better performance
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
            onScrollToIndexFailed={(info) => {
              // Wait for list to render then try again
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              }, 100);
            }}
          />
        </ImageBackground>

        {/* Input area */}
        <View style={styles.inputRow}>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor="#9A9A9A"
              value={input}
              onChangeText={handleInputChange}
              multiline
              editable={isConnected && isAuthenticated}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!isConnected || !isAuthenticated || !input.trim()) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!isConnected || !isAuthenticated || !input.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
    </ThemedView>
  </SafeAreaView>
);

}

const window = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  chatBackgroundImage: {
    opacity: 0.3,
    resizeMode: 'contain',
  },
  header: {
    height: 64,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 0.33,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  contactSub: {
    fontSize: 12,
    color: '#767779',
    marginTop: 2,
  },
  menuBtn: {
    width: 28,
       height: 28,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
        backgroundColor: 'rgba(26, 26, 26, 0.08)',

  },

  listContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6, // leaves space for input area
    fontFamily: 'SF Pro Text',
    fontWeight: 400,
    fontSize: 15.8,
  },

  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: window.width * 0.72,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  bubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6,
  },
  bubbleRight: {
    backgroundColor: '#111111',
    borderTopRightRadius: 6,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textLeft: {
    color: '#1A1A1A',
  },
  textRight: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 11,
    color: '#9A9A9A',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#9A9A9A',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#767779',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#D32F2F',
    textAlign: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },

  inputRow: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
  },
  inputBox: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
  },
  textInput: {
    color: '#1A1A1A',
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
