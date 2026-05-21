import { describe, it, expect } from 'vitest'
import { classifyCommand, tryRuleEngine } from '../domain/commandRouter.js'

const BASE = {
  sett: [{ c: '#cc1122', n: 8 }, { c: '#003366', n: 4 }],
  weave: 'twill22', ts: 8, reps: 3, activePreset: 0
}

describe('classifyCommand', () => {
  it('classifies weave commands as rule', () => {
    expect(classifyCommand('switch to plain weave')).toBe('rule')
    expect(classifyCommand('2/2 twill')).toBe('rule')
    expect(classifyCommand('satin weave please')).toBe('rule')
  })

  it('classifies thread size commands as rule', () => {
    expect(classifyCommand('make it finer')).toBe('rule')
    expect(classifyCommand('make it thicker')).toBe('rule')
    expect(classifyCommand('zoom in')).toBe('rule')
  })

  it('classifies repeat commands as rule', () => {
    expect(classifyCommand('more repeats')).toBe('rule')
    expect(classifyCommand('fewer repeats')).toBe('rule')
    expect(classifyCommand('4 repeats')).toBe('rule')
  })

  it('classifies preset names as rule', () => {
    expect(classifyCommand('black watch')).toBe('rule')
    expect(classifyCommand('school uniform')).toBe('rule')
    expect(classifyCommand('shirting')).toBe('rule')
  })

  it('classifies tone commands as rule', () => {
    expect(classifyCommand('make it darker')).toBe('rule')
    expect(classifyCommand('muted palette')).toBe('rule')
    expect(classifyCommand('more contrast')).toBe('rule')
  })

  it('classifies utility commands as rule', () => {
    expect(classifyCommand('surprise me')).toBe('rule')
    expect(classifyCommand('reset')).toBe('rule')
    expect(classifyCommand('save design')).toBe('rule')
  })

  it('classifies open-ended creative descriptions as llm', () => {
    expect(classifyCommand('autumn forest inspired plaid')).toBe('llm')
    expect(classifyCommand('ocean sunset mood')).toBe('llm')
    expect(classifyCommand('traditional Scottish highland look')).toBe('llm')
  })

  it('classifies short vague queries as llm', () => {
    expect(classifyCommand('something warm')).toBe('llm')
    expect(classifyCommand('industrial vibes')).toBe('llm')
  })
})

describe('tryRuleEngine', () => {
  it('returns null for LLM-bound queries', () => {
    expect(tryRuleEngine('autumn forest inspired plaid', BASE)).toBeNull()
  })

  it('returns a result for deterministic commands', () => {
    const r = tryRuleEngine('plain weave', BASE)
    expect(r).not.toBeNull()
    expect(r.state.weave).toBe('plain')
    expect(r.source).toBe('RULE')
  })

  it('result.source is always RULE', () => {
    const r = tryRuleEngine('make it finer', BASE)
    expect(r?.source).toBe('RULE')
  })

  it('returns null when nlp returns no-match intent', () => {
    const r = tryRuleEngine('vibrant oceanic sunset mood design', BASE)
    expect(r).toBeNull()
  })
})
