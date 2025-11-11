import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatListItemProps {
  /**
   * Name or title of the chat
   */
  name: string;
  /**
   * Avatar/profile picture URL
   */
  avatar?: string;
  /**
   * Last message content
   */
  lastMessage?: string;
  /**
   * Time of last message (formatted string like "16:14")
   */
  time?: string;
  /**
   * Number of unread messages
   */
  unreadCount?: number;
  /**
   * Whether to show typing indicator
   */
  isTyping?: boolean;
  /**
   * Whether message was delivered (show checkmark)
   */
  isDelivered?: boolean;
  /**
   * Whether message was read (show double checkmark)
   */
  isRead?: boolean;
  /**
   * Callback when chat is pressed
   */
  onPress: () => void;
}

/**
 * ChatListItem Component
 * 
 * Reusable component for rendering individual chat items in the chat list.
 * Matches the WhatsApp-style design with avatar, name, last message preview,
 * timestamp, and unread badge.
 * 
 * Features:
 * - Avatar with fallback to initials
 * - Last message preview with truncation
 * - Timestamp display
 * - Unread message count badge
 * - Typing indicator
 * - Message status indicators (checkmarks)
 * - Responsive design
 */
export function ChatListItem({
  name,
  avatar,
  lastMessage,
  time,
  unreadCount = 0,
  isTyping = false,
  isDelivered = false,
  isRead = false,
  onPress,
}: ChatListItemProps) {
  // Generate initials from name for avatar placeholder
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Determine message preview text
  const messagePreview = isTyping
    ? `${name.split(' ')[0]} is typing...`
    : lastMessage || 'No messages yet';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
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
        {/* Name and Time Row */}
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {time && <Text style={styles.time}>{time}</Text>}
        </View>

        {/* Message Preview and Badge Row */}
        <View style={styles.bottomRow}>
          <View style={styles.messageContainer}>
            {/* Status Icons */}
            {!isTyping && lastMessage && (
              <>
                {isRead && (
                  <Ionicons
                    name="checkmark-done"
                    size={16}
                    color="#4FC3F7"
                    style={styles.statusIcon}
                  />
                )}
                {isDelivered && !isRead && (
                  <Ionicons
                    name="checkmark-done"
                    size={16}
                    color="#767779"
                    style={styles.statusIcon}
                  />
                )}
              </>
            )}
            
            <Text
              style={[
                styles.message,
                isTyping && styles.typingText,
                unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {messagePreview}
            </Text>
          </View>

          {/* Unread Badge or Typing Indicator */}
          {unreadCount > 0 && !isTyping && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
          
          {isTyping && (
            <View style={styles.typingIndicator}>
              <Ionicons name="ellipsis-horizontal-circle" size={20} color="#25D366" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'SF Pro Text',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#767779',
    fontFamily: 'SF Pro Text',
    marginLeft: 8,
    fontWeight: '400',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    marginRight: 4,
  },
  message: {
    fontSize: 14,
    color: '#767779',
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    lineHeight: 19,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#1A1A1A',
  },
  typingText: {
    fontStyle: 'italic',
    color: '#25D366',
  },
  unreadBadge: {
    backgroundColor: '#000',
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
  typingIndicator: {
    marginLeft: 8,
  },
});
