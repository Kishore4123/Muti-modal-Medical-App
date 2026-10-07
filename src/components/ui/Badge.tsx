import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: colors.emerald[50], text: colors.emerald[700], border: colors.emerald[200] },
  warning: { bg: colors.amber[50], text: colors.amber[700], border: colors.amber[200] },
  danger: { bg: colors.red[50], text: colors.red[700], border: colors.red[200] },
  info: { bg: colors.blue[50], text: colors.blue[600], border: colors.blue[200] },
  default: { bg: colors.slate[100], text: colors.slate[700], border: colors.slate[200] },
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const style = variantStyles[variant];
  return (
    <View style={[styles.container, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>
        {typeof children === 'string' ? children : children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default Badge;
