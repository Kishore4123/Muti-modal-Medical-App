import React, { useEffect, useState } from 'react';
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
import { getPatients, getAnalyses } from '../services/firestore';
import { useAuthStore } from '../store/authStore';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { colors } from '../theme/colors';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastAnalysisDate?: string;
  status?: string;
}

interface Analysis {
  id: string;
  patientName: string;
  patientId: string;
  imageType: string;
  confidenceScore: number;
  createdAt: string;
}

const formatDate = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const confidenceVariant = (s: number) =>
  s >= 85 ? 'success' : s >= 65 ? 'warning' : ('danger' as const);

const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pats, rawAnalyses] = await Promise.all([
          getPatients(user!.uid, user!.role),
          getAnalyses(user!.uid, user!.role),
        ]);
        setPatients(pats);
        setAnalyses(
          rawAnalyses.map((a: any) => ({
            id: a.id,
            patientName: a.doctorName || a.imageType,
            patientId: a.patientId,
            imageType: a.imageType,
            confidenceScore: a.analysis?.findings?.[0]?.confidence || 0,
            createdAt: a.createdAt,
          })),
        );
      } catch {
        Alert.alert('Error', 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue[500]} />
      </View>
    );
  }

  const recentPatients = patients.slice(0, 5);
  const recentAnalyses = analyses.slice(0, 5);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Welcome */}
      <View style={styles.welcomeRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.welcomeTitle}>
              Welcome, {user?.name?.split(' ')[0] ?? 'Doctor'}
            </Text>
            {isAdmin && <Badge variant="info">Admin</Badge>}
          </View>
          <Text style={styles.welcomeSub}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actionRow}>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate('PatientList')}
        >
          <View style={styles.btnInner}>
            <Ionicons name="person-add" size={16} color={colors.slate[700]} />
            <Text style={styles.btnSecText}>Add Patient</Text>
          </View>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={() => navigation.navigate('NewAnalysis')}
        >
          <View style={styles.btnInner}>
            <Ionicons name="scan" size={16} color={colors.white} />
            <Text style={styles.btnPrimText}>AI Analysis</Text>
          </View>
        </Button>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard
          label="Patients"
          value={patients.length}
          icon="people"
          color={colors.blue[600]}
          bg={colors.blue[50]}
        />
        <StatCard
          label="Analyses"
          value={analyses.length}
          icon="analytics"
          color={colors.emerald[700]}
          bg={colors.emerald[50]}
        />
        <StatCard
          label="Recent"
          value={recentAnalyses.length}
          icon="trending-up"
          color={colors.amber[700]}
          bg={colors.amber[50]}
        />
      </View>

      {/* Recent Patients */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Patients</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PatientList')}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {recentPatients.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people" size={32} color={colors.slate[300]} />
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        ) : (
          recentPatients.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.listItem}
              onPress={() => navigation.navigate('PatientDetail', { patientId: p.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{p.name}</Text>
                <Text style={styles.itemSub}>
                  {p.age}y · {p.gender} · {formatDate(p.lastAnalysisDate ?? '')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.slate[400]} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Recent Analyses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Analyses</Text>
        </View>
        {recentAnalyses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="analytics" size={32} color={colors.slate[300]} />
            <Text style={styles.emptyText}>No analyses yet</Text>
          </View>
        ) : (
          recentAnalyses.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.analysisItem}
              onPress={() => navigation.navigate('AnalysisReport', { analysisId: a.id })}
            >
              <View style={styles.analysisIcon}>
                <Ionicons name="scan" size={18} color={colors.blue[600]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{a.patientName}</Text>
                <Text style={styles.itemSub}>{a.imageType}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Badge variant={confidenceVariant(a.confidenceScore)}>
                  {a.confidenceScore}%
                </Badge>
                <Text style={styles.dateText}>{formatDate(a.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
}> = ({ label, value, icon, color, bg }) => (
  <View style={styles.statCard}>
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <View style={[styles.statIcon, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: colors.slate[900] },
  welcomeSub: { fontSize: 12, color: colors.slate[500], marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btnSecText: { color: colors.slate[700], fontWeight: '600', fontSize: 13 },
  btnPrimText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statLabel: { fontSize: 11, color: colors.slate[500], fontWeight: '500' },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.slate[900], marginTop: 4 },
  statIcon: { padding: 10, borderRadius: 12 },
  section: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.slate[900] },
  viewAll: { fontSize: 12, color: colors.blue[600], fontWeight: '500' },
  emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: colors.slate[500] },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
    gap: 10,
  },
  analysisIcon: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.blue[50],
  },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.slate[800] },
  itemSub: { fontSize: 11, color: colors.slate[500], marginTop: 2 },
  dateText: { fontSize: 10, color: colors.slate[500], marginTop: 3 },
});

export default DashboardScreen;
