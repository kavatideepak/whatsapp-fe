import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KeyboardAvoidingWrapper from '../components/keyboard-avoiding-wrapper';
import { Colors } from '../constants/theme';

const CONTACTS_PERMISSION_KEY = '@contacts_permission_requested';

export default function ContactPermissionsScreen() {
  const { width } = useWindowDimensions();
  const [isRequesting, setIsRequesting] = React.useState(false);
  const horizontalPadding = 24;
  const contentWidth = width - (horizontalPadding * 2);
  const bannerWidth = Math.min(230, contentWidth * 0.5); // 70% of content width, max 230
  const buttonWidth = (contentWidth - 8) / 2; // 8px gap between buttons

  const handleSkip = async () => {
    await AsyncStorage.setItem(CONTACTS_PERMISSION_KEY, 'skipped');
    router.push('/setup-success');
  };

  const handleAllowAccess = async () => {
    if (isRequesting) return;
    
    setIsRequesting(true);
    
    try {
      // Check current permission status
      const { status: currentStatus } = await Contacts.getPermissionsAsync();
      
      if (currentStatus === 'granted') {
        // Already granted, proceed to sync contacts
        await AsyncStorage.setItem(CONTACTS_PERMISSION_KEY, 'granted');
        router.push('/add-contacts?from=onboarding');
        return;
      }
      
      // Request permission
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Permission granted
        await AsyncStorage.setItem(CONTACTS_PERMISSION_KEY, 'granted');
        router.push('/add-contacts?from=onboarding');
      } else if (status === 'denied') {
        // Permission denied
        await AsyncStorage.setItem(CONTACTS_PERMISSION_KEY, 'denied');
        
        // Check if we can ask again (not permanently denied)
        const canAskAgain = await Contacts.getPermissionsAsync();
        
        if (canAskAgain.canAskAgain === false) {
          // Permanently denied - show alert to open settings
          Alert.alert(
            'Permission Required',
            'Synapse needs access to your contacts to help you connect with teammates. Please enable contacts access in Settings.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => router.push('/setup-success'),
              },
              {
                text: 'Open Settings',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                  // Navigate away after opening settings
                  setTimeout(() => router.push('/setup-success'), 500);
                },
              },
            ]
          );
        } else {
          // User denied but can ask again later
          Alert.alert(
            'Permission Denied',
            'You can enable contacts access later from the app settings.',
            [
              {
                text: 'OK',
                onPress: () => router.push('/setup-success'),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      Alert.alert(
        'Error',
        'Failed to request contacts permission. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => setIsRequesting(false),
          },
        ]
      );
    } finally {
      setIsRequesting(false);
    }
  };

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
            onPress={handleSkip}
            disabled={isRequesting}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </Pressable>
          <Pressable 
            style={[styles.button, styles.allowButton, { width: buttonWidth }, isRequesting && styles.buttonDisabled]}
            onPress={handleAllowAccess}
            disabled={isRequesting}
          >
            <Text style={styles.allowButtonText}>
              {isRequesting ? 'Requesting...' : 'Allow access'}
            </Text>
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
  buttonDisabled: {
    opacity: 0.6,
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