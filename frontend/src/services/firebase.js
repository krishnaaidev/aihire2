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
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';

// Firebase configuration for aihire-platform (from Firebase Console)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCg4lPI2EpeN5rn66dyOonXbH4cMDN7758",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aihire-platform.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aihire-platform",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aihire-platform.firebasestorage.app",
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

// Firebase Cloud Storage instance
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in using Firebase Email & Password
 */
export async function firebaseSignIn(email, password) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not yet configured. Please set VITE_FIREBASE_API_KEY in your frontend/.env file.');
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
    throw new Error('Firebase is not yet configured. Please set VITE_FIREBASE_API_KEY in your frontend/.env file.');
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
    throw new Error('Firebase is not yet configured. Please set VITE_FIREBASE_API_KEY in your frontend/.env file.');
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

/**
 * Upload resume directly to Firebase Cloud Storage bucket
 * @param {File} file - The resume PDF or text file
 * @param {string} candidateId - Unique candidate ID or email
 * @param {Function} onProgress - Progress callback receiving percent 0-100
 * @returns {Promise<{downloadUrl: string, storagePath: string}>}
 */
export function uploadResumeToFirebase(file, candidateId = 'general', onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    if (!isFirebaseConfigured) {
      reject(new Error('Firebase Cloud Storage is not configured. Set VITE_FIREBASE_STORAGE_BUCKET in frontend/.env.'));
      return;
    }

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `resumes/${candidateId}/${timestamp}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/pdf',
      customMetadata: {
        candidateId: String(candidateId),
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(progress));
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}
