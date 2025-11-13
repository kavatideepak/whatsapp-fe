// add-contacts.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Pressable,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { ThemedView } from '../components/themed-view';
import { matchContacts, addCorporateContacts, getCorporateContacts } from '../services/api';
import { useAuth } from '../context/AuthContext';

type CorporateContact = {
  id: number;
  name: string;
  phone_number: string;
  email?: string;
  department?: string;
  job_title?: string;
  profile_pic?: string;
  matched: boolean;
  is_on_synapse: boolean;
  synapse_user_id?: number | null;
};

type ContactSection = {
  title: string;
  data: CorporateContact[];
};

export default function AddContactsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: currentUser } = useAuth(); // Get logged-in user
  const isOnboarding = params.from === 'onboarding'; // Check if coming from onboarding
  
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<Record<number, boolean>>({});
  const [matchedContacts, setMatchedContacts] = React.useState<CorporateContact[]>([]);
  const [officeContacts, setOfficeContacts] = React.useState<CorporateContact[]>([]);
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

        // Fetch all corporate contacts and match with device contacts
        // Only call matchContacts if we have phone numbers to match
        const corporateResponse = await getCorporateContacts();
        let matchedContactsData = [];

        if (devicePhoneNumbers.length > 0) {
          const matchResponse = await matchContacts(devicePhoneNumbers);
          matchedContactsData = matchResponse.data?.matches || matchResponse.data || [];
        }

        const allCorporateContacts = corporateResponse.data?.contacts || corporateResponse.data || [];

        // Create a Set of matched contact IDs for quick lookup
        const matchedIds = new Set(matchedContactsData.map((c: any) => c.id));

        // Segregate contacts
        const matched: CorporateContact[] = [];
        const office: CorporateContact[] = [];

        if (Array.isArray(allCorporateContacts)) {
          allCorporateContacts.forEach((contact: any) => {
            const contactData = {
              ...contact,
              matched: matchedIds.has(contact.id),
              is_on_synapse: contact.is_on_synapse || false,
              synapse_user_id: contact.synapse_user_id || null
            };

            if (matchedIds.has(contact.id)) {
              matched.push(contactData);
            } else {
              office.push(contactData);
            }
          });
        }

        setMatchedContacts(matched);
        setOfficeContacts(office);
      } catch (err: any) {
        console.error('Failed to fetch and match contacts:', err);
        setError(err.message || 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }

    fetchAndMatchContacts();
  }, []);

  // Derived filtered list with sections
  const sections = React.useMemo((): ContactSection[] => {
    const filterContact = (c: CorporateContact, q: string) => 
      c.name.toLowerCase().includes(q) || 
      c.phone_number.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q);

    const q = query.toLowerCase().trim();
    const filteredMatched = q ? matchedContacts.filter(c => filterContact(c, q)) : matchedContacts;
    const filteredOffice = q ? officeContacts.filter(c => filterContact(c, q)) : officeContacts;

    const result: ContactSection[] = [];
    
    if (filteredMatched.length > 0) {
      result.push({
        title: 'In your contacts',
        data: filteredMatched
      });
    }
    
    if (filteredOffice.length > 0) {
      result.push({
        title: 'In your office',
        data: filteredOffice
      });
    }

    return result;
  }, [query, matchedContacts, officeContacts]);

  // Count how many contacts are on Synapse
  const synapseCount = React.useMemo(() => {
    const allContacts = [...matchedContacts, ...officeContacts];
    return allContacts.filter(c => c.is_on_synapse).length;
  }, [matchedContacts, officeContacts]);

  const totalCount = matchedContacts.length + officeContacts.length;

  function toggleSelect(id: number, isOnSynapse: boolean) {
    // Only allow selection if contact is on Synapse
    if (!isOnSynapse) {
      Alert.alert(
        'Not on Synapse',
        'This contact hasn\'t registered on Synapse yet. Only registered users can be added.',
        [{ text: 'OK' }]
      );
      return;
    }

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

      const { added, existing, failed } = response.data;

      // Show appropriate message based on results
      if (failed && failed.length > 0) {
        const notOnSynapseCount = failed.filter((f: any) => 
          f.error === 'This contact is not on Synapse yet'
        ).length;
        
        if (notOnSynapseCount > 0) {
          Alert.alert(
            'Some Contacts Not Added',
            `✓ ${added.length} contact(s) added successfully\n\n${notOnSynapseCount} contact(s) couldn't be added because they're not on Synapse yet.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  if (added.length > 0) {
                    router.push('/(tabs)/contacts');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', 'Some contacts could not be added. Please try again.');
        }
      } else {
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
      }

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
    const isOnSynapse = item.is_on_synapse;
    const isSelf = item.synapse_user_id === currentUser?.id; // Check if this is the logged-in user
    
    return (
      <View style={[styles.contactRow, !isOnSynapse && styles.contactRowDisabled]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleSelect(item.id, isOnSynapse)}
          style={[
            styles.checkbox, 
            isSelected && styles.checkboxSelected,
            !isOnSynapse && styles.checkboxDisabled
          ]}
          disabled={!isOnSynapse}
        >
          {isSelected ? (
            <Ionicons name="checkmark" size={14} color="#fff" />
          ) : (
            <View />
          )}
        </TouchableOpacity>

        <View style={styles.contactInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.contactName, !isOnSynapse && styles.textDisabled]} numberOfLines={1}>
              {item.name}
            </Text>
            {isSelf && (
              <Text style={styles.youBadge}> (You)</Text>
            )}
            {isOnSynapse ? (
              <View style={styles.synapseBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              </View>
            ) : (
              <View style={styles.notOnSynapseBadge}>
                <Text style={styles.notOnSynapseText}>Not on Synapse</Text>
              </View>
            )}
          </View>
          <Text style={[styles.contactDetail, !isOnSynapse && styles.textDisabled]} numberOfLines={1}>
            {item.job_title || ''}{item.job_title && item.department ? ' • ' : ''}{item.department || ''}
          </Text>
          {item.email && (
            <Text style={[styles.contactEmail, !isOnSynapse && styles.textDisabled]} numberOfLines={1}>
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
          <Pressable 
            onPress={() => isOnboarding ? router.push('/setup-success') : router.back()} 
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color="#1A1A1A" />
          </Pressable>
        </View>

        {/* Synapse status banner */}
        {!loading && totalCount > 0 && (
          <View style={styles.statusBanner}>
            <Ionicons name="people" size={16} color="#10B981" />
            <Text style={styles.statusText}>
              {synapseCount} of {totalCount} contacts on Synapse
            </Text>
          </View>
        )}

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
          ) : sections.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons name="people-outline" size={64} color="#D0D0D0" />
              <Text style={styles.emptyText}>No matching contacts found</Text>
              <Text style={styles.emptySubtext}>
                Make sure you've granted contacts permission and have company contacts in your phone.
              </Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => renderItem({ item })}
              renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{title}</Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
            />
          )}
        </View>

        <View style={styles.footer}>
          {selectedCount > 0 ? (
            <Pressable
              style={[styles.addButton, adding && styles.buttonDisabled]}
              onPress={handleAddContacts}
              disabled={adding}
            >
              <Text style={styles.addButtonText}>
                {adding ? 'Adding...' : `Add ${selectedCount} contact${selectedCount > 1 ? 's' : ''}`}
              </Text>
            </Pressable>
          ) : isOnboarding ? (
            <Pressable
              style={styles.skipButton}
              onPress={() => router.push('/setup-success')}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </Pressable>
          ) : null}
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
  statusBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    fontFamily: 'SF Pro Text',
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
  sectionHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#767779',
    fontFamily: 'SF Pro Text',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 13,
  },
  contactRowDisabled: {
    opacity: 0.5,
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
  checkboxDisabled: {
    borderColor: '#D0D0D0',
    backgroundColor: '#F5F5F5',
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
  youBadge: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    color: '#767779',
    fontWeight: '500',
    marginLeft: 4,
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
  textDisabled: {
    color: '#B2B2B2',
  },
  synapseBadge: {
    marginLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notOnSynapseBadge: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  notOnSynapseText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
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
  skipButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBEFF3',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
  },
});
