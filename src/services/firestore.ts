import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export function generateId(): string {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += hex[Math.floor(Math.random() * 16)];
  }
  return [
    id.slice(0, 8),
    id.slice(8, 12),
    '4' + id.slice(13, 16),
    id.slice(16, 20),
    id.slice(20, 32),
  ].join('-');
}

// ── Users ──

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as any) : null;
}

export async function createUserProfile(uid: string, data: Record<string, any>) {
  await setDoc(doc(db, 'users', uid), data);
}

export async function updateUserProfile(uid: string, data: Record<string, any>) {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

// ── Patients ──

export async function getPatients(uid: string, role: string) {
  let q: any;
  if (role === 'admin') {
    q = collection(db, 'patients');
  } else {
    q = query(collection(db, 'patients'), where('assignedDoctorId', '==', uid));
  }
  const snap = await getDocs(q);
  const patients = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  patients.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return patients;
}

export async function getPatient(patientId: string) {
  const snap = await getDoc(doc(db, 'patients', patientId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as any : null;
}

export async function createPatient(data: Record<string, any>) {
  const patientId = data.id || generateId();
  const patientData = {
    id: patientId,
    name: data.name,
    age: parseInt(data.age, 10),
    gender: data.gender,
    bloodType: data.bloodType || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    medicalHistory: data.medicalHistory || '',
    allergies: data.allergies || [],
    currentMedications: data.currentMedications || [],
    emergencyContact: data.emergencyContact || {},
    assignedDoctorId: data.assignedDoctorId,
    assignedDoctorName: data.assignedDoctorName || '',
    analyses: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'patients', patientId), patientData);
  return patientData;
}

// ── Analyses ──

export async function getAnalyses(uid: string, role: string) {
  let q: any;
  if (role === 'admin') {
    q = collection(db, 'analyses');
  } else {
    q = query(collection(db, 'analyses'), where('doctorId', '==', uid));
  }
  const snap = await getDocs(q);
  let analyses = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  analyses.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return analyses.slice(0, 50);
}

export async function getAnalysis(analysisId: string) {
  const snap = await getDoc(doc(db, 'analyses', analysisId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as any : null;
}

export async function getPatientAnalyses(patientId: string) {
  const q = query(collection(db, 'analyses'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  const analyses = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  analyses.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return analyses;
}

export async function getPriorAnalyses(patientId: string) {
  const analyses = await getPatientAnalyses(patientId);
  return analyses
    .filter((a: any) => a?.analysis)
    .slice(0, 3)
    .map((a: any) => ({
      date: String(a.createdAt).slice(0, 10),
      imageType: a.imageType || 'scan',
      summary: a.analysis.summary || '',
      findings: (a.analysis.findings || []).map((f: any) => `${f.finding} (${f.location})`),
    }));
}

export async function saveAnalysis(data: Record<string, any>) {
  const analysisId = data.id || generateId();
  await setDoc(doc(db, 'analyses', analysisId), { ...data, id: analysisId });
  if (data.patientId) {
    try {
      await updateDoc(doc(db, 'patients', data.patientId), {
        lastAnalysisAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch {}
  }
  return analysisId;
}

// ── Admin ──

export async function getAllDoctors() {
  const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}

export async function getAllPatients() {
  const snap = await getDocs(collection(db, 'patients'));
  const patients = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  patients.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return patients;
}

export async function getAuditLogs() {
  try {
    const snap = await getDocs(collection(db, 'auditLogs'));
    const logs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs;
  } catch {
    return [];
  }
}

export async function updateDoctorStatus(uid: string, status: string) {
  await updateDoc(doc(db, 'users', uid), {
    status,
    updatedAt: new Date().toISOString(),
  });
  const logId = generateId();
  await setDoc(doc(db, 'auditLogs', logId), {
    id: logId,
    action: status === 'suspended' ? 'DOCTOR_SUSPENDED' : 'DOCTOR_ACTIVATED',
    performedBy: 'admin',
    timestamp: new Date().toISOString(),
  });
}

export async function transferPatient(
  patientId: string,
  targetDoctorId: string,
  targetDoctorName: string,
) {
  await updateDoc(doc(db, 'patients', patientId), {
    assignedDoctorId: targetDoctorId,
    assignedDoctorName: targetDoctorName,
    updatedAt: new Date().toISOString(),
  });
  const logId = generateId();
  await setDoc(doc(db, 'auditLogs', logId), {
    id: logId,
    action: 'PATIENT_TRANSFERRED',
    patientId,
    performedBy: 'admin',
    timestamp: new Date().toISOString(),
  });
}
