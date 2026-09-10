import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForStaticHosting",
  authDomain: "analiza-transporta-flota.firebaseapp.com",
  projectId: "analiza-transporta-flota",
  storageBucket: "analiza-transporta-flota.appspot.com",
  messagingSenderId: "1087413645321",
  appId: "1:1087413645321:web:analizaTransportaAppId"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
