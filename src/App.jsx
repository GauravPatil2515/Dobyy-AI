import { useState, useEffect } from 'react'
import { useFabricState } from './hooks/useFabricState.js'
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

  const {
    state, dispatch, processPrompt, loading,
    undo, redo, canUndo, canRedo
  } = useFabricState()

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

        <div className="main">
          <Sidebar
            state={state} dispatch={dispatch}
            className={sidebarOpen ? 'open' : ''}/>
          <FabricCanvas state={state} dispatch={dispatch}/>
          <ChatPanel
            state={state}
            onPrompt={processPrompt}
            loading={loading}/>
        </div>
      </div>
    </>
  )
}
