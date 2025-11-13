// app/(tabs)/contacts.tsx  (or wherever your contacts tab file is)
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// removed ThemedText import to avoid ambiguity
import { ThemedView } from '../../components/themed-view'; // keep ThemedView if it returns a View
import { TabHeader } from '../../components/tab-header';
import { useAuth } from '../../context/AuthContext';
import { createChat, getUserContacts } from '../../services/api';
import { User } from '../../types/api';
import { useTheme } from '@/hooks/useTheme';

interface Contact {
  id: number;
  name: string;
  phone_number: string;
  email?: string;
  department?: string;
  job_title?: string;
  profile_pic?: string;
  added_at?: string;
}

export default function ContactsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [initiatingChat, setInitiatingChat] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch user's added contacts from API
  React.useEffect(() => {
    async function fetchContacts() {
      try {
        setLoading(true);
        setError(null);
        const response = await getUserContacts();
        
        // Contacts are already in the correct format from the API
        setContacts(response.data.contacts);
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
        setError('Failed to load contacts');
        setContacts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, []);

  async function openChat(item: Contact) {
    if (!currentUser?.id) {
      Alert.alert('Error', 'Please log in to start a chat');
      return;
    }

    try {
      setInitiatingChat(item.id);
      
      // Call the API to create/get chat
      const response = await createChat(
        item.id, // Already a number
        false // is_group is false for individual chats
      );

      console.log('Chat created/retrieved:', response.data.chat);

      // Navigate to chat screen with chat info
      router.push({
        pathname: '/contact-chat',
        params: { 
          contact: JSON.stringify({
            id: item.id.toString(),
            name: item.name,
            phone: item.phone_number
          }),
          chatId: response.data.chat.id.toString(),
        },
      });
    } catch (err: any) {
      console.error('Failed to initiate chat:', err);
      Alert.alert(
        'Error',
        err?.message || 'Failed to start chat. Please try again.'
      );
    } finally {
      setInitiatingChat(null);
    }
  }

  // Filter contacts based on search query and exclude self user
  const filteredContacts = React.useMemo(() => {
    // First, exclude the logged-in user from the list
    const contactsWithoutSelf = contacts.filter(
      contact => contact.id !== currentUser?.id
    );
    
    if (!searchQuery.trim()) {
      return contactsWithoutSelf;
    }
    
    const query = searchQuery.toLowerCase();
    return contactsWithoutSelf.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.phone_number.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.department?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery, currentUser?.id]);

  const renderItem = ({ item }: { item: Contact }) => {
    const isLoading = initiatingChat === item.id;
    
    return (
      <TouchableOpacity 
        onPress={() => openChat(item)} 
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <View style={styles.contactRow}>
          <View style={[styles.avatar, { backgroundColor: colors.avatarBackground }]}>
            <Text style={[styles.avatarText, { color: colors.avatarText }]}>{String(item.name?.charAt(0) ?? '')}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]}>{String(item.name ?? '')}</Text>
            <Text style={[styles.phone, { color: colors.textSecondary }]}>{String(item.phone_number ?? '')}</Text>
            {item.department && (
              <Text style={[styles.department, { color: colors.textTertiary }]}>{item.department}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <TabHeader />

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>Contacts</Text>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundTertiary }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search for a contact"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="people-outline" size={64} color={colors.iconDisabled} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No contacts yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {searchQuery ? 'No contacts match your search' : 'Add contacts from your company directory to start chatting'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={() => router.push('/add-contacts')}
              activeOpacity={0.8}
            >
              <Text style={[styles.addButtonText, { color: colors.buttonPrimaryText }]}>Add Contacts</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(i) => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </ThemedView>
  );
}

const window = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: 'SF Pro Text',
  },
  searchContainer: {
    height: 43,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 43,
    fontSize: 14,
    fontFamily: 'SF Pro Text',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  phone: {
    marginTop: 2,
    fontSize: 13,
  },
  department: {
    marginTop: 1,
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  addButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sep: {
    height: 1,
    backgroundColor: 'transparent',
  },
});
