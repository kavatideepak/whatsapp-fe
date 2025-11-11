// app/(tabs)/contacts.tsx  (or wherever your contacts tab file is)
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// removed ThemedText import to avoid ambiguity
import { ThemedView } from '../../components/themed-view'; // keep ThemedView if it returns a View
import { getUsers } from '../../services/api';
import { User } from '../../types/api';
interface Contact {
  id: string;
  name: string;
  phone: string;
}

export default function ContactsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  function openChat(item: Contact) {
    router.push({
      pathname: '/contact-chat',
      params: { contact: JSON.stringify(item) },
    });
  }

  const renderItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity onPress={() => openChat(item)} activeOpacity={0.8}>
      <View style={styles.contactRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{String(item.name?.charAt(0) ?? '')}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{String(item.name ?? '')}</Text>
          <Text style={styles.phone}>{String(item.phone ?? '')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#B2B2B2" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Use RN Text for header to avoid custom component issues */}
      <Text style={styles.header}>Contacts</Text>

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
          data={contacts}
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
    paddingTop: 64,
    paddingHorizontal: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
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
    paddingBottom: 24,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
