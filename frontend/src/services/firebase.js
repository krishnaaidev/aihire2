import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';

// Firebase configuration for aihire-platform (Authentication only)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCg4lpI2EpeN5rn66dyOonXbH4cMDN7758",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aihire-platform.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aihire-platform",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "160949664281",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:160949664281:web:da9fd1dcd81190fe280888",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D2NC5ER8LM"
};

// Check whether Firebase has valid configuration keys provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
);

// Initialize Firebase App singleton
export const app = getApps().length > 0 
  ? getApp() 
  : initializeApp(firebaseConfig);

// Firebase Authentication instance
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in using Firebase Email & Password
 */
export async function firebaseSignIn(email, password) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Authentication is not configured.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
}

/**
 * Sign up using Firebase Email & Password
 */
export async function firebaseSignUp(email, password) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Authentication is not configured.');
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
}

/**
 * Sign in with Google Popup
 */
export async function firebaseSignInWithGoogle() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Authentication is not configured.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  const token = await result.user.getIdToken();
  return { user: result.user, token };
}

/**
 * Sign out of Firebase
 */
export async function firebaseSignOut() {
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
}
