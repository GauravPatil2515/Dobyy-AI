import { describe, it, expect } from 'vitest'
import { nlp } from '../utils/nlpEngine.js'
import { PRESETS } from '../data/presets.js'

const BASE = {
  sett: [{ c: '#cc1122', n: 8 }, { c: '#003366', n: 4 }],
  weave: 'twill22', ts: 8, reps: 3, activePreset: 0
}

describe('nlpEngine', () => {
  it('returns no-match for empty-ish input', () => {
    const r = nlp('', BASE)
    expect(r.intent).toBe('no match')
  })

  it('loads Royal Stewart preset', () => {
    const r = nlp('royal stewart', BASE)
    expect(r.intent).toMatch(/preset/i)
    expect(r.state.activePreset).toBe(0)
  })

  it('loads Black Watch preset', () => {
    const r = nlp('black watch please', BASE)
    expect(r.state.activePreset).toBe(1)
  })

  it('loads School Uniform preset (new textile preset)', () => {
    const r = nlp('school uniform', BASE)
    expect(r.state.activePreset).toBe(8)
  })

  it('loads Classic Shirting preset (new textile preset)', () => {
    const r = nlp('shirting', BASE)
    expect(r.state.activePreset).toBe(9)
  })

  it('switches to plain weave', () => {
    const r = nlp('switch to plain weave', BASE)
    expect(r.state.weave).toBe('plain')
  })

  it('switches to satin', () => {
    const r = nlp('satin', BASE)
    expect(r.state.weave).toBe('satin5')
  })

  it('switches to hopsack', () => {
    const r = nlp('hopsack weave', BASE)
    expect(r.state.weave).toBe('hopsack')
  })

  it('makes thread finer', () => {
    const r = nlp('make it finer', BASE)
    expect(r.state.ts).toBe(BASE.ts - 2)
  })

  it('clamps finer at minimum 4', () => {
    const r = nlp('very fine', { ...BASE, ts: 4 })
    expect(r.state.ts).toBe(4)
  })

  it('increases repeats', () => {
    const r = nlp('more repeats', BASE)
    expect(r.state.reps).toBe(BASE.reps + 1)
  })

  it('decreases repeats', () => {
    const r = nlp('fewer repeats', BASE)
    expect(r.state.reps).toBe(BASE.reps - 1)
  })

  it('mirrors sett symmetrically', () => {
    const r = nlp('make it symmetric', BASE)
    const expected = [...BASE.sett, ...[...BASE.sett].reverse().slice(1)]
    expect(r.state.sett.length).toBe(expected.length)
  })

  it('inverts / reverses sett', () => {
    const r = nlp('reverse the sett', BASE)
    expect(r.state.sett[0].c).toBe(BASE.sett[BASE.sett.length - 1].c)
  })

  it('shifts palette darker', () => {
    const r = nlp('make it darker', BASE)
    expect(r.intent).toBe('tone: darker')
    // R channel of first color should be <= original
    const origR = parseInt(BASE.sett[0].c.slice(1,3), 16)
    const newR  = parseInt(r.state.sett[0].c.slice(1,3), 16)
    expect(newR).toBeLessThanOrEqual(origR)
  })

  it('gives save hint', () => {
    const r = nlp('save this design', BASE)
    expect(r.intent).toBe('save-hint')
    expect(r.state).toEqual(expect.objectContaining({ weave: BASE.weave }))
  })

  it('gives random preset', () => {
    const r = nlp('surprise me', BASE)
    expect(r.intent).toMatch(/random/)
  })

  it('builds 2-color sett from color names', () => {
    const r = nlp('red and navy', BASE)
    expect(r.state.sett.length).toBeGreaterThanOrEqual(2)
    expect(r.intent).toMatch(/colors/)
  })
})
