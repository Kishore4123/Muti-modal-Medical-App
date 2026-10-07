import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPatient, getPatientAnalyses } from '../services/firestore';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { colors } from '../theme/colors';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  assignedDoctorName?: string;
  createdAt: string;
}

interface AnalysisItem {
  id: string;
  imageType: string;
  createdAt: string;
  analysis: {
    summary: string;
    imageQuality: string;
    findings: Array<{ finding: string; confidence: number; severity: string }>;
  };
}

const PatientDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'scans'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pat, anas] = await Promise.all([
          getPatient(patientId),
          getPatientAnalyses(patientId),
        ]);
        setPatient(pat);
        setAnalyses(anas);
      } catch {
        Alert.alert('Error', 'Failed to load patient.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue[500]} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Patient not found.</Text>
        <Button variant="secondary" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'person' },
    { id: 'history', label: 'History', icon: 'document-text' },
    { id: 'scans', label: `Scans (${analyses.length})`, icon: 'analytics' },
  ] as const;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{patient.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Text style={styles.meta}>{patient.age}y</Text>
              <Text style={styles.metaDot}>{'·'}</Text>
              <Text style={styles.meta}>{patient.gender}</Text>
              <Badge variant="info">Blood: {patient.bloodType || '?'}</Badge>
            </View>
          </View>
        </View>

        <Button
          variant="primary"
          size="sm"
          onPress={() => navigation.navigate('NewAnalysis', { patientId: patient.id })}
          style={{ marginTop: 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="scan" size={16} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: '600', fontSize: 13 }}>New AI Scan</Text>
          </View>
        </Button>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
            >
              <Ionicons
                name={t.icon as any}
                size={14}
                color={activeTab === t.id ? colors.blue[600] : colors.slate[500]}
              />
              <Text
                style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <View style={styles.sectionCard}>
          <InfoRow icon="call" label="Phone" value={patient.phone || 'Not recorded'} />
          <InfoRow icon="mail" label="Email" value={patient.email || 'Not recorded'} />
          <InfoRow icon="person" label="Doctor" value={patient.assignedDoctorName || 'Assigned'} />
          <InfoRow
            icon="calendar"
            label="Created"
            value={new Date(patient.createdAt).toLocaleDateString()}
          />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Scans</Text>
            <Text style={styles.statValue}>{analyses.length}</Text>
          </View>
        </View>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <View style={{ gap: 12 }}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            <View style={styles.textBox}>
              <Text style={styles.textContent}>
                {patient.medicalHistory || 'No history recorded.'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.sectionCard, { flex: 1 }]}>
              <Text style={[styles.sectionTitle, { color: colors.red[700] }]}>Allergies</Text>
              {patient.allergies?.length ? (
                <View style={styles.tagRow}>
                  {patient.allergies.map((a, i) => (
                    <Badge key={i} variant="danger">{a}</Badge>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyMini}>None reported</Text>
              )}
            </View>

            <View style={[styles.sectionCard, { flex: 1 }]}>
              <Text style={[styles.sectionTitle, { color: colors.emerald[700] }]}>Medications</Text>
              {patient.currentMedications?.length ? (
                <View style={styles.tagRow}>
                  {patient.currentMedications.map((m, i) => (
                    <Badge key={i} variant="success">{m}</Badge>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyMini}>None recorded</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Scans Tab */}
      {activeTab === 'scans' && (
        <View style={{ gap: 10 }}>
          {analyses.length === 0 ? (
            <View style={styles.emptyScans}>
              <Ionicons name="scan" size={40} color={colors.slate[300]} />
              <Text style={styles.emptyTitle}>No scans on file</Text>
              <Button
                variant="primary"
                size="sm"
                onPress={() => navigation.navigate('NewAnalysis', { patientId: patient.id })}
              >
                Run First Analysis
              </Button>
            </View>
          ) : (
            analyses.map((scan) => (
              <TouchableOpacity
                key={scan.id}
                style={styles.scanCard}
                onPress={() => navigation.navigate('AnalysisReport', { analysisId: scan.id })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Badge variant="info">{scan.imageType.toUpperCase()}</Badge>
                  <Text style={styles.scanDate}>
                    {new Date(scan.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.scanSummary} numberOfLines={2}>
                  {scan.analysis.summary}
                </Text>
                <View style={styles.findingsRow}>
                  {scan.analysis.findings?.slice(0, 3).map((f, i) => (
                    <Text key={i} style={styles.findingChip}>
                      {f.finding} ({f.confidence}%)
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={infoStyles.row}>
    <Ionicons name={icon as any} size={16} color={colors.slate[500]} />
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={infoStyles.value}>{value}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  label: { fontSize: 12, color: colors.slate[500], width: 60 },
  value: { fontSize: 13, color: colors.slate[800], flex: 1 },
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
    marginBottom: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.blue[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: colors.slate[900] },
  meta: { fontSize: 12, color: colors.slate[600] },
  metaDot: { fontSize: 12, color: colors.slate[400] },
  tabRow: {
    flexDirection: 'row',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.slate[200],
    marginTop: 16,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.blue[500] },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.slate[600] },
  tabTextActive: { color: colors.blue[600] },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.slate[800], marginBottom: 8 },
  textBox: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    padding: 12,
  },
  textContent: { fontSize: 13, color: colors.slate[700], lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emptyMini: { fontSize: 11, color: colors.slate[500] },
  statBox: { marginTop: 12, alignItems: 'center' },
  statLabel: { fontSize: 12, color: colors.slate[600] },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.blue[600], marginTop: 4 },
  emptyText: { fontSize: 14, color: colors.slate[600] },
  emptyScans: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.slate[700] },
  scanCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  scanDate: { fontSize: 11, color: colors.slate[500] },
  scanSummary: { fontSize: 13, fontWeight: '600', color: colors.slate[800] },
  findingsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  findingChip: {
    fontSize: 11,
    color: colors.slate[700],
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

export default PatientDetailScreen;
