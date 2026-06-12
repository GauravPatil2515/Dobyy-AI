import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// Client-side Firebase configuration.
// Read from Vite environment variables. Falls back gracefully to Demo/Offline mode if not configured.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

let app, analytics, auth, db, googleProvider

const hasValidConfig = firebaseConfig.apiKey && 
                       firebaseConfig.apiKey !== 'AIzaSy...' && 
                       !firebaseConfig.apiKey.includes('your_firebase_api_key')

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
    console.error('[Firebase] Initialization error, falling back to mock services:', err)
  }
}

if (!app) {
  console.warn('[Firebase] Missing or invalid credentials in environment. Operating in OFFLINE/DEMO mode only.')
  // Export dummy stubs so the application doesn't crash on import or setup
  app = {}
  analytics = {}
  auth = {
    isMock: true,
    currentUser: null,
    onAuthStateChanged: (callback) => {
      // Trigger callback with null (unsigned in) so it falls back to demo user
      setTimeout(() => callback(null), 0)
      return () => {}
    },
    signInWithPopup: () => Promise.reject(new Error('Firebase auth not configured. Using demo mode.')),
    signOut: () => Promise.resolve(),
  }
  db = {
    isMock: true
  }
  googleProvider = {}
}

export { app, analytics, auth, db, googleProvider }
