import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const handleGetStarted = () => {
    // Navigate to phone verification
    router.push('/verify-phone');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={require('../assets/images/synapse_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/onbaording_banner.png')}
          style={styles.banner}
          resizeMode="cover"
        />
      </View>

      <View style={styles.contentSection}>
        <View>
          <Text style={styles.heading}>
            Effortless collaboration that brings teams together
          </Text>

          <Text style={styles.description}>
            Synapse helps you connect instantly, share ideas effortlessly, and stay aligned with your team in one secure space. Collaboration becomes smooth, fast, and distraction-free—so work flows naturally.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    maxHeight: '50%',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 40
  },
  banner: {
    width: width-100,
    flex: 1,
    marginBottom: 20
  },
  contentSection: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  heading: {
    height: 72,
    fontFamily: `"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif`,
    fontWeight: '600',
    fontSize: 26,
    lineHeight: 36,
    letterSpacing: -1,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  description: {
    fontFamily: `"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif`,
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 24,
    color: '#8E8E93',
    marginBottom: 24,
  },
  buttonContainer: {
    paddingBottom: 32,
    width: '100%',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'SF Pro Text',
  },
});