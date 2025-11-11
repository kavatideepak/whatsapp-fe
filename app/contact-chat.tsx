// app/contact-chat.tsx
import KeyboardAvoidingWrapper from '@/components/keyboard-avoiding-wrapper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    FlatList,
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

type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
};

const SAMPLE_TEXTS = [
  'Hi! How are you doing today?',
  "I checked the records — looks fine.",
  "Do you need the report?",
  "I'll send it by EOD.",
  "Perfect, thank you!",
  "Let's touch base tomorrow.",
  "Noted. I'll follow up.",
  "Great — that helps a lot.",
  "Can you share the file?",
  "On it now.",
  "Looks good to me.",
  "Please review and confirm.",
  "Awesome 😄",
  "Will do.",
  "See you soon!",
];

export default function ContactChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const contact: Contact | null = React.useMemo(() => {
    if (params.contact) {
      try {
        return JSON.parse(params.contact as string) as Contact;
      } catch {
        return null;
      }
    }
    return null;
  }, [params]);

  // 🟢 messages state
  const [messages, setMessages] = React.useState<Message[]>(() =>
    Array.from({ length: 15 }).map((_, idx) => {
      const text = SAMPLE_TEXTS[idx % SAMPLE_TEXTS.length];
      const fromMe = idx % 2 === 0;
      const hour = 8 + Math.floor(idx / 2);
      const minute = (10 + idx * 3) % 60;
      const time = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`;
      return { id: String(idx + 1), text, fromMe, time };
    }).reverse()
  );

  const [input, setInput] = React.useState('');
  const flatListRef = React.useRef<FlatList>(null);

  // 🟢 handle send
  const handleSend = () => {
    if (!input.trim()) return;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newMsg: Message = {
      id: (messages.length + 1).toString(),
      text: input.trim(),
      fromMe: true,
      time,
    };

    setMessages((prev) => [newMsg, ...prev]); // prepend because list is inverted
    setInput('');

    // Scroll to bottom (newest message)
    setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const bubbleStyle = [
      styles.bubble,
      item.fromMe ? styles.bubbleRight : styles.bubbleLeft,
    ];
    const textStyle = [
      styles.bubbleText,
      item.fromMe ? styles.textRight : styles.textLeft,
    ];

    return (
      <View
        style={[
          styles.messageRow,
          item.fromMe
            ? { justifyContent: 'flex-end' }
            : { justifyContent: 'flex-start' },
        ]}
      >
        <View style={bubbleStyle}>
          <Text style={textStyle}>{item.text}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
    );
  };

return (
  <ThemedView style={styles.container}>
    <KeyboardAvoidingWrapper dismissKeyboardOnTap={false}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.contactName}>
              {contact?.name ?? 'Unknown'}
            </Text>
            <Text style={styles.contactSub}>{contact?.phone ?? ''}</Text>
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Input area */}
        <View style={styles.inputRow}>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor="#9A9A9A"
              value={input}
              onChangeText={setInput}
              multiline
            />
          </View>
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingWrapper>
  </ThemedView>
);

}

const window = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F7F7F7',
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

  listContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6, // leaves space for input area
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
    marginTop: 6,
    fontSize: 11,
    color: '#9A9A9A',
    textAlign: 'right',
  },

  inputRow: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
    backgroundColor: '#F7F7F7',
    paddingBottom: 10,
    paddingTop: 8,
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
