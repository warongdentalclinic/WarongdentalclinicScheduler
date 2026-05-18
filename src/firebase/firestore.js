// src/firebase/firestore.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from './config';

// ─── PATIENTS ───────────────────────────────────────────────
export const addPatient = (data) =>
  addDoc(collection(db, 'patients'), { ...data, createdAt: serverTimestamp() });

export const updatePatient = (id, data) =>
  updateDoc(doc(db, 'patients', id), data);

export const searchPatients = async (field, value) => {
  const q = query(
    collection(db, 'patients'),
    where(field, '>=', value),
    where(field, '<=', value + '\uf8ff')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getPatientByHN = async (hn) => {
  const q = query(collection(db, 'patients'), where('hn', '==', hn));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// ─── APPOINTMENTS ────────────────────────────────────────────
export const addAppointment = (data) =>
  addDoc(collection(db, 'appointments'), {
    ...data,
    status: 'scheduled',
    isWalkIn: data.isWalkIn || false,
    createdAt: serverTimestamp()
  });

export const updateAppointment = (id, data) =>
  updateDoc(doc(db, 'appointments', id), { ...data, updatedAt: serverTimestamp() });

export const getAppointmentsByDate = async (dateStr) => {
  const q = query(
    collection(db, 'appointments'),
    where('date', '==', dateStr),
    orderBy('time', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const subscribeToDate = (dateStr, callback) => {
  const q = query(
    collection(db, 'appointments'),
    where('date', '==', dateStr),
    orderBy('time', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const subscribeToRecalls = (callback) => {
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
  const q = query(
    collection(db, 'recalls'),
    where('recallDate', '<=', Timestamp.fromDate(today)),
    where('notified', '==', false)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const addRecall = (data) =>
  addDoc(collection(db, 'recalls'), { ...data, notified: false, createdAt: serverTimestamp() });

export const markRecallNotified = (id) =>
  updateDoc(doc(db, 'recalls', id), { notified: true });

// ─── SETTINGS ────────────────────────────────────────────────
export const getSettings = async (key) => {
  const snap = await getDoc(doc(db, 'settings', key));
  return snap.exists() ? snap.data() : null;
};

export const saveSettings = (key, data) => {
  const ref = doc(db, 'settings', key);
  return updateDoc(ref, data).catch(() =>
    addDoc(collection(db, 'settings'), { id: key, ...data })
  );
};

export const getCollection = async (name) => {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addToCollection = (name, data) =>
  addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() });

export const updateInCollection = (name, id, data) =>
  updateDoc(doc(db, name, id), data);

export const deleteFromCollection = (name, id) =>
  deleteDoc(doc(db, name, id));
