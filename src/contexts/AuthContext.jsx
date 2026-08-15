import { createContext, useContext, useState, useEffect } from 'react'
import { auth, googleProvider } from '../firebase.js'
import { signInWithPopup, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth'

const AuthContext = createContext(null)

// Demo user for offline mode
const DEMO_USER = {
  uid: 'demo-user',
  email: 'demo@dobby.studio',
  displayName: 'Demo User',
  photoURL: null,
  isDemo: true
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER)
  const [loading, setLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [useDemoMode, setUseDemoMode] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    // Online mode - use Firebase auth if available, else keep DEMO_USER
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setUseDemoMode(false)
      } else {
        setUser(DEMO_USER)
        setUseDemoMode(true)
      }
      setLoading(false)
    }, (error) => {
      console.error('Auth state error:', error)
      setUser(DEMO_USER)
      setUseDemoMode(true)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    if (isOffline) {
      throw new Error('Cannot sign in while offline')
    }
    try {
      const result = await signInWithPopup(auth, googleProvider)
      setUseDemoMode(false)
      return result.user
    } catch (error) {
      console.error('Google sign-in error:', error)
      // Fall back to demo mode on network error
      if (error.code === 'auth/network-request-failed' || error.code === 'auth/timeout' || error.message?.includes('network')) {
        setIsOffline(true)
        setUser(DEMO_USER)
        setUseDemoMode(true)
        return DEMO_USER
      }
      throw error
    }
  }

  const logout = async () => {
    if (isOffline || useDemoMode) {
      setUser(null)
      setUseDemoMode(false)
      return
    }
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const enableDemoMode = () => {
    setUser(DEMO_USER)
    setUseDemoMode(true)
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
    enableDemoMode,
    isAuthenticated: !!user,
    isOffline,
    isDemoMode: useDemoMode
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
