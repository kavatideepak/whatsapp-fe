# Socket Quick Reference Guide

## Initialization

```typescript
import { initializeSocket } from '@/services/socket';

// Initialize with user ID (not token!)
const socket = initializeSocket(userId);
```

## Using in Components

### Basic Setup
```typescript
import { useSocket } from '@/hooks/useSocket';
import { useChat } from '@/hooks/useChat';

function ChatScreen() {
  // 1. Initialize socket (happens automatically when authenticated)
  const { isConnected, isAuthenticated } = useSocket();
  
  // 2. Use chat hook (no need to join rooms!)
  const { messages, sendMessage, markAsRead, setTyping, typingUsers } = useChat({
    chatId: 123,
    autoMarkDelivered: true,
    autoMarkRead: true, // Auto-mark as read when visible
  });
  
  // 3. Send messages
  const handleSend = (text: string) => {
    sendMessage(text, 'text');
  };
  
  // 4. Mark as read manually (if autoMarkRead is false)
  const handleMarkRead = (messageIds: number[]) => {
    markAsRead(messageIds);
  };
  
  // 5. Send typing indicator
  const handleTyping = () => {
    setTyping(true); // or false to stop
  };
  
  // 6. Check who's typing
  if (typingUsers.size > 0) {
    console.log('Someone is typing...');
  }
}
```

## Sending Messages

```typescript
// Simple text message
sendMessage('Hello!', 'text');

// Message is sent via socket automatically
// Status updates: sending → sent → delivered → read
```

## Presence Tracking

```typescript
import { getSocket, getPresenceInfo } from '@/services/socket';

// Request presence for users
getPresenceInfo([userId1, userId2]);

// Listen for updates
const socket = getSocket();

socket?.on('presence_updated', (data) => {
  console.log(`User ${data.user_id} is ${data.is_online ? 'online' : 'offline'}`);
});

socket?.on('presence_info', (presenceData) => {
  // Array of { user_id, is_online, last_seen }
});
```

## Typing Indicators

```typescript
import { sendTypingIndicator } from '@/services/socket';

// Start typing
sendTypingIndicator(chatId, true);

// Stop typing
sendTypingIndicator(chatId, false);

// Or use the hook
const { setTyping } = useChat({ chatId });
setTyping(true); // automatically stops after 3 seconds
```

## Message Status

### Reading Status Updates
```typescript
const socket = getSocket();

socket?.on('message_status_updated', (data) => {
  // data: { message_id, status: 'delivered' | 'read', user_id }
  console.log(`Message ${data.message_id} is now ${data.status}`);
});
```

### Status Icons (WhatsApp-like)
```typescript
// In your render function:
const renderStatus = (message: Message) => {
  if (message.status === 'sending') return '🕐';
  if (message.status === 'sent') return '✓';
  if (message.status === 'delivered') return '✓✓'; // gray
  if (message.status === 'read') return '✓✓'; // blue
  if (message.status === 'failed') return '⚠️';
};
```

## Available Socket Events

### Emit (Send to Server)
- `user_authenticated` - Authenticate with user ID
- `send_message` - Send a message
- `message_delivered` - Mark message as delivered
- `message_read` - Mark message as read
- `bulk_mark_read` - Mark multiple messages as read
- `typing` - Send typing indicator
- `get_presence` - Request presence info
- `delete_message` - Delete a message
- `user_disconnect` - Manual disconnect

### Listen (Receive from Server)
- `new_message` - New message received
- `message_sent` - Your message was sent
- `message_status_updated` - Message status changed
- `user_typing` - Someone is typing
- `presence_updated` - User online/offline status changed
- `presence_info` - Presence data response
- `message_deleted` - Message was deleted
- `pending_messages_delivered` - Offline messages delivered

## Common Patterns

### Display Online Status
```typescript
const [isOnline, setIsOnline] = useState(false);
const [lastSeen, setLastSeen] = useState<string | null>(null);

useEffect(() => {
  const socket = getSocket();
  
  socket?.on('presence_updated', (data) => {
    if (data.user_id === contactId) {
      setIsOnline(data.is_online);
      setLastSeen(data.last_seen);
    }
  });
  
  // Request initial presence
  getPresenceInfo([contactId]);
}, [contactId]);

// Display
const status = isOnline ? 'Online' : `Last seen ${formatTime(lastSeen)}`;
```

### Handle Typing Indicator
```typescript
const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

useEffect(() => {
  const socket = getSocket();
  
  socket?.on('user_typing', (data) => {
    if (data.chat_id === currentChatId) {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (data.is_typing) {
          next.add(data.user_id);
        } else {
          next.delete(data.user_id);
        }
        return next;
      });
    }
  });
}, [currentChatId]);

// Display
{typingUsers.size > 0 && <Text>Typing...</Text>}
```

### Auto-mark Messages as Read
```typescript
const { messages, markAsRead } = useChat({
  chatId,
  autoMarkRead: false, // manual control
});

// When messages are visible
useEffect(() => {
  const unreadIds = messages
    .filter(m => m.sender_id !== currentUserId && m.status !== 'read')
    .map(m => Number(m.id));
  
  if (unreadIds.length > 0) {
    markAsRead(unreadIds);
  }
}, [messages]);
```

## Troubleshooting

### Socket not connecting?
1. Check `useSocket()` hook is used at app level
2. Verify user is authenticated (has user.id)
3. Check SOCKET_URL in config

### Messages not appearing?
1. Verify `useChat()` hook is active
2. Check chatId is valid
3. Monitor console for `new_message` events
4. No need to join rooms manually!

### Presence not updating?
1. Call `getPresenceInfo()` on chat open
2. Listen to `presence_updated` events
3. Check contact IDs are correct

### Typing indicator not working?
1. Call `setTyping(true)` when typing starts
2. Call `setTyping(false)` when typing stops
3. Listen to `user_typing` events from others

## Performance Tips

1. **Debounce typing indicators** - Don't send on every keystroke
2. **Batch read receipts** - Use `bulkMarkMessagesRead()` instead of individual calls
3. **Request presence once** - Cache and listen for updates
4. **Clean up listeners** - Always remove event listeners on unmount
5. **Optimize re-renders** - Use React.memo for message components

## Security Notes

- User ID is sent for authentication (backend validates via JWT context)
- Messages are delivered only to authorized users
- Backend validates all permissions before delivery
- Personal rooms (`user:${userId}`) ensure privacy
