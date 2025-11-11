import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import KeyboardAvoidingWrapper from '../components/keyboard-avoiding-wrapper';
import { Colors } from '../constants/theme';

export default function ContactPermissionsScreen() {
  const { width } = useWindowDimensions();
  const horizontalPadding = 24;
  const contentWidth = width - (horizontalPadding * 2);
  const bannerWidth = Math.min(230, contentWidth * 0.5); // 70% of content width, max 230
  const buttonWidth = (contentWidth - 8) / 2; // 8px gap between buttons

  return (
    <KeyboardAvoidingWrapper style={styles.container}>
      <View style={styles.content}>
        {/* Banner Section */}
        <View style={styles.bannerSection}>
          <Image
            source={require('../assets/images/undraw_check-boxes.png')}
            style={[styles.banner, { width: bannerWidth, height: bannerWidth * 0.787 }]} // maintain aspect ratio
            resizeMode="contain"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textSection}>
          <Text style={styles.mainText}>
            Synapse needs access to your device contacts to help you connect with your teammates.
          </Text>
          <Text style={styles.subText}>
            This helps identify your device contacts who are already on Synapse and lets you add them to your in-app contact list.
          </Text>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable 
            style={[styles.button, styles.skipButton, { width: buttonWidth }]}
            onPress={() => router.push('/setup-success')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </Pressable>
          <Pressable 
            style={[styles.button, styles.allowButton, { width: buttonWidth }]}
            onPress={() => router .push('/setup-success')}
          >
            <Text style={styles.allowButtonText}>Allow access</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  bannerSection: {
    alignItems: 'center',
    marginTop: 144,
  },
  banner: {
    // width and height are calculated dynamically
  },
  textSection: {
    marginTop: 54,
    gap: 17,
  },
  mainText: {
    fontFamily: 'SF Pro Text',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 30,
    letterSpacing: -1,
    color: '#1A1A1A',
  },
  subText: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: '#1A1A1A',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
    paddingBottom: 56,
  },
  button: {
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  skipButton: {
    backgroundColor: '#EBEFF3',
  },
  allowButton: {
    backgroundColor: '#1A1A1A',
  },
  skipButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'SF Pro Text',
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'SF Pro Text',
  },
});