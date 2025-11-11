import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { router } from 'expo-router';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const FilterChip = ({ label, isActive, onPress }: FilterChipProps) => (
  <Pressable
    style={[styles.chip, isActive ? styles.activeChip : styles.inactiveChip]}
    onPress={onPress}
  >
    <ThemedText
      style={[
        styles.chipText,
        isActive ? styles.activeChipText : styles.inactiveChipText,
      ]}
    >
      {label}
    </ThemedText>
  </Pressable>
);

export default function ChatScreen() {
  const [activeFilter, setActiveFilter] = React.useState('All');
  const chats = []; // mock: no chats yet

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/Logo_icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#1A1A1A" />
          </Pressable>
          <Pressable style={[styles.iconButton, styles.plusButton]} onPress={() => router.push('/add-contacts')}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchAndFiltersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#767779" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#767779"
          />
        </View>

        <View style={[styles.filterContainer, styles.filterContent]}>
          <FilterChip
            label="All"
            isActive={activeFilter === 'All'}
            onPress={() => setActiveFilter('All')}
          />
          <FilterChip
            label="Unread"
            isActive={activeFilter === 'Unread'}
            onPress={() => setActiveFilter('Unread')}
          />
          <FilterChip
            label="Favourites"
            isActive={activeFilter === 'Favourites'}
            onPress={() => setActiveFilter('Favourites')}
          />
          <FilterChip
            label="Groups"
            isActive={activeFilter === 'Groups'}
            onPress={() => setActiveFilter('Groups')}
          />
          <FilterChip label="+" isActive={false} onPress={() => {}} />
        </View>
      </View>

      {/* Empty Chat Banner */}
      {chats.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <Image
            source={require('../../assets/images/empty_chat_banner.png')}
            style={styles.emptyBanner}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>
            No conversations yet. Let’s get the conversation started
          </Text>
          <Text style={styles.emptySubtitle}>Start a chat</Text>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 62,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  logo: {
    width: 46.87,
    height: 24.7,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 48,
    backgroundColor: 'rgba(26, 26, 26, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    backgroundColor: '#1A1A1A',
  },
  searchAndFiltersContainer: {
    paddingTop: 5,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    gap: 8,
  },
  searchContainer: {
    height: 43,
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 3,
  },
  searchInput: {
    flex: 1,
    height: 43,
    fontSize: 14,
    fontFamily: 'SF Pro Text',
    color: '#1A1A1A',
  },
  filterContainer: {
    height: 34,
    width: '100%',
    flexDirection: 'row',
    overflowX: 'scroll',
  },
  filterContent: {
    gap: 8,
    justifyContent: 'space-between',
  },
  chip: {
    height: 34,
    borderRadius: 19,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeChip: {
    backgroundColor: '#1A1A1A',
  },
  inactiveChip: {
    backgroundColor: '#F4F4F4',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
    letterSpacing: -0.14,
    lineHeight: 19,
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  inactiveChipText: {
    color: '#767779',
  },

  // 🟦 Empty state styles

  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 52,
    paddingBottom: 64
  },
  emptyBanner: {
    width: 300,
    height: 250,
    marginBottom: 24,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#016EEB',
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.22,
    textAlign: 'center',
  },
});
