/**
 * useChat Hook
 * Manages chat operations: receiving messages, sending messages
 * No longer requires joining chat rooms - messages delivered via personal user rooms
 */

import { API_ENDPOINTS, buildUrl } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import {
    bulkMarkMessagesRead,
    getSocket,
    markMessageDelivered,
    sendMessageViaSocket,
    sendTypingIndicator,
} from '@/services/socket';
import {
    GetMessagesResponse,
    Message,
    MessageType,
    SocketMessageSentPayload,
} from '@/types/api';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseChatOptions {
  chatId: number | null;
  autoMarkDelivered?: boolean; // Automatically mark messages as delivered
  autoMarkRead?: boolean; // Automatically mark messages as read when visible
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, messageType?: MessageType) => void;
  loadMessages: () => Promise<void>;
  markAsRead: (messageIds: number[]) => void;
  setTyping: (isTyping: boolean) => void;
  typingUsers: Set<number>;
}

/**
 * Hook to manage a specific chat
 * Handles sending/receiving messages, and loading message history
 * Works with WhatsApp-like delivery system via personal user rooms
 */
export function useChat(options: UseChatOptions): UseChatReturn {
  const { chatId, autoMarkDelivered = true, autoMarkRead = false } = options;
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const socketRef = useRef(getSocket());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMarkedAsReadRef = useRef<boolean>(false); // Flag to prevent duplicate marking

  /**
   * Load message history from API
   */
  const loadMessages = useCallback(async () => {
    if (!chatId || !token) {
      console.log('⚠️ Cannot load messages: missing chatId or token');
      return;
    }

    // Prevent duplicate loading
    if (isLoading) {
      console.log('⚠️ Already loading messages, skipping...');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(buildUrl(API_ENDPOINTS.messages.list(chatId)), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data: GetMessagesResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load messages');
      }

      console.log(`📥 Loaded ${data.data.messages.length} messages for chat ${chatId}`);
      // Reverse messages for inverted FlatList (newest first for better performance)
      setMessages(data.data.messages.reverse());

      // Auto-mark all unread messages as read when opening the chat (ONLY ONCE)
      if (autoMarkRead && user?.id && !hasMarkedAsReadRef.current) {
        const unreadFromOthers = data.data.messages.filter(
          (msg) => msg.sender_id !== user.id && (msg.status === 'sent' || msg.status === 'delivered')
        );
        
        const unreadMessageIds = unreadFromOthers
          .map(msg => msg.id)
          .filter((id): id is number => typeof id === 'number');
        
        if (unreadMessageIds.length > 0) {
          console.log(`📖 Auto-marking ${unreadMessageIds.length} messages as read on chat load`);
          console.log(`📖 Message IDs to mark as read:`, unreadMessageIds);
          console.log(`📖 Chat ID:`, chatId);
          console.log(`📖 Current user ID:`, user.id);
          console.log(`📖 hasMarkedAsReadRef:`, hasMarkedAsReadRef.current);
          
          // Set flag BEFORE calling to prevent race condition
          hasMarkedAsReadRef.current = true;
          
          bulkMarkMessagesRead(chatId, unreadMessageIds);
          
          // Update local state immediately
          setMessages((prev) =>
            prev.map((msg) =>
              unreadMessageIds.includes(Number(msg.id)) ? { ...msg, status: 'read' } : msg
            )
          );
        } else {
          console.log(`📖 No unread messages to mark as read`);
        }
      } else if (hasMarkedAsReadRef.current) {
        console.log(`📖 Skipping mark as read - already marked (flag=${hasMarkedAsReadRef.current})`);
      }
    } catch (err: any) {
      console.error('❌ Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [chatId, token, autoMarkDelivered, user?.id]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    (content: string, messageType: MessageType = 'text') => {
      if (!chatId || !user?.id) {
        console.warn('⚠️ Cannot send message: missing chatId or user');
        return;
      }

      if (!content.trim()) {
        console.warn('⚠️ Cannot send empty message');
        return;
      }

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const now = new Date().toISOString();

      // Optimistic UI update
      const tempMessage: Message = {
        id: tempId,
        chat_id: chatId,
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType,
        sent_at: now,
        created_at: now,
        status: 'sending',
        tempId,
      };

      // Add new message at the beginning (for inverted FlatList)
      setMessages((prev) => [tempMessage, ...prev]);

      // Send via socket
      try {
        sendMessageViaSocket({
          chat_id: chatId,
          content: content.trim(),
          message_type: messageType,
          tempId,
        });
        console.log('📤 Message sent via socket');
      } catch (err: any) {
        console.error('❌ Failed to send message:', err);
        
        // Update message status to failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: 'failed' } : msg
          )
        );
      }
    },
    [chatId, user]
  );

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(
    (messageIds: number[]) => {
      if (!chatId || messageIds.length === 0) {
        return;
      }

      bulkMarkMessagesRead(chatId, messageIds);
      
      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(Number(msg.id)) ? { ...msg, status: 'read' } : msg
        )
      );
    },
    [chatId]
  );

  /**
   * Send typing indicator
   */
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!chatId) {
        return;
      }

      sendTypingIndicator(chatId, isTyping);

      // Auto-stop typing after 3 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingIndicator(chatId, false);
        }, 3000);
      }
    },
    [chatId]
  );

  /**
   * Handle socket events
   */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    // Handle message sent confirmation
    const handleMessageSent = ({ tempId, message }: SocketMessageSentPayload) => {
      console.log('✅ Message sent successfully:', message.id);

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.tempId === tempId || msg.id === tempId) {
            return { ...message, status: 'sent' };
          }
          return msg;
        })
      );
    };

    // Handle new incoming message (delivered via personal user room)
    const handleNewMessage = (message: Message) => {
      console.log('📨 New message received:', message.id);

      // Check if message is for this chat
      if (message.chat_id === chatId) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            return prev;
          }
          // Add at beginning for inverted FlatList
          return [{ ...message, status: 'delivered' }, ...prev];
        });

        // Auto-mark as delivered if from another user
        if (autoMarkDelivered && message.sender_id !== user?.id) {
          if (typeof message.id === 'number') {
            markMessageDelivered(message.id);
          }
        }

        // Auto-mark as read if enabled (for new incoming messages)
        if (autoMarkRead && message.sender_id !== user?.id) {
          if (typeof message.id === 'number') {
            console.log(`📖 Auto-marking new message ${message.id} as read`);
            bulkMarkMessagesRead(chatId, [message.id]);
          }
        }
      }
    };

    // Handle message status updates
    const handleMessageStatusUpdated = (data: {
      message_id: number;
      status: 'delivered' | 'read';
      user_id: number;
    }) => {
      console.log(`📊 Message ${data.message_id} status: ${data.status} by user ${data.user_id}`);

      setMessages((prev) =>
        prev.map((msg) => {
          if (Number(msg.id) === data.message_id) {
            return { ...msg, status: data.status };
          }
          return msg;
        })
      );
    };

    // Handle bulk message status updates (when someone marks multiple messages as read)
    const handleBulkMessageStatusUpdated = (data: {
      message_ids: number[];
      user_id: number;
      chat_id: number;
    }) => {
      console.log(`📊 Bulk status update: ${data.message_ids.length} messages by user ${data.user_id}`);

      setMessages((prev) =>
        prev.map((msg) => {
          if (data.message_ids.includes(Number(msg.id))) {
            return { ...msg, status: 'read' };
          }
          return msg;
        })
      );
    };

    // Handle typing indicator
    const handleUserTyping = (data: {
      chat_id: number;
      user_id: number;
      is_typing: boolean;
    }) => {
      if (data.chat_id !== chatId) {
        return;
      }

      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.is_typing) {
          next.add(data.user_id);
        } else {
          next.delete(data.user_id);
        }
        return next;
      });
    };

    // Handle message deleted
    const handleMessageDeleted = (data: { message_id: number }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          Number(msg.id) === data.message_id
            ? { ...msg, is_deleted: true, content: 'This message was deleted' }
            : msg
        )
      );
    };

    // Register listeners
    socket.on('message_sent', handleMessageSent);
    socket.on('new_message', handleNewMessage);
    socket.on('message_status_updated', handleMessageStatusUpdated);
    socket.on('messages_read_bulk', handleBulkMessageStatusUpdated);
    socket.on('user_typing', handleUserTyping);
    socket.on('message_deleted', handleMessageDeleted);

    // Cleanup
    return () => {
      socket.off('message_sent', handleMessageSent);
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_updated', handleMessageStatusUpdated);
      socket.off('messages_read_bulk', handleBulkMessageStatusUpdated);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [chatId, autoMarkDelivered, autoMarkRead, user?.id]);

  /**
   * Load messages when chat changes
   */
  useEffect(() => {
    if (chatId) {
      console.log(`🔄 Chat changed to ${chatId}, loading messages...`);
      // Reset the flag when chat changes
      hasMarkedAsReadRef.current = false;
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // Only reload when chatId changes, not when loadMessages function changes

  /**
   * Cleanup typing timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    loadMessages,
    markAsRead,
    setTyping,
    typingUsers,
  };
}
