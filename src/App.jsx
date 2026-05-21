// App.jsx — auth gate + view routing only.
// Layout, resize logic, and gallery are owned by AppShell.
import { useState, useEffect, useRef } from 'react'
import { useFabricState }        from './hooks/useFabricState.js'
import { useFirestoreGallery }   from './hooks/useFirestoreGallery.js'
import { useAuth }               from './contexts/AuthContext.jsx'
import { useSubscription }       from './contexts/SubscriptionContext.jsx'
import { useLandingGate }        from './hooks/useLandingGate.js'
import { decodeState }           from './utils/shareUtils.js'
import { uiPrefs, PREF_KEYS }   from './services/storageService.js'
import Header       from './components/Header.jsx'
import Sidebar      from './components/Sidebar.jsx'
import FabricCanvas from './components/FabricCanvas.jsx'
import ChatPanel    from './components/ChatPanel.jsx'
import LandingPage  from './components/LandingPage.jsx'
import LoginPage    from './components/LoginPage.jsx'
import UpgradeModal from './components/UpgradeModal.jsx'

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { getRemainingCalls, isPro, subscription } = useSubscription()
  const { showLanding, handleEnter } = useLandingGate()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sidebar widths — read via storageService, no direct localStorage calls
  const [leftWidth,  setLeftWidth]  = useState(() => uiPrefs.get(PREF_KEYS.LEFT_WIDTH,  230))
  const [rightWidth, setRightWidth] = useState(() => uiPrefs.get(PREF_KEYS.RIGHT_WIDTH, 290))
  const [resizing, setResizing] = useState(null)

  const {
    state, dispatch, dispatchRef, isDirty,
    undo, redo, canUndo, canRedo
  } = useFabricState()

  const {
    gallery, activeId: galleryActiveId, loading: galleryLoading,
    save, load, remove, rename, canSaveMore
  } = useFirestoreGallery(state, dispatch)

  // Theme sync
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  // Load shared state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const d = params.get('d')
    if (d) {
      const decoded = decodeState(d)
      if (decoded) {
        dispatchRef.current({ type: 'APPLY', newState: decoded })
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sidebar resize — mouse events
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizing) return
      e.preventDefault()
      if (resizing === 'left') {
        setLeftWidth(Math.max(180, Math.min(450, e.clientX)))
      } else {
        setRightWidth(Math.max(180, Math.min(450, window.innerWidth - e.clientX)))
      }
    }
    const handleMouseUp = () => {
      if (resizing === 'left')  uiPrefs.set(PREF_KEYS.LEFT_WIDTH,  leftWidth)
      if (resizing === 'right') uiPrefs.set(PREF_KEYS.RIGHT_WIDTH, rightWidth)
      setResizing(null)
      document.body.style.cursor    = 'auto'
      document.body.style.userSelect = 'auto'
    }
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup',   handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup',   handleMouseUp)
      }
    }
  }, [resizing, leftWidth, rightWidth])

  // ── Auth loading ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-inner">
          <div className="app-spinner" />
          <p style={{ color: 'var(--fg2)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <LoginPage />

  return (
    <>
      {showLanding && <LandingPage onEnter={handleEnter} />}

      <div className="app" style={{ visibility: showLanding ? 'hidden' : 'visible' }}>
        <Header
          state={state}   dispatch={dispatch}
          undo={undo}     redo={redo}
          canUndo={canUndo} canRedo={canRedo}
          isDirty={isDirty}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        <div
          className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <div className="main" style={{
          gridTemplateColumns: `${leftWidth}px 1fr ${rightWidth}px`,
          cursor: resizing ? 'col-resize' : 'auto'
        }}>

          {/* LEFT SIDEBAR */}
          <div style={{ display: 'flex', position: 'relative' }}>
            <Sidebar
              state={state}  dispatch={dispatch}
              className={sidebarOpen ? 'open' : ''}
              gallery={gallery}
              galleryActiveId={galleryActiveId}
              onSave={save}
              onLoad={(id) => { if (isDirty && !window.confirm('Unsaved changes. Load anyway?')) return; load(id) }}
              onRemove={remove}
              onRename={rename}
              galleryLoading={galleryLoading}
              canSaveMore={canSaveMore}
              maxDesigns={subscription.maxSavedDesigns}
            />
            <div
              className="resize-handle resize-handle-right"
              onMouseDown={() => { setResizing('left'); document.body.style.cursor='col-resize'; document.body.style.userSelect='none' }}
            />
          </div>

          {/* CANVAS */}
          <FabricCanvas state={state} dispatch={dispatch} />

          {/* RIGHT CHAT PANEL */}
          <div style={{ display: 'flex', position: 'relative' }}>
            <div
              className="resize-handle resize-handle-left"
              onMouseDown={() => { setResizing('right'); document.body.style.cursor='col-resize'; document.body.style.userSelect='none' }}
            />
            <ChatPanel
              state={state}
              dispatch={dispatch}
              loading={false}
              onLimitExceeded={() => setShowUpgradeModal(true)}
              remainingCalls={getRemainingCalls()}
              isPro={isPro}
            />
          </div>
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => window.open('mailto:gaurav@dobby.studio?subject=Dobby Studio Pro Upgrade', '_blank')}
        />
      )}
    </>
  )
}
