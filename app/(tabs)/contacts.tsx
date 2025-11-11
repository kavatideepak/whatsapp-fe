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
import { createChat, getUsers } from '../../services/api';
import { User } from '../../types/api';
interface Contact {
  id: string;
  name: string;
  phone: string;
}

export default function ContactsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [initiatingChat, setInitiatingChat] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Extract params.contacts to a stable value
  const paramsContacts = params.contacts as string | undefined;

  // Fetch users from API only once on mount
  React.useEffect(() => {
    async function fetchContacts() {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers();
        
        // Transform API users to Contact format
        const transformedContacts: Contact[] = response.data.users.map((user: User) => ({
          id: user.id.toString(),
          name: user.name || user.phone_number,
          phone: user.phone_number,
        }));
        
        setContacts(transformedContacts);
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
        setError('Failed to load contacts');
        // Fallback to sample data on error
        setContacts([
          { id: '1', name: 'Aaron Josh', phone: '+91 9983655423' },
          { id: '2', name: 'Aaaron Hilton', phone: '+91 9122849573' },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, []); // Empty dependency array - fetch only once

  // Handle params separately to avoid re-fetching
  React.useEffect(() => {
    if (paramsContacts) {
      try {
        const passedContacts = JSON.parse(paramsContacts) as Contact[];
        setContacts(passedContacts);
        setLoading(false);
      } catch (err) {
        console.error('Failed to parse passed contacts:', err);
      }
    }
  }, [paramsContacts]);

  async function openChat(item: Contact) {
    if (!currentUser?.id) {
      Alert.alert('Error', 'Please log in to start a chat');
      return;
    }

    try {
      setInitiatingChat(item.id);
      
      // Call the API to create/get chat
      const response = await createChat(
        parseInt(item.id),
        false // is_group is false for individual chats
      );

      console.log('Chat created/retrieved:', response.data.chat);

      // Navigate to chat screen with chat info
      router.push({
        pathname: '/contact-chat',
        params: { 
          contact: JSON.stringify(item),
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
      contact.phone.toLowerCase().includes(query)
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
            <Text style={styles.phone}>{String(item.phone ?? '')}</Text>
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
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(i) => i.id}
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
  sep: {
    height: 1,
    backgroundColor: 'transparent',
  },
});
