import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View
} from 'react-native';
import { colors } from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  rightElement,
  leftElement,
  fullWidth = false,
  ...rest
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
          shadowColor: colors.secondary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          borderWidth: 2,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
          shadowColor: colors.error,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'error': // Added error variant (same as danger)
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
          shadowColor: colors.error,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          borderColor: colors.success,
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'warning': // Added warning variant
        return {
          backgroundColor: colors.warning,
          borderColor: colors.warning,
          shadowColor: colors.warning,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'ghost':
        return {
          backgroundColor: `${colors.primary}10`,
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return {
          color: colors.primary,
          fontWeight: '600',
        };
      case 'ghost':
        return {
          color: colors.primary,
          fontWeight: '600',
        };
      default:
        return {
          color: '#FFFFFF',
          fontWeight: '600',
        };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          minHeight: 40,
        };
      case 'large':
        return {
          paddingVertical: 18,
          paddingHorizontal: 32,
          minHeight: 56,
        };
      default:
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          minHeight: 48,
        };
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return {
          fontSize: 14,
        };
      case 'large':
        return {
          fontSize: 18,
        };
      default:
        return {
          fontSize: 16,
        };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'} 
          size="small"
        />
      ) : (
        <View style={styles.buttonContent}>
          {leftElement}
          <Text
            style={[
              styles.text,
              getTextStyle(),
              getTextSizeStyle(),
              leftElement && styles.textWithLeftElement,
              rightElement && styles.textWithRightElement,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  textWithLeftElement: {
    marginLeft: 8,
  },
  textWithRightElement: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  fullWidth: {
    width: '100%',
  },
});