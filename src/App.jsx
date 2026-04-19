import { useState, useEffect } from 'react'
import { useFabricState } from './hooks/useFabricState.js'
import { useGallery } from './hooks/useGallery.js'
import { decodeState } from './utils/shareUtils.js'
import Header       from './components/Header.jsx'
import Sidebar      from './components/Sidebar.jsx'
import FabricCanvas from './components/FabricCanvas.jsx'
import ChatPanel    from './components/ChatPanel.jsx'
import LandingPage  from './components/LandingPage.jsx'

export default function App() {
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

  const { gallery, activeId: galleryActiveId, save, load, remove, rename } = useGallery(state, dispatch)

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
              onRename={rename}/>
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
              loading={loading}/>
          </div>
        </div>
      </div>
    </>
  )
}
