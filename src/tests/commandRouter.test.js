import { describe, it, expect } from 'vitest'
import { classifyCommand, tryRuleEngine } from '../domain/commandRouter.js'
import { INITIAL_STATE } from '../store/fabricReducer.js'

describe('commandRouter — classifyCommand', () => {
  it('classifies preset names as rule', () => {
    expect(classifyCommand('black watch')).toBe('rule')
    expect(classifyCommand('royal stewart')).toBe('rule')
    expect(classifyCommand('school uniform')).toBe('rule')
  })

  it('classifies weave commands as rule', () => {
    expect(classifyCommand('plain weave')).toBe('rule')
    expect(classifyCommand('twill 2/2')).toBe('rule')
    expect(classifyCommand('satin')).toBe('rule')
  })

  it('classifies thread size commands as rule', () => {
    expect(classifyCommand('make it finer')).toBe('rule')
    expect(classifyCommand('bolder')).toBe('rule')
  })

  it('classifies tone adjustments as rule', () => {
    expect(classifyCommand('darker')).toBe('rule')
    expect(classifyCommand('muted')).toBe('rule')
  })

  it('classifies open creative prompt as llm', () => {
    expect(classifyCommand('autumn forest colours with gold accents')).toBe('llm')
    expect(classifyCommand('ocean blues inspired by the aegean sea')).toBe('llm')
  })
})

describe('commandRouter — tryRuleEngine', () => {
  it('returns CommandResult for known command', () => {
    const result = tryRuleEngine('plain weave', INITIAL_STATE)
    expect(result).not.toBeNull()
    expect(result.source).toBe('RULE')
    expect(result.state.weave).toBe('plain')
  })

  it('returns null for unknown command', () => {
    const result = tryRuleEngine('autumn forest tartans with gold', INITIAL_STATE)
    expect(result).toBeNull()
  })
})
