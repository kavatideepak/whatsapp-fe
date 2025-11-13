/**
 * App-wide color theme supporting light and dark modes.
 * Follows system theme (iOS/Android appearance settings) automatically.
 * Industry-standard implementation similar to WhatsApp, Telegram, etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F7F7F7',
    backgroundTertiary: '#F4F4F4',
    footerTabBackground: '#F7F7F7',

    // Chat-specific backgrounds
    chatBackground: '#F5F2EB',
    chatBackgroundPattern: '#E5DFD4',
    
    // Text colors
    text: '#1A1A1A',
    textSecondary: '#767779',
    textTertiary: '#9A9A9A',
    textInverse: '#FFFFFF',
    
    // Message bubbles
    bubbleReceived: '#FFFFFF',
    bubbleSent: '#111111',
    bubbleReceivedText: '#1A1A1A',
    bubbleSentText: '#FFFFFF',
    
    // Input fields
    inputBackground: '#FFFFFF',
    inputBorder: '#E5E5E5',
    inputPlaceholder: '#9A9A9A',
    inputText: '#1A1A1A',
    
    // Buttons & interactive elements
    buttonPrimary: '#1A1A1A',
        sendBtn: '#1A1A1A',

    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: 'rgba(26, 26, 26, 0.08)',
    buttonSecondaryText: '#1A1A1A',
    
    // Status & accent colors
    accent: '#016EEB',
    accentLight: '#4FC3F7',
    success: '#25D366',
    error: '#F44336',
    warning: '#FF9800',
    
    // Icons
    icon: '#1A1A1A',
    iconSecondary: '#767779',
    iconTertiary: '#9A9A9A',
    iconButtonBackground: 'rgba(26, 26, 26, 0.08)',
    iconDisabled: '#D0D0D0',
    
    // Avatar
    avatarBackground: '#E0E0E0',
    avatarText: '#767779',
    
    // Status indicators (message delivery)
    statusSending: '#9A9A9A',
    statusSent: '#9A9A9A',
    statusDelivered: '#9A9A9A',
    statusRead: '#4FC3F7',
    statusFailed: '#F44336',
    statusOnline: '#25D366',
    
    // Badges & notifications
    badge: '#000000',
    badgeText: '#FFFFFF',
    unreadBadge: '#000000',
    unreadBadgeText: '#FFFFFF',
    unreadIndicator: '#25D366',
    
    // Borders & dividers
    border: '#E5E5E5',
    borderLight: 'rgba(0, 0, 0, 0.06)',
    divider: '#F4F4F4',
    separator: '#F4F4F4',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: '#FFFFFF',
    
    // Legacy (for backward compatibility)
    tint: '#016EEB',
    tabIconDefault: '#767779',
    tabIconSelected: '#1A1A1A',
  },
  dark: {
    // Primary backgrounds
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',
    footerTabBackground: '#000',
    // Chat-specific backgrounds
    chatBackground: '#0A0A0A',
    chatBackgroundPattern: '#1A1A1A',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textTertiary: '#707070',
    textInverse: '#000000',
    
    // Message bubbles
    bubbleReceived: '#1C1C1E',
    bubbleSent: '#134d37',
    bubbleReceivedText: '#FFFFFF',
    bubbleSentText: '#FFFFFF',
    
    // Input fields
    inputBackground: '#1C1C1E',
    inputBorder: '#2C2C2E',
    inputPlaceholder: '#707070',
    inputText: '#FFFFFF',
    
    // Buttons & interactive elements
    buttonPrimary: '#0B93F6',
    sendBtn: '#0e1012ff',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: '#2C2C2E',
    buttonSecondaryText: '#FFFFFF',
    
    // Status & accent colors
    accent: '#167e56ff',
    accentLight: '#64B5F6',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
    
    // Icons
    icon: '#FFFFFF',
    iconSecondary: '#A0A0A0',
    iconTertiary: '#707070',
    iconButtonBackground: '#2C2C2E',
    iconDisabled: '#3A3A3C',
    
    // Avatar
    avatarBackground: '#3A3A3C',
    avatarText: '#A0A0A0',
    
    // Status indicators (message delivery)
    statusSending: '#707070',
    statusSent: '#A0A0A0',
    statusDelivered: '#A0A0A0',
    statusRead: '#64B5F6',
    statusFailed: '#FF453A',
    statusOnline: '#30D158',
    
    // Badges & notifications
    badge: '#0B93F6',
    badgeText: '#FFFFFF',
    unreadBadge: '#0B93F6',
    unreadBadgeText: '#FFFFFF',
    unreadIndicator: '#30D158',
    
    // Borders & dividers
    border: '#2C2C2E',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    divider: '#2C2C2E',
    separator: '#2C2C2E',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: '#1C1C1E',
    
    // Legacy (for backward compatibility)
    tint: '#0A84FF',
    tabIconDefault: '#A0A0A0',
    tabIconSelected: '#FFFFFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
