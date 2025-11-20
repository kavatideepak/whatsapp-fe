/**
 * Socket Service
 * Manages WebSocket connection lifecycle and events
 */

import { SOCKET_URL } from '@/config/api';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let isConnecting = false;
let isAuthenticated = false;
let currentUserId: number | null = null;

/**
 * Initialize socket connection with user ID for authentication
 */
export function initializeSocket(userId: number): Socket {
  // Return existing socket if already connected
  if (socket?.connected && isAuthenticated && currentUserId === userId) {
    console.log('✅ Socket already connected and authenticated for user:', userId);
    return socket;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    console.log('⏳ Socket connection already in progress...');
    return socket!;
  }

  console.log('🔌 Initializing socket connection for user:', userId);
  isConnecting = true;
  currentUserId = userId;

  // Create socket connection
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Connection established
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
    isConnecting = false;

    // Authenticate the socket with user ID
    if (userId) {
      console.log('🔐 Authenticating socket with user ID:', userId);
      socket?.emit('user_authenticated', userId);
      isAuthenticated = true;
    }
  });

  // Pending messages delivered notification
  socket.on('pending_messages_delivered', (data: { count: number }) => {
    console.log(`📬 ${data.count} pending messages delivered`);
  });

  // Connection error
  socket.on('connect_error', (error: Error) => {
    console.error('❌ Socket connection error:', error.message);
    isConnecting = false;
  });

  // Disconnection
  socket.on('disconnect', (reason: string) => {
    console.log('🔌 Socket disconnected:', reason);
    isAuthenticated = false;

    if (reason === 'io server disconnect') {
      // Server disconnected, attempt reconnection
      socket?.connect();
    }
  });

  // Reconnection attempt
  socket.on('reconnect_attempt', (attempt: number) => {
    console.log(`🔄 Reconnection attempt #${attempt}`);
  });

  // Reconnection successful
  socket.on('reconnect', (attempt: number) => {
    console.log(`✅ Reconnected after ${attempt} attempts`);
    
    // Re-authenticate after reconnection
    if (userId) {
      console.log('🔐 Re-authenticating socket with user ID:', userId);
      socket?.emit('user_authenticated', userId);
      isAuthenticated = true;
    }
  });

  // Reconnection failed
  socket.on('reconnect_failed', () => {
    console.error('❌ Reconnection failed after all attempts');
  });

  return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Check if socket is connected and authenticated
 */
export function isSocketReady(): boolean {
  return socket?.connected === true && isAuthenticated === true;
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket(): void {
  if (socket) {
    console.log('🔌 Disconnecting socket...');
    
    // Notify server of intentional disconnect
    if (currentUserId) {
      socket.emit('user_disconnect');
    }
    
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isAuthenticated = false;
    isConnecting = false;
    currentUserId = null;
  }
}

/**
 * Mark message as delivered
 */
export function markMessageDelivered(messageId: number): void {
  if (!isSocketReady()) {
    return;
  }

  console.log(`✓ Marking message as delivered: ${messageId}`);
  socket?.emit('message_delivered', { message_id: messageId });
}

/**
 * Send a message via socket
 */
export function sendMessageViaSocket(payload: {
  chat_id: number;
  content: string;
  message_type?: string;
  tempId?: string;
  caption?: string;
  reply_to?: number;
}): void {
  if (!isSocketReady()) {
    console.warn('⚠️ Socket not ready, cannot send message');
    throw new Error('Socket not connected');
  }

  console.log('📤 Sending message via socket:', payload);
  
  // Build the socket payload, only including caption if it's a non-empty string
  const socketPayload: any = {
    chat_id: payload.chat_id,
    content: payload.content,
    message_type: payload.message_type || 'text',
    tempId: payload.tempId,
  };
  
  // Only add caption if it exists and is not empty
  // Handle edge case where caption might be an object (e.g., React Native event)
  if (payload.caption) {
    const captionValue = typeof payload.caption === 'string' 
      ? payload.caption.trim() 
      : '';
    
    if (captionValue.length > 0) {
      socketPayload.caption = captionValue;
    }
  }
  
  // Only add reply_to if it exists
  if (payload.reply_to) {
    socketPayload.reply_to = payload.reply_to;
  }
  
  console.log('📤 Final socket payload:', socketPayload);
  socket?.emit('send_message', socketPayload);
}

/**
 * Mark message as read
 */
export function markMessageRead(messageId: number, chatId: number): void {
  if (!isSocketReady()) {
    return;
  }

  console.log(`✓✓ Marking message as read: ${messageId}`);
  socket?.emit('message_read', { message_id: messageId, chat_id: chatId });
}

/**
 * Bulk mark messages as read
 */
export function bulkMarkMessagesRead(chatId: number, messageIds: number[]): void {
  if (!isSocketReady() || messageIds.length === 0) {
    console.warn(`⚠️ Cannot bulk mark read: socketReady=${isSocketReady()}, messageIds=${messageIds.length}`);
    return;
  }

  console.log(`✓✓ Bulk marking ${messageIds.length} messages as read in chat ${chatId}`);
  console.log(`✓✓ Message IDs:`, messageIds);
  socket?.emit('bulk_mark_read', { chat_id: chatId, message_ids: messageIds });
}

/**
 * Send typing indicator
 */
export function sendTypingIndicator(chatId: number, isTyping: boolean): void {
  if (!isSocketReady()) {
    return;
  }

  socket?.emit('typing', { chat_id: chatId, is_typing: isTyping });
}

/**
 * Get presence info for users
 */
export function getPresenceInfo(userIds: number[]): void {
  if (!isSocketReady()) {
    return;
  }

  console.log('📊 Requesting presence info for users:', userIds);
  socket?.emit('get_presence', userIds);
}

/**
 * Delete a message
 */
export function deleteMessage(messageId: number, chatId: number): void {
  if (!isSocketReady()) {
    return;
  }

  console.log(`🗑️ Deleting message: ${messageId}`);
  socket?.emit('delete_message', { message_id: messageId, chat_id: chatId });
}
