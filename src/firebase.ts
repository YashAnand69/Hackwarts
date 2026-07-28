import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment,
  writeBatch
} from "firebase/firestore";
import config from "../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID from config as the 3rd parameter
export const db = initializeFirestore(app, {}, config.firestoreDatabaseId || "(default)");

export { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment,
  writeBatch
};
