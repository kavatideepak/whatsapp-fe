/**
 * useTheme Hook
 * 
 * Provides convenient access to the current theme and all color values.
 * Automatically responds to system theme changes (light/dark mode).
 * 
 * Industry-standard implementation - similar to WhatsApp, Telegram, etc.
 * 
 * Usage:
 * ```tsx
 * const { colors, theme, isDark } = useTheme();
 * 
 * <View style={{ backgroundColor: colors.background }}>
 *   <Text style={{ color: colors.text }}>Hello</Text>
 * </View>
 * ```
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  return {
    theme,
    colors: Colors[theme],
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
}
