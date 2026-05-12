import { useReducer, useCallback, useState, useRef } from 'react'
import { PRESETS } from '../data/presets.js'
import { askGroq } from '../utils/groqClient.js'

const VALID_WEAVES = ['twill22','twill21','plain','satin5','twill31','basket2','hopsack']

const INITIAL = {
  sett:         PRESETS[0].sett.map(s => ({...s})),
  weave:        'twill22',
  ts:           8,
  reps:         3,
  activePreset: 0,
  panel:        'fabric',
  theme:        'light',
}

function reducer(state, action) {
  switch(action.type) {
    case 'SET_WEAVE':     return { ...state, weave: action.weave }
    case 'SET_TS':        return { ...state, ts: Math.max(4, Math.min(22, action.ts)) }
    case 'SET_REPS':      return { ...state, reps: Math.max(1, Math.min(12, action.reps)) }
    case 'SET_PANEL':     return { ...state, panel: action.panel }
    case 'SET_PRESET':    return { ...state, sett: PRESETS[action.idx].sett.map(s=>({...s})), activePreset: action.idx }
    case 'TOGGLE_THEME':  return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' }
    case 'ADD_STRIPE':    return { ...state, sett: [...state.sett, { c:'#888888', n:4 }] }
    case 'UPDATE_STRIPE': return { ...state, sett: state.sett.map((s,i) => i===action.idx ? {...s,...action.patch} : s) }
    case 'REMOVE_STRIPE': return { ...state, sett: state.sett.length > 1 ? state.sett.filter((_,i) => i!==action.idx) : state.sett }
    case 'REORDER_SETT':  return { ...state, sett: action.newSett }
    case 'APPLY':         return { ...action.newState }
    default: return state
  }
}

const HISTORY_ACTIONS = [
  'SET_WEAVE','SET_TS','SET_REPS','SET_PRESET',
  'ADD_STRIPE','UPDATE_STRIPE','REMOVE_STRIPE','REORDER_SETT','APPLY'
]

export function useFabricState() {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const history   = useRef([INITIAL])
  const histIdx   = useRef(0)
  const skipDepth = useRef(0)

  // Keep a stable ref to latest dispatch so closures in useEffect never go stale
  const dispatchRef = useRef(null)

  const dispatchWithHistory = useCallback((action) => {
    if (HISTORY_ACTIONS.includes(action.type) && skipDepth.current === 0) {
      const nextState = reducer(history.current[histIdx.current], action)
      history.current = history.current.slice(0, histIdx.current + 1)
      history.current.push(nextState)
      histIdx.current = history.current.length - 1
    }
    dispatch(action)
  }, [])

  // Always keep ref in sync — sync effect runs before paint
  dispatchRef.current = dispatchWithHistory

  const undo = useCallback(() => {
    if (histIdx.current <= 0) return
    histIdx.current -= 1
    skipDepth.current += 1
    dispatch({ type: 'APPLY', newState: history.current[histIdx.current] })
    skipDepth.current -= 1
  }, [])

  const redo = useCallback(() => {
    if (histIdx.current >= history.current.length - 1) return
    histIdx.current += 1
    skipDepth.current += 1
    dispatch({ type: 'APPLY', newState: history.current[histIdx.current] })
    skipDepth.current -= 1
  }, [])

  const canUndo = histIdx.current > 0
  const canRedo = histIdx.current < history.current.length - 1

  const processPrompt = useCallback(async (text, onReply) => {
    setLoading(true)
    const userMsg = { role: 'user', content: text }
    const updatedHistory = [...chatHistory, userMsg].slice(-10)

    try {
      const result = await askGroq(updatedHistory, state)
      const newState = { ...state }

      if (result.sett && Array.isArray(result.sett) && result.sett.length > 0) {
        newState.sett = result.sett.map(s => ({
          c: s.c || '#888888',
          n: Math.max(1, Math.min(32, s.n || 4))
        }))
        newState.activePreset = -1
      }
      if (result.weave && VALID_WEAVES.includes(result.weave))
        newState.weave = result.weave
      if (result.ts   && result.ts >= 4   && result.ts <= 22) newState.ts = result.ts
      if (result.reps && result.reps >= 1 && result.reps <= 12) newState.reps = result.reps

      dispatchRef.current({ type: 'APPLY', newState })

      const assistantMsg = { role: 'assistant', content: result.reply || 'Design updated!' }
      setChatHistory([...updatedHistory, assistantMsg].slice(-10))

      if (onReply) onReply({ reply: result.reply || 'Design updated!', intent: result.intent || 'llm' })
    } catch(err) {
      console.error('Groq error:', err)
      setChatHistory(updatedHistory)
      if (onReply) onReply({ reply: `Error: ${err.message || 'Check your API key in .env'}`, intent: 'error' })
    } finally {
      setLoading(false)
    }
  }, [state, chatHistory])

  return { state, dispatch: dispatchWithHistory, dispatchRef, processPrompt, loading, undo, redo, canUndo, canRedo }
}
