import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '../ui/Badge';
import ConfidenceMeter from './ConfidenceMeter';
import { colors } from '../../theme/colors';

export interface MedicalFinding {
  finding: string;
  location: string;
  boundingBox?: [number, number, number, number] | null;
  evidenceSource?: 'image' | 'clinical_notes' | 'both';
  confidence: number;
  confidenceBreakdown?: {
    modelConfidence: number;
    qualityPenalty: number;
    lateralityPenalty?: number;
    ceiling: number;
    final: number;
    formula: string;
  };
  lateralityWarning?: string | null;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  supportingEvidence: string;
  recommendation: string;
}

interface FindingCardProps {
  finding: MedicalFinding;
  index: number;
  active?: boolean;
  onSelect?: () => void;
}

const severityBadge: Record<string, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  moderate: 'warning',
  high: 'danger',
  critical: 'danger',
};

const FindingCard: React.FC<FindingCardProps> = ({ finding, index, active, onSelect }) => (
  <TouchableOpacity
    onPress={onSelect}
    activeOpacity={0.8}
    style={[styles.card, active && styles.cardActive]}
  >
    <View style={styles.row}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.indexCircle}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <Text style={styles.findingTitle} numberOfLines={2}>
            {finding.finding}
          </Text>
        </View>

        <Badge variant={severityBadge[finding.severity] || 'warning'}>
          {finding.severity.toUpperCase()} Severity
        </Badge>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={colors.blue[600]} />
          <Text style={styles.locationText}>
            {finding.location}
            {!finding.boundingBox ? ' (clinical notes only)' : ''}
          </Text>
        </View>

        {finding.lateralityWarning ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{finding.lateralityWarning}</Text>
          </View>
        ) : null}

        <View style={styles.evidenceBox}>
          <View style={styles.evidenceHeader}>
            <Ionicons name="document-text" size={14} color={colors.blue[600]} />
            <Text style={styles.evidenceLabel}>Supporting Evidence:</Text>
          </View>
          <Text style={styles.evidenceText}>{finding.supportingEvidence}</Text>
        </View>

        <View style={styles.recoBox}>
          <View style={styles.evidenceHeader}>
            <Ionicons name="checkmark-circle" size={14} color={colors.blue[600]} />
            <Text style={styles.recoLabel}>Recommendation:</Text>
          </View>
          <Text style={styles.recoText}>"{finding.recommendation}"</Text>
        </View>
      </View>

      <View style={styles.meterBox}>
        <ConfidenceMeter confidence={finding.confidence} size="md" />
        {finding.confidenceBreakdown && (
          <View style={styles.breakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.bkLabel}>Model</Text>
              <Text style={styles.bkValue}>{finding.confidenceBreakdown.modelConfidence}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.bkLabel}>Quality</Text>
              <Text style={styles.bkValue}>-{finding.confidenceBreakdown.qualityPenalty}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.bkLabel}>Cap</Text>
              <Text style={styles.bkValue}>{finding.confidenceBreakdown.ceiling}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardActive: {
    borderColor: colors.blue[500],
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.slate[100],
    borderWidth: 1,
    borderColor: colors.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate[700],
  },
  findingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[900],
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.blue[50],
    borderWidth: 1,
    borderColor: colors.blue[200],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.blue[600],
    flex: 1,
  },
  warningBox: {
    backgroundColor: colors.red[50],
    borderWidth: 1,
    borderColor: colors.red[200],
    borderRadius: 8,
    padding: 8,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.red[700],
  },
  evidenceBox: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate[700],
  },
  evidenceText: {
    fontSize: 11,
    color: colors.slate[600],
    lineHeight: 16,
    paddingLeft: 18,
  },
  recoBox: {
    backgroundColor: colors.blue[50],
    borderWidth: 1,
    borderColor: colors.blue[200],
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  recoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.blue[600],
  },
  recoText: {
    fontSize: 11,
    color: colors.blue[800],
    lineHeight: 16,
    paddingLeft: 18,
    fontStyle: 'italic',
  },
  meterBox: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    padding: 10,
    minWidth: 95,
  },
  breakdown: {
    marginTop: 8,
    gap: 2,
    width: '100%',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  bkLabel: {
    fontSize: 10,
    color: colors.slate[600],
  },
  bkValue: {
    fontSize: 10,
    color: colors.slate[600],
    fontVariant: ['tabular-nums'],
  },
});

export default FindingCard;
