import { useState, useEffect } from 'react'
import { useFabricState } from './hooks/useFabricState.js'
import Header       from './components/Header.jsx'
import Sidebar      from './components/Sidebar.jsx'
import FabricCanvas from './components/FabricCanvas.jsx'
import ChatPanel    from './components/ChatPanel.jsx'
import LandingPage  from './components/LandingPage.jsx'

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const { state, dispatch, processPrompt, loading, undo, redo, canUndo, canRedo } = useFabricState()

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  return (
    <>
      {showLanding && (
        <LandingPage onEnter={() => setShowLanding(false)}/>
      )}
      <div className="app">
        <Header state={state} dispatch={dispatch} undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}/>
        <div className="main">
          <Sidebar      state={state} dispatch={dispatch}/>
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
