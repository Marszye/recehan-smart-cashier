import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { colors } from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Input = React.forwardRef<TextInput, InputProps>(({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  rightElement,
  leftElement,
  variant = 'default',
  ...rest
}, ref) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: colors.gray[100],
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      <View style={[
        styles.inputContainer,
        getVariantStyle(),
        error && styles.inputError,
      ]}>
        {leftElement && (
          <View style={styles.leftElement}>{leftElement}</View>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            leftElement && styles.inputWithLeftElement,
            rightElement && styles.inputWithRightElement,
            inputStyle,
          ]}
          placeholderTextColor={colors.textMuted}
          {...rest}
        />
        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
    fontWeight: '600',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputWithLeftElement: {
    paddingLeft: 8,
  },
  inputWithRightElement: {
    paddingRight: 8,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  leftElement: {
    paddingLeft: 14,
  },
  rightElement: {
    paddingRight: 14,
  },
});