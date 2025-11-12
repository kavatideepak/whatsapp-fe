import { create } from 'zustand';
import * as Contacts from 'expo-contacts';

interface Contact {
  id: string;
  name: string;
  phone: string;
  isAdded?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  isDeviceContact?: boolean;
  isRegistered?: boolean;
  isSynced?: boolean;
}

interface ContactStore {
  // State
  contacts: Contact[];
  syncedContactIds: Set<string>;
  isSyncing: boolean;
  syncError: string | null;
  hasContactPermission: boolean;
  
  // Actions
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  markAsSynced: (contactIds: string[]) => void;
  setHasPermission: (hasPermission: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  clearContacts: () => void;
}

export const useContactStore = create<ContactStore>((set, get) => ({
  // Initial state
  contacts: [],
  syncedContactIds: new Set(),
  isSyncing: false,
  syncError: null,
  hasContactPermission: false,

  // Actions
  setContacts: (contacts) => set({ contacts }),

  addContact: (contact) => set((state) => ({
    contacts: [...state.contacts, contact]
  })),

  markAsSynced: (contactIds) => set((state) => {
    const newSyncedIds = new Set(state.syncedContactIds);
    contactIds.forEach(id => newSyncedIds.add(id));
    
    // Update contacts with synced status
    const updatedContacts = state.contacts.map(contact => 
      contactIds.includes(contact.id) 
        ? { ...contact, isSynced: true }
        : contact
    );

    return {
      syncedContactIds: newSyncedIds,
      contacts: updatedContacts
    };
  }),

  setHasPermission: (hasPermission) => set({ hasContactPermission: hasPermission }),

  setSyncing: (isSyncing) => set({ isSyncing }),

  setSyncError: (error) => set({ syncError: error }),

  clearContacts: () => set({ 
    contacts: [], 
    syncedContactIds: new Set(),
    syncError: null
  })
}));
