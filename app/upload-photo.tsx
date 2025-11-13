import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    Alert,
    ActivityIndicator,
} from 'react-native';
import KeyboardAvoidingWrapper from '../components/keyboard-avoiding-wrapper';
import { Colors } from '../constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { updateUser } from '../services/api';
import type { ApiError } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

export default function UploadPhotoScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const phoneNumber = (params.phoneNumber as string) || '';
  const { updateUser: updateAuthUser } = useAuth();
  
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadPhoto = () => {
    // Handle photo upload
    console.log('Upload photo');
  };

  const handleNext = async () => {
    // Validate name
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue');
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateUser(phoneNumber, { name: name.trim() });
      console.log('User profile updated successfully:', response);
      
      // Update the user in the auth context with the new data
      await updateAuthUser(response.user);
      
      // Navigate to contact permissions screen
      router.push('/contact-permissions');
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Update Failed',
        apiError.message || 'Failed to update profile. Please try again.'
      );
      console.error('Failed to update user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, { borderColor: colors.text }]}>
            <Image
              source={require('../assets/images/avatar.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          <Pressable onPress={handleUploadPhoto}>
            <Text style={[styles.uploadText, { color: colors.accent }]}>Upload your photo</Text>
          </Pressable>
        </View>

        {/* Name Input Section */}
        <View style={styles.nameSection}>
          <Text style={[styles.nameLabel, { color: colors.text }]}>Name</Text>
          <TextInput
            style={[styles.nameInput, { borderColor: colors.separator, backgroundColor: colors.background, color: colors.text }]}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Theme Selection Section */}
        <View style={styles.themeSection}>
          <Text style={[styles.themeLabel, { color: colors.text }]}>Choose a color theme</Text>
          <View style={styles.colorContainer}>
            <View style={[styles.colorOption, styles.selectedColorOption]}>
              <View style={[styles.colorCircle, { backgroundColor: '#1A1A1A' }]}>
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </View>
              </View>
            </View>
            <View style={[styles.colorOption, styles.unselectedColorOption]}>
              <View style={[styles.colorCircle, { backgroundColor: '#B33A93' }]} />
            </View>
            <View style={[styles.colorOption, styles.unselectedColorOption]}>
              <View style={[styles.colorCircle, { backgroundColor: '#059866' }]} />
            </View>
            <View style={[styles.colorOption, styles.unselectedColorOption]}>
              <View style={[styles.colorCircle, { backgroundColor: '#0080A3' }]} />
            </View>
          </View>
        </View>

        {/* Bottom Button */}
        <View style={styles.buttonContainer}>
          <Pressable 
            style={[styles.button, { backgroundColor: colors.text }, isLoading && styles.buttonDisabled]} 
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>Next</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 110, // Based on Figma, but using marginTop for responsiveness
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  uploadText: {
    marginTop: 10,
    fontFamily: 'SF Pro Text',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  nameSection: {
    marginTop: 50, // Adjusted for better spacing
    gap: 4,
  },
  nameLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  nameInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 0.33,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontFamily: 'SF Pro Text',
    fontSize: 17,
  },
  themeSection: {
    marginTop: 40,
  },
  themeLabel: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.3, // -2% of font size
    marginBottom: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 60,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderColor: '#016EEB',
  },
  unselectedColorOption: {
    borderColor: '#EBEFF7',
  },
  colorCircle: {
    width: 43.6363639831543,
    height: 43.6363639831543,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    width: 16,
    height: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    // paddingHorizontal: 12,
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 56,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'SF Pro Text',
  },
});