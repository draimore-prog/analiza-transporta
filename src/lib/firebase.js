import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "analiza-transporta-flota",
  appId: "1:1097206634987:web:178e18377696faf183e1ae",
  storageBucket: "analiza-transporta-flota.firebasestorage.app",
  apiKey: "AIzaSyDyYOLagPwhGirEfMXbqAClooDFODUVb2M",
  authDomain: "analiza-transporta-flota.firebaseapp.com",
  messagingSenderId: "1097206634987"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
