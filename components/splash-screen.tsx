import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { SynapseLogo } from './icons/synapse-logo';

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Wait for auth to finish loading, then navigate
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          console.log('✅ User is authenticated, navigating to chat');
          router.replace('/(tabs)/chat');
        } else {
          console.log('❌ User not authenticated, navigating to onboarding');
          router.replace('/onboarding');
        }
      }, 2000); // 2 seconds delay for splash screen

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <SynapseLogo 
          width={200} 
          height={75.6} 
          isDark={colorScheme === 'dark'} 
        />
      </View>
      <Text style={[styles.poweredBy, { color: colors.textSecondary }]}>
        Powered by Graviti Pharma
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poweredBy: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'normal',
    marginBottom: 48,
    textAlign:'center',
  },
});