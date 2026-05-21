import { describe, it, expect } from 'vitest'
import { fabricReducer, INITIAL_STATE } from '../store/fabricReducer.js'

describe('fabricReducer', () => {
  it('returns initial state by default', () => {
    const s = fabricReducer(undefined, { type: '@@INIT' })
    expect(s).toEqual(INITIAL_STATE)
  })

  it('SET_WEAVE — valid weave', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_WEAVE', weave: 'plain' })
    expect(s.weave).toBe('plain')
    expect(s._dirty).toBe(true)
  })

  it('SET_WEAVE — invalid weave is ignored', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_WEAVE', weave: 'badweave' })
    expect(s.weave).toBe(INITIAL_STATE.weave)
  })

  it('SET_TS — clamps to min 4', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_TS', ts: 1 })
    expect(s.ts).toBe(4)
  })

  it('SET_TS — clamps to max 22', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'SET_TS', ts: 99 })
    expect(s.ts).toBe(22)
  })

  it('SET_REPS — clamps to 1..12', () => {
    const lo = fabricReducer(INITIAL_STATE, { type: 'SET_REPS', reps: 0 })
    const hi = fabricReducer(INITIAL_STATE, { type: 'SET_REPS', reps: 20 })
    expect(lo.reps).toBe(1)
    expect(hi.reps).toBe(12)
  })

  it('ADD_STRIPE — adds a grey stripe', () => {
    const before = INITIAL_STATE.sett.length
    const s = fabricReducer(INITIAL_STATE, { type: 'ADD_STRIPE' })
    expect(s.sett.length).toBe(before + 1)
    expect(s.sett[before].c).toBe('#888888')
  })

  it('REMOVE_STRIPE — removes correct index', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'REMOVE_STRIPE', idx: 0 })
    expect(s.sett.length).toBe(INITIAL_STATE.sett.length - 1)
  })

  it('REMOVE_STRIPE — never removes last stripe', () => {
    const single = { ...INITIAL_STATE, sett: [{ c: '#ff0000', n: 4 }] }
    const s = fabricReducer(single, { type: 'REMOVE_STRIPE', idx: 0 })
    expect(s.sett.length).toBe(1)
  })

  it('MARK_SAVED — clears dirty flag', () => {
    const dirty = fabricReducer(INITIAL_STATE, { type: 'SET_TS', ts: 10 })
    expect(dirty._dirty).toBe(true)
    const saved = fabricReducer(dirty, { type: 'MARK_SAVED' })
    expect(saved._dirty).toBe(false)
  })

  it('RESET — returns to initial state keeping theme', () => {
    const dark = { ...INITIAL_STATE, theme: 'dark', ts: 20 }
    const s = fabricReducer(dark, { type: 'RESET' })
    expect(s.ts).toBe(INITIAL_STATE.ts)
    expect(s.theme).toBe('dark')   // theme preserved
    expect(s._dirty).toBe(false)
  })

  it('TOGGLE_THEME — light to dark', () => {
    const s = fabricReducer(INITIAL_STATE, { type: 'TOGGLE_THEME' })
    expect(s.theme).toBe('dark')
  })
})
