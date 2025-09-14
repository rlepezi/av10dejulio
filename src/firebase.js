import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAnm8V217rAFWXI5LxxmUEwGI_-Nzbe6RM",
  authDomain: "huamachuco-c0d9f.firebaseapp.com",
  projectId: "huamachuco-c0d9f",
  storageBucket: "huamachuco-c0d9f.firebasestorage.app",
  messagingSenderId: "159537945910",
  appId: "1:159537945910:web:f70c13700159f848d1e797",
  measurementId: "G-CHMV3GKSRM"
};

/*
const firebaseConfig = {
  apiKey: "AIzaSyASi2ao3U8-D1rhdXfU-wUxji7PR_1muMo",
  authDomain: "av10dejulio-2ecc3.firebaseapp.com",
  projectId: "av10dejulio-2ecc3",
  storageBucket: "av10dejulio-2ecc3.appspot.com",
  messagingSenderId: "910468348910",
  appId: "1:910468348910:web:dd9a81bc1181a385dcacff",
  measurementId: "G-SZK5LL9Y14"
};

*/


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Inicializar messaging solo si está en el navegador y el service worker está disponible
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
    console.log('Firebase Messaging inicializado correctamente');
  } catch (error) {
    console.warn('Firebase Messaging no disponible:', error.message);
    // No lanzar el error para evitar que falle la aplicación
  }
} else {
  console.warn('Firebase Messaging no disponible: Service Worker no soportado');
}

export { messaging };