// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwBe4k7qZ36hJZFRH1HxrVt1WD4VPJfv4",
  authDomain: "techkriti-26.firebaseapp.com",
  projectId: "techkriti-26",
  storageBucket: "techkriti-26.firebasestorage.app",
  messagingSenderId: "854223759655",
  appId: "1:854223759655:web:3eb6bb300edd1397002102",
  measurementId: "G-M311DGCE03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// 👇 Export Firestore helpers properly
export { doc, getDoc, setDoc, signInWithPopup, signOut, updateDoc, ref, uploadBytes, getDownloadURL, deleteObject };
const analytics = getAnalytics(app);