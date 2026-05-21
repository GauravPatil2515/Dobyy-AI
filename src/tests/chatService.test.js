import { describe, it, expect, vi } from 'vitest'
import { buildStateFromLLM } from '../services/chatService.js'
import { INITIAL_STATE } from '../store/fabricReducer.js'

describe('chatService — buildStateFromLLM', () => {
  it('applies valid sett from LLM response', () => {
    const llm = {
      sett:  [{ c: '#cc2211', n: 8 }, { c: '#003399', n: 4 }],
      weave: 'plain',
      ts:    10,
      reps:  2,
    }
    const next = buildStateFromLLM(llm, INITIAL_STATE)
    expect(next.sett).toHaveLength(2)
    expect(next.weave).toBe('plain')
    expect(next.ts).toBe(10)
    expect(next.activePreset).toBe(-1)
  })

  it('sanitizes invalid hex colors to #888888', () => {
    const llm = { sett: [{ c: 'notahex', n: 4 }] }
    const next = buildStateFromLLM(llm, INITIAL_STATE)
    expect(next.sett[0].c).toBe('#888888')
  })

  it('clamps thread count to 1..32', () => {
    const llm = { sett: [{ c: '#ff0000', n: 999 }] }
    const next = buildStateFromLLM(llm, INITIAL_STATE)
    expect(next.sett[0].n).toBe(32)
  })

  it('ignores invalid weave types', () => {
    const llm = { weave: 'invalidweave' }
    const next = buildStateFromLLM(llm, INITIAL_STATE)
    expect(next.weave).toBe(INITIAL_STATE.weave)
  })

  it('preserves current state when LLM returns empty response', () => {
    const next = buildStateFromLLM({}, INITIAL_STATE)
    expect(next.weave).toBe(INITIAL_STATE.weave)
    expect(next.ts).toBe(INITIAL_STATE.ts)
  })
})
