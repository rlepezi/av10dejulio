import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyASi2ao3U8-D1rhdXfU-wUxji7PR_1muMo",
  authDomain: "av10dejulio-2ecc3.firebaseapp.com",
  projectId: "av10dejulio-2ecc3",
  storageBucket: "av10dejulio-2ecc3.appspot.com",
  messagingSenderId: "910468348910",
  appId: "1:910468348910:web:dd9a81bc1181a385dcacff",
  measurementId: "G-SZK5LL9Y14"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);