import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDI9wPUswyQsdVTrKvEl87xn1rntb5Ix-A",
  authDomain: "divcash1-2c72a.firebaseapp.com",
  projectId: "divcash1-2c72a",
  storageBucket: "divcash1-2c72a.firebasestorage.app",
  messagingSenderId: "989342896268",
  appId: "1:989342896268:web:3c09855046abfdd2e7eba9"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };