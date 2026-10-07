import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface ConfidenceMeterProps {
  confidence: number;
  size?: 'sm' | 'md';
}

const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ confidence, size = 'md' }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(confidence)));
  const dimension = size === 'sm' ? 52 : 80;
  const strokeWidth = size === 'sm' ? 5 : 7;
  const radius = (dimension - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  let strokeColor = colors.emerald[500];
  let textColor = colors.emerald[700];
  let label = 'High';

  if (clamped < 50) {
    strokeColor = colors.red[500];
    textColor = colors.red[700];
    label = 'Low';
  } else if (clamped < 75) {
    strokeColor = colors.amber[500];
    textColor = colors.amber[700];
    label = 'Moderate';
  }

  return (
    <View style={styles.container}>
      <View style={{ width: dimension, height: dimension }}>
        <Svg width={dimension} height={dimension} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={colors.slate[200]}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.labelCenter]}>
          <Text style={[styles.value, { color: textColor, fontSize: size === 'sm' ? 12 : 14 }]}>
            {clamped}%
          </Text>
        </View>
      </View>
      {size === 'md' && <Text style={styles.sublabel}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  labelCenter: { alignItems: 'center', justifyContent: 'center' },
  value: { fontWeight: '700' },
  sublabel: { fontSize: 10, color: colors.slate[600], fontWeight: '500', marginTop: 2 },
});

export default ConfidenceMeter;
