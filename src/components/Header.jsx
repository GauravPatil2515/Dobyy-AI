import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useSubscription } from '../contexts/SubscriptionContext.jsx'
import { t, getLang, setLang, SUPPORTED_LANGS } from '../utils/i18n.js'

export default function Header({ state, dispatch, undo, redo, canUndo, canRedo, onMenuToggle }) {
  const { user, logout } = useAuth()
  const { isPro } = useSubscription()
  const [showProfile, setShowProfile] = useState(false)
  const [lang, setLangState] = useState(getLang())

  const wl = { twill22:'2/2 twill', twill21:'2/1 twill', plain:'plain weave', satin5:'5-end satin',
                twill31:'3/1 twill', basket2:'basket weave', hopsack:'hopsack' }
  const total = state.sett.reduce((a,s) => a+s.n, 0)

  // Listen for language changes fired from LandingPage or anywhere
  useEffect(() => {
    const onLangChange = (e) => setLangState(e.detail)
    window.addEventListener('dobby-lang-change', onLangChange)
    return () => window.removeEventListener('dobby-lang-change', onLangChange)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey||e.metaKey) && e.key==='z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey||e.metaKey) && (e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  useEffect(() => {
    if (!showProfile) return
    const handleClick = (e) => {
      if (!e.target.closest('[data-profile-dropdown]')) setShowProfile(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showProfile])

  const handleLang = (code) => {
    setLang(code)
    setLangState(code)
  }

  return (
    <header className="app-header">
      <div className="logo">
        <button className="menu-btn" onClick={onMenuToggle} title="Open Sett Builder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="logo-mk">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="0" width="7" height="7" fill="white" opacity=".9"/>
            <rect x="9" y="0" width="7" height="7" fill="white" opacity=".5"/>
            <rect x="0" y="9" width="7" height="7" fill="white" opacity=".5"/>
            <rect x="9" y="9" width="7" height="7" fill="white" opacity=".9"/>
          </svg>
        </div>
        <span className="logo-text">{t('app.name').split(' ')[0]}<em className="logo-sub"> {t('app.name').split(' ')[1] || 'Studio'}</em></span>
      </div>

      <div className="header-center">
        <button className="icon-btn" onClick={undo} disabled={!canUndo} title={`${t('header.undo')} (Ctrl+Z)`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M3 7v6h6"/><path d="M3 13C5 7 11 3 18 5s9 9 5 15"/>
          </svg>
        </button>
        <button className="icon-btn" onClick={redo} disabled={!canRedo} title={`${t('header.redo')} (Ctrl+Y)`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M21 7v6h-6"/><path d="M21 13C19 7 13 3 6 5S-3 14 1 20"/>
          </svg>
        </button>

        {/* Language switcher — compact in header */}
        <div style={{ display:'flex', gap:3, marginLeft:10 }}>
          {SUPPORTED_LANGS.map(({ code, flag }) => (
            <button
              key={code}
              onClick={() => handleLang(code)}
              title={code.toUpperCase()}
              style={{
                background: lang === code ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.05)',
                border: lang === code ? '1px solid rgba(255,255,255,.4)' : '1px solid rgba(255,255,255,.1)',
                borderRadius: 5, padding:'2px 6px',
                fontSize: 13, cursor:'pointer',
                opacity: lang === code ? 1 : 0.55,
                transition:'all 150ms'
              }}>
              {flag}
            </button>
          ))}
        </div>
      </div>

      <div className="header-right">
        <span className="badge">{total}T · {state.sett.length} colors · {wl[state.weave]}</span>
        <button className="icon-btn"
          onClick={() => dispatch({type:'TOGGLE_THEME'})} title="Toggle theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        <div style={{ position:'relative' }} data-profile-dropdown>
          <button
            onClick={() => setShowProfile(!showProfile)}
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'4px 8px', borderRadius:20, border:'none',
              background:'rgba(0,0,0,0.05)', cursor:'pointer', marginLeft:8
            }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile"
                style={{ width:28, height:28, borderRadius:'50%' }}/>
            ) : (
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontSize:12, fontWeight:600
              }}>
                {user?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span style={{ fontSize:'0.85rem', color:'var(--text,#333)' }}>
              {isPro && (
                <span style={{
                  background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
                  color:'white', padding:'2px 6px', borderRadius:4,
                  fontSize:'0.65rem', fontWeight:600, marginRight:4
                }}>PRO</span>
              )}
            </span>
          </button>

          {showProfile && (
            <div style={{
              position:'absolute', top:'100%', right:0, marginTop:8,
              background:'white', borderRadius:12,
              boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
              padding:12, minWidth:200, zIndex:100
            }}>
              <div style={{ padding:'8px 12px', borderBottom:'1px solid #e5e7eb', marginBottom:8 }}>
                <p style={{ fontWeight:600, margin:0, fontSize:'0.9rem' }}>{user?.displayName}</p>
                <p style={{ margin:'4px 0 0', fontSize:'0.8rem', color:'#6b7280' }}>{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); setShowProfile(false) }}
                style={{
                  width:'100%', padding:'8px 12px', textAlign:'left',
                  border:'none', background:'none', borderRadius:6,
                  cursor:'pointer', fontSize:'0.9rem',
                  display:'flex', alignItems:'center', gap:8
                }}
                onMouseEnter={e => e.target.style.background='#f3f4f6'}
                onMouseLeave={e => e.target.style.background='none'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
