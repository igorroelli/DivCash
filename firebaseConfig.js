import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDI9wPUswyQsdVTrKvEl87xn1rntb5Ix-A",
  authDomain: "divcash1-2c72a.firebaseapp.com",
  projectId: "divcash1-2c72a",
  storageBucket: "divcash1-2c72a.firebasestorage.app",
  messagingSenderId: "989342896268",
  appId: "1:989342896268:web:3c09855046abfdd2e7eba9"
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o serviço de Autenticação com persistência local
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Inicializa o serviço do Firestore
const db = getFirestore(app);

// Exporta as instâncias para serem usadas no aplicativ
export { auth, db };