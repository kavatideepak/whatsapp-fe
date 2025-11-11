import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View
} from 'react-native';
import KeyboardAvoidingWrapper from '../components/keyboard-avoiding-wrapper';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { verifyOtp } from '../services/api';
import type { ApiError } from '../types/api';

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams();
  const phoneNumber = (params.phoneNumber as string) || '';
  const { login } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create refs for each TextInput with proper typing
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleWrongNumber = () => {
    router.back();
  };

  const handleChangeOtp = (value: string, index: number) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace') {
      // If current input is empty and we're not at the first input
      if (!otp[index] && index > 0) {
        // Move to previous input
        inputRefs.current[index - 1]?.focus();
        
        // Clear the previous input
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else if (otp[index]) {
        // If current input has value, clear it
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    // Validate OTP
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }

    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number is missing. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOtp(phoneNumber, otpCode);
      console.log('OTP verified successfully:', response);
      
      // Store the authentication token and user data using auth context
      await login(response.token, response.user);
      
      console.log('Stored auth data:', {
        token: response.token,
        userId: response.user.id,
        phoneNumber: response.user.phone_number
      });
      
      // Navigate to next screen (upload photo) and pass phone number
      router.push({
        pathname: '/upload-photo',
        params: { phoneNumber }
      });
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Verification Failed',
        apiError.message || 'Invalid OTP. Please try again.'
      );
      console.error('Failed to verify OTP:', error);
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
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
          <Text style={styles.title}>Verifying your number</Text>
          <Text style={styles.description}>
            Waiting to automatically detect 6-digit code sent by SMS to{' '}
            <Text style={styles.phoneNumber}>{phoneNumber || '+91 8373627890'}</Text>.{' '}
            <Text style={styles.link} onPress={handleWrongNumber}>
              Wrong number?
            </Text>
          </Text>
        </View>

        {/* OTP Input Container */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null
              ]}
              placeholder=""
              keyboardType="number-pad"
              value={digit}
              onChangeText={(value) => handleChangeOtp(value, index)}
              onKeyPress={(e: NativeSyntheticEvent<TextInputKeyPressEventData>) => 
                handleKeyPress(e, index)
              }
              maxLength={1}
              placeholderTextColor="#999"
              textAlign="center"
              autoFocus={index === 0}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              selectTextOnFocus={true}
            />
          ))}
        </View>

           <View style={styles.resendCodeSection}>
            <Text style={styles.link} onPress={handleWrongNumber}>
              Didn’t receive code? Resend code
            </Text>
        </View>
      </View>

      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleVerifyOtp}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  innerContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  headerSection: {
    alignItems: 'center',
    gap: 6,
    marginTop: 114,
  },
  resendCodeSection : {
        alignItems: 'center',
    gap: 6,
    marginTop: 34,
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
  phoneNumber: {
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.22,
    color: '#1A1A1A',
  },
  link: {
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.22,
    color: '#016EEB',
  },
  otpContainer: {
    marginTop: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderRadius: 24,  // Circular shape
    borderWidth: 1,
    borderColor: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 17,
    letterSpacing: -0.34,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: '#1A1A1A',
    borderWidth: 1.6,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 56,
  },
  buttonContainerWithKeyboard: {
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  headerSectionCompact: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
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
