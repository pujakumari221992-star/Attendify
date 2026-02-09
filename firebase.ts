import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence, collection, doc, setDoc, onSnapshot, query, where, getDocs, addDoc, deleteDoc, updateDoc, serverTimestamp, orderBy, getDoc, writeBatch, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAeWL35I5QVGEihCRzfnVv7Zav0we8ODAc",
  authDomain: "attendify-e9c1a.firebaseapp.com",
  projectId: "attendify-e9c1a",
  storageBucket: "attendify-e9c1a.appspot.com",
  messagingSenderId: "382309566686",
  appId: "1:382309566686:web:865681a2512a9e33b41a4f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch(() => {});
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  collection, doc, setDoc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs, serverTimestamp, orderBy, writeBatch, limit,
  ref, uploadString, getDownloadURL, deleteObject
};

export default app;