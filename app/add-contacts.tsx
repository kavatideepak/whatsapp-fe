// add-contacts.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
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
import { getUsers } from '../services/api';
import { User } from '../types/api';
import { useSocket } from '../hooks/useSocket';
import { getPresenceInfo } from '../services/socket';

type Contact = {
  id: string;
  name: string;
  phone: string;
  isAdded?: boolean; // already added in app
  isOnline?: boolean;
  lastSeen?: string;
  isDeviceContact?: boolean; // from device contacts
  isRegistered?: boolean; // registered on the app
};

export default function AddContactsScreen() {
  const router = useRouter();
  const { socket } = useSocket();
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Normalize phone number for comparison
  const normalizePhone = (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
  };

  // Fetch device contacts and merge with app users
  React.useEffect(() => {
    async function fetchAndMergeContacts() {
      try {
        setLoading(true);
        setError(null);

        // Fetch app users
        const response = await getUsers();
        const appUsers: User[] = response.data.users;

        // Create a map of app users by normalized phone number
        const appUsersMap = new Map<string, User>();
        appUsers.forEach(user => {
          const normalizedPhone = normalizePhone(user.phone_number);
          appUsersMap.set(normalizedPhone, user);
        });

        // Fetch device contacts if permission granted
        const { status } = await Contacts.getPermissionsAsync();
        let deviceContacts: Contacts.Contact[] = [];
        
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [
              Contacts.Fields.Name,
              Contacts.Fields.PhoneNumbers,
            ],
          });
          deviceContacts = data || [];
        }

        // Merge device contacts with app users
        const mergedContacts: Contact[] = [];
        const processedPhones = new Set<string>();

        // Process device contacts
        deviceContacts.forEach(contact => {
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            contact.phoneNumbers.forEach(phoneNumber => {
              const phoneNum = phoneNumber.number || phoneNumber.digits || '';
              if (!phoneNum) return;

              const normalizedPhone = normalizePhone(phoneNum);
              
              // Skip duplicates
              if (processedPhones.has(normalizedPhone)) return;
              processedPhones.add(normalizedPhone);

              const appUser = appUsersMap.get(normalizedPhone);
              const contactName = contact.name || phoneNum;

              if (appUser) {
                // Contact is registered on the app
                mergedContacts.push({
                  id: appUser.id.toString(),
                  name: appUser.name || contactName,
                  phone: appUser.phone_number,
                  isDeviceContact: true,
                  isRegistered: true,
                  isAdded: false,
                  isOnline: false,
                  lastSeen: undefined,
                });
              } else {
                // Contact not on the app
                mergedContacts.push({
                  id: `device_${normalizedPhone}`,
                  name: contactName,
                  phone: phoneNum,
                  isDeviceContact: true,
                  isRegistered: false,
                  isAdded: false,
                  isOnline: false,
                  lastSeen: undefined,
                });
              }
            });
          }
        });

        // Add app users that are not in device contacts
        appUsers.forEach(user => {
          const normalizedPhone = normalizePhone(user.phone_number);
          if (!processedPhones.has(normalizedPhone)) {
            mergedContacts.push({
              id: user.id.toString(),
              name: user.name || user.phone_number,
              phone: user.phone_number,
              isDeviceContact: false,
              isRegistered: true,
              isAdded: false,
              isOnline: false,
              lastSeen: undefined,
            });
          }
        });

        // Sort: registered contacts first, then by name
        mergedContacts.sort((a, b) => {
          if (a.isRegistered && !b.isRegistered) return -1;
          if (!a.isRegistered && b.isRegistered) return 1;
          return a.name.localeCompare(b.name);
        });

        setContacts(mergedContacts);
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
        setError('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }

    fetchAndMergeContacts();
  }, []);

  // Request presence for all registered contacts when loaded
  React.useEffect(() => {
    if (!socket || contacts.length === 0) return;

    const registeredContacts = contacts.filter(c => c.isRegistered);
    if (registeredContacts.length === 0) return;

    console.log('📡 Requesting presence for', registeredContacts.length, 'registered contacts');
    
    // Request presence for registered contacts only
    const contactIds = registeredContacts.map(contact => parseInt(contact.id));
    console.log('📡 Requesting presence for IDs:', contactIds);
    getPresenceInfo(contactIds);
  }, [socket, contacts.length]);

  // Listen for presence updates (separate effect to avoid dependency issues)
  React.useEffect(() => {
    if (!socket) return;

    // Listen for presence updates
    const handlePresenceUpdate = (data: { user_id: number; is_online: boolean; last_seen?: string }) => {
      console.log('📊 Presence updated in contacts list:', data);
      
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === data.user_id.toString()
            ? { ...contact, isOnline: data.is_online, lastSeen: data.last_seen }
            : contact
        )
      );
    };

    const handlePresenceInfo = (data: Array<{ user_id: number; is_online: boolean; last_seen?: string }> | { user_id: number; is_online: boolean; last_seen?: string }) => {
      console.log('📊 Presence info received in contacts list:', data);
      
      // Handle bulk presence info (array of users)
      if (Array.isArray(data)) {
        setContacts(prevContacts => 
          prevContacts.map(contact => {
            const presenceData = data.find(p => p.user_id === parseInt(contact.id));
            if (presenceData) {
              return { ...contact, isOnline: presenceData.is_online, lastSeen: presenceData.last_seen };
            }
            return contact;
          })
        );
      } else {
        // Handle single user presence info
        setContacts(prevContacts => 
          prevContacts.map(contact => 
            contact.id === data.user_id.toString()
              ? { ...contact, isOnline: data.is_online, lastSeen: data.last_seen }
              : contact
          )
        );
      }
    };

    socket.on('presence_updated', handlePresenceUpdate);
    socket.on('presence_info', handlePresenceInfo);

    return () => {
      socket.off('presence_updated', handlePresenceUpdate);
      socket.off('presence_info', handlePresenceInfo);
    };
  }, [socket]);

  // Derived filtered list
  const filtered = React.useMemo(() => {
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [query, contacts]);

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = { ...s };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  const selectedCount = Object.keys(selected).length;

  const renderItem = ({ item }: { item: Contact }) => {
    const isSelected = !!selected[item.id];
    
    // Format last seen like WhatsApp
    const formatLastSeen = () => {
      if (!item.isRegistered) {
        return 'Invite to Synapse';
      }
      if (item.isOnline) return 'Online';
      if (!item.lastSeen) return item.phone; // Show phone number if no presence data
      
      const lastSeenDate = new Date(item.lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Last seen just now';
      if (diffMins < 60) return `Last seen ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Last seen ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Last seen yesterday';
      if (diffDays < 7) return `Last seen ${diffDays} days ago`;
      
      return `Last seen ${lastSeenDate.toLocaleDateString()}`;
    };
    
    return (
      <View style={styles.contactRow}>
        {item.isRegistered && (
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
        )}

        {/* avatar + name/phone */}
        <View style={[styles.contactInfo, !item.isRegistered && styles.contactInfoFullWidth]}>
          <View style={styles.nameRow}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isAdded && <Text style={styles.addedLabel}>Added</Text>}
            {item.isDeviceContact && item.isRegistered && (
              <Ionicons name="phone-portrait-outline" size={14} color="#6B7280" style={{ marginLeft: 6 }} />
            )}
          </View>
          <Text 
            style={[
              styles.contactPhone, 
              item.isOnline && styles.onlineText,
              !item.isRegistered && styles.inviteText
            ]}
          >
            {formatLastSeen()}
          </Text>
        </View>

        {/* Invite button for non-registered contacts */}
        {!item.isRegistered && (
          <Pressable style={styles.inviteButton}>
            <Text style={styles.inviteButtonText}>Invite</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
        {/* top row: info + close */}
        <View style={styles.topBar}>
          <Text style={styles.topText}>
            Add contacts from Synapse directory to your contacts list in this app.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#1A1A1A" />
          </Pressable>
        </View>

        {/* main content */}
        <View style={styles.content}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#767779" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for contact"
              placeholderTextColor="#767779"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>

          {/* list */}
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
              data={filtered}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* footer sticky add button */}
        <View style={styles.footer}>
          <Pressable
            style={styles.addButton}
            onPress={() => {
    const selectedContacts = contacts.filter((c) => selected[c.id]);
    if (selectedContacts.length === 0) {
      // optional: show toast or avoid navigation
      return;
    }

    // Preferred: push to the contacts tab (works if contacts is in tabs)
    router.push({
      pathname: '/contacts',                 // or '/(tabs)/contacts' if needed
      params: { contacts: JSON.stringify(selectedContacts) },
    });

    // Alternative: replace so user doesn't stack add-contacts on top of tabs
    // router.replace({ pathname: '/contacts', params: { contacts: JSON.stringify(selectedContacts) }});
  }}
          >
            <Text style={styles.addButtonText}>Add selected ({selectedCount})</Text>
          </Pressable>
        </View>
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
  },
  errorText: {
    fontSize: 16,
    color: '#767779',
    textAlign: 'center',
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
    paddingBottom: 10, // space for footer
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
  contactInfoFullWidth: {
    marginLeft: 13,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    color: '#1A1A1A',
    fontWeight: '600',
    maxWidth: window.width - 170,
  },
  addedLabel: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
  },
  contactPhone: {
    marginTop: 2,
    fontSize: 14,
    color: '#767779',
    fontFamily: 'SF Pro Text',
  },
  onlineText: {
    color: '#25D366', // WhatsApp green for online status
  },
  inviteText: {
    color: '#1A73E8', // Blue color for invite text
    fontWeight: '500',
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
    maxWidth: 520,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#EBEFF3',
    borderRadius: 16,
  },
  inviteButtonText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
  },
});
