// firebase.js
import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Connect to Firestore emulator if in development and emulator is running
if (process.env.NODE_ENV === 'development') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    if (process.env.NODE_ENV === 'development') {
      console.log('Connected to Firestore emulator');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to connect to Firestore emulator:', error.message);
    }
  }
}
export { db };

//initialize google authentication
const auth = getAuth(app);

// Connect to Auth emulator if in development and emulator is running
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    if (process.env.NODE_ENV === 'development') {
      console.log('Connected to Auth emulator');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to connect to Auth emulator:', error.message);
    }
  }
}

const googleProvider = new GoogleAuthProvider();
export { auth, googleProvider };

// Initialize Cloud Functions
const functions = getFunctions(app);
if (process.env.NODE_ENV === 'development') {
  try {
    connectFunctionsEmulator(functions, "localhost", 5001);
    if (process.env.NODE_ENV === 'development') {
      console.log('Connected to Functions emulator');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to connect to Functions emulator:', error.message);
    }
  }
}
export { functions };

// Initialize Storage
const storage = getStorage(app);
// Connect to Storage emulator if in development and emulator is running
if (process.env.NODE_ENV === 'development') {
  try {
    connectStorageEmulator(storage, 'localhost', 9199);
    if (process.env.NODE_ENV === 'development') {
      console.log('Connected to Storage emulator');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to connect to Storage emulator:', error.message);
    }
  }
}
export { storage };

// Export app for use with client-side messaging initialization
export { app };