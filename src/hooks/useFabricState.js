// useFabricState — thin hook: wires fabricReducer with undo/redo.
// Async prompt processing has been moved to src/services/chatService.js
import { useReducer, useCallback, useRef } from 'react'
import { fabricReducer, INITIAL_STATE } from '../store/fabricReducer.js'

const HISTORY_ACTIONS = [
  'SET_WEAVE','SET_TS','SET_REPS','SET_PRESET',
  'ADD_STRIPE','UPDATE_STRIPE','REMOVE_STRIPE','REORDER_SETT','APPLY'
]

export function useFabricState() {
  const [state, dispatch] = useReducer(fabricReducer, INITIAL_STATE)
  const history   = useRef([INITIAL_STATE])
  const histIdx   = useRef(0)
  const skipDepth = useRef(0)

  // Stable dispatch that also pushes to undo history
  const dispatchWithHistory = useCallback((action) => {
    if (HISTORY_ACTIONS.includes(action.type) && skipDepth.current === 0) {
      const nextState = fabricReducer(history.current[histIdx.current], action)
      history.current = history.current.slice(0, histIdx.current + 1)
      history.current.push(nextState)
      if (history.current.length > 50) history.current.shift() // cap at 50
      histIdx.current = history.current.length - 1
    }
    dispatch(action)
  }, [])

  // Stable ref so closures (e.g. URL-decode effect in App) always see latest dispatch
  const dispatchRef = useRef(dispatchWithHistory)
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

  return {
    state,
    dispatch: dispatchWithHistory,
    dispatchRef,
    undo,
    redo,
    get canUndo() { return histIdx.current > 0 },
    get canRedo() { return histIdx.current < history.current.length - 1 },
    get isDirty() { return state._dirty },
  }
}
