// Header — app bar with undo/redo, dirty indicator, lang switcher, export menu, profile.
import { useEffect, useRef, useState } from 'react'
import { useAuth }         from '../contexts/AuthContext.jsx'
import { useSubscription } from '../contexts/SubscriptionContext.jsx'
import { t, getLang, setLang, SUPPORTED_LANGS } from '../utils/i18n.js'
import { exportPNG, exportJSON, exportWIF, exportPDF } from '../services/exportService.js'

const WEAVE_LABELS = {
  twill22:'2/2 twill', twill21:'2/1 twill', plain:'plain weave',
  satin5:'5-end satin', twill31:'3/1 twill', basket2:'basket weave', hopsack:'hopsack'
}

/**
 * @param {{
 *   state: import('../domain/fabricTypes.js').FabricState,
 *   dispatch: Function,
 *   undo: Function, redo: Function,
 *   canUndo: boolean, canRedo: boolean,
 *   isDirty: boolean,
 *   canvasRef: React.RefObject<HTMLCanvasElement>,
 *   onMenuToggle: Function
 * }} props
 */
export default function Header({
  state, dispatch,
  undo, redo, canUndo, canRedo,
  isDirty,
  canvasRef,
  onMenuToggle,
}) {
  const { user, logout } = useAuth()
  const { isPro }        = useSubscription()
  const [showProfile, setShowProfile] = useState(false)
  const [showExport,  setShowExport]  = useState(false)
  const [lang,        setLangState]   = useState(getLang())
  const exportMenuRef = useRef(null)

  const total = state.sett.reduce((a, s) => a + s.n, 0)

  // Sync lang state from external events
  useEffect(() => {
    const onLangChange = (e) => setLangState(e.detail)
    window.addEventListener('dobby-lang-change', onLangChange)
    return () => window.removeEventListener('dobby-lang-change', onLangChange)
  }, [])

  // Global keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!showProfile) return
    const handleClick = (e) => {
      if (!e.target.closest('[data-profile-dropdown]')) setShowProfile(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showProfile])

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExport) return
    const handleClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setShowExport(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showExport])

  const handleLang   = (code) => { setLang(code); setLangState(code) }
  const designName   = `dobby-${state.weave}-${total}t`
  const canvas       = canvasRef?.current ?? null

  return (
    <header className="app-header">
      {/* LEFT: hamburger + logo */}
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
        <span className="logo-text">
          {t('app.name').split(' ')[0]}
          <em className="logo-sub"> {t('app.name').split(' ')[1] || 'Studio'}</em>
        </span>
      </div>

      {/* CENTER: undo/redo + dirty dot + lang switcher */}
      <div className="header-center">
        {/* Undo */}
        <button
          className="icon-btn"
          onClick={undo}
          disabled={!canUndo}
          title={`${t('header.undo')} (Ctrl+Z)`}
          style={{ opacity: canUndo ? 1 : 0.35 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M3 7v6h6"/><path d="M3 13C5 7 11 3 18 5s9 9 5 15"/>
          </svg>
        </button>

        {/* Redo */}
        <button
          className="icon-btn"
          onClick={redo}
          disabled={!canRedo}
          title={`${t('header.redo')} (Ctrl+Y)`}
          style={{ opacity: canRedo ? 1 : 0.35 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M21 7v6h-6"/><path d="M21 13C19 7 13 3 6 5S-3 14 1 20"/>
          </svg>
        </button>

        {/* Dirty indicator */}
        {isDirty && (
          <span
            title={t('header.dirty')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600,
              padding: '2px 6px', background: '#fef3c7',
              borderRadius: 4, marginLeft: 2,
            }}
          >
            <span style={{ fontSize: '0.6rem' }}>●</span>
            Unsaved
          </span>
        )}

        {/* Lang switcher */}
        <div className="lang-switcher">
          {SUPPORTED_LANGS.map(({ code, flag }) => (
            <button
              key={code}
              onClick={() => handleLang(code)}
              title={code.toUpperCase()}
              className={`lang-btn${lang === code ? ' active' : ''}`}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: spec badge + export + theme + profile */}
      <div className="header-right">
        <span className="badge">{total}T · {state.sett.length}c · {WEAVE_LABELS[state.weave]}</span>

        {/* Export dropdown */}
        <div style={{ position: 'relative' }} ref={exportMenuRef}>
          <button
            className="icon-btn"
            onClick={() => setShowExport(o => !o)}
            title="Export"
            style={{ padding: '4px 8px', fontSize: '0.72rem', gap: 4, display: 'flex', alignItems: 'center' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>

          {showExport && (
            <div style={{
              position:'absolute', top:'calc(100% + 6px)', right:0,
              background:'var(--bg)', border:'1px solid var(--border)',
              borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)',
              minWidth:190, zIndex:200, overflow:'hidden',
            }}>
              {[
                { label: t('export.png'),  icon: '🖼️', action: () => { exportPNG(canvas, designName);  setShowExport(false) } },
                { label: t('export.json'), icon: '📄', action: () => { exportJSON(state, designName); setShowExport(false) } },
                { label: t('export.wif'),  icon: '🧵', action: () => { exportWIF(state, designName);  setShowExport(false) } },
                { label: t('export.pdf'),  icon: '🖨️', action: () => { exportPDF(state, canvas);     setShowExport(false) } },
              ].map(({ label, icon, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    width:'100%', padding:'9px 14px',
                    background:'none', border:'none',
                    cursor:'pointer', fontSize:'0.82rem',
                    color:'var(--fg)', textAlign:'left',
                    transition:'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <span style={{ fontSize:'1rem' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button className="icon-btn" onClick={() => dispatch({ type:'TOGGLE_THEME' })} title="Toggle theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        {/* Profile */}
        <div className="profile-wrap" data-profile-dropdown>
          <button className="profile-btn" onClick={() => setShowProfile(o => !o)}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="profile-avatar"/>
            ) : (
              <div className="profile-avatar-fallback">
                {user?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            {isPro && <span className="profile-pro-badge">PRO</span>}
          </button>

          {showProfile && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <p className="profile-dropdown-name">{user?.displayName || 'Designer'}</p>
                <p className="profile-dropdown-email">{user?.email}</p>
              </div>
              <button
                className="profile-signout"
                onClick={() => { logout(); setShowProfile(false) }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
