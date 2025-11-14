import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, Alert, ActivityIndicator, Keyboard, Modal, FlatList, TouchableOpacity } from 'react-native';
import KeyboardAvoidingWrapper from '../components/keyboard-avoiding-wrapper';
import { IconSymbol } from '../components/ui/icon-symbol';
import { Colors } from '../constants/theme';
import { requestOtp } from '../services/api';
import type { ApiError } from '../types/api';
import { useTheme } from '../hooks/useTheme';

interface Country {
  id: string;
  name: string;
  code: string;
}

const COUNTRIES: Country[] = [
  { id: 'IN', name: 'India', code: '+91' },
  { id: 'US', name: 'United States', code: '+1' },
  { id: 'GB', name: 'United Kingdom', code: '+44' },
  { id: 'CA', name: 'Canada', code: '+1' },
  { id: 'AU', name: 'Australia', code: '+61' },
  { id: 'DE', name: 'Germany', code: '+49' },
  { id: 'FR', name: 'France', code: '+33' },
  { id: 'JP', name: 'Japan', code: '+81' },
  { id: 'CN', name: 'China', code: '+86' },
  { id: 'SG', name: 'Singapore', code: '+65' },
  { id: 'AE', name: 'United Arab Emirates', code: '+971' },
  { id: 'SA', name: 'Saudi Arabia', code: '+966' },
  { id: 'ZA', name: 'South Africa', code: '+27' },
  { id: 'BR', name: 'Brazil', code: '+55' },
  { id: 'MX', name: 'Mexico', code: '+52' },
  { id: 'ES', name: 'Spain', code: '+34' },
  { id: 'IT', name: 'Italy', code: '+39' },
  { id: 'RU', name: 'Russia', code: '+7' },
  { id: 'KR', name: 'South Korea', code: '+82' },
  { id: 'NL', name: 'Netherlands', code: '+31' },
];

export default function VerifyPhoneScreen() {
  const { colors } = useTheme();
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // India as default
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWhatsMyNumber = () => {
    // Handle "What's my number?" click
    console.log('What\'s my number clicked');
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  };

  const handleNext = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    const fullPhoneNumber = `${selectedCountry.code}${phoneNumber}`;
    
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
    <KeyboardAvoidingWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Enter your phone number</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Synapse will need to verify your phone number. Carrier charges may apply.{' '}
            <Text style={[styles.link, { color: colors.accent }]} onPress={handleWhatsMyNumber}>
              What's my number?
            </Text>
          </Text>
        </View>

        {/* Country Selector */}
        <Pressable style={[styles.countrySelector, { borderBottomColor: colors.separator }]} onPress={() => setShowCountryPicker(true)}>
          <View style={styles.countryDisplay}>
            <Text style={[styles.countrySelectorText, { color: colors.text }]}>{selectedCountry.name}</Text>
          </View>
          <IconSymbol
            name="chevron.down"
            size={24}
            color={colors.text}
            style={styles.dropdownIcon}
          />
        </Pressable>

        {/* Phone Input Container */}
        <View style={styles.phoneInputContainer}>
          {/* Country Code */}
          <View style={[styles.countryCodeContainer, { borderBottomColor: colors.text }]}>
            <Text style={[styles.countryCodeText, { color: colors.text }]}>{selectedCountry.code}</Text>
          </View>

          {/* Phone Number Input */}
          <TextInput
            style={[styles.phoneInput, { borderBottomColor: colors.text, color: colors.text, backgroundColor: colors.background }]}
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              // Automatically close keyboard when 10 digits are entered
              if (text.length === 10) {
                Keyboard.dismiss();
              }
            }}
            placeholderTextColor={colors.textSecondary}
            maxLength={10}
          />
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

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, { borderBottomColor: colors.separator }]}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.countryCodeInList, { color: colors.textSecondary }]}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create<{[key: string]: any}>({
  container: {
    flex: 1,
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
  },
  description: {
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.22,
    textAlign: 'center',
  },
  link: {
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.22,
  },
  countrySelector: {
    marginTop: 34,
    height: 48,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  countryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  countrySelectorText: {
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 17,
    letterSpacing: -0.34,
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
    justifyContent: 'center',
  },
  countryCodeText: {
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 17, // 100% of fontSize
    letterSpacing: -0.34, // -2% of fontSize
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    marginLeft: 12,
    borderBottomWidth: 0.33,
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 17, // 100% of fontSize
    letterSpacing: -0.34, // -2% of fontSize
  },
  buttonContainer: {
    paddingHorizontal: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SF Pro Text',
  },
  countryCodeInList: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
  },
});