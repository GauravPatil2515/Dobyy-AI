// fabricReducer — pure reducer extracted from useFabricState.
// No React, no async, no imports of hooks.
import { PRESETS } from '../data/presets.js'

export const INITIAL_STATE = {
  sett:         PRESETS[0].sett.map(s => ({ ...s })),
  weave:        'twill22',
  ts:           8,
  reps:         3,
  activePreset: 0,
  panel:        'fabric',
  theme:        'light',
  _dirty:       false,   // true = unsaved changes exist
}

const VALID_WEAVES = ['twill22','twill21','plain','satin5','twill31','basket2','hopsack']

/**
 * @param {import('../domain/fabricTypes.js').FabricState} state
 * @param {Object} action
 * @returns {import('../domain/fabricTypes.js').FabricState}
 */
export function fabricReducer(state, action) {
  switch (action.type) {
    case 'SET_WEAVE':
      if (!VALID_WEAVES.includes(action.weave)) return state
      return { ...state, weave: action.weave, _dirty: true }

    case 'SET_TS':
      return { ...state, ts: Math.max(4, Math.min(22, action.ts)), _dirty: true }

    case 'SET_REPS':
      return { ...state, reps: Math.max(1, Math.min(12, action.reps)), _dirty: true }

    case 'SET_PANEL':
      return { ...state, panel: action.panel }

    case 'SET_PRESET':
      return {
        ...state,
        sett: PRESETS[action.idx].sett.map(s => ({ ...s })),
        activePreset: action.idx,
        _dirty: true,
      }

    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' }

    case 'ADD_STRIPE':
      return { ...state, sett: [...state.sett, { c: '#888888', n: 4 }], _dirty: true }

    case 'UPDATE_STRIPE':
      return {
        ...state,
        sett: state.sett.map((s, i) => i === action.idx ? { ...s, ...action.patch } : s),
        _dirty: true,
      }

    case 'REMOVE_STRIPE':
      return {
        ...state,
        sett: state.sett.length > 1 ? state.sett.filter((_, i) => i !== action.idx) : state.sett,
        _dirty: true,
      }

    case 'REORDER_SETT':
      return { ...state, sett: action.newSett, _dirty: true }

    case 'APPLY':
      return { ...action.newState, _dirty: true }

    case 'MARK_SAVED':
      return { ...state, _dirty: false }

    case 'RESET':
      return { ...INITIAL_STATE, theme: state.theme, _dirty: false }

    default:
      return state
  }
}
