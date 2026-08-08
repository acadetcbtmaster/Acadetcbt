import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || 'cbt-master-b1d65.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || 'cbt-master-b1d65',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || 'cbt-master-b1d65.firebasestorage.app',
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firestore with auto-detected long polling for sandbox reliability
const configuredDbId = firebaseConfigData.firestoreDatabaseId || '(default)';
const dbId = configuredDbId === 'ai-studio-aicbtsimulator-24029710-e20e-4e1e-a3cf-846d58bd47cf' ? '(default)' : configuredDbId;

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, dbId);

export {
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
};
export type { User };
