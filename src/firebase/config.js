import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBPjvWGdVuK_U5HQzqJwgCeAWks1oPGh64",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "avyukt-restaurant.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "avyukt-restaurant",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "avyukt-restaurant.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "280779017187",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:280779017187:web:9f530d582c35b33386eed6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T8EHWKHMQS",
};

let app = null;
let auth = null;
let db = null;
let analytics = null;
let googleProvider = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Safe analytics initialization for browser environments
  if (typeof window !== "undefined") {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }

  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
} catch (error) {
  console.warn("Firebase client initialization note:", error.message);
}

export { 
  app, 
  auth, 
  db, 
  analytics,
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
};
