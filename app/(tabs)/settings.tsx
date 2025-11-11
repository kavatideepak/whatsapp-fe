import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { user, token, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

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
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Settings</ThemedText>
      
      {isAuthenticated && user ? (
        <View style={styles.infoSection}>
          <Text style={styles.label}>User Information:</Text>
          <Text style={styles.info}>User ID: {user.id}</Text>
          <Text style={styles.info}>Phone: {user.phone_number}</Text>
          <Text style={styles.info}>Name: {user.name || 'Not set'}</Text>
          <Text style={styles.info}>Email: {user.email || 'Not set'}</Text>
          <Text style={styles.info}>About: {user.about || 'Not set'}</Text>
          
          <Text style={[styles.label, { marginTop: 20 }]}>Token:</Text>
          <Text style={styles.tokenText} numberOfLines={2}>
            {token ? `${token.substring(0, 50)}...` : 'No token'}
          </Text>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.info}>Not authenticated</Text>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: '#767779',
    marginBottom: 6,
    paddingLeft: 8,
  },
  tokenText: {
    fontSize: 12,
    color: '#9A9A9A',
    fontFamily: 'monospace',
    marginBottom: 6,
    paddingLeft: 8,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});