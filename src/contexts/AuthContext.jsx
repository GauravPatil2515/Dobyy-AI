import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const STUDIO_USER = {
  uid: 'dobby-studio-designer',
  displayName: 'Studio Designer',
  email: 'designer@dobby.studio',
  photoURL: null
}

export function AuthProvider({ children }) {
  const [user] = useState(STUDIO_USER)

  const signInWithGoogle = async () => STUDIO_USER
  const enableDemoMode = () => STUDIO_USER
  const logout = async () => {}

  const value = {
    user,
    loading: false,
    error: null,
    isAuthenticated: true,
    isOffline: true,
    isDemoMode: true,
    signInWithGoogle,
    enableDemoMode,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
