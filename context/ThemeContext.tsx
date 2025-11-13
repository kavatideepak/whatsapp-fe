/**
 * ThemeContext - Manages user's custom theme/accent color preference
 * 
 * Stores selected theme color in AsyncStorage for persistence
 * Provides accent colors that override default theme colors
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

// Theme color options
export const THEME_COLORS = [
  { id: 1, color: '#1A1A1A', name: 'Default', lightAccent: '#1A1A1A', darkAccent: '#0e1012ff' },
  { id: 2, color: '#B33A93', name: 'Purple', lightAccent: '#B33A93', darkAccent: '#8B2A73' },
  { id: 3, color: '#059866', name: 'Green', lightAccent: '#059866', darkAccent: '#167e56ff' },
  { id: 4, color: '#0080A3', name: 'Blue', lightAccent: '#0080A3', darkAccent: '#006B8A' },
];

interface ThemeContextType {
  selectedThemeId: number;
  selectedThemeColor: typeof THEME_COLORS[0];
  selectTheme: (themeId: number) => Promise<void>;
  colors: typeof Colors.light;
  theme: 'light' | 'dark';
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@synapse_selected_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const theme = systemColorScheme ?? 'light';
  const [selectedThemeId, setSelectedThemeId] = useState(1); // Default theme

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const themeId = parseInt(saved, 10);
        if (themeId >= 1 && themeId <= THEME_COLORS.length) {
          setSelectedThemeId(themeId);
        }
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const selectTheme = async (themeId: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, themeId.toString());
      setSelectedThemeId(themeId);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const selectedThemeColor = THEME_COLORS.find(t => t.id === selectedThemeId) || THEME_COLORS[0];
  
  // Get base colors and override accent colors with selected theme
  const baseColors = Colors[theme];
  const accentColor = theme === 'dark' ? selectedThemeColor.darkAccent : selectedThemeColor.lightAccent;
  
  const colors = {
    ...baseColors,
    // Override accent-related colors with selected theme
    sendBtn: accentColor,
    buttonPrimary: accentColor,
    bubbleSent: theme === 'dark' ? selectedThemeColor.darkAccent : selectedThemeColor.lightAccent,
    accent: accentColor,
    unreadBadge: accentColor,
    badge: accentColor,
  };

  return (
    <ThemeContext.Provider
      value={{
        selectedThemeId,
        selectedThemeColor,
        selectTheme,
        colors,
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
