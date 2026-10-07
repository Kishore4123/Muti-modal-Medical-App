import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { colors } from '../theme/colors';

const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, setUser, logout } = useAuthStore();

  const [form, setForm] = useState({
    displayName: user?.displayName || user?.name || '',
    specialization: user?.specialization || '',
    licenseNumber: user?.licenseNumber || '',
    hospital: user?.hospital || '',
    phone: user?.phone || '',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      setUser(res.data.user);
      Alert.alert('Success', 'Profile updated.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      logout();
    } catch {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'D'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.name}>
                {user?.displayName || user?.name || 'Physician'}
              </Text>
              <Badge variant={user?.role === 'admin' ? 'warning' : 'info'}>
                {user?.role?.toUpperCase()}
              </Badge>
            </View>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.affiliation}>
              {user?.hospital || 'Clinical Practice'}
            </Text>
          </View>
        </View>
      </View>

      {/* Edit Form */}
      <View style={styles.formCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Ionicons name="medical" size={16} color={colors.blue[600]} />
          <Text style={styles.formTitle}>Medical Credentials</Text>
        </View>

        <Field
          label="Physician Name"
          icon="person"
          value={form.displayName}
          onChangeText={(v) => setForm((f) => ({ ...f, displayName: v }))}
        />
        <Field
          label="Email (Read-Only)"
          icon="mail"
          value={user?.email || ''}
          editable={false}
        />
        <Field
          label="Specialization"
          icon="medical"
          value={form.specialization}
          onChangeText={(v) => setForm((f) => ({ ...f, specialization: v }))}
        />
        <Field
          label="License Number"
          icon="ribbon"
          value={form.licenseNumber}
          onChangeText={(v) => setForm((f) => ({ ...f, licenseNumber: v }))}
        />
        <Field
          label="Hospital"
          icon="business"
          value={form.hospital}
          onChangeText={(v) => setForm((f) => ({ ...f, hospital: v }))}
        />
        <Field
          label="Phone"
          icon="call"
          value={form.phone}
          onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
          keyboardType="phone-pad"
        />

        <Button
          variant="primary"
          loading={saving}
          onPress={handleSave}
          style={{ marginTop: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="save" size={16} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>
              Save Changes
            </Text>
          </View>
        </Button>
      </View>

      {/* Sign Out */}
      <Button variant="danger" onPress={handleSignOut} style={{ marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="log-out" size={16} color={colors.white} />
          <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>Sign Out</Text>
        </View>
      </Button>
    </ScrollView>
  );
};

const Field: React.FC<{
  label: string;
  icon: string;
  value: string;
  onChangeText?: (v: string) => void;
  editable?: boolean;
  keyboardType?: any;
}> = ({ label, icon, value, onChangeText, editable = true, keyboardType }) => (
  <View style={fieldStyles.container}>
    <Text style={fieldStyles.label}>{label}</Text>
    <View style={fieldStyles.inputRow}>
      <Ionicons name={icon as any} size={16} color={colors.slate[500]} />
      <TextInput
        style={[fieldStyles.input, !editable && { color: colors.slate[500] }]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholderTextColor={colors.slate[400]}
      />
    </View>
  </View>
);

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: colors.slate[600], marginBottom: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 14, color: colors.slate[900] },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.blue[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: colors.slate[900] },
  email: { fontSize: 12, color: colors.slate[600], marginTop: 2 },
  affiliation: { fontSize: 11, color: colors.slate[500], marginTop: 1 },
  formCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  formTitle: { fontSize: 14, fontWeight: '600', color: colors.slate[800] },
});

export default ProfileScreen;
