import * as Contacts from 'expo-contacts';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import AsyncStorageLib from '@react-native-async-storage/async-storage';

const SYNC_STORAGE_KEY = '@contact_sync_status';

export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors?: string[];
}

/**
 * Request contacts permission
 */
export async function requestContactsPermission(): Promise<boolean> {
  try {
    const { status: currentStatus } = await Contacts.getPermissionsAsync();
    
    if (currentStatus === 'granted') {
      return true;
    }

    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return false;
  }
}

/**
 * Check if we have WRITE permission (for syncing to device)
 */
export async function hasWritePermission(): Promise<boolean> {
  try {
    const { status } = await Contacts.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking write permission:', error);
    return false;
  }
}

/**
 * Open device settings for manual permission grant
 */
export async function openContactSettings() {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('Error opening settings:', error);
  }
}

/**
 * Sync a single contact to device
 */
export async function syncContactToDevice(contact: {
  name: string;
  phone: string;
  profilePic?: string;
  about?: string;
}): Promise<boolean> {
  try {
    const hasPermission = await hasWritePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable contacts access to sync contacts to your phone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openContactSettings }
        ]
      );
      return false;
    }

    // Check if contact already exists
    const existingContacts = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    const normalizedPhone = normalizePhone(contact.phone);
    const exists = existingContacts.data.some(c => 
      c.phoneNumbers?.some(p => 
        normalizePhone(p.number || '') === normalizedPhone
      )
    );

    if (exists) {
      console.log('Contact already exists on device:', contact.name);
      return true; // Already synced
    }

    // Create new contact
    const contactData: any = {
      [Contacts.Fields.FirstName]: contact.name,
      [Contacts.Fields.PhoneNumbers]: [{
        label: 'mobile',
        number: contact.phone,
      }],
    };

    // Add optional fields
    if (contact.about) {
      contactData[Contacts.Fields.Note] = `${contact.about}\n\nAdded from Synapse`;
    } else {
      contactData[Contacts.Fields.Note] = 'Added from Synapse';
    }

    // Add company
    contactData[Contacts.Fields.Company] = 'Synapse';

    await Contacts.addContactAsync(contactData);
    console.log('✅ Contact synced to device:', contact.name);
    return true;
  } catch (error) {
    console.error('Error syncing contact to device:', error);
    return false;
  }
}

/**
 * Bulk sync multiple contacts to device
 */
export async function bulkSyncToDevice(contacts: Array<{
  id: string;
  name: string;
  phone: string;
  profilePic?: string;
  about?: string;
}>): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    synced: 0,
    failed: 0,
    errors: []
  };

  try {
    const hasPermission = await hasWritePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable contacts access to sync contacts to your phone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openContactSettings }
        ]
      );
      return result;
    }

    // Get existing contacts to avoid duplicates
    const existingContacts = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    const existingPhones = new Set<string>();
    existingContacts.data.forEach(contact => {
      contact.phoneNumbers?.forEach(phone => {
        existingPhones.add(normalizePhone(phone.number || ''));
      });
    });

    // Sync each contact
    for (const contact of contacts) {
      try {
        const normalizedPhone = normalizePhone(contact.phone);
        
        // Skip if already exists
        if (existingPhones.has(normalizedPhone)) {
          console.log('Skipping existing contact:', contact.name);
          result.synced++; // Count as synced
          continue;
        }

        const success = await syncContactToDevice(contact);
        if (success) {
          result.synced++;
          existingPhones.add(normalizedPhone); // Add to set to avoid re-adding
        } else {
          result.failed++;
          result.errors?.push(`Failed to sync ${contact.name}`);
        }
      } catch (error: any) {
        result.failed++;
        result.errors?.push(`Error syncing ${contact.name}: ${error.message}`);
      }
    }

    result.success = result.synced > 0;
    return result;
  } catch (error: any) {
    console.error('Error in bulk sync:', error);
    result.errors?.push(`Bulk sync error: ${error.message}`);
    return result;
  }
}

/**
 * Mark contacts as synced in backend
 */
export async function markContactsAsSynced(contactIds: number[]): Promise<boolean> {
  try {
    const token = await AsyncStorageLib.getItem('@auth_token');
    if (!token) {
      console.error('No auth token found');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/contacts/sync`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ contact_user_ids: contactIds })
    });

    if (!response.ok) {
      console.error('Failed to mark contacts as synced:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking contacts as synced:', error);
    return false;
  }
}

/**
 * Save sync status locally
 */
export async function saveSyncStatus(contactIds: string[]) {
  try {
    const existing = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
    const synced = existing ? JSON.parse(existing) : [];
    const updated = [...new Set([...synced, ...contactIds])];
    await AsyncStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving sync status:', error);
  }
}

/**
 * Get locally synced contact IDs
 */
export async function getSyncedContactIds(): Promise<string[]> {
  try {
    const synced = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
    return synced ? JSON.parse(synced) : [];
  } catch (error) {
    console.error('Error getting synced contacts:', error);
    return [];
  }
}

/**
 * Normalize phone number for comparison
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '');
}

/**
 * Complete sync flow: sync to device + mark in backend + save locally
 */
export async function completeSyncFlow(contacts: Array<{
  id: string;
  name: string;
  phone: string;
  profilePic?: string;
  about?: string;
}>): Promise<SyncResult> {
  // Sync to device
  const result = await bulkSyncToDevice(contacts);

  if (result.synced > 0) {
    // Mark as synced in backend
    const contactIds = contacts.map(c => parseInt(c.id)).filter(id => !isNaN(id));
    await markContactsAsSynced(contactIds);

    // Save locally
    const contactStringIds = contacts.map(c => c.id);
    await saveSyncStatus(contactStringIds);
  }

  return result;
}
