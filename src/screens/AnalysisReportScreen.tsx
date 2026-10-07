import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import FindingCard, { type MedicalFinding } from '../components/analysis/FindingCard';
import { colors } from '../theme/colors';

interface AnalysisData {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  imageType: string;
  imageName?: string;
  imageDataUrl?: string | null;
  clinicalNotes?: string;
  status: string;
  createdAt: string;
  analysis: {
    summary: string;
    imageQuality: string;
    imageQualityRating?: string;
    qualityWarning?: string | null;
    comparisonCaveat?: string | null;
    droppedFindings?: number;
    notLocalized?: { condition: string; statement: string; notesEvidence: string }[];
    overallAssessment: string;
    disclaimer: string;
    modelUsed: string;
    processingTime: number;
    findings: MedicalFinding[];
  };
}

const rebrand = (text?: string) => text?.replace(/NEXUS[-_ ]?Q/gi, 'TetrixAI');

const AnalysisReportScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { analysisId } = route.params;
  const [report, setReport] = useState<AnalysisData | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFinding, setActiveFinding] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/analysis/${analysisId}`);
        setReport(res.data.analysis);
        if (res.data.analysis.patientId) {
          try {
            const pRes = await api.get(`/patients/${res.data.analysis.patientId}`);
            setPatient(pRes.data.patient);
          } catch {}
        }
      } catch {
        Alert.alert('Error', 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [analysisId]);

  const handleShare = async () => {
    if (!report) return;
    try {
      await Share.share({
        message: `TetrixAI Report #${report.id.slice(0, 8)}\n\n${report.analysis.summary}\n\nFindings: ${report.analysis.findings.length}\nModel: ${report.analysis.modelUsed}`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue[500]} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.slate[600] }}>Report not found.</Text>
        <Button variant="secondary" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const { analysis } = report;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Share */}
      <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
        <Button variant="secondary" size="sm" onPress={handleShare}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="share-outline" size={16} color={colors.slate[700]} />
            <Text style={{ fontSize: 12, color: colors.slate[700], fontWeight: '600' }}>Share</Text>
          </View>
        </Button>
      </View>

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.brandDark}>Tetrix</Text>
            <Text style={styles.brandBlue}>AI</Text>
            <Badge variant="info">Report</Badge>
          </View>
          <Text style={styles.dateText}>
            {new Date(report.createdAt).toLocaleString()}
          </Text>
        </View>
        <Text style={styles.reportId}>ID: {report.id}</Text>

        {/* Metadata */}
        <View style={styles.metaGrid}>
          <MetaBox label="Patient" value={patient?.name || 'Patient'} sub={patient ? `${patient.age}y · ${patient.gender}` : ''} />
          <MetaBox label="Physician" value={report.doctorName || 'Dr.'} sub={`ID: ${report.doctorId.slice(0, 8)}`} />
          <MetaBox label="Modality" value={report.imageType} sub={report.imageName || 'Scan'} />
          <MetaBox
            label="Quality"
            value={analysis.imageQualityRating !== 'unknown' ? analysis.imageQualityRating || 'Unrated' : 'Unrated'}
            sub={`${(analysis.processingTime / 1000).toFixed(1)}s`}
            highlight={analysis.imageQualityRating === 'poor' || analysis.imageQualityRating === 'fair'}
          />
        </View>
      </View>

      {/* Quality Warning */}
      {analysis.qualityWarning && (
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={18} color={colors.amber[700]} />
          <Text style={styles.warningText}>{analysis.qualityWarning}</Text>
        </View>
      )}

      {analysis.comparisonCaveat && (
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={18} color={colors.amber[700]} />
          <Text style={styles.warningText}>{analysis.comparisonCaveat}</Text>
        </View>
      )}

      {/* Scan Image */}
      {report.imageDataUrl && (
        <View style={styles.imageCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="scan" size={16} color={colors.blue[600]} />
            <Text style={styles.sectionLabel}>Analyzed Scan</Text>
          </View>
          <Image
            source={{ uri: report.imageDataUrl }}
            style={styles.scanImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Clinical Notes */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Ionicons name="document-text" size={16} color={colors.blue[600]} />
          <Text style={styles.sectionLabel}>Clinical Context</Text>
        </View>
        <View style={styles.textBox}>
          <Text style={styles.textContent}>
            {report.clinicalNotes || 'No notes provided.'}
          </Text>
        </View>
      </View>

      {/* Summary */}
      <View style={[styles.card, { borderColor: colors.blue[200] }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="analytics" size={18} color={colors.blue[600]} />
            <Text style={styles.summaryTitle}>AI Executive Summary</Text>
          </View>
          <View style={styles.evidenceTag}>
            <Ionicons name="shield-checkmark" size={12} color={colors.emerald[700]} />
            <Text style={styles.evidenceText}>Evidence Grounded</Text>
          </View>
        </View>
        <Text style={styles.summaryBody}>{rebrand(analysis.summary)}</Text>
      </View>

      {/* Findings */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Ionicons name="scan" size={18} color={colors.blue[600]} />
          <Text style={styles.summaryTitle}>
            Findings ({analysis.findings?.length || 0})
          </Text>
        </View>
        {analysis.findings?.length > 0 ? (
          analysis.findings.map((f, i) => (
            <FindingCard
              key={i}
              finding={f}
              index={i}
              active={activeFinding === i}
              onSelect={() => setActiveFinding(activeFinding === i ? null : i)}
            />
          ))
        ) : (
          <View style={styles.noFindings}>
            <Ionicons name="checkmark-circle" size={36} color={colors.emerald[700]} />
            <Text style={styles.noFindingsTitle}>
              {analysis.droppedFindings
                ? 'No evidence-supported findings'
                : 'No abnormalities identified'}
            </Text>
            <Text style={styles.noFindingsSub}>
              {analysis.droppedFindings
                ? `${analysis.droppedFindings} finding(s) discarded (unsupported). This does not exclude pathology.`
                : 'The model found nothing it could tie to an image region or the clinical notes. This does not exclude pathology.'}
            </Text>
          </View>
        )}
      </View>

      {/* Not Localized */}
      {!!analysis.notLocalized?.length && (
        <View style={styles.card}>
          <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>
            Raised in notes, not found on scan
          </Text>
          {analysis.notLocalized.map((c, i) => (
            <View key={i} style={styles.notLocalizedItem}>
              <Text style={styles.nlStatement}>{c.statement}</Text>
              <Text style={styles.nlEvidence}>{c.notesEvidence}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Overall Assessment */}
      {analysis.overallAssessment && (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="medical" size={16} color={colors.blue[600]} />
            <Text style={styles.sectionLabel}>Physician Assessment</Text>
          </View>
          <View style={styles.textBox}>
            <Text style={styles.textContent}>{rebrand(analysis.overallAssessment)}</Text>
          </View>
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Ionicons name="alert-circle" size={18} color={colors.red[700]} />
        <Text style={styles.disclaimerText}>
          {rebrand(analysis.disclaimer) ||
            'TetrixAI is an assistive clinical decision support tool. Final decisions remain with the physician.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const MetaBox: React.FC<{
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}> = ({ label, value, sub, highlight }) => (
  <View style={metaStyles.box}>
    <Text style={metaStyles.label}>{label}</Text>
    <Text style={[metaStyles.value, highlight && { color: colors.amber[700] }]}>{value}</Text>
    <Text style={metaStyles.sub}>{sub}</Text>
  </View>
);

const metaStyles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    padding: 10,
  },
  label: { fontSize: 10, color: colors.slate[500], fontWeight: '500' },
  value: { fontSize: 13, fontWeight: '600', color: colors.slate[800], marginTop: 2 },
  sub: { fontSize: 10, color: colors.slate[600], marginTop: 2 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  headerCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
    paddingBottom: 12,
    marginBottom: 10,
  },
  brandDark: { fontSize: 18, fontWeight: '700', color: colors.slate[900] },
  brandBlue: { fontSize: 18, fontWeight: '700', color: colors.blue[600] },
  dateText: { fontSize: 11, color: colors.slate[600] },
  reportId: { fontSize: 10, color: colors.slate[500], fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 10 },
  metaGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.amber[50],
    borderWidth: 1,
    borderColor: colors.amber[200],
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  warningText: { fontSize: 12, color: colors.amber[700], flex: 1, lineHeight: 18 },
  imageCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  scanImage: { width: '100%', height: 280, borderRadius: 10, backgroundColor: colors.slate[900] },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.slate[800] },
  textBox: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    padding: 12,
  },
  textContent: { fontSize: 12, color: colors.slate[700], lineHeight: 18 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: colors.slate[900] },
  summaryBody: { fontSize: 13, fontWeight: '500', color: colors.slate[800], lineHeight: 20 },
  evidenceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.emerald[50],
    borderWidth: 1,
    borderColor: colors.emerald[200],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  evidenceText: { fontSize: 10, color: colors.emerald[700], fontWeight: '600' },
  noFindings: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  noFindingsTitle: { fontSize: 14, fontWeight: '600', color: colors.slate[800] },
  noFindingsSub: { fontSize: 12, color: colors.slate[600], textAlign: 'center', maxWidth: 300 },
  notLocalizedItem: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  nlStatement: { fontSize: 12, fontWeight: '500', color: colors.slate[800] },
  nlEvidence: { fontSize: 11, color: colors.slate[600], marginTop: 4 },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.red[50],
    borderWidth: 1,
    borderColor: colors.red[200],
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  disclaimerText: { fontSize: 11, color: colors.red[700], flex: 1, lineHeight: 16 },
});

export default AnalysisReportScreen;
