import { describe, it, expect } from 'vitest'
import { nlp } from '../utils/nlpEngine.js'
import { INITIAL_STATE } from '../store/fabricReducer.js'

describe('nlpEngine', () => {
  it('loads Royal Stewart preset', () => {
    const r = nlp('royal stewart', INITIAL_STATE)
    expect(r.intent).toContain('Royal Stewart')
    expect(r.state.activePreset).toBe(0)
  })

  it('loads Black Watch preset', () => {
    const r = nlp('black watch', INITIAL_STATE)
    expect(r.intent).toContain('Black Watch')
  })

  it('loads school uniform preset', () => {
    const r = nlp('school uniform', INITIAL_STATE)
    expect(r.intent).toContain('School Uniform')
  })

  it('switches to plain weave', () => {
    const r = nlp('plain weave', INITIAL_STATE)
    expect(r.state.weave).toBe('plain')
  })

  it('switches to satin', () => {
    const r = nlp('satin', INITIAL_STATE)
    expect(r.state.weave).toBe('satin5')
  })

  it('increases thread size on bolder', () => {
    const r = nlp('make it bolder', INITIAL_STATE)
    expect(r.state.ts).toBeGreaterThan(INITIAL_STATE.ts)
  })

  it('decreases thread size on finer', () => {
    const r = nlp('make it finer', INITIAL_STATE)
    expect(r.state.ts).toBeLessThan(INITIAL_STATE.ts)
  })

  it('increments repeats on more repeats', () => {
    const r = nlp('more repeats', INITIAL_STATE)
    expect(r.state.reps).toBe(INITIAL_STATE.reps + 1)
  })

  it('mirrors sett on symmetric', () => {
    const r = nlp('symmetric', INITIAL_STATE)
    expect(r.state.sett.length).toBeGreaterThan(INITIAL_STATE.sett.length)
  })

  it('returns random preset on surprise me', () => {
    const r = nlp('surprise me', INITIAL_STATE)
    expect(r.intent).toContain('random')
  })

  it('shifts colors darker', () => {
    const r = nlp('darker', INITIAL_STATE)
    expect(r.intent).toBe('tone: darker')
    expect(r.state.sett).not.toEqual(INITIAL_STATE.sett)
  })

  it('shifts colors lighter', () => {
    const r = nlp('lighter', INITIAL_STATE)
    expect(r.intent).toBe('tone: lighter')
  })

  it('mutes palette', () => {
    const r = nlp('muted palette', INITIAL_STATE)
    expect(r.intent).toBe('tone: muted')
  })

  it('parses two color words', () => {
    const r = nlp('red and navy', INITIAL_STATE)
    expect(r.state.sett.length).toBeGreaterThanOrEqual(2)
  })

  it('returns no match for unknown input', () => {
    const r = nlp('xyzzy foobar baz', INITIAL_STATE)
    expect(r.intent).toBe('no match')
  })
})
