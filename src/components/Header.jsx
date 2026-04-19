import { useEffect } from 'react'

export default function Header({ state, dispatch, undo, redo, canUndo, canRedo }) {
  const wl = {
    twill22:'2/2 twill', twill21:'2/1 twill',
    plain:'plain weave', satin5:'5-end satin'
  }
  const total = state.sett.reduce((a,s) => a+s.n, 0)

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return (
    <header className="app-header">
      <div className="logo">
        <div className="logo-mk">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="0" width="7" height="7" fill="white" opacity=".9"/>
            <rect x="9" y="0" width="7" height="7" fill="white" opacity=".5"/>
            <rect x="0" y="9" width="7" height="7" fill="white" opacity=".5"/>
            <rect x="9" y="9" width="7" height="7" fill="white" opacity=".9"/>
          </svg>
        </div>
        <span className="logo-text">
          Dobby<em className="logo-sub"> Studio</em>
        </span>
      </div>
      <div className="header-center">
        <button className="icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M3 7v6h6"/><path d="M3 13C5 7 11 3 18 5s9 9 5 15"/>
          </svg>
        </button>
        <button className="icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M21 7v6h-6"/><path d="M21 13C19 7 13 3 6 5S-3 14 1 20"/>
          </svg>
        </button>
      </div>
      <div className="header-right">
        <span className="badge">
          {total}T · {state.sett.length} colors · {wl[state.weave]}
        </span>
        <button
          className="icon-btn"
          onClick={() => dispatch({ type:'TOGGLE_THEME' })}
          title="Toggle theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" width="15" height="15">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
