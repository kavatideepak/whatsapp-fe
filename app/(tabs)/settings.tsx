import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const { user, token, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to login/onboarding screen
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
      <ThemedText style={[styles.title, { color: colors.text }]}>Settings</ThemedText>
      
      {isAuthenticated && user ? (
        <View style={styles.infoSection}>
          <Text style={[styles.label, { color: colors.text }]}>User Information:</Text>
          <Text style={[styles.info, { color: colors.textSecondary }]}>User ID: {user.id}</Text>
          <Text style={[styles.info, { color: colors.textSecondary }]}>Phone: {user.phone_number}</Text>
          <Text style={[styles.info, { color: colors.textSecondary }]}>Name: {user.name || 'Not set'}</Text>
          <Text style={[styles.info, { color: colors.textSecondary }]}>Email: {user.email || 'Not set'}</Text>
          <Text style={[styles.info, { color: colors.textSecondary }]}>About: {user.about || 'Not set'}</Text>
          
          <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Token:</Text>
          <Text style={[styles.tokenText, { color: colors.textTertiary }]} numberOfLines={2}>
            {token ? `${token.substring(0, 50)}...` : 'No token'}
          </Text>

          <Pressable style={[styles.logoutButton, { backgroundColor: colors.error }]} onPress={handleLogout}>
            <Text style={[styles.logoutText, { color: colors.textInverse }]}>Logout</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={[styles.info, { color: colors.textSecondary }]}>Not authenticated</Text>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  infoSection: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    marginBottom: 6,
    paddingLeft: 8,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 6,
    paddingLeft: 8,
  },
  logoutButton: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});