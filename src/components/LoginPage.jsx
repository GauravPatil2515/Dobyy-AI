import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { t, getLang } from '../utils/i18n.js'

export default function LoginPage() {
  const { signInWithGoogle, loading, enableDemoMode, isOffline } = useAuth()
  const [isOfflineState, setIsOfflineState] = useState(!navigator.onLine)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const handleOnline  = () => setIsOfflineState(false)
    const handleOffline = () => setIsOfflineState(true)
    const onLangChange  = () => forceUpdate(n => n + 1)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('dobby-lang-change', onLangChange)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('dobby-lang-change', onLangChange)
    }
  }, [])

  const handleSignIn = async () => {
    try { await signInWithGoogle() }
    catch (err) { console.error('Login failed:', err) }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg width="40" height="40" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="0" width="7" height="7" fill="white" opacity=".9"/>
            <rect x="9" y="0" width="7" height="7" fill="white" opacity=".5"/>
            <rect x="0" y="9" width="7" height="7" fill="white" opacity=".5"/>
            <rect x="9" y="9" width="7" height="7" fill="white" opacity=".9"/>
          </svg>
        </div>

        <h1 className="login-title">{t('app.name')}</h1>
        <p className="login-sub">{t('login.tagline')}</p>

        <div className="login-features">
          <h3>Free Plan Includes</h3>
          <ul>
            <li><span className="login-feature-icon" style={{color:'#4ade80'}}>✓</span> 5 AI designs per day</li>
            <li><span className="login-feature-icon" style={{color:'#4ade80'}}>✓</span> Save up to 20 designs</li>
            <li><span className="login-feature-icon" style={{color:'#4ade80'}}>✓</span> PDF Tech Sheet export</li>
            <li><span className="login-feature-icon" style={{color:'#4ade80'}}>✓</span> Pantone TCX color matching</li>
            <li className="login-feature-disabled"><span>✗</span> WIF loom export (Pro only)</li>
          </ul>
        </div>

        <button
          className="login-btn login-btn-google"
          onClick={handleSignIn}
          disabled={loading || isOfflineState}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : (isOfflineState ? 'Offline — Sign in unavailable' : t('login.google'))}
        </button>

        {isOfflineState && (
          <button
            className="login-btn login-btn-demo"
            onClick={enableDemoMode}
          >
            {t('login.demo')} (Offline)
          </button>
        )}

        <p className="login-footer">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
