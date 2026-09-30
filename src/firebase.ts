import { initializeApp } from "firebase/app";
import * as firestore from "firebase/firestore";
import * as demo from "./utils/demoStore";
import config from "../firebase-applet-config.json";
// Local demo is explicit and isolated: it never writes demo personas to a shared database.
// Enable VITE_DATA_MODE=live only with a secured Firebase deployment.
export const isDemoMode = import.meta.env.VITE_DATA_MODE !== "live";
export const db: any = isDemoMode
  ? {}
  : firestore.initializeFirestore(
      initializeApp(config),
      {},
      config.firestoreDatabaseId || "(default)",
    );
const api: any = isDemoMode ? demo : firestore;
export const collection: typeof firestore.collection = api.collection;
export const doc: typeof firestore.doc = api.doc;
export const getDocs: typeof firestore.getDocs = api.getDocs;
export const getDoc: typeof firestore.getDoc = api.getDoc;
export const setDoc: typeof firestore.setDoc = api.setDoc;
export const addDoc: typeof firestore.addDoc = api.addDoc;
export const updateDoc: typeof firestore.updateDoc = api.updateDoc;
export const onSnapshot: typeof firestore.onSnapshot = api.onSnapshot;
export const query: typeof firestore.query = api.query;
export const where: typeof firestore.where = api.where;
export const orderBy: typeof firestore.orderBy = api.orderBy;
export const limit: typeof firestore.limit = api.limit;
export const increment: typeof firestore.increment = api.increment;
export const writeBatch: typeof firestore.writeBatch = api.writeBatch;
export const runTransaction: typeof firestore.runTransaction =
  api.runTransaction;
export const Timestamp = firestore.Timestamp;
