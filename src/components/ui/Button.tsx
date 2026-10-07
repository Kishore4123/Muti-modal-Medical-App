import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.blue[600] },
    text: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.slate[100] },
    text: { color: colors.slate[800] },
  },
  danger: {
    container: { backgroundColor: colors.red[600] },
    text: { color: colors.white },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.slate[700] },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { paddingHorizontal: 12, paddingVertical: 6 }, text: { fontSize: 12 } },
  md: { container: { paddingHorizontal: 16, paddingVertical: 10 }, text: { fontSize: 14 } },
  lg: { container: { paddingHorizontal: 20, paddingVertical: 14 }, text: { fontSize: 14 } },
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onPress,
  style,
}) => {
  const isDisabled = disabled || loading;
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        vs.container,
        ss.container,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={vs.text.color as string}
          style={{ marginRight: 8 }}
        />
      )}
      {typeof children === 'string' ? (
        <Text style={[styles.text, vs.text, ss.text]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
