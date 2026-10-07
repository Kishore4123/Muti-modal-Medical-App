import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading TetrixAI...',
}) => (
  <View style={styles.container}>
    <View style={styles.iconBox}>
      <Ionicons name="medical" size={32} color={colors.blue[600]} />
    </View>
    <ActivityIndicator size="large" color={colors.blue[500]} style={{ marginTop: 16 }} />
    <View style={styles.brandRow}>
      <Text style={styles.brandDark}>Tetrix</Text>
      <Text style={styles.brandBlue}>AI</Text>
    </View>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.blue[50],
    borderWidth: 1,
    borderColor: colors.blue[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  brandDark: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate[900],
  },
  brandBlue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.blue[600],
  },
  message: {
    fontSize: 12,
    color: colors.slate[600],
    fontWeight: '500',
    marginTop: 4,
  },
});

export default LoadingSpinner;
