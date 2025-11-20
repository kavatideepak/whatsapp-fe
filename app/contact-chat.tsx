// app/contact-chat.tsx
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useSocket } from '@/hooks/useSocket';
import { useTheme } from '@/hooks/useTheme';
import { Message as MessageType } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../components/themed-view';

export const options = {
  headerShown: false,
};

type Contact = {
  id: string;
  name: string;
  phone: string;
  profile_pic?: string;
};

type ChatParams = {
  contact?: string;
  chatId?: string;
};

export default function ContactChatScreen() {
  const params = useLocalSearchParams<ChatParams>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets(); // Get safe area insets for navigation bar

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
    sendImageMessage,
    markAsRead,
    setTyping,
    typingUsers,
    isUploadingMedia,
  } = useChat({
    chatId,
    autoMarkDelivered: true,
    autoMarkRead: true,
  });

  const [input, setInput] = React.useState('');
  const [recipientPresence, setRecipientPresence] = React.useState<{
    is_online: boolean;
    last_seen?: string;
  }>({ is_online: false });
  const flatListRef = React.useRef<FlatList>(null);
  const textInputRef = React.useRef<TextInput>(null);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [selectedImageUri, setSelectedImageUri] = React.useState<string | null>(null);

  // Show connection status
  React.useEffect(() => {
    console.log('🔌 Socket status:', {
      isConnected,
      isAuthenticated,
      chatId,
    });
  }, [isConnected, isAuthenticated, chatId]);

  // Keyboard event listeners for Android
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    const keyboardWillShow = Keyboard.addListener('keyboardDidShow', (e) => {
      // Subtract the bottom inset (navigation bar height) from keyboard height
      const adjustedHeight = e.endCoordinates.height - insets.bottom;
      setKeyboardHeight(adjustedHeight);
    });

    const keyboardWillHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [insets.bottom]);

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

  // Handle send message (text and/or image)
  const handleSend = async () => {
    const textContent = input.trim();
    const hasImage = !!selectedImageUri;
    
    if (!textContent && !hasImage) return;

    // Stop typing indicator
    setTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If there's an image selected, send it with text as caption
    if (hasImage) {
      const imageUri = selectedImageUri;
      setSelectedImageUri(null);
      setInput('');
      await sendImageMessage(imageUri, textContent);
    } else {
      // Just text message
      setInput('');
      sendMessage(textContent, 'text');
    }

    // Scroll to bottom (index 0 in inverted list)
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
    }, 100);
  };

  // Handle image button press - select image and show preview
  const handleImagePress = async () => {
    if (isUploadingMedia) return;
    
    const ImagePicker = require('expo-image-picker');
    
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        const { Alert } = require('react-native');
        Alert.alert('Permission Required', 'Permission to access photos is required to send images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
        // Focus text input after a short delay
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  // Handle remove selected image
  const handleRemoveImage = () => {
    setSelectedImageUri(null);
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

    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    return `Last seen ${diffDays}d ago`;
  };

  const renderMessage = ({ item }: { item: MessageType }) => {
    const isFromMe = item.sender_id === user?.id;

    const renderStatus = () => {
      if (!isFromMe) return null;

      switch (item.status) {
        case 'sending':
          return <Ionicons name="time-outline" size={14} color={colors.statusSending} />;
        case 'sent':
          return <Ionicons name="checkmark" size={14} color={colors.statusSent} />;
        case 'delivered':
          return (
            <View style={{ flexDirection: 'row', marginLeft: -4 }}>
              <Ionicons name="checkmark" size={14} color={colors.statusDelivered} />
              <Ionicons name="checkmark" size={14} color={colors.statusDelivered} style={{ marginLeft: -8 }} />
            </View>
          );
        case 'read':
          return (
            <View style={{ flexDirection: 'row', marginLeft: -4 }}>
              <Ionicons name="checkmark" size={14} color={colors.statusRead} />
              <Ionicons name="checkmark" size={14} color={colors.statusRead} style={{ marginLeft: -8 }} />
            </View>
          );
        case 'failed':
          return <Ionicons name="alert-circle" size={14} color={colors.statusFailed} />;
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
        <View style={[
          styles.bubble,
          isFromMe 
            ? [styles.bubbleRight, { backgroundColor: colors.bubbleSent }] 
            : [styles.bubbleLeft, { backgroundColor: colors.bubbleReceived }],
          // Add padding for text messages only
          item.message_type === 'text' && styles.textBubblePadding
        ]}>
          {item.is_deleted ? (
            <Text style={[
              isFromMe ? styles.textRight : styles.textLeft,
              { fontStyle: 'italic', opacity: 0.6 },
              { color: isFromMe ? colors.bubbleSentText : colors.bubbleReceivedText }
            ]}>
              {item.content}
            </Text>
          ) : item.message_type === 'image' ? (
            <>
              {(() => {
                // Check if content is JSON array (multiple images)
                let imageUrls: string[] = [];
                try {
                  const parsed = JSON.parse(item.content);
                  if (Array.isArray(parsed)) {
                    imageUrls = parsed;
                  } else {
                    imageUrls = [item.content];
                  }
                } catch {
                  imageUrls = [item.content];
                }

                const hasCaption = item.caption && item.caption.trim().length > 0;

                return (
                  <View style={styles.imageMessageContainer}>
                    {imageUrls.length > 1 ? (
                      // Multiple images - horizontal gallery
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.imageGallery}
                      >
                        {imageUrls.map((url, index) => (
                          <Image
                            key={index}
                            source={{ uri: url }}
                            style={[
                              styles.messageImage,
                              index < imageUrls.length - 1 && { marginRight: 4 }
                            ]}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      // Single image with overlay timestamp (WhatsApp style)
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: imageUrls[0] }}
                          style={[
                            styles.messageImage,
                            hasCaption && { marginBottom: 0 } // No margin if there's a caption
                          ]}
                          resizeMode="cover"
                        />
                        {/* Timestamp overlay on image (only if no caption) */}
                        {!hasCaption && (
                          <View style={[
                            styles.imageTimeOverlay,
                            isFromMe ? styles.imageTimeOverlayRight : styles.imageTimeOverlayLeft
                          ]}>
                            <Text style={styles.imageTimeText}>
                              {formatTime(item.sent_at || item.created_at || '')}
                            </Text>
                            {isFromMe && (
                              <View style={styles.imageStatusOverlay}>
                                {renderStatus()}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                    
                    {/* Caption below image (WhatsApp style) */}
                    {hasCaption && (
                      <View style={styles.captionContainer}>
                        <Text style={[
                          styles.captionText,
                          { color: isFromMe ? colors.bubbleSentText : colors.bubbleReceivedText }
                        ]}>
                          {item.caption}
                        </Text>
                        {/* Timestamp with caption */}
                        <View style={styles.captionFooter}>
                          <Text style={[styles.timeText, { color: isFromMe ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
                            {formatTime(item.sent_at || item.created_at || '')}
                          </Text>
                          {isFromMe && renderStatus()}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })()}
            </>
          ) : (
            <>
              <Text style={[
                isFromMe ? styles.textRight : styles.textLeft,
                { color: isFromMe ? colors.bubbleSentText : colors.bubbleReceivedText }
              ]}>
                {item.content}
              </Text>
              <View style={styles.messageFooter}>
                <Text style={[styles.timeText, { color: isFromMe ? colors.bubbleSentText : colors.textTertiary }]}>
                  {formatTime(item.sent_at || item.created_at || '')}
                </Text>
                {renderStatus()}
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={Platform.OS === 'ios'}
      >
        {/* <ThemedView 
          style={[
            styles.container, 
            Platform.OS === 'android' && keyboardHeight > 0 && { 
              marginBottom: keyboardHeight 
            }
          ]}
        > */}
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.icon} />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={styles.avatar}>
              {contact?.profile_pic && (contact.profile_pic.startsWith('http://') || contact.profile_pic.startsWith('https://')) ? (
                <Image
                  source={{ uri: contact.profile_pic }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.avatarBackground }]}>
                  <Text style={[styles.avatarText, { color: colors.avatarText }]}>
                    {contact?.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerTitle}>
              <Text style={[styles.contactName, { color: colors.text }]}>
                {contact?.name ?? 'Unknown'}
              </Text>
              <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
                {typingUsers.size > 0
                  ? 'typing...'
                  : recipientPresence.is_online
                  ? 'Online'
                  : formatLastSeen()}
              </Text>
            </View>

            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: colors.buttonSecondary }]}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Chat Background */}
          <ImageBackground
            source={require('@/assets/images/chat_bg.png')}
            style={[styles.chatBackground, { backgroundColor: colors.chatBackground }]}
            imageStyle={styles.chatBackgroundImage}
          >
            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.icon} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
              </View>
            )}

            {/* Error message */}
            {chatError && (
              <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(255, 69, 58, 0.2)' : '#FFE5E5' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{chatError}</Text>
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
              inverted
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 100);
              }}
            />
          </ImageBackground>

          {/* Input area */}
          <View style={[
            styles.inputContainer, 
            { backgroundColor: colors.backgroundSecondary },
            Platform.OS === 'android' && keyboardHeight === 0 && { 
              paddingBottom: Math.max(insets.bottom, 8) 
            }
          ]}>
            {/* Image preview */}
            {selectedImageUri && (
              <View style={[styles.imagePreviewContainer, { backgroundColor: colors.background }]}>
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity 
                  onPress={handleRemoveImage} 
                  style={[styles.removeImageBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={[styles.attachBtn, { opacity: isUploadingMedia ? 0.5 : 1 }]}
                onPress={handleImagePress}
                disabled={isUploadingMedia}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isUploadingMedia ? (
                  <ActivityIndicator size="small" color={colors.icon} />
                ) : (
                  <Ionicons name="image-outline" size={24} color={colors.icon} />
                )}
              </TouchableOpacity>
              <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <TextInput
                  ref={textInputRef}
                  style={[styles.textInput, { color: colors.inputText }]}
                  placeholder={selectedImageUri ? "Add a message..." : "Message..."}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={input}
                  onChangeText={handleInputChange}
                  multiline
                  editable={true}
                  blurOnSubmit={false}
                  returnKeyType="default"
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.sendBtn, 
                  { backgroundColor: colors.sendBtn },
                  ((!input.trim() && !selectedImageUri) || isUploadingMedia) && styles.sendBtnDisabled
                ]}
                onPress={handleSend}
                disabled={(!input.trim() && !selectedImageUri) || isUploadingMedia}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="send" size={20} color={colors.buttonPrimaryText} />
              </TouchableOpacity>
            </View>
          </View>
        {/* </ThemedView>\ */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const window = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatBackground: {
    flex: 1,
  },
  chatBackgroundImage: {
    opacity: 0.25,
    resizeMode: 'cover',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 0.33,
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
  },
  contactSub: {
    fontSize: 12,
    marginTop: 2,
  },
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 15.8,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: window.width * 0.72,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  textBubblePadding: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bubbleLeft: {
    borderTopLeftRadius: 2,
  },
  bubbleRight: {
    borderTopRightRadius: 2,
  },
  textLeft: {
    fontSize: 14,
    lineHeight: 20,
  },
  textRight: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 11,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  messageImage: {
    width: 250,
    height: 250,
    borderRadius: 6,
  },
  imageGallery: {
    marginBottom: 0,
  },
  imageMessageContainer: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
  },
  imageTimeOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  imageTimeOverlayLeft: {
    // Additional styles for left bubble if needed
  },
  imageTimeOverlayRight: {
    // Additional styles for right bubble if needed
  },
  imageTimeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  imageStatusOverlay: {
    flexDirection: 'row',
    marginLeft: -4,
  },
  captionContainer: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 2,
  },
  captionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
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
  },
  errorContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  inputBox: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 28,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 0.5,
  },
  textInput: {
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});