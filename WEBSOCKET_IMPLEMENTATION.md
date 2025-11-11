# 📡 WebSocket Messaging Implementation

Complete WebSocket-based real-time messaging system for Synapse chat application.

---

## 🎯 Overview

This implementation provides a robust, reusable WebSocket messaging system with:
- Automatic connection management
- Chat room joining/leaving
- Real-time message sending/receiving
- Optimistic UI updates
- Message status tracking (sending, sent, delivered, read, failed)
- Automatic reconnection handling

---

## 📁 File Structure

```
services/
  └── socket.ts              # WebSocket connection manager

hooks/
  ├── useSocket.ts           # Socket connection lifecycle hook
  └── useChat.ts             # Chat operations hook (send/receive messages)

types/
  └── api.ts                 # Message types, socket event types

config/
  └── api.ts                 # Socket URL and endpoints

app/
  ├── contact-chat.tsx       # Chat screen with socket integration
  └── (tabs)/
      └── contacts.tsx       # Contacts screen (initiates chats)
```

---

## 🔧 Core Components

### 1. **Socket Service** (`services/socket.ts`)

Central WebSocket connection manager.

**Key Functions:**
- `initializeSocket(authToken)` - Create and authenticate connection
- `getSocket()` - Get current socket instance
- `isSocketReady()` - Check if connected + authenticated
- `disconnectSocket()` - Clean disconnect
- `joinChatRoom(chatId)` - Join a chat room
- `leaveChatRoom(chatId)` - Leave a chat room
- `sendMessageViaSocket(payload)` - Send a message
- `markMessageDelivered(messageId)` - Mark message as delivered
- `markMessageRead(messageId)` - Mark message as read

**Socket Events:**
- `connect` - Connection established
- `authenticated` - Socket authenticated
- `disconnect` - Connection lost
- `reconnect` - Reconnected successfully

---

### 2. **useSocket Hook** (`hooks/useSocket.ts`)

React hook for managing socket connection lifecycle.

**Usage:**
```typescript
import { useSocket } from '@/hooks/useSocket';

function MyComponent() {
  const { socket, isConnected, isAuthenticated, error } = useSocket();
  
  // Socket automatically connects when user is authenticated
  // and disconnects on unmount
}
```

**Returns:**
- `socket` - Socket instance
- `isConnected` - Connection status
- `isAuthenticated` - Authentication status
- `error` - Error message (if any)

---

### 3. **useChat Hook** (`hooks/useChat.ts`)

React hook for chat operations (join room, send/receive messages).

**Usage:**
```typescript
import { useChat } from '@/hooks/useChat';

function ChatScreen() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    loadMessages,
    isJoined,
  } = useChat({
    chatId: 5,
    autoJoin: true,
    autoMarkDelivered: true,
  });

  // Send a message
  const handleSend = () => {
    sendMessage('Hello!', 'text');
  };
}
```

**Parameters:**
- `chatId` - Chat room ID
- `autoJoin` - Auto-join room when ready (default: `true`)
- `autoMarkDelivered` - Auto-mark received messages as delivered (default: `true`)

**Returns:**
- `messages` - Array of messages
- `isLoading` - Loading state
- `error` - Error message
- `sendMessage(content, type)` - Send a message
- `loadMessages()` - Reload message history
- `isJoined` - Room join status

---

## 🔄 Message Flow

### 1. **Initiating a Chat**

When user taps on a contact:

```typescript
// app/(tabs)/contacts.tsx
const response = await createChat(
  currentUser.id,
  parseInt(contactId),
  false // is_group
);

// Response:
{
  "success": true,
  "message": "Success",
  "data": {
    "chat": {
      "id": 5,
      "is_group": false,
      "created_by": 1,
      "created_at": "2025-11-08T10:30:00.000Z"
    }
  }
}

// Navigate to chat with chatId
router.push({
  pathname: '/contact-chat',
  params: {
    contact: JSON.stringify(contact),
    chatId: response.data.chat.id.toString(),
  },
});
```

### 2. **Joining Chat Room**

Automatically handled by `useChat` hook:

```typescript
// Socket emits
socket.emit('join_chat', chatId);

// Listen for confirmation
socket.on('joined_chat', ({ chatId }) => {
  console.log('Joined chat:', chatId);
  setIsJoined(true);
});
```

### 3. **Sending Messages**

```typescript
// User types message and hits send
sendMessage('Hello!', 'text');

// Optimistic UI update (instant feedback)
const tempMessage = {
  id: 'temp-123',
  content: 'Hello!',
  sender_id: currentUser.id,
  status: 'sending',
  created_at: new Date().toISOString(),
};

// Socket emits
socket.emit('send_message', {
  chat_id: 5,
  content: 'Hello!',
  message_type: 'text',
  tempId: 'temp-123',
});

// Confirmation received
socket.on('message_sent', ({ tempId, message }) => {
  // Replace temp message with real message
  replaceMessage(tempId, message);
});
```

### 4. **Receiving Messages**

```typescript
// Listen for incoming messages
socket.on('new_message', (payload) => {
  const { message } = payload;
  
  // Add to message list
  addMessage(message);
  
  // Auto-mark as delivered
  socket.emit('message_delivered', { message_id: message.id });
});
```

---

## 📊 Message Types

```typescript
export interface Message {
  id: string | number;
  chat_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  created_at: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  tempId?: string; // For optimistic updates
}
```

---

## 🎨 UI Features

### Message Status Indicators

- 🕐 Sending
- ✓ Sent
- ✓✓ Delivered
- ✓✓ Read (blue)
- ✗ Failed

### Connection Status

Displayed in chat header subtitle:
- "Connecting..." - Establishing socket connection
- "Authenticating..." - Authenticating socket
- "Joining chat..." - Joining chat room
- "Online" - Ready to send/receive messages

### Loading States

- Loading indicator while fetching message history
- Disabled input when not connected
- Optimistic UI updates for instant feedback

---

## 🔐 Socket Events Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `token: string` | Authenticate socket connection |
| `join_chat` | `chatId: number` | Join a chat room |
| `leave_chat` | `chatId: number` | Leave a chat room |
| `send_message` | `{ chat_id, content, message_type, tempId }` | Send a message |
| `message_delivered` | `{ message_id }` | Mark message as delivered |
| `message_read` | `{ message_id }` | Mark message as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticated` | - | Authentication successful |
| `joined_chat` | `{ chatId }` | Successfully joined chat room |
| `message_sent` | `{ tempId, message }` | Message sent confirmation |
| `new_message` | `{ message }` | New message received |
| `authentication_error` | `error` | Authentication failed |

---

## 🚀 Usage Example

### Complete Chat Screen Implementation

```typescript
// app/contact-chat.tsx
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useSocket } from '@/hooks/useSocket';
import { Message as MessageType } from '@/types/api';

export default function ChatScreen() {
  const { user } = useAuth();
  const { isConnected, isAuthenticated } = useSocket();
  
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    isJoined,
  } = useChat({
    chatId: 5,
    autoJoin: true,
    autoMarkDelivered: true,
  });

  const handleSend = (content: string) => {
    sendMessage(content, 'text');
  };

  return (
    <View>
      {/* Header with connection status */}
      <Text>
        {!isConnected ? 'Connecting...' :
         !isAuthenticated ? 'Authenticating...' :
         !isJoined ? 'Joining chat...' : 'Online'}
      </Text>

      {/* Messages list */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isFromMe={item.sender_id === user?.id}
          />
        )}
      />

      {/* Input */}
      <TextInput
        onSubmit Text={handleSend}
        editable={isJoined}
      />
    </View>
  );
}
```

---

## ⚙️ Configuration

### Socket URL

Update in `config/api.ts`:

```typescript
export const SOCKET_URL = 'http://localhost:3000';
```

### Environment-specific URLs

```typescript
const isDev = __DEV__;
export const SOCKET_URL = isDev
  ? 'http://localhost:3000'
  : 'https://api.synapse.com';
```

---

## 🐛 Troubleshooting

### Socket Not Connecting

1. Check if user is authenticated
2. Verify `SOCKET_URL` is correct
3. Check network connectivity
4. Review console logs for connection errors

### Messages Not Sending

1. Ensure socket is connected (`isConnected === true`)
2. Verify socket is authenticated (`isAuthenticated === true`)
3. Check if joined chat room (`isJoined === true`)
4. Review message payload format

### Not Receiving Messages

1. Verify you've joined the chat room
2. Check socket event listeners are registered
3. Ensure `chat_id` matches

---

## 🎯 Best Practices

1. **Always check `isJoined` before sending messages**
2. **Use optimistic UI updates for instant feedback**
3. **Handle socket reconnection gracefully**
4. **Clean up socket listeners on unmount**
5. **Show connection status to users**
6. **Auto-mark messages as delivered/read**
7. **Implement error handling and retries**

---

## 📦 Dependencies

```json
{
  "socket.io-client": "^4.x.x",
  "@react-native-async-storage/async-storage": "^2.x.x"
}
```

---

## ✅ Checklist

- [x] Socket.io-client installed
- [x] Socket service created
- [x] useSocket hook implemented
- [x] useChat hook implemented
- [x] Message types defined
- [x] Chat screen integrated
- [x] Connection status UI
- [x] Message status indicators
- [x] Optimistic UI updates
- [x] Error handling
- [x] Auto-reconnection

---

## 🎉 You're Ready!

Your WebSocket messaging system is now fully implemented and ready to use. All components are modular, reusable, and follow React best practices.

**Need help?** Review the code comments in each file for detailed explanations.
