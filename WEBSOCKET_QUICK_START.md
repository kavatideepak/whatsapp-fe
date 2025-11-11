# 🚀 Quick Start Guide - WebSocket Messaging

## 📋 Summary

Complete WebSocket real-time messaging system with automatic connection management, chat rooms, and message status tracking.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Contact Screen                       │
│  User taps contact → POST /api/chats → Get chat_id      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      Chat Screen                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   useSocket  │  │    useChat   │  │   Messages   │  │
│  │   Hook       │─▶│     Hook     │─▶│   Display    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                 │                              │
│         ▼                 ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Socket Service (services/socket.ts)      │  │
│  └──────────────────────────────────────────────────┘  │
│         │                                               │
│         ▼                                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │            WebSocket Server                       │  │
│  │         (socket.io @ localhost:3000)              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Setup

### 1. Dependencies Installed ✅
```bash
npm install socket.io-client
```

### 2. Files Created ✅

- `services/socket.ts` - WebSocket manager
- `hooks/useSocket.ts` - Connection hook
- `hooks/useChat.ts` - Chat operations hook
- `types/api.ts` - Message & socket types
- `config/api.ts` - Socket URL config

### 3. Screens Updated ✅

- `app/(tabs)/contacts.tsx` - Initiates chat via API
- `app/contact-chat.tsx` - Real-time messaging

---

## 💬 Usage in 3 Steps

### Step 1: Initialize Socket (Automatic)

Socket automatically connects when user is authenticated.

```typescript
// Happens automatically in any component
const { isConnected, isAuthenticated } = useSocket();
```

### Step 2: Join Chat Room

```typescript
const {
  messages,
  sendMessage,
  isJoined
} = useChat({
  chatId: 5,
  autoJoin: true,
});
```

### Step 3: Send/Receive Messages

```typescript
// Send
sendMessage('Hello!', 'text');

// Receive (automatic)
// Messages appear in the `messages` array
```

---

## 🎯 Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| Auto Connect | ✅ | Connects when user logs in |
| Auto Join | ✅ | Joins chat room automatically |
| Send Messages | ✅ | Via socket with optimistic UI |
| Receive Messages | ✅ | Real-time via `new_message` event |
| Message Status | ✅ | Sending → Sent → Delivered → Read |
| Reconnection | ✅ | Automatic with exponential backoff |
| Error Handling | ✅ | Graceful error display |
| Loading States | ✅ | Connection & message loading |

---

## 🔄 Message Flow

```
User Action              Socket Event              Server Response
─────────────────────────────────────────────────────────────────
1. User logs in      →  authenticate (token)   →  authenticated ✓
                                                
2. Open chat         →  join_chat (chatId)     →  joined_chat ✓
                                                
3. Send message      →  send_message (data)    →  message_sent ✓
                                                
4. Receive message   ←  new_message (message)  ←  (from other user)
                                                
5. Mark delivered    →  message_delivered (id) →  (acknowledged)
```

---

## 📡 Socket Events

### Emit (Client → Server)

```typescript
// Authentication
socket.emit('authenticate', authToken);

// Join chat
socket.emit('join_chat', chatId);

// Send message
socket.emit('send_message', {
  chat_id: 5,
  content: 'Hello!',
  message_type: 'text',
  tempId: 'temp-123'
});

// Mark as delivered
socket.emit('message_delivered', { message_id: 42 });

// Mark as read
socket.emit('message_read', { message_id: 42 });
```

### Listen (Server → Client)

```typescript
// Authenticated successfully
socket.on('authenticated', () => {});

// Joined chat room
socket.on('joined_chat', ({ chatId }) => {});

// Message sent confirmation
socket.on('message_sent', ({ tempId, message }) => {});

// New message received
socket.on('new_message', ({ message }) => {});
```

---

## 🎨 UI States

### Connection Status (Header Subtitle)
- **Connecting...** - Establishing connection
- **Authenticating...** - Verifying token
- **Joining chat...** - Entering chat room
- **Online** - Ready to chat ✅

### Message Status (Right side of bubble)
- 🕐 **Sending** - Uploading to server
- ✓ **Sent** - Delivered to server
- ✓✓ **Delivered** - Received by recipient's device
- ✓✓ **Read** - Seen by recipient (blue ticks)
- ✗ **Failed** - Error sending

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Not connecting | Check `SOCKET_URL` in `config/api.ts` |
| Not authenticated | Verify user token is valid |
| Can't send messages | Ensure `isJoined === true` |
| Messages not appearing | Check console for socket events |
| Reconnection loops | Review server logs for errors |

---

## 📝 Example: Send a Message

```typescript
import { useChat } from '@/hooks/useChat';

function ChatScreen({ chatId }: { chatId: number }) {
  const { sendMessage, isJoined } = useChat({ chatId });
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || !isJoined) return;
    
    sendMessage(input.trim(), 'text');
    setInput('');
  };

  return (
    <>
      <TextInput
        value={input}
        onChangeText={setInput}
        editable={isJoined}
      />
      <Button
        onPress={handleSend}
        disabled={!isJoined || !input.trim()}
        title="Send"
      />
    </>
  );
}
```

---

## 🎯 Best Practices

1. ✅ Always check `isJoined` before sending
2. ✅ Show connection status to users
3. ✅ Use optimistic UI for instant feedback
4. ✅ Handle reconnections gracefully
5. ✅ Clean up on unmount
6. ✅ Log socket events for debugging

---

## 📞 Need Help?

1. Check console logs for socket events
2. Review `WEBSOCKET_IMPLEMENTATION.md` for details
3. Inspect code comments in source files
4. Verify server is running and accessible

---

## ✨ You're all set!

Your app now has production-ready real-time messaging! 🎉
