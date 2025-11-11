import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

interface TabHeaderProps {
  /**
   * Optional callback for the menu button (ellipsis)
   * If not provided, button will be shown but do nothing
   */
  onMenuPress?: () => void;
  /**
   * Optional callback for the add button (+)
   * If not provided, defaults to navigating to /add-contacts
   */
  onAddPress?: () => void;
  /**
   * Show/hide the add button
   * @default true
   */
  showAddButton?: boolean;
  /**
   * Show/hide the menu button
   * @default true
   */
  showMenuButton?: boolean;
}

/**
 * TabHeader Component
 * 
 * Reusable header component for tab screens with logo and action buttons.
 * Used across Chat, Contacts, and other tab screens for consistency.
 * 
 * Features:
 * - App logo on the left
 * - Menu button (ellipsis) on the right
 * - Add button (+) on the right
 * - Responsive design for all device sizes
 * - Customizable button actions and visibility
 */
export function TabHeader({
  onMenuPress,
  onAddPress,
  showAddButton = true,
  showMenuButton = true,
}: TabHeaderProps) {
  const handleAddPress = () => {
    if (onAddPress) {
      onAddPress();
    } else {
      // Default action: navigate to add-contacts screen
      router.push('/add-contacts');
    }
  };

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    }
    // If no callback provided, button just shows but does nothing
  };

  return (
    <View style={styles.header}>
      {/* App Logo */}
      <Image
        source={require('../assets/images/Logo_icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Action Buttons */}
      <View style={styles.headerIcons}>
        {showMenuButton && (
          <Pressable 
            style={styles.iconButton}
            onPress={handleMenuPress}
            accessibilityLabel="Menu"
            accessibilityRole="button"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#1A1A1A" />
          </Pressable>
        )}
        
        {showAddButton && (
          <Pressable
            style={[styles.iconButton, styles.plusButton]}
            onPress={handleAddPress}
            accessibilityLabel="Add contact"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 62,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 46.87,
    height: 24.7,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 48,
    backgroundColor: 'rgba(26, 26, 26, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    backgroundColor: '#1A1A1A',
  },
});
