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

  // Filter contacts based on search query
  const filteredContacts = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.phone_number.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.department?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const renderItem = ({ item }: { item: Contact }) => {
    const isLoading = initiatingChat === item.id;
    
    return (
      <TouchableOpacity 
        onPress={() => openChat(item)} 
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <View style={styles.contactRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{String(item.name?.charAt(0) ?? '')}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{String(item.name ?? '')}</Text>
            <Text style={styles.phone}>{String(item.phone_number ?? '')}</Text>
            {item.department && (
              <Text style={styles.department}>{item.department}</Text>
            )}
          </View>
          {/* {isLoading ? (
            <ActivityIndicator size="small" color="#1A1A1A" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#B2B2B2" />
          )} */}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <TabHeader />

      {/* Title */}
      <Text style={styles.title}>Contacts</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#767779" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a contact"
          placeholderTextColor="#767779"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="people-outline" size={64} color="#D0D0D0" />
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'No contacts match your search' : 'Add contacts from your company directory to start chatting'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/add-contacts')}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Add Contacts</Text>
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
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: 'SF Pro Text',
  },
  searchContainer: {
    height: 43,
    backgroundColor: '#F4F4F4',
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
    color: '#1A1A1A',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#767779',
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
    backgroundColor: '#E6E6E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  phone: {
    marginTop: 2,
    fontSize: 13,
    color: '#767779',
  },
  department: {
    marginTop: 1,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#767779',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  addButton: {
    marginTop: 24,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sep: {
    height: 1,
    backgroundColor: 'transparent',
  },
});
