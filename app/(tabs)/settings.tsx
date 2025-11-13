import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

const THEME_COLORS = [
  { id: 1, color: '#1A1A1A', name: 'Default' },
  { id: 2, color: '#B33A93', name: 'Purple' },
  { id: 3, color: '#059866', name: 'Green' },
  { id: 4, color: '#0080A3', name: 'Blue' },
];

export default function SettingsScreen() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedTheme, setSelectedTheme] = useState(1); // Default theme selected

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/onboarding');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Profile Section */}
      {isAuthenticated && user && (
        <View style={[styles.profileSection, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.avatarBackground }]}>
            {user.profile_pic ? (
              <Image source={{ uri: user.profile_pic }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={40} color={colors.avatarText} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user.name || 'No name'}
            </Text>
            <Text style={[styles.profileAbout, { color: colors.textSecondary }]}>
              {user.about || 'Hey there! I am using Synapse'}
            </Text>
          </View>
          <Ionicons name="qr-code-outline" size={24} color={colors.accent} />
        </View>
      )}

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Account</Text>
          
          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="key-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Privacy</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Last seen, profile photo, about
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Security</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Two-step verification, change number
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="person-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Account</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Delete my account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Appearance</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="color-palette-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContentFull}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Chat Theme</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary, marginBottom: 16 }]}>
                Personalize your chat with color themes
              </Text>
              
              {/* Theme Color Selector */}
              <View style={styles.themeColorContainer}>
                {THEME_COLORS.map((theme) => (
                  <Pressable
                    key={theme.id}
                    style={[
                      styles.themeColorOption,
                      selectedTheme === theme.id && [styles.themeColorSelected, { borderColor: colors.accent }]
                    ]}
                    onPress={() => setSelectedTheme(theme.id)}
                  >
                    <View style={[styles.themeColorCircle, { backgroundColor: theme.color }]}>
                      {selectedTheme === theme.id && (
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={[styles.themeColorName, { color: colors.textSecondary }]}>
                      {theme.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="image-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Wallpaper</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Chats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Chats</Text>
          
          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="archive-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Archived</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="download-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Storage and data</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Network usage, auto-download
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Notifications</Text>
          
          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Message, group & call tones
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Support</Text>
          
          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="help-circle-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Help</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="mail-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Invite a friend</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Pressable 
            style={[styles.logoutButton, { backgroundColor: colors.error }]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
            Synapse v1.0.0
          </Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
    marginBottom: 4,
  },
  profileAbout: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingIcon: {
    width: 32,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingContentFull: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SF Pro Text',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'SF Pro Text',
  },
  divider: {
    height: 0.5,
    marginLeft: 44,
  },
  themeColorContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  themeColorOption: {
    alignItems: 'center',
    gap: 8,
  },
  themeColorSelected: {
    transform: [{ scale: 1.05 }],
  },
  themeColorCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  themeColorName: {
    fontSize: 12,
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutIcon: {
    marginRight: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appVersion: {
    fontSize: 13,
    fontFamily: 'SF Pro Text',
  },
});