import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'app1-810ef.firebaseapp.com',
  projectId: 'app1-810ef',
  storageBucket: 'app1-810ef.firebasestorage.app',
  messagingSenderId: '77299255414',
  appId: '1:77299255414:web:c886eb47cba151e2383757',
  measurementId: 'G-KGJ4MTBMKB'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);