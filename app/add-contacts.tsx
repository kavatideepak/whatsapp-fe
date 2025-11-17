// add-contacts.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
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
import { matchContacts, addCorporateContacts, getCorporateContacts, getUserContacts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

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
  is_already_added?: boolean;
};

type ContactSection = {
  title: string;
  data: CorporateContact[];
};

export default function AddContactsScreen() {
  const { colors } = useTheme();
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
  const [chooseMode, setChooseMode] = React.useState(false);
  const [addedContactIds, setAddedContactIds] = React.useState<Set<number>>(new Set());

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

        // Fetch user's already added contacts
        const userContactsResponse = await getUserContacts();
        const userContactIds = new Set<number>(
          (userContactsResponse.data?.contacts || []).map((c: any) => Number(c.corporate_contact_id))
        );
        setAddedContactIds(userContactIds);

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
              synapse_user_id: contact.synapse_user_id || null,
              is_already_added: userContactIds.has(contact.id)
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

  function toggleSelect(id: number, isOnSynapse: boolean, isAlreadyAdded: boolean) {
    // Don't allow selection if already added
    if (isAlreadyAdded) {
      return;
    }

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

  // Filter contacts based on search query
  const filteredContacts = React.useMemo(() => {
    if (!query.trim()) return matchedContacts;
    const q = query.toLowerCase().trim();
    return matchedContacts.filter(contact => 
      contact.name.toLowerCase().includes(q) || 
      contact.phone_number.toLowerCase().includes(q)
    );
  }, [matchedContacts, query]);

  const renderItem = ({ item }: { item: CorporateContact }) => {
    const isSelected = !!selected[item.id];
    const isOnSynapse = item.is_on_synapse;
    const isSelf = item.synapse_user_id === currentUser?.id; // Check if this is the logged-in user
    const isAlreadyAdded = item.is_already_added || false;
    
    // Check if profile_pic is a valid URL
    const isValidUrl = (url?: string) => {
      if (!url) return false;
      return url.startsWith('http://') || url.startsWith('https://');
    };

    const hasValidProfilePic = isValidUrl(item.profile_pic);
    
    return (
      <View>
        <Pressable 
          style={[styles.contactRow, (!isOnSynapse || isAlreadyAdded) && styles.contactRowDisabled]}
          onPress={() => chooseMode ? toggleSelect(item.id, isOnSynapse, isAlreadyAdded) : null}
          disabled={!isOnSynapse || !chooseMode || isAlreadyAdded}
        >
          {/* Checkbox or Checkmark icon */}
          {chooseMode && (
            isAlreadyAdded ? (
              // Show checkmark icon for already added contacts
              <View style={styles.checkboxPlaceholder}>
                <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
              </View>
            ) : (
              // Show checkbox for selectable contacts
              <View style={[styles.checkbox, isSelected && { borderColor: colors.accent }]}>
                {isSelected && (
                  <View style={[styles.checkboxInner, { backgroundColor: colors.accent }]} />
                )}
              </View>
            )
          )}

          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: hasValidProfilePic ? 'transparent' : colors.avatarBackground, overflow: 'hidden' }]}>
            {hasValidProfilePic ? (
              <Image source={{ uri: item.profile_pic }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.avatarText }]}>
                {item.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            )}
          </View>

          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: colors.text }, (!isOnSynapse || isAlreadyAdded) && [styles.textDisabled, { color: colors.textSecondary }]]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.contactPhone, { color: colors.textSecondary }, (!isOnSynapse || isAlreadyAdded) && styles.textDisabled]} numberOfLines={1}>
              {item.phone_number}
            </Text>
          </View>

          {/* Show "Added" label for already added contacts */}
          {isAlreadyAdded && (
            <Text style={[styles.addedLabel, { color: colors.textSecondary }]}>
              Added
            </Text>
          )}

          {/* Checkmark on right (only when not in choose mode and selected) */}
          {!chooseMode && isSelected && (
            <View style={[styles.checkmarkCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          )}
        </Pressable>
        
        {/* Dotted separator in choose mode */}
        {/* {chooseMode && (
          <View style={[styles.dottedSeparator, { borderColor: colors.accent }]} />
        )} */}
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.background }]}>
          <Text style={[styles.topText, { color: colors.text }]}>
            We found {synapseCount} of your device contacts already on Synapse. Add them to your Synapse contacts list to start collaborating.
          </Text>
          {isOnboarding && (
            <Pressable 
              onPress={() => router.push('/setup-success')} 
              style={styles.skipButton}
            >
              <Text style={[styles.skipButtonText, { color: colors.accent }]}>Skip</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.content}>
          <View style={[styles.searchContainer, { backgroundColor: colors.iconButtonBackground }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for contact"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>

          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.text} />
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            </View>
          ) : matchedContacts.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons name="people-outline" size={64} color={colors.iconDisabled} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No contacts found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                No matching contacts found on Synapse.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => renderItem({ item })}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.footer}>
          {chooseMode ? (
            <>
              <Pressable
                style={[styles.chooseButton, { backgroundColor: colors.background, borderColor: colors.accent }]}
                onPress={() => {
                  // Add all contacts to selection (excluding already added)
                  const allSelected: Record<number, boolean> = {};
                  matchedContacts.forEach(contact => {
                    if (contact.is_on_synapse && !contact.is_already_added) {
                      allSelected[contact.id] = true;
                    }
                  });
                  setSelected(allSelected);
                }}
              >
                <Text style={[styles.chooseButtonText, { color: colors.accent }]}>Add all {synapseCount} contacts</Text>
              </Pressable>

              <Pressable
                style={[styles.addAllButton, { backgroundColor: colors.text }, (adding || selectedCount === 0) && styles.buttonDisabled]}
                onPress={handleAddContacts}
                disabled={adding || selectedCount === 0}
              >
                <Text style={[styles.addAllButtonText, { color: colors.background }]}>
                  {adding ? 'Adding...' : `Add selected (${selectedCount})`}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={[styles.chooseButton, { backgroundColor: colors.background, borderColor: colors.text }]}
                onPress={() => setChooseMode(true)}
              >
                <Text style={[styles.chooseButtonText, { color: colors.text }]}>Choose contacts</Text>
              </Pressable>

              <Pressable
                style={[styles.addAllButton, { backgroundColor: colors.text }, adding && styles.buttonDisabled]}
                onPress={async () => {
                  // Select all and add (excluding already added)
                  const allSelected: Record<number, boolean> = {};
                  matchedContacts.forEach(contact => {
                    if (contact.is_on_synapse && !contact.is_already_added) {
                      allSelected[contact.id] = true;
                    }
                  });
                  setSelected(allSelected);
                  
                  // Wait for state to update then add
                  setTimeout(() => {
                    const selectedIds = Object.keys(allSelected).map(id => parseInt(id));
                    if (selectedIds.length === 0) {
                      Alert.alert('No Contacts', 'No contacts available to add.');
                      return;
                    }

                    setAdding(true);
                    addCorporateContacts(selectedIds)
                      .then(response => {
                        setAdding(false);
                        const { added, existing } = response.data;
                        Alert.alert(
                          'Success',
                          `✓ ${added.length} contact(s) added${existing.length > 0 ? `\n${existing.length} already in your list` : ''}`,
                          [
                            {
                              text: 'OK',
                              onPress: () => {
                                router.push('/(tabs)/contacts');
                              }
                            }
                          ]
                        );
                        setSelected({});
                      })
                      .catch((error: any) => {
                        setAdding(false);
                        Alert.alert('Error', error.message || 'Failed to add contacts');
                      });
                  }, 100);
                }}
                disabled={adding}
              >
                <Text style={[styles.addAllButtonText, { color: colors.background }]}>
                  {adding ? 'Adding...' : `Add all ${synapseCount} contacts`}
                </Text>
              </Pressable>
            </>
          )}
        </View>
    </ThemedView>
  );
}

const window = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingTop: 62,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    paddingRight: 8,
  },
  skipButton: {
    paddingVertical: 4,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
  },
  statusBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
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
    textAlign: 'center',
  },
  emptyText: {
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
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    height: '100%',
  },
  listContent: {
    paddingBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  contactRowDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxPlaceholder: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dottedSeparator: {
    marginLeft: 16,
    marginRight: 16,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: 'SF Pro Text',
  },
  textDisabled: {
    opacity: 0.5,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedLabel: {
    fontSize: 14,
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  chooseButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chooseButtonText: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
  },
  addAllButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAllButtonText: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
