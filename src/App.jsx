import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react'
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
import AiToolsModal from './components/AiToolsModal.jsx'
import Toaster      from './components/Toaster.jsx'

const DesignDrop = lazy(() => import('./components/DesignDrop.jsx'))
const ImageToDesignModal = lazy(() => import('./components/ImageToDesignModal.jsx'))

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { canMakeApiCall, getRemainingCalls, isPro, subscription } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showAiTools, setShowAiTools] = useState(false)
  const [aiToolsTab, setAiToolsTab] = useState('colors')

  const handleOpenAiTools = useCallback((tab = 'colors') => {
    setAiToolsTab(tab)
    setShowAiTools(true)
  }, [])
  // FIX #2: state to show/hide DesignDrop modal
  const [showDesignDrop, setShowDesignDrop] = useState(false)
  // Image-to-Design wizard modal: holds the chosen file, preview URL, and base64
  const [imageModal, setImageModal] = useState(null) // { file, dataUrl, base64 } | null
  const openImageModal = useCallback(async (file, dataUrl) => {
    try {
      const { fileToBase64 } = await import('./utils/imageAnalyzer.js')
      const base64 = await fileToBase64(file)
      setImageModal({ file, dataUrl, base64 })
    } catch (err) {
      console.error('[App] image prep failed', err)
      setImageModal({ file, dataUrl, base64: null })
    }
  }, [])
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

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-inner">
          <div className="app-spinner" />
          <p>Loading...</p>
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
          onMenuToggle={() => setSidebarOpen(o => !o)}
          // FIX #2: wire DesignDrop open handler to Header
          onDesignDropOpen={() => setShowDesignDrop(true)}
          onAiToolsOpen={handleOpenAiTools}/>

        <div
          className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
          onClick={() => setSidebarOpen(false)}/>

        <div className="main" style={{
          gridTemplateColumns: `${leftWidth}px 1fr ${rightWidth}px`,
          cursor: resizing ? 'col-resize' : 'auto'
        }}>
          <div style={{ display: 'flex', position: 'relative', height: '100%', minHeight: 0, overflow: 'hidden', width: '100%' }}>
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
              maxDesigns={subscription.maxSavedDesigns}
              onAiToolsOpen={handleOpenAiTools}/>
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
          <div style={{ display: 'flex', position: 'relative', height: '100%', minHeight: 0, overflow: 'hidden', width: '100%' }}>
            <div
              className="resize-handle resize-handle-left"
              onMouseDown={() => {
                setResizing('right')
                document.body.style.cursor = 'col-resize'
                document.body.style.userSelect = 'none'
              }}
            />
            {/* FIX #10: pass dispatch so image upload APPLY action works */}
            <ChatPanel
              state={state}
              dispatch={dispatch}
              onPrompt={processPrompt}
              loading={loading}
              onLimitExceeded={() => setShowUpgradeModal(true)}
              remainingCalls={getRemainingCalls()}
              isPro={isPro}
              dailyLimit={subscription.dailyApiCalls}
              onImageModalOpen={openImageModal}/>
          </div>
        </div>
      </div>

      {/* AI Tools Modal (AI Colour Suggestion + Design Name & Details Generator) */}
      <AiToolsModal
        isOpen={showAiTools}
        initialTab={aiToolsTab}
        onClose={() => setShowAiTools(false)}
        state={state}
        dispatch={dispatch}/>

      {/* FIX #2: render DesignDrop modal */}
      {showDesignDrop && (
        <Suspense fallback={null}>
          <DesignDrop
            state={state}
            dispatch={dispatch}
            onClose={() => setShowDesignDrop(false)}/>
        </Suspense>
      )}

      {/* Image-to-Design wizard modal */}
      {imageModal && (
        <Suspense fallback={null}>
          <ImageToDesignModal
            imageDataUrl={imageModal.dataUrl}
            base64={imageModal.base64}
            dispatch={dispatch}
            onClose={() => setImageModal(null)}/>
        </Suspense>
      )}

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            window.open('mailto:gaurav@dobby.studio?subject=Dobby Studio Pro Upgrade', '_blank')
          }}
        />
      )}

      <Toaster/>
    </>
  )
}
