import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { colors } from '../theme/colors';

interface PatientOption {
  id: string;
  name: string;
  age: number;
  gender: string;
}

const MODALITIES = [
  'Chest X-Ray',
  'Brain MRI (T1/T2/FLAIR)',
  'Abdominal CT Scan',
  'Chest CT Scan',
  'Musculoskeletal X-Ray',
  'Ultrasound / Sonography',
  'Histopathology Biopsy',
  'Mammography',
  'Other Medical Scan',
];

const NewAnalysisScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const preselectedId = route.params?.patientId || '';

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedId);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [imageType, setImageType] = useState('Chest X-Ray');
  const [modalityPickerOpen, setModalityPickerOpen] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [preliminaryFindings, setPreliminaryFindings] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);

  useEffect(() => {
    api
      .get('/patients')
      .then((res) => setPatients(res.data.patients || []))
      .catch(() => Alert.alert('Error', 'Failed to load patients.'))
      .finally(() => setLoadingPatients(false));
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImageUri(manipulated.uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to capture scans.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImageUri(manipulated.uri);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedPatientId) {
      Alert.alert('Missing', 'Please select a patient.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Missing', 'Please select or capture a medical scan.');
      return;
    }
    if (!clinicalNotes.trim()) {
      Alert.alert('Missing', 'Please provide clinical notes.');
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'scan.jpg',
      } as any);
      formData.append('patientId', selectedPatientId);
      formData.append('imageType', imageType);
      formData.append('clinicalNotes', clinicalNotes.trim());
      formData.append('findings', preliminaryFindings.trim());

      const res = await api.post('/analysis/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Analysis complete!');
      navigation.navigate('AnalysisReport', { analysisId: res.data.analysis.id });
    } catch (err: any) {
      Alert.alert(
        'Analysis Failed',
        err.response?.data?.error || 'Please check API configuration.',
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Banner */}
      <View style={styles.banner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="sparkles" size={20} color={colors.blue[600]} />
          <Text style={styles.bannerTitle}>Diagnostic Imaging Assistant</Text>
        </View>
        <Text style={styles.bannerSub}>
          Upload a medical scan with clinical notes for AI analysis.
        </Text>
      </View>

      {/* Warning */}
      <View style={styles.warningBox}>
        <Ionicons name="warning" size={16} color={colors.amber[700]} />
        <Text style={styles.warningText}>
          Clinical Protocol: This system is decision support only. All findings must be
          correlated with clinical judgment.
        </Text>
      </View>

      {/* Step 1: Patient */}
      <View style={styles.section}>
        <View style={styles.stepHeader}>
          <Ionicons name="person" size={18} color={colors.blue[600]} />
          <Text style={styles.stepTitle}>Step 1: Select Patient</Text>
        </View>
        {loadingPatients ? (
          <Text style={styles.loadingText}>Loading patients...</Text>
        ) : patients.length === 0 ? (
          <View style={styles.emptyPatients}>
            <Text style={styles.emptyText}>No patients found.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PatientList')}>
              <Text style={styles.linkText}>Create a patient first</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setPatientPickerOpen(!patientPickerOpen)}
            >
              <Text style={{ color: selectedPatient ? colors.slate[900] : colors.slate[400], fontSize: 14 }}>
                {selectedPatient
                  ? `${selectedPatient.name} (${selectedPatient.age}y, ${selectedPatient.gender})`
                  : '-- Choose Patient --'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.slate[500]} />
            </TouchableOpacity>
            {patientPickerOpen && (
              <View style={styles.pickerList}>
                {patients.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickerItem, p.id === selectedPatientId && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedPatientId(p.id);
                      setPatientPickerOpen(false);
                    }}
                  >
                    <Text style={styles.pickerText}>
                      {p.name} ({p.age}y, {p.gender})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.picker, { marginTop: 10 }]}
              onPress={() => setModalityPickerOpen(!modalityPickerOpen)}
            >
              <Text style={{ color: colors.slate[900], fontSize: 14 }}>{imageType}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.slate[500]} />
            </TouchableOpacity>
            {modalityPickerOpen && (
              <View style={styles.pickerList}>
                {MODALITIES.map((mod) => (
                  <TouchableOpacity
                    key={mod}
                    style={[styles.pickerItem, mod === imageType && styles.pickerItemActive]}
                    onPress={() => {
                      setImageType(mod);
                      setModalityPickerOpen(false);
                    }}
                  >
                    <Text style={styles.pickerText}>{mod}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Step 2: Image */}
      <View style={styles.section}>
        <View style={styles.stepHeader}>
          <Ionicons name="scan" size={18} color={colors.blue[600]} />
          <Text style={styles.stepTitle}>Step 2: Upload Scan</Text>
        </View>
        {imageUri ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            <TouchableOpacity style={styles.clearBtn} onPress={() => setImageUri(null)}>
              <Ionicons name="close" size={18} color={colors.slate[700]} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Ionicons name="images" size={24} color={colors.slate[600]} />
              <Text style={styles.uploadText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color={colors.slate[600]} />
              <Text style={styles.uploadText}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Step 3: Notes */}
      <View style={styles.section}>
        <View style={styles.stepHeader}>
          <Ionicons name="document-text" size={18} color={colors.blue[600]} />
          <Text style={styles.stepTitle}>Step 3: Clinical Notes *</Text>
        </View>
        <TextInput
          style={styles.textArea}
          value={clinicalNotes}
          onChangeText={setClinicalNotes}
          placeholder="e.g. 58yo male, persistent cough 3 weeks, low-grade fever..."
          placeholderTextColor={colors.slate[400]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <View style={styles.noteHint}>
          <Ionicons name="information-circle" size={14} color={colors.blue[600]} />
          <Text style={styles.hintText}>
            Crucial for multimodal correlation to reduce false positives.
          </Text>
        </View>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>
          Doctor Observation (Optional)
        </Text>
        <TextInput
          style={styles.input}
          value={preliminaryFindings}
          onChangeText={setPreliminaryFindings}
          placeholder="e.g. Suspected consolidation in right lower lobe"
          placeholderTextColor={colors.slate[400]}
        />
      </View>

      {/* Submit */}
      <Button
        variant="primary"
        size="lg"
        loading={analyzing}
        disabled={!imageUri || !selectedPatientId || !clinicalNotes.trim()}
        onPress={handleAnalyze}
        style={{ marginTop: 8 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="analytics" size={20} color={colors.white} />
          <Text style={{ color: colors.white, fontWeight: '600', fontSize: 15 }}>
            {analyzing ? 'Analyzing...' : 'Run AI Diagnostic Analysis'}
          </Text>
        </View>
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  banner: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderLeftWidth: 4,
    borderLeftColor: colors.blue[600],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 4,
  },
  bannerTitle: { fontSize: 17, fontWeight: '700', color: colors.slate[900] },
  bannerSub: { fontSize: 12, color: colors.slate[600], lineHeight: 18 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.amber[50],
    borderWidth: 1,
    borderColor: colors.amber[200],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: { fontSize: 11, color: colors.amber[700], flex: 1, lineHeight: 16 },
  section: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: colors.slate[800] },
  loadingText: { fontSize: 12, color: colors.slate[600] },
  emptyPatients: { alignItems: 'center', gap: 6 },
  emptyText: { fontSize: 12, color: colors.slate[600] },
  linkText: { fontSize: 12, color: colors.blue[600], fontWeight: '600', textDecorationLine: 'underline' },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  pickerItemActive: { backgroundColor: colors.blue[50] },
  pickerText: { fontSize: 13, color: colors.slate[700] },
  uploadRow: { flexDirection: 'row', gap: 12 },
  uploadBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.slate[200],
    borderRadius: 16,
    paddingVertical: 28,
    backgroundColor: colors.slate[50],
  },
  uploadText: { fontSize: 12, fontWeight: '500', color: colors.slate[600] },
  imagePreview: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.slate[900],
    position: 'relative',
  },
  previewImage: { width: '100%', height: 250 },
  clearBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.slate[50],
  },
  textArea: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.slate[900],
    minHeight: 80,
    lineHeight: 20,
  },
  noteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  hintText: { fontSize: 11, color: colors.slate[500], flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: colors.slate[700], marginBottom: 4 },
  input: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.slate[900],
  },
});

export default NewAnalysisScreen;
