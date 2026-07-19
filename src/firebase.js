import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// All Firebase config is read from Vite env vars (.env.local, gitignored)
// or Vercel environment variables in production. Nothing is hardcoded.
//
// Required vars: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN,
// VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID, etc. (see .env.example)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const hasValidConfig =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'AIzaSy...' &&
  !firebaseConfig.apiKey.includes('your_firebase_api_key')

let app, analytics, auth, db, googleProvider

if (hasValidConfig) {
  try {
    app = initializeApp(firebaseConfig)
    try {
      analytics = getAnalytics(app)
    } catch (e) {
      console.warn('[Firebase] Analytics failed to initialize:', e)
    }
    auth = getAuth(app)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    })
    googleProvider = new GoogleAuthProvider()
  } catch (err) {
    console.error('[Firebase] Initialization error, falling back to demo mode:', err)
    app = null
  }
}

if (!app) {
  console.warn('[Firebase] Missing or invalid credentials in environment. Operating in OFFLINE/DEMO mode only.')
  // Minimal stubs so imports never crash the app. AuthContext's
  // onAuthStateChanged error handler routes users to demo mode; Firestore
  // calls in SubscriptionContext / useFirestoreGallery are guarded behind
  // offline/demo flags, so a non-functional db here is safe.
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb) => {
      setTimeout(() => cb(null), 0)
      return () => {}
    },
    signInWithPopup: () => Promise.reject(new Error('Firebase auth not configured. Using demo mode.')),
    signOut: () => Promise.resolve(),
  }
  db = {}
  googleProvider = {}
}

export { app, analytics, auth, db, googleProvider }
