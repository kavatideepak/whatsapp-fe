import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';

interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  enabled?: boolean;
  behavior?: 'height' | 'position' | 'padding';
  dismissKeyboardOnTap?: boolean; // New prop to control TouchableWithoutFeedback
}

export default function KeyboardAvoidingWrapper({
  children,
  style,
  enabled = true,
  behavior = Platform.OS === 'ios' ? 'padding' : undefined,
  dismissKeyboardOnTap = true, // Default to true for backward compatibility
}: KeyboardAvoidingWrapperProps) {
  if (!enabled) {
    return <View style={style}>{children}</View>;
  }

  // If dismissKeyboardOnTap is false, just use KeyboardAvoidingView without TouchableWithoutFeedback
  if (!dismissKeyboardOnTap) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, style]}
        behavior={behavior}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={behavior}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>{children}</View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});