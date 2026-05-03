import { useState, useEffect } from 'react'
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
        dispatch({ type: 'APPLY', newState: { ...state, ...decoded } })
        // Clean URL without reloading
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, []) // run once on mount

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

  // Show loading state while auth initializes
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #f8f7f5)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#0f3460',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Require authentication
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

        {/* Mobile sidebar backdrop */}
        <div
          className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
          onClick={() => setSidebarOpen(false)}/>

        <div className="main" style={{
          gridTemplateColumns: `${leftWidth}px 1fr ${rightWidth}px`,
          cursor: resizing ? (resizing === 'left' ? 'col-resize' : 'col-resize') : 'auto'
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
            // Navigate to Stripe or payment page
            window.open('https://stripe.com/payments', '_blank')
          }}
        />
      )}
    </>
  )
}
