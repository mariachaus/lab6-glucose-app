import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAtIKkretrmiJwHKYWybpwAQ2YXrkHfUqs",
  authDomain: "glucoseapp-71310.firebaseapp.com",
  projectId: "glucoseapp-71310",
  storageBucket: "glucoseapp-71310.firebasestorage.app",
  messagingSenderId: "413274778464",
  appId: "1:413274778464:web:fdddeaff162c2413890c05"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);     
export const db = getFirestore(app);

