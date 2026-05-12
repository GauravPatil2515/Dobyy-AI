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
    <div className="login-page" style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
      color:'white', padding:20
    }}>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{
          width:80, height:80, margin:'0 auto 24px',
          background:'rgba(255,255,255,0.1)', borderRadius:20,
          display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(10px)'
        }}>
          <svg width="40" height="40" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="0" width="7" height="7" fill="white" opacity=".9"/>
            <rect x="9" y="0" width="7" height="7" fill="white" opacity=".5"/>
            <rect x="0" y="9" width="7" height="7" fill="white" opacity=".5"/>
            <rect x="9" y="9" width="7" height="7" fill="white" opacity=".9"/>
          </svg>
        </div>

        <h1 style={{ fontSize:'2.5rem', fontWeight:600, marginBottom:12, fontFamily:'Cormorant Garamond, serif' }}>
          {t('app.name')}
        </h1>
        <p style={{ fontSize:'1.1rem', opacity:.8, marginBottom:32, lineHeight:1.6 }}>
          {t('login.tagline')}
        </p>

        <div style={{
          background:'rgba(255,255,255,0.05)', borderRadius:16,
          padding:24, marginBottom:32, backdropFilter:'blur(10px)'
        }}>
          <h3 style={{ fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'0.1em', opacity:.6, marginBottom:16 }}>
            Free Plan Includes
          </h3>
          <ul style={{ listStyle:'none', padding:0, textAlign:'left', fontSize:'0.95rem', lineHeight:2 }}>
            <li style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:'#4ade80' }}>✓</span> 5 AI designs per day
            </li>
            <li style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:'#4ade80' }}>✓</span> Save up to 20 designs
            </li>
            <li style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:'#4ade80' }}>✓</span> PDF Tech Sheet export
            </li>
            <li style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:'#4ade80' }}>✓</span> Pantone TCX color matching
            </li>
            <li style={{ display:'flex', alignItems:'center', gap:10, opacity:.5 }}>
              <span>✗</span> WIF loom export (Pro only)
            </li>
          </ul>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading || isOfflineState}
          style={{
            width:'100%', padding:'16px 24px', fontSize:'1rem', fontWeight:500,
            background: isOfflineState ? 'rgba(255,255,255,0.3)' : 'white',
            color:'#1a1a2e', border:'none', borderRadius:12,
            cursor:(loading||isOfflineState) ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            transition:'transform 0.2s, box-shadow 0.2s',
            boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
            opacity: isOfflineState ? 0.6 : 1
          }}
          onMouseEnter={e => {
            if (!loading && !isOfflineState) {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 24px rgba(0,0,0,0.4)'
            }
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
          }}
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
            onClick={enableDemoMode}
            style={{
              width:'100%', padding:'16px 24px', fontSize:'1rem', fontWeight:500,
              background:'transparent', color:'white',
              border:'2px solid rgba(255,255,255,0.3)', borderRadius:12,
              cursor:'pointer', marginTop:12, transition:'all 0.2s'
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(255,255,255,0.1)'
              e.target.style.borderColor = 'rgba(255,255,255,0.5)'
            }}
            onMouseLeave={e => {
              e.target.style.background = 'transparent'
              e.target.style.borderColor = 'rgba(255,255,255,0.3)'
            }}
          >
            {t('login.demo')} (Offline)
          </button>
        )}

        <p style={{ fontSize:'0.8rem', opacity:.5, marginTop:20 }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
