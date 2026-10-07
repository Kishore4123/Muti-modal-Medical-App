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
import api from '../config/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { colors } from '../theme/colors';

interface DoctorUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  specialization?: string;
  hospital?: string;
  status: 'active' | 'suspended';
}

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType?: string;
  assignedDoctorId: string;
  assignedDoctorName?: string;
}

interface AuditLog {
  id: string;
  action: string;
  patientId?: string;
  performedBy: string;
  timestamp: string;
}

const AdminScreen: React.FC = () => {
  const [tab, setTab] = useState<'doctors' | 'patients' | 'audits'>('doctors');
  const [stats, setStats] = useState({ totalDoctors: 0, totalPatients: 0, totalAnalyses: 0 });
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [transferModal, setTransferModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [targetDocId, setTargetDocId] = useState('');
  const [transferring, setTransferring] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [s, d, p, a] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/doctors'),
        api.get('/admin/patients'),
        api.get('/admin/audit-logs'),
      ]);
      setStats(s.data.stats || s.data);
      setDoctors(d.data.doctors || []);
      setPatients(p.data.patients || []);
      setAudits(a.data.logs || []);
    } catch {
      Alert.alert('Error', 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleStatus = async (doc: DoctorUser) => {
    const next = doc.status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/admin/doctors/${doc.id || doc.uid}/status`, { status: next });
      Alert.alert('Success', `${doc.displayName} is now ${next}.`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed.');
    }
  };

  const handleTransfer = async () => {
    if (!selectedPatient || !targetDocId) return;
    setTransferring(true);
    try {
      await api.patch(`/admin/patients/${selectedPatient.id}/transfer`, { targetDoctorId: targetDocId });
      Alert.alert('Success', 'Patient transferred.');
      setTransferModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Transfer failed.');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue[500]} />
      </View>
    );
  }

  const tabs = [
    { id: 'doctors', label: `Doctors (${doctors.length})`, icon: 'medical' },
    { id: 'patients', label: `Patients (${patients.length})`, icon: 'people' },
    { id: 'audits', label: `Audit (${audits.length})`, icon: 'document-text' },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="shield" size={22} color={colors.blue[700]} />
          <Text style={styles.title}>Admin Panel</Text>
        </View>
        <Badge variant="warning">Root Authority</Badge>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.totalDoctors}</Text>
          <Text style={styles.statLabel}>Doctors</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.totalAnalyses}</Text>
          <Text style={styles.statLabel}>Scans</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons
              name={t.icon as any}
              size={14}
              color={tab === t.id ? colors.blue[600] : colors.slate[500]}
            />
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }}>
        {tab === 'doctors' &&
          doctors.map((d) => (
            <View key={d.id || d.uid} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{d.displayName}</Text>
                <Text style={styles.cardSub}>{d.email}</Text>
                <Text style={styles.cardSub}>
                  {d.specialization || 'General'} · {d.hospital || 'Clinic'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Badge variant={d.status === 'active' ? 'success' : 'danger'}>
                  {d.status.toUpperCase()}
                </Badge>
                <Button
                  variant={d.status === 'active' ? 'danger' : 'primary'}
                  size="sm"
                  onPress={() => toggleStatus(d)}
                >
                  {d.status === 'active' ? 'Suspend' : 'Activate'}
                </Button>
              </View>
            </View>
          ))}

        {tab === 'patients' &&
          patients.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{p.name}</Text>
                <Text style={styles.cardSub}>
                  {p.age}y · {p.gender} · Dr. {p.assignedDoctorName || 'Assigned'}
                </Text>
              </View>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  setSelectedPatient(p);
                  setTargetDocId('');
                  setTransferModal(true);
                }}
              >
                Transfer
              </Button>
            </View>
          ))}

        {tab === 'audits' &&
          audits.map((log) => (
            <View key={log.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Badge variant="warning">{log.action}</Badge>
                <Text style={[styles.cardSub, { marginTop: 4 }]}>
                  {log.patientId ? `Patient #${log.patientId.slice(0, 8)}` : 'System'}
                </Text>
              </View>
              <Text style={styles.cardSub}>
                {new Date(log.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}
      </ScrollView>

      {/* Transfer Modal */}
      <Modal
        visible={transferModal}
        onClose={() => setTransferModal(false)}
        title={`Transfer: ${selectedPatient?.name}`}
      >
        <Text style={{ fontSize: 12, color: colors.slate[700], marginBottom: 12 }}>
          Select the target physician:
        </Text>
        {doctors
          .filter((d) => (d.id || d.uid) !== selectedPatient?.assignedDoctorId)
          .map((d) => (
            <TouchableOpacity
              key={d.id || d.uid}
              style={[
                styles.transferOption,
                (d.id || d.uid) === targetDocId && styles.transferOptionActive,
              ]}
              onPress={() => setTargetDocId(d.id || d.uid)}
            >
              <Text style={styles.cardName}>{d.displayName}</Text>
              <Text style={styles.cardSub}>{d.specialization || 'General'}</Text>
            </TouchableOpacity>
          ))}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <Button variant="ghost" onPress={() => setTransferModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" loading={transferring} onPress={handleTransfer}>
            Confirm Transfer
          </Button>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.slate[900] },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.slate[900] },
  statLabel: { fontSize: 11, color: colors.slate[600], marginTop: 2 },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.blue[500] },
  tabText: { fontSize: 11, fontWeight: '600', color: colors.slate[600] },
  tabTextActive: { color: colors.blue[600] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cardName: { fontSize: 14, fontWeight: '600', color: colors.slate[900] },
  cardSub: { fontSize: 11, color: colors.slate[600], marginTop: 1 },
  transferOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    marginBottom: 6,
  },
  transferOptionActive: {
    borderColor: colors.blue[500],
    backgroundColor: colors.blue[50],
  },
});

export default AdminScreen;
