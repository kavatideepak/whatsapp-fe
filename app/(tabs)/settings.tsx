import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, Alert, TextInput, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../context/AuthContext';
import { useTheme, THEME_COLORS } from '@/hooks/useTheme';
import { uploadProfilePhoto, updateUser } from '@/services/api';
import type { ApiError } from '@/types/api';

export default function SettingsScreen() {
  const { user, isLoading, isAuthenticated, logout, updateUser: updateAuthUser } = useAuth();
  const router = useRouter();
  const { colors, selectedThemeId, selectTheme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isUploading, setIsUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAbout, setEditAbout] = useState(user?.about || '');
  const [isSaving, setIsSaving] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/onboarding');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAvatarPress = () => {
    // If profile pic exists, show viewer. Otherwise, trigger photo upload
    if (user?.profile_pic) {
      setImageViewerVisible(true);
    } else {
      handleChangePhoto();
    }
  };

  const handleChangePhoto = async () => {
    if (!user?.phone_number) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        try {
          console.log('📤 Uploading photo:', result.assets[0].uri);
          const response = await uploadProfilePhoto(
            user.phone_number,
            user.name || '',
            result.assets[0].uri
          );
          console.log('✅ Upload response:', JSON.stringify(response, null, 2));
          console.log('📸 New profile_pic URL:', response.user.profile_pic);
          await updateAuthUser(response.user);
          console.log('✅ User updated in auth context');
          Alert.alert('Success', 'Profile photo updated successfully');
        } catch (error) {
          const apiError = error as ApiError;
          Alert.alert('Upload Failed', apiError.message || 'Failed to upload photo');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleOpenEditProfile = () => {
    setEditName(user?.name || '');
    setEditAbout(user?.about || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.phone_number) return;

    setIsSaving(true);
    try {
      const response = await updateUser(user.phone_number, {
        name: editName.trim() || undefined,
        about: editAbout.trim() || undefined,
      });
      await updateAuthUser(response.user);
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert('Update Failed', apiError.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Profile Section */}
      {isAuthenticated && user && (
        <Pressable 
          style={[styles.profileSection, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}
          onPress={handleOpenEditProfile}
        >
          <Pressable onPress={handleAvatarPress} style={[styles.avatarContainer, { backgroundColor: colors.avatarBackground }]}>
            {isUploading ? (
              <ActivityIndicator color={colors.accent} />
            ) : user.profile_pic ? (
              <Image source={{ uri: user.profile_pic }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={40} color={colors.avatarText} />
            )}
            <View style={[styles.cameraIconContainer, { backgroundColor: colors.accent }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user.name || 'No name'}
            </Text>
            <Text style={[styles.profileAbout, { color: colors.textSecondary }]}>
              {user.about || 'Hey there! I am using Synapse'}
            </Text>
          </View>
          <Ionicons name="pencil" size={20} color={colors.accent} />
        </Pressable>
      )}

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Account</Text>
          
          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="key-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Privacy</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Last seen, profile photo, about
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Security</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Two-step verification, change number
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="person-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Account</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Delete my account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Appearance</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="color-palette-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContentFull}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Chat Theme</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary, marginBottom: 16 }]}>
                Personalize your chat with color themes
              </Text>
              
              {/* Theme Color Selector */}
              <View style={styles.themeColorContainer}>
                {THEME_COLORS.map((theme) => (
                  <Pressable
                    key={theme.id}
                    style={[
                      styles.themeColorOption,
                      selectedThemeId === theme.id && [styles.themeColorSelected, { borderColor: colors.accent }]
                    ]}
                    onPress={() => selectTheme(theme.id)}
                  >
                    <View style={[styles.themeColorCircle, { backgroundColor: theme.color }]}>
                      {selectedThemeId === theme.id && (
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={[styles.themeColorName, { color: colors.textSecondary }]}>
                      {theme.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="image-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Wallpaper</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Chats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Chats</Text>
          
          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="archive-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Archived</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="download-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Storage and data</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Network usage, auto-download
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Notifications</Text>
          
          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Message, group & call tones
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Support</Text>
          
          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="help-circle-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Help</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <Pressable style={[styles.settingItem, { backgroundColor: colors.background }]}>
            <Ionicons name="mail-outline" size={24} color={colors.iconSecondary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Invite a friend</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.iconTertiary} />
          </Pressable>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Pressable 
            style={[styles.logoutButton, { backgroundColor: colors.error }]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
            Synapse v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
            <Pressable onPress={() => setEditModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.accent }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <Pressable onPress={handleSaveProfile} disabled={isSaving}>
              <Text style={[styles.modalSave, { color: colors.accent }]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.inputBackground, 
                  color: colors.text,
                  borderColor: colors.separator 
                }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>About</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.inputBackground, 
                  color: colors.text,
                  borderColor: colors.separator 
                }]}
                value={editAbout}
                onChangeText={setEditAbout}
                placeholder="Enter your status"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          <Pressable 
            style={styles.imageViewerOverlay} 
            onPress={() => setImageViewerVisible(false)}
          />
          
          <View style={styles.imageViewerContent}>
            {/* Header */}
            <View style={[styles.imageViewerHeader, { backgroundColor: colors.background }]}>
              <View style={styles.imageViewerHeaderLeft}>
                <Text style={[styles.imageViewerName, { color: colors.text }]}>
                  {user?.name || 'Profile Photo'}
                </Text>
              </View>
              <Pressable 
                onPress={() => setImageViewerVisible(false)}
                style={styles.imageViewerCloseButton}
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
            </View>

            {/* Image */}
            <View style={styles.imageViewerImageContainer}>
              {user?.profile_pic && (
                <Image 
                  source={{ uri: user.profile_pic }} 
                  style={styles.imageViewerImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Footer Actions */}
            <View style={[styles.imageViewerFooter, { backgroundColor: colors.background }]}>
              <Pressable 
                style={[styles.imageViewerButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setImageViewerVisible(false);
                  setTimeout(() => handleChangePhoto(), 300);
                }}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.imageViewerButtonText}>Change Photo</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.imageViewerButton, { backgroundColor: colors.iconButtonBackground }]}
                onPress={() => {
                  setImageViewerVisible(false);
                  setTimeout(() => handleOpenEditProfile(), 300);
                }}
              >
                <Ionicons name="pencil" size={20} color={colors.text} />
                <Text style={[styles.imageViewerButtonText, { color: colors.text }]}>Edit Profile</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
    marginBottom: 4,
  },
  profileAbout: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingIcon: {
    width: 32,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingContentFull: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SF Pro Text',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'SF Pro Text',
  },
  divider: {
    height: 0.5,
    marginLeft: 44,
  },
  themeColorContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  themeColorOption: {
    alignItems: 'center',
    gap: 8,
  },
  themeColorSelected: {
    transform: [{ scale: 1.05 }],
  },
  themeColorCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  themeColorName: {
    fontSize: 12,
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutIcon: {
    marginRight: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appVersion: {
    fontSize: 13,
    fontFamily: 'SF Pro Text',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  modalField: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'SF Pro Text',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'SF Pro Text',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  imageViewerHeaderLeft: {
    flex: 1,
  },
  imageViewerName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
  },
  imageViewerCloseButton: {
    padding: 8,
  },
  imageViewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
  },
  imageViewerFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  imageViewerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  imageViewerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Pro Text',
  },
});