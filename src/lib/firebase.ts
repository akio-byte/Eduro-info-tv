import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

export const isMockFirebase = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';

if (isMockFirebase && import.meta.env.PROD) {
  console.error('⚠️ WARNING: Mock mode is enabled in a production build! This should be disabled in production.');
}
