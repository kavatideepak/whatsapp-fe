import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';

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
  /**
   * Show profile picture instead of logo
   * @default false
   */
  showProfile?: boolean;
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
  showProfile = false,
}: TabHeaderProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Debug: Log user profile pic
  React.useEffect(() => {
    if (showProfile) {
      console.log('👤 TabHeader - User profile_pic:', user?.profile_pic);
      console.log('👤 TabHeader - User data:', JSON.stringify(user, null, 2));
    }
  }, [user?.profile_pic, showProfile]);
  
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

  const handleProfilePress = () => {
    router.push('/(tabs)/settings');
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      {/* App Logo or Profile Picture */}
      {showProfile && user ? (
        <Pressable onPress={handleProfilePress} style={styles.profileContainer}>
          {user.profile_pic ? (
            <Image
              source={{ uri: user.profile_pic }}
              style={styles.profilePic}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.profilePicPlaceholder, { backgroundColor: colors.avatarBackground }]}>
              <Ionicons name="person" size={20} color={colors.avatarText} />
            </View>
          )}
        </Pressable>
      ) : (
        <Image
          source={require('../assets/images/Logo_icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      )}

      {/* Action Buttons */}
      <View style={styles.headerIcons}>
        {showMenuButton && (
          <Pressable 
            style={[styles.iconButton, { backgroundColor: colors.iconButtonBackground }]}
            onPress={handleMenuPress}
            accessibilityLabel="Menu"
            accessibilityRole="button"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.icon} />
          </Pressable>
        )}
        
        {showAddButton && (
          <Pressable
            style={[styles.iconButton, { backgroundColor: colors.bubbleSent }]}
            onPress={handleAddPress}
            accessibilityLabel="Add contact"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color={colors.buttonPrimaryText} />
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
  },
  logo: {
    width: 46.87,
    height: 24.7,
  },
  profileContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  profilePicPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
