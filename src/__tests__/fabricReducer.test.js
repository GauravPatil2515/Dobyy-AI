import { describe, it, expect } from 'vitest'
import { fabricReducer, INITIAL_STATE } from '../store/fabricReducer.js'
import { PRESETS } from '../data/presets.js'

describe('fabricReducer', () => {
  it('returns state unchanged for unknown action', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'UNKNOWN' })
    expect(s).toBe(INITIAL_STATE)
  })

  it('SET_WEAVE — updates weave and marks dirty', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_WEAVE', weave: 'plain' })
    expect(s.weave).toBe('plain')
    expect(s._dirty).toBe(true)
  })

  it('SET_WEAVE — ignores invalid weave type', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_WEAVE', weave: 'invalid' })
    expect(s).toBe(INITIAL_STATE)
  })

  it('SET_TS — clamps to min 4', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_TS', ts: 1 })
    expect(s.ts).toBe(4)
  })

  it('SET_TS — clamps to max 22', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_TS', ts: 99 })
    expect(s.ts).toBe(22)
  })

  it('SET_TS — accepts valid value and marks dirty', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_TS', ts: 10 })
    expect(s.ts).toBe(10)
    expect(s._dirty).toBe(true)
  })

  it('SET_REPS — clamps to min 1', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_REPS', reps: 0 })
    expect(s.reps).toBe(1)
  })

  it('SET_REPS — clamps to max 12', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_REPS', reps: 20 })
    expect(s.reps).toBe(12)
  })

  it('SET_PRESET — loads correct sett', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_PRESET', idx: 1 })
    expect(s.sett).toEqual(PRESETS[1].sett.map(x => ({ ...x })))
    expect(s.activePreset).toBe(1)
    expect(s._dirty).toBe(true)
  })

  it('TOGGLE_THEME — toggles light to dark', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'TOGGLE_THEME' })
    expect(s.theme).toBe('dark')
  })

  it('TOGGLE_THEME — toggles dark back to light', () => {
    const dark = { ...INITIAL_STATE, theme: 'dark' }
    const s = fabricReducer(dark, { type: 'TOGGLE_THEME' })
    expect(s.theme).toBe('light')
  })

  it('ADD_STRIPE — appends a new stripe', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'ADD_STRIPE' })
    expect(s.sett.length).toBe(INITIAL_STATE.sett.length + 1)
    expect(s._dirty).toBe(true)
  })

  it('REMOVE_STRIPE — removes stripe by index', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'REMOVE_STRIPE', idx: 0 })
    expect(s.sett.length).toBe(INITIAL_STATE.sett.length - 1)
  })

  it('REMOVE_STRIPE — prevents removing last stripe', () => {
    const single = { ...INITIAL_STATE, sett: [{ c: '#ff0000', n: 4 }] }
    const s = fabricReducer(single, { type: 'REMOVE_STRIPE', idx: 0 })
    expect(s.sett.length).toBe(1)
  })

  it('UPDATE_STRIPE — updates color at index', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'UPDATE_STRIPE', idx: 0, patch: { c: '#aabbcc' } })
    expect(s.sett[0].c).toBe('#aabbcc')
    expect(s._dirty).toBe(true)
  })

  it('MARK_SAVED — clears dirty flag', () => {
    const dirty = { ...INITIAL_STATE, _dirty: true }
    const s = fabricReducer(dirty, { type: 'MARK_SAVED' })
    expect(s._dirty).toBe(false)
  })

  it('RESET — returns to initial state, keeps theme', () => {
    const modified = { ...INITIAL_STATE, theme: 'dark', ts: 18, _dirty: true }
    const s = fabricReducer(modified, { type: 'RESET' })
    expect(s.ts).toBe(INITIAL_STATE.ts)
    expect(s.theme).toBe('dark')   // theme preserved
    expect(s._dirty).toBe(false)
  })

  it('APPLY — replaces state entirely', () => {
    const newState = { ...INITIAL_STATE, ts: 16, weave: 'plain' }
    const s = fabricReducer(INITIAL_STATE, { type: 'APPLY', newState })
    expect(s.ts).toBe(16)
    expect(s.weave).toBe('plain')
  })

  it('SET_PANEL — updates panel without marking dirty', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_PANEL', panel: 'draft' })
    expect(s.panel).toBe('draft')
    expect(s._dirty).toBe(false)
  })
})
