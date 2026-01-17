import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBLs9up7fvFHnqkE0-QllVznr7nhB1vRvQ",
  authDomain: "amit-game-5a542.firebaseapp.com",
  projectId: "amit-game-5a542",
  storageBucket: "amit-game-5a542.firebasestorage.app",
  messagingSenderId: "717705277642",
  appId: "1:717705277642:web:527fd0fd57983abaa60433"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);