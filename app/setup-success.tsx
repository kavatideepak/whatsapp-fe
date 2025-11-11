import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { Colors } from '../constants/theme';
export default function SetupSuccessScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Calculate image sizes responsively while maintaining aspect ratio
  const backgroundSize = width * 0.75; // 80% of screen width

  return (
    <View style={styles.container}>
      {/* Center Success Images */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/images/success_stars_bg.png')}
          style={[styles.backgroundImage, { width: backgroundSize, height: backgroundSize }]}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/success_check.png')}
          style={styles.checkImage}
          resizeMode="contain"
        />
      </View>

      {/* Status Messages */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <View style={styles.checkIconContainer}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
          <Text style={styles.statusText}>Your profile setup is done!</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.checkIconContainer}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
          <Text style={styles.statusText}>We've added existing contacts to your Synapse contacts list.</Text>
        </View>
      </View>

      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.button}
          onPress={() => router.replace('/(tabs)/chat')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // For absolute positioning of check image
  },
  backgroundImage: {
    // width and height set dynamically

  },
  checkImage: {
    position: 'absolute',
    width: '27%', // 40% of the background image
    height: '20%',
    alignSelf: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 56,
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
  statusContainer: {
    paddingHorizontal: 28,
    marginBottom: 40,
    gap: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 23, // Match line height of text
  },
  checkIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 16,
    backgroundColor: '#1CB697',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4, // Add small top margin to align with text baseline
  },
  statusText: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23,
    color: '#1A1A1A',
  },
});