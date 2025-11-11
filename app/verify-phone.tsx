import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, Alert, ActivityIndicator } from 'react-native';
import KeyboardAvoidingWrapper from '../components/keyboard-avoiding-wrapper';
import { IconSymbol } from '../components/ui/icon-symbol';
import { Colors } from '../constants/theme';
import { requestOtp } from '../services/api';
import type { ApiError } from '../types/api';

export default function VerifyPhoneScreen() {
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWhatsMyNumber = () => {
    // Handle "What's my number?" click
    console.log('What\'s my number clicked');
  };

  const handleCountrySelect = () => {
    setShowCountryPicker(!showCountryPicker);
  };

  const handleNext = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    
    setIsLoading(true);
    try {
      const response = await requestOtp(fullPhoneNumber);
      console.log('OTP requested successfully:', response);
      
      // Navigate to OTP verification screen and pass the phone number
      router.push({
        pathname: '/verify-otp',
        params: { phoneNumber: fullPhoneNumber }
      });
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Error',
        apiError.message || 'Failed to send OTP. Please try again.'
      );
      console.error('Failed to request OTP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Enter your phone number</Text>
          <Text style={styles.description}>
            Synapse will need to verify your phone number. Carrier charges may apply.{' '}
            <Text style={styles.link} onPress={handleWhatsMyNumber}>
              What's my number?
            </Text>
          </Text>
        </View>

        {/* Country Selector */}
        <Pressable style={styles.countrySelector} onPress={handleCountrySelect}>
          <Text style={styles.countrySelectorText}>{selectedCountry}</Text>
          <IconSymbol
            name="chevron.down"
            size={24}
            color="#1A1A1A"
            style={styles.dropdownIcon}
          />
        </Pressable>

        {/* Phone Input Container */}
        <View style={styles.phoneInputContainer}>
          {/* Country Code */}
          <View style={styles.countryCodeContainer}>
            <Text style={styles.countryCodeText}>{countryCode}</Text>
          </View>

          {/* Phone Number Input */}
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Next</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create<{[key: string]: any}>({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    gap: 6,
    marginTop: 114,
  },
  title: {
    maxWidth: 303,
    fontFamily: 'SF Pro Text',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A1A',
  },
  description: {
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.22,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  link: {
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.22,
    color: '#016EEB',
  },
  countrySelector: {
    marginTop: 34,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#C2C3CB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  countrySelectorText: {
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 17, // 100% of fontSize
    letterSpacing: -0.34, // -2% of fontSize
    color: '#1A1A1A',
    textAlign: 'center',  // Center the text inside the space
    flex: 1,  // Make the text container flexible to take up space and center the text
    
  },
  dropdownIcon: {
    width: 24,
    height: 24,
    opacity: 1,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  countryCodeContainer: {
    width: 60,
    height: 48,
    borderBottomWidth: 0.33,
    borderBottomColor: '#1A1A1A',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 17, // 100% of fontSize
    letterSpacing: -0.34, // -2% of fontSize
    color: '#1A1A1A',
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    marginLeft: 12,
    borderBottomWidth: 0.33,
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 17, // 100% of fontSize
    letterSpacing: -0.34, // -2% of fontSize
    color: '#1A1A1A',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'SF Pro Text',
  },
});