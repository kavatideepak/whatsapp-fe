import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
  View,
  Clipboard,
  Keyboard
} from 'react-native';
import KeyboardAvoidingWrapper from '../components/keyboard-avoiding-wrapper';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { verifyOtp, requestOtp } from '../services/api';
import type { ApiError } from '../types/api';

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams();
  const phoneNumber = (params.phoneNumber as string) || '';
  const { login } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [resendTimer, setResendTimer] = useState(120); // 60 seconds countdown
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Create refs for each TextInput with proper typing
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const clipboardCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-detect OTP from clipboard
  useEffect(() => {
    let isMounted = true;
    let checkCount = 0;
    const maxChecks = 30; // Check for 60 seconds (30 checks * 2 seconds)

    const checkClipboard = async () => {
      if (!isMounted || autoDetected || checkCount >= maxChecks) {
        if (clipboardCheckInterval.current) {
          clearInterval(clipboardCheckInterval.current);
        }
        return;
      }

      try {
        const clipboardContent = await Clipboard.getString();
        
        // Check if clipboard contains a 6-digit OTP
        // Match patterns like: "123456", "Your OTP: 123456", "Code: 123456", etc.
        const otpMatch = clipboardContent.match(/\b(\d{6})\b/);
        
        if (otpMatch && isMounted && !autoDetected) {
          const detectedOtp = otpMatch[1].split('');
          setOtp(detectedOtp);
          setAutoDetected(true);
          
          console.log('OTP auto-detected and filled');
          
          // Close keyboard when OTP is auto-filled
          Keyboard.dismiss();
          
          // Stop checking once detected
          if (clipboardCheckInterval.current) {
            clearInterval(clipboardCheckInterval.current);
          }
        }
        
        checkCount++;
      } catch (error) {
        console.log('Clipboard check error:', error);
      }
    };

    // Check clipboard immediately on mount
    checkClipboard();

    // Continue checking every 2 seconds
    clipboardCheckInterval.current = setInterval(checkClipboard, 2000);

    return () => {
      isMounted = false;
      if (clipboardCheckInterval.current) {
        clearInterval(clipboardCheckInterval.current);
      }
    };
  }, [autoDetected]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0 && !canResend) {
      timerInterval.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            if (timerInterval.current) {
              clearInterval(timerInterval.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [resendTimer, canResend]);

  const handleWrongNumber = () => {
    router.back();
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number is missing. Please go back and try again.');
      return;
    }

    setIsResending(true);
    try {
      await requestOtp(phoneNumber);
      
      // Reset timer and states
      setResendTimer(120);
      setCanResend(false);
      setAutoDetected(false);
      setOtp(['', '', '', '', '', '']);
      
      Alert.alert('Success', 'OTP has been resent to your phone number');
      inputRefs.current[0]?.focus();
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Error',
        apiError.message || 'Failed to resend OTP. Please try again.'
      );
      console.error('Failed to resend OTP:', error);
    } finally {
      setIsResending(false);
    }
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
    } else if (value && index === 5) {
      // Close keyboard when last digit is entered
      Keyboard.dismiss();
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
        phoneNumber: response.user.phone_number,
        hasName: !!response.user.name
      });
      
      // Check if user already has a name (returning user) or is new
      if (response.user.name) {
        // Returning user - skip profile setup and go to setup success
        console.log('Returning user detected, skipping profile setup');
        router.replace('/setup-success');
      } else {
        // New user - navigate to profile setup (upload photo/name)
        console.log('New user detected, navigating to profile setup');
        router.push({
          pathname: '/upload-photo',
          params: { phoneNumber }
        });
      }
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
            {canResend ? (
              <Text style={styles.link} onPress={handleResendOtp}>
                {isResending ? 'Sending...' : "Didn't receive code? Resend code"}
              </Text>
            ) : (
              <Text style={styles.timerText}>
                Resend code in {resendTimer}s
              </Text>
            )}
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
  timerText: {
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.22,
    color: '#666',
    textAlign: 'center',
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
