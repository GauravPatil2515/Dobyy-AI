import { useReducer, useCallback, useState, useRef } from 'react'
import { PRESETS } from '../data/presets.js'
import { askGroq } from '../utils/groqClient.js'

const VALID_WEAVES = ['twill22','twill21','plain','satin5','twill31','basket2','hopsack']

// Stable uid generator for stripe identity (dnd-kit keys)
let _uidCounter = 0
const uid = () => `s_${++_uidCounter}_${Math.random().toString(36).slice(2,7)}`

const INITIAL = {
  sett:         PRESETS[0].sett.map(s => ({...s, id: uid()})),
  weave:        'twill22',
  ts:           8,
  reps:         3,
  activePreset: 0,
  panel:        'fabric',
  theme:        'light',
  compare:      null,   // A-B compare baseline snapshot {sett,weave,ts,reps}
}

function reducer(state, action) {
  switch(action.type) {
    case 'SET_WEAVE':     return { ...state, weave: action.weave }
    case 'SET_TS':        return { ...state, ts: Math.max(4, Math.min(22, action.ts)) }
    case 'SET_REPS':      return { ...state, reps: Math.max(1, Math.min(12, action.reps)) }
    case 'SET_PANEL':     return { ...state, panel: action.panel }
    // FIX #5: inject stable id into every preset stripe so dnd-kit keys never break
    case 'SET_PRESET':    return { ...state, sett: PRESETS[action.idx].sett.map(s=>({...s, id: uid()})), activePreset: action.idx }
    case 'TOGGLE_THEME':  return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' }
    case 'ADD_STRIPE':    return { ...state, sett: [...state.sett, { c:'#888888', n:4, id: uid() }] }
    case 'UPDATE_STRIPE': return { ...state, sett: state.sett.map((s,i) => i===action.idx ? {...s,...action.patch} : s) }
    case 'REMOVE_STRIPE': return { ...state, sett: state.sett.length > 1 ? state.sett.filter((_,i) => i!==action.idx) : state.sett }
    case 'REORDER_SETT':  return { ...state, sett: action.newSett }
    // FIX #6: ensure every incoming sett stripe has a stable id (prevents dnd-kit crash after AI/DesignDrop APPLY)
    case 'APPLY': {
      const sett = (action.newState.sett || []).map(s => s.id ? s : {...s, id: uid()})
      return { ...action.newState, sett }
    }
    // A-B compare: stash the current design as the baseline for side-by-side view
    case 'SNAPSHOT_COMPARE':
      return { ...state, compare: {
        sett: state.sett.map(s => ({...s})),
        weave: state.weave, ts: state.ts, reps: state.reps
      }}
    case 'CLEAR_COMPARE': return { ...state, compare: null }
    default: return state
  }
}

const HISTORY_ACTIONS = [
  'SET_WEAVE','SET_TS','SET_REPS','SET_PRESET',
  'ADD_STRIPE','UPDATE_STRIPE','REMOVE_STRIPE','REORDER_SETT','APPLY'
]

const MAX_HISTORY = 50

export function useFabricState() {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const history   = useRef([INITIAL])
  const histIdx   = useRef(0)
  const skipDepth = useRef(0)

  // Mirror undo/redo availability into state so the toolbar re-renders correctly.
  // Refs (histIdx) do not trigger re-renders, so reading them during render goes stale.
  const [historyFlags, setHistoryFlags] = useState({ canUndo: false, canRedo: false })
  const syncHistoryFlags = useCallback(() => {
    setHistoryFlags({
      canUndo: histIdx.current > 0,
      canRedo: histIdx.current < history.current.length - 1
    })
  }, [])

  const dispatchRef = useRef(null)

  const dispatchWithHistory = useCallback((action) => {
    if (HISTORY_ACTIONS.includes(action.type) && skipDepth.current === 0) {
      const nextState = reducer(history.current[histIdx.current], action)
      history.current = history.current.slice(0, histIdx.current + 1)
      history.current.push(nextState)
      // Cap history to prevent unbounded memory growth
      if (history.current.length > MAX_HISTORY) {
        history.current = history.current.slice(-MAX_HISTORY)
      }
      histIdx.current = history.current.length - 1
      syncHistoryFlags()
    }
    dispatch(action)
  }, [])

  dispatchRef.current = dispatchWithHistory

  const undo = useCallback(() => {
    if (histIdx.current <= 0) return
    histIdx.current -= 1
    skipDepth.current += 1
    dispatch({ type: 'APPLY', newState: history.current[histIdx.current] })
    skipDepth.current -= 1
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const redo = useCallback(() => {
    if (histIdx.current >= history.current.length - 1) return
    histIdx.current += 1
    skipDepth.current += 1
    dispatch({ type: 'APPLY', newState: history.current[histIdx.current] })
    skipDepth.current -= 1
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const canUndo = historyFlags.canUndo
  const canRedo = historyFlags.canRedo

  const processPrompt = useCallback(async (text, onReply) => {
    setLoading(true)
    const userMsg = { role: 'user', content: text }
    const updatedHistory = [...chatHistory, userMsg].slice(-10)

    try {
      const result = await askGroq(updatedHistory, state)
      const newState = { ...state }

      if (result.sett && Array.isArray(result.sett) && result.sett.length > 0) {
        // Sanitize: keep 2-12 stripes, validate hex, clamp thread count 1-32.
        const HEX = /^#[0-9a-fA-F]{6}$/
        newState.sett = result.sett
          .filter(s => s && (HEX.test(s.c) || s.c == null))
          .map(s => ({
            c: HEX.test(s.c) ? s.c.toLowerCase() : '#888888',
            n: Math.max(1, Math.min(32, Number(s.n) || 4))
            // id injected by APPLY reducer case
          }))
          .slice(0, 12)
        if (newState.sett.length === 0) newState.sett = state.sett
        newState.activePreset = -1
      }
      if (result.weave && VALID_WEAVES.includes(result.weave))
        newState.weave = result.weave
      if (result.ts   && result.ts >= 4   && result.ts <= 22) newState.ts = result.ts
      if (result.reps && result.reps >= 1 && result.reps <= 12) newState.reps = result.reps

      dispatchRef.current({ type: 'APPLY', newState })

      const assistantMsg = { role: 'assistant', content: result.reply || 'Design updated!' }
      setChatHistory([...updatedHistory, assistantMsg].slice(-10))

      if (onReply) onReply({
        reply: result.reply || 'Design updated!',
        intent: result.intent || 'llm',
        quota: result._quota || null
      })
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
