// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDU-VKS4J0MdvCDkqwowIvNNf_yNUjXqXE",
  authDomain: "dobby-fced3.firebaseapp.com",
  databaseURL: "https://dobby-fced3-default-rtdb.firebaseio.com",
  projectId: "dobby-fced3",
  storageBucket: "dobby-fced3.firebasestorage.app",
  messagingSenderId: "835665414703",
  appId: "1:835665414703:web:7d26926b1974b66c01d4da",
  measurementId: "G-Q3ZS04Y017"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
// Initialize Firestore with persistent cache for offline support
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, googleProvider };
