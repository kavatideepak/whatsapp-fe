// add-contacts.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { ThemedView } from '../components/themed-view';
import { matchContacts, addCorporateContacts } from '../services/api';

type CorporateContact = {
  id: number;
  name: string;
  phone_number: string;
  email?: string;
  department?: string;
  job_title?: string;
  profile_pic?: string;
  matched: boolean;
};

export default function AddContactsScreen() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<Record<number, boolean>>({});
  const [contacts, setContacts] = React.useState<CorporateContact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  // Fetch device contacts and match with corporate contacts
  React.useEffect(() => {
    async function fetchAndMatchContacts() {
      try {
        setLoading(true);
        setError(null);

        // Fetch device contacts if permission granted
        const { status } = await Contacts.getPermissionsAsync();
        let devicePhoneNumbers: string[] = [];
        
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers],
          });

          // Extract all phone numbers from device contacts
          data.forEach(contact => {
            if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
              contact.phoneNumbers.forEach(phoneNumber => {
                const phoneNum = phoneNumber.number || phoneNumber.digits || '';
                if (phoneNum) {
                  devicePhoneNumbers.push(phoneNum);
                }
              });
            }
          });
        }

        // Match device phone numbers with corporate contacts
        const response = await matchContacts(devicePhoneNumbers);
        const matchedContacts = response.data.matches.map((contact: any) => ({
          ...contact,
          matched: true
        }));

        setContacts(matchedContacts);
      } catch (err: any) {
        console.error('Failed to fetch and match contacts:', err);
        setError(err.message || 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }

    fetchAndMatchContacts();
  }, []);

  // Derived filtered list
  const filtered = React.useMemo(() => {
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || 
             c.phone_number.toLowerCase().includes(q) ||
             c.email?.toLowerCase().includes(q) ||
             c.department?.toLowerCase().includes(q)
    );
  }, [query, contacts]);

  function toggleSelect(id: number) {
    setSelected((s) => {
      const next = { ...s };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  // Handle adding contacts to user's list
  const handleAddContacts = async () => {
    const selectedContactIds = Object.keys(selected).filter(id => selected[parseInt(id)]).map(id => parseInt(id));
    
    if (selectedContactIds.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to add.');
      return;
    }

    try {
      setAdding(true);

      const response = await addCorporateContacts(selectedContactIds);

      setAdding(false);

      const { added, existing } = response.data;

      Alert.alert(
        'Success',
        `✓ ${added.length} contact(s) added${existing.length > 0 ? `\n${existing.length} already in your list` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to contacts tab
              router.push('/(tabs)/contacts');
            }
          }
        ]
      );

      // Clear selection
      setSelected({});
    } catch (error: any) {
      setAdding(false);
      Alert.alert('Error', error.message || 'Failed to add contacts');
    }
  };

  const selectedCount = Object.keys(selected).length;

  const renderItem = ({ item }: { item: CorporateContact }) => {
    const isSelected = !!selected[item.id];
    
    return (
      <View style={styles.contactRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleSelect(item.id)}
          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
        >
          {isSelected ? (
            <Ionicons name="checkmark" size={14} color="#fff" />
          ) : (
            <View />
          )}
        </TouchableOpacity>

        <View style={styles.contactInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.name}
            </Text>
            <Ionicons name="briefcase-outline" size={14} color="#6B7280" style={{ marginLeft: 6 }} />
          </View>
          <Text style={styles.contactDetail} numberOfLines={1}>
            {item.job_title || ''}{item.job_title && item.department ? ' • ' : ''}{item.department || ''}
          </Text>
          {item.email && (
            <Text style={styles.contactEmail} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.topText}>
            These are your teammates from the company directory who are in your phone contacts.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#1A1A1A" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#767779" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts"
              placeholderTextColor="#767779"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
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
          ) : filtered.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons name="people-outline" size={64} color="#D0D0D0" />
              <Text style={styles.emptyText}>No matching contacts found</Text>
              <Text style={styles.emptySubtext}>
                Make sure you've granted contacts permission and have company contacts in your phone.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(i) => i.id.toString()}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {selectedCount > 0 && (
          <View style={styles.footer}>
            <Pressable
              style={[styles.addButton, adding && styles.buttonDisabled]}
              onPress={handleAddContacts}
              disabled={adding}
            >
              <Text style={styles.addButtonText}>
                {adding ? 'Adding...' : `Add ${selectedCount} contact${selectedCount > 1 ? 's' : ''}`}
              </Text>
            </Pressable>
          </View>
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
  topBar: {
    paddingTop: 62,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  topText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'SF Pro Text',
    color: '#1A1A1A',
    fontWeight: '400',
  },
  closeButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#767779',
    textAlign: 'center',
  },
  emptyText: {
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
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 6,
    height: 46,
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'SF Pro Text',
    color: '#1A1A1A',
    height: '100%',
  },
  listContent: {
    paddingBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 13,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#B2B2B2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    color: '#1A1A1A',
    fontWeight: '600',
    maxWidth: window.width - 170,
  },
  contactDetail: {
    marginTop: 2,
    fontSize: 14,
    color: '#767779',
    fontFamily: 'SF Pro Text',
  },
  contactEmail: {
    marginTop: 1,
    fontSize: 13,
    color: '#999',
    fontFamily: 'SF Pro Text',
  },
  separator: {
    height: 1,
    backgroundColor: 'transparent',
  },
  footer: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
    backgroundColor: 'transparent',
    paddingBottom: 45,
    paddingTop: 8,
  },
  addButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
  },
});
