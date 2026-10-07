import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import { colors } from '../theme/colors';

const SPECIALIZATIONS = [
  'Radiology',
  'Pulmonology & Respiratory',
  'Cardiology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'General Medicine',
  'Emergency Medicine',
  'Pathology',
  'Internal Medicine',
  'Pediatrics',
  'Other Specialization',
];

const SignInScreen: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [specialization, setSpecialization] = useState('Radiology');
  const [specPickerOpen, setSpecPickerOpen] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospital, setHospital] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      const idToken = await cred.user.getIdToken();
      const res = await api.post('/auth/signin', { idToken });
      setUser(res.data.user);
    } catch (err: any) {
      if (err.response?.data?.needsRegistration) {
        Alert.alert('No Profile', 'No doctor profile found. Please sign up first.');
        setTab('signup');
        setSignupEmail(loginEmail);
      } else {
        Alert.alert(
          'Sign In Failed',
          err.response?.data?.error || err.message || 'Unable to authenticate.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupEmail.trim() || !signupPassword || !signupName.trim()) {
      Alert.alert('Missing Fields', 'Please fill in your name, email, and password.');
      return;
    }
    if (!licenseNumber.trim()) {
      Alert.alert('Missing Fields', 'Please enter your Medical License Number.');
      return;
    }
    if (!hospital.trim()) {
      Alert.alert('Missing Fields', 'Please enter your Hospital or Clinic name.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        signupEmail.trim(),
        signupPassword,
      );
      await updateProfile(cred.user, { displayName: signupName.trim() });
      const idToken = await cred.user.getIdToken();

      const res = await api.post('/auth/register', {
        idToken,
        displayName: signupName.trim(),
        specialization,
        licenseNumber: licenseNumber.trim(),
        hospital: hospital.trim(),
        phone: phone.trim(),
      });

      setUser(res.data.user);
    } catch (err: any) {
      Alert.alert(
        'Registration Failed',
        err.response?.data?.error || err.message || 'Could not create account.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand header */}
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Ionicons name="medical" size={24} color={colors.white} />
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandDark}>Tetrix</Text>
            <Text style={styles.brandBlue}>AI</Text>
          </View>
          <Text style={styles.brandSub}>
            A second opinion on every scan.
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'login' && styles.tabActive]}
            onPress={() => setTab('login')}
          >
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'signup' && styles.tabActive]}
            onPress={() => setTab('signup')}
          >
            <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
              Sign Up (Doctors)
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'login' ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSub}>
              Access your clinical workspace and patient diagnostics.
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={loginEmail}
              onChangeText={setLoginEmail}
              placeholder="doctor@hospital.com"
              placeholderTextColor={colors.slate[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={loginPassword}
              onChangeText={setLoginPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.slate[400]}
              secureTextEntry
            />

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLogin}
              style={{ marginTop: 16 }}
            >
              <Text style={styles.btnText}>Sign In</Text>
            </Button>

            <TouchableOpacity onPress={() => setTab('signup')} style={{ marginTop: 12 }}>
              <Text style={styles.switchText}>New doctor? Register here</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Doctor Registration</Text>
            <Text style={styles.formSub}>
              Enter your medical credentials to initialize your clinical account.
            </Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={signupName}
              onChangeText={setSignupName}
              placeholder="Dr. Jane Smith"
              placeholderTextColor={colors.slate[400]}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={signupEmail}
              onChangeText={setSignupEmail}
              placeholder="doctor@hospital.com"
              placeholderTextColor={colors.slate[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={signupPassword}
              onChangeText={setSignupPassword}
              placeholder="Choose a password (min 6 chars)"
              placeholderTextColor={colors.slate[400]}
              secureTextEntry
            />

            <Text style={styles.label}>Specialization *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setSpecPickerOpen(!specPickerOpen)}
            >
              <Text style={{ color: colors.slate[900], fontSize: 14 }}>{specialization}</Text>
              <Ionicons
                name={specPickerOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.slate[500]}
              />
            </TouchableOpacity>
            {specPickerOpen && (
              <View style={styles.pickerList}>
                {SPECIALIZATIONS.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[
                      styles.pickerItem,
                      spec === specialization && styles.pickerItemActive,
                    ]}
                    onPress={() => {
                      setSpecialization(spec);
                      setSpecPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        spec === specialization && { color: colors.blue[600], fontWeight: '600' },
                      ]}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Medical License Number *</Text>
            <TextInput
              style={styles.input}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="e.g. MD-482019"
              placeholderTextColor={colors.slate[400]}
            />

            <Text style={styles.label}>Hospital / Clinic *</Text>
            <TextInput
              style={styles.input}
              value={hospital}
              onChangeText={setHospital}
              placeholder="e.g. Apollo Hospitals"
              placeholderTextColor={colors.slate[400]}
            />

            <Text style={styles.label}>Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={colors.slate[400]}
              keyboardType="phone-pad"
            />

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSignup}
              style={{ marginTop: 16 }}
            >
              <Text style={styles.btnText}>Create Doctor Account</Text>
            </Button>

            <TouchableOpacity onPress={() => setTab('login')} style={{ marginTop: 12 }}>
              <Text style={styles.switchText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Decision support for qualified clinicians. It does not replace clinical judgment.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.blue[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
  },
  brandDark: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.slate[900],
  },
  brandBlue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.blue[600],
  },
  brandSub: {
    fontSize: 13,
    color: colors.slate[500],
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.blue[500],
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate[600],
  },
  tabTextActive: {
    color: colors.blue[600],
  },
  form: {
    gap: 4,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate[900],
  },
  formSub: {
    fontSize: 12,
    color: colors.slate[600],
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate[700],
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.slate[900],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  switchText: {
    fontSize: 12,
    color: colors.slate[600],
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 11,
    color: colors.slate[400],
    textAlign: 'center',
    marginTop: 32,
  },
  pickerList: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 200,
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  pickerItemActive: {
    backgroundColor: colors.blue[50],
  },
  pickerText: {
    fontSize: 13,
    color: colors.slate[700],
  },
});

export default SignInScreen;
