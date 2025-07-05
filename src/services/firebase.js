// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import mock Firebase implementation for testing
import { mockAuth, mockFirestore, mockOnAuthStateChanged } from './mockFirebase';

// Determine if we should use real Firebase with environment variables
const USE_MOCK_FIREBASE = false; // Using real Firebase with environment variables

// Fallback Firebase configuration for development/testing
const fallbackConfig = {
  apiKey: "AIzaSyBLs-NPmwcLPr-I8AxWBYJgR9J9Jm7_9Ys",
  authDomain: "job-tracker-demo-app.firebaseapp.com",
  projectId: "job-tracker-demo-app",
  storageBucket: "job-tracker-demo-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Try to use environment variables first, fallback to demo config if not available
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || fallbackConfig.appId
};

// Debug Firebase configuration
console.log('Firebase Config (API key masked):', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-6) : 'undefined',
});

// Check if Firebase config is valid
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId;
console.log('Firebase config valid:', isConfigValid);

// If config is invalid, show a warning
if (!isConfigValid) {
  console.warn('Firebase configuration is incomplete. Check your .env file.');
}

// Initialize Firebase
const app = USE_MOCK_FIREBASE ? null : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = USE_MOCK_FIREBASE ? mockAuth : getAuth(app);
const db = USE_MOCK_FIREBASE ? mockFirestore : getFirestore(app);
const storage = USE_MOCK_FIREBASE ? null : getStorage(app);

// Export Firebase services and mock functions
export { auth, db, storage, mockOnAuthStateChanged };
