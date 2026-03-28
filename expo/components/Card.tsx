import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { useSettingsStore } from '@/store/useSettingsStore';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient' | 'luxury';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  variant = 'default',
  padding = 'medium'
}) => {
  const nightMode = useSettingsStore((state) => state.nightMode);

  const getVariantStyle = (): ViewStyle => {
    const baseStyle = {
      backgroundColor: nightMode ? colors.gray[800] : colors.card,
      borderWidth: 0, // Remove borders for cleaner look
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          shadowColor: nightMode ? '#000000' : colors.text,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: nightMode ? 0.4 : 0.12,
          shadowRadius: 16,
          elevation: 12,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: nightMode ? colors.gray[600] : colors.border,
          shadowColor: nightMode ? '#000000' : colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: nightMode ? 0.2 : 0.05,
          shadowRadius: 8,
          elevation: 2,
        };
      case 'gradient':
        return {
          ...baseStyle,
          shadowColor: nightMode ? '#000000' : colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: nightMode ? 0.4 : 0.2,
          shadowRadius: 16,
          elevation: 12,
        };
      case 'luxury':
        return {
          ...baseStyle,
          shadowColor: nightMode ? '#000000' : colors.text,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: nightMode ? 0.5 : 0.15,
          shadowRadius: 24,
          elevation: 16,
          borderWidth: 0,
        };
      default:
        return {
          ...baseStyle,
          shadowColor: nightMode ? '#000000' : colors.text,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: nightMode ? 0.3 : 0.08,
          shadowRadius: 12,
          elevation: 6,
        };
    }
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: 12 };
      case 'large':
        return { padding: 24 };
      default:
        return { padding: 20 }; // Increased default padding for luxury feel
    }
  };

  return (
    <View style={[
      styles.card, 
      getVariantStyle(), 
      getPaddingStyle(),
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, // Consistent border radius
    marginBottom: 16, // Consistent margin
    overflow: 'hidden', // Ensure content doesn't overflow rounded corners
  },
});