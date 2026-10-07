import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPatients, createPatient } from '../services/firestore';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { colors } from '../theme/colors';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType?: string;
  phone?: string;
  assignedDoctorName?: string;
  lastAnalysisAt?: string;
}

const PatientListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodType: 'O+',
    phone: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
  });

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const pats = await getPatients(user!.uid, user!.role);
      setPatients(pats);
    } catch {
      Alert.alert('Error', 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.age) {
      Alert.alert('Missing Fields', 'Name and age are required.');
      return;
    }
    setCreating(true);
    try {
      await createPatient({
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        gender: form.gender,
        bloodType: form.bloodType,
        phone: form.phone.trim(),
        medicalHistory: form.medicalHistory.trim(),
        allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()) : [],
        currentMedications: form.currentMedications
          ? form.currentMedications.split(',').map((s) => s.trim())
          : [],
        assignedDoctorId: user!.uid,
        assignedDoctorName: user!.displayName || '',
      });
      Alert.alert('Success', `Patient ${form.name} registered.`);
      setModalVisible(false);
      setForm({ name: '', age: '', gender: 'Male', bloodType: 'O+', phone: '', medicalHistory: '', allergies: '', currentMedications: '' });
      fetchPatients();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create patient.');
    } finally {
      setCreating(false);
    }
  };

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.bloodType?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>
            {isAdmin ? 'All Patients' : 'My Patients'}
          </Text>
          <Text style={styles.subtitle}>
            {isAdmin ? 'System-wide patient directory' : 'Under your clinical supervision'}
          </Text>
        </View>
        {!isAdmin && (
          <Button variant="primary" size="sm" onPress={() => setModalVisible(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="person-add" size={16} color={colors.white} />
              <Text style={{ color: colors.white, fontWeight: '600', fontSize: 12 }}>Add</Text>
            </View>
          </Button>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.slate[500]} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search patients..."
          placeholderTextColor={colors.slate[400]}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue[500]} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people" size={40} color={colors.slate[300]} />
          <Text style={styles.emptyTitle}>No patients found</Text>
          <Text style={styles.emptySub}>
            {search ? 'Try a different search.' : 'Register your first patient.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {filtered.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => navigation.navigate('PatientDetail', { patientId: p.id })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{p.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <Text style={styles.cardSub}>
                    {p.age}y · {p.gender}
                  </Text>
                </View>
                <Badge variant="info">{p.bloodType || 'N/A'}</Badge>
              </View>
              <View style={styles.cardFooter}>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => navigation.navigate('PatientDetail', { patientId: p.id })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="eye" size={14} color={colors.slate[600]} />
                    <Text style={{ fontSize: 12, color: colors.slate[600] }}>View</Text>
                  </View>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() =>
                    navigation.navigate('NewAnalysis', { patientId: p.id })
                  }
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="scan" size={14} color={colors.white} />
                    <Text style={{ fontSize: 12, color: colors.white, fontWeight: '600' }}>Analyze</Text>
                  </View>
                </Button>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Create Modal */}
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="Register New Patient">
        <View style={{ gap: 10 }}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.modalInput}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Eleanor Vance"
            placeholderTextColor={colors.slate[400]}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Age *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.age}
                onChangeText={(v) => setForm((f) => ({ ...f, age: v }))}
                placeholder="54"
                placeholderTextColor={colors.slate[400]}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Gender</Text>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => {
                  const next = form.gender === 'Male' ? 'Female' : form.gender === 'Female' ? 'Other' : 'Male';
                  setForm((f) => ({ ...f, gender: next }));
                }}
              >
                <Text style={{ fontSize: 14, color: colors.slate[900] }}>{form.gender}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.modalInput}
            value={form.phone}
            onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+1 555 000-0000"
            placeholderTextColor={colors.slate[400]}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Medical History</Text>
          <TextInput
            style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
            value={form.medicalHistory}
            onChangeText={(v) => setForm((f) => ({ ...f, medicalHistory: v }))}
            placeholder="Prior conditions..."
            placeholderTextColor={colors.slate[400]}
            multiline
          />

          <Text style={styles.inputLabel}>Allergies (comma-separated)</Text>
          <TextInput
            style={styles.modalInput}
            value={form.allergies}
            onChangeText={(v) => setForm((f) => ({ ...f, allergies: v }))}
            placeholder="Penicillin, Latex"
            placeholderTextColor={colors.slate[400]}
          />

          <Text style={styles.inputLabel}>Medications (comma-separated)</Text>
          <TextInput
            style={styles.modalInput}
            value={form.currentMedications}
            onChangeText={(v) => setForm((f) => ({ ...f, currentMedications: v }))}
            placeholder="Lisinopril 10mg"
            placeholderTextColor={colors.slate[400]}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Button variant="ghost" onPress={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={creating} onPress={handleCreate}>
              Save Patient
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.slate[900] },
  subtitle: { fontSize: 11, color: colors.slate[600], marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.slate[900] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 60,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.slate[700] },
  emptySub: { fontSize: 12, color: colors.slate[500] },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.blue[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.slate[900] },
  cardSub: { fontSize: 11, color: colors.slate[500], marginTop: 1 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
    paddingTop: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate[700],
  },
  modalInput: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.slate[900],
  },
});

export default PatientListScreen;
