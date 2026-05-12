import { useState, useEffect, useRef } from 'react'
import { useFabricState } from './hooks/useFabricState.js'
import { useFirestoreGallery } from './hooks/useFirestoreGallery.js'
import { useAuth } from './contexts/AuthContext.jsx'
import { useSubscription } from './contexts/SubscriptionContext.jsx'
import { decodeState } from './utils/shareUtils.js'
import Header       from './components/Header.jsx'
import Sidebar      from './components/Sidebar.jsx'
import FabricCanvas from './components/FabricCanvas.jsx'
import ChatPanel    from './components/ChatPanel.jsx'
import LandingPage  from './components/LandingPage.jsx'
import LoginPage    from './components/LoginPage.jsx'
import UpgradeModal from './components/UpgradeModal.jsx'

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { canMakeApiCall, getRemainingCalls, isPro, subscription } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showLanding, setShowLanding] = useState(
    () => !sessionStorage.getItem('dobby-entered')
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('leftSidebarWidth')
    return saved ? parseInt(saved) : 230
  })
  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem('rightSidebarWidth')
    return saved ? parseInt(saved) : 290
  })
  const [resizing, setResizing] = useState(null)

  const {
    state, dispatch, processPrompt, loading,
    undo, redo, canUndo, canRedo
  } = useFabricState()

  const dispatchRef = useRef(dispatch)
  useEffect(() => { dispatchRef.current = dispatch }, [dispatch])

  const {
    gallery,
    activeId: galleryActiveId,
    loading: galleryLoading,
    save,
    load,
    remove,
    rename,
    canSaveMore
  } = useFirestoreGallery(state, dispatch)

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
  }, [])

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizing) return
      e.preventDefault()
      if (resizing === 'left') {
        const newWidth = Math.max(180, Math.min(450, e.clientX))
        setLeftWidth(newWidth)
      } else if (resizing === 'right') {
        const viewportWidth = window.innerWidth
        const newWidth = Math.max(180, Math.min(450, viewportWidth - e.clientX))
        setRightWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (resizing === 'left') localStorage.setItem('leftSidebarWidth', leftWidth)
      if (resizing === 'right') localStorage.setItem('rightSidebarWidth', rightWidth)
      setResizing(null)
      document.body.style.cursor = 'auto'
      document.body.style.userSelect = 'auto'
    }

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizing, leftWidth, rightWidth])

  const handleEnter = () => {
    sessionStorage.setItem('dobby-entered', '1')
    setShowLanding(false)
  }

  // BUG FIX: replaced inline loading div + <style> tag with CSS classes from main.css
  // The old inline @keyframes spin fought with the global CSS spin keyframe we added.
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

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <>
      {showLanding && <LandingPage onEnter={handleEnter}/>}

      <div className="app" style={{ visibility: showLanding ? 'hidden' : 'visible' }}>
        <Header
          state={state} dispatch={dispatch}
          undo={undo} redo={redo}
          canUndo={canUndo} canRedo={canRedo}
          onMenuToggle={() => setSidebarOpen(o => !o)}/>

        <div
          className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
          onClick={() => setSidebarOpen(false)}/>

        <div className="main" style={{
          gridTemplateColumns: `${leftWidth}px 1fr ${rightWidth}px`,
          cursor: resizing ? 'col-resize' : 'auto'
        }}>
          <div style={{ display: 'flex', position: 'relative' }}>
            <Sidebar
              state={state} dispatch={dispatch}
              className={sidebarOpen ? 'open' : ''}
              gallery={gallery}
              galleryActiveId={galleryActiveId}
              onSave={save}
              onLoad={load}
              onRemove={remove}
              onRename={rename}
              galleryLoading={galleryLoading}
              canSaveMore={canSaveMore}
              maxDesigns={subscription.maxSavedDesigns}/>
            <div
              className="resize-handle resize-handle-right"
              onMouseDown={() => {
                setResizing('left')
                document.body.style.cursor = 'col-resize'
                document.body.style.userSelect = 'none'
              }}
            />
          </div>
          <FabricCanvas state={state} dispatch={dispatch}/>
          <div style={{ display: 'flex', position: 'relative' }}>
            <div
              className="resize-handle resize-handle-left"
              onMouseDown={() => {
                setResizing('right')
                document.body.style.cursor = 'col-resize'
                document.body.style.userSelect = 'none'
              }}
            />
            <ChatPanel
              state={state}
              onPrompt={processPrompt}
              loading={loading}
              onLimitExceeded={() => setShowUpgradeModal(true)}
              remainingCalls={getRemainingCalls()}
              isPro={isPro}/>
          </div>
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            // Show contact link until Stripe is wired
            window.open('mailto:gaurav@dobby.studio?subject=Dobby Studio Pro Upgrade', '_blank')
          }}
        />
      )}
    </>
  )
}
