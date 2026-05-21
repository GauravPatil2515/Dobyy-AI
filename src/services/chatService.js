// chatService — orchestrates text commands through rule engine → LLM pipeline.
// Components call processCommand() and get a typed ServiceResult back.
import { tryRuleEngine } from '../domain/commandRouter.js'
import { askGroq } from '../utils/groqClient.js'

/**
 * @param {string} text
 * @param {import('../domain/fabricTypes.js').FabricState} state
 * @param {Array<{role:string,content:string}>} history
 * @returns {Promise<import('../domain/fabricTypes.js').ServiceResult>}
 */
export async function processCommand(text, state, history = []) {
  // 1. Rule engine first — deterministic, zero API cost
  const ruleResult = tryRuleEngine(text, state)
  if (ruleResult) {
    return { ok: true, data: ruleResult }
  }

  // 2. LLM for open-ended creative descriptions
  try {
    const llmResult = await askGroq(history, state)
    return {
      ok: true,
      data: {
        state:  buildStateFromLLM(llmResult, state),
        reply:  llmResult.reply  || 'Design updated!',
        intent: llmResult.intent || 'llm',
        source: 'LLM',
      }
    }
  } catch (err) {
    console.error('[chatService]', err.message)

    // HTTP 429 — rate limited
    if (err.message?.includes('429') || err.message?.toLowerCase().includes('limit')) {
      return { ok: false, errorCode: 'RATE_LIMIT', message: "Daily AI limit reached. Upgrade to Pro for unlimited designs! ✨" }
    }
    // JSON parse failure (groqClient already handles internally, but just in case)
    if (err.name === 'SyntaxError' || err.message?.includes('parse')) {
      return { ok: false, errorCode: 'PARSE_FAILED', message: "AI returned an unexpected format. Try a simpler description." }
    }
    // Network error
    return { ok: false, errorCode: 'NETWORK', message: "Connection error — check your internet and try again." }
  }
}

/**
 * Maps raw LLM JSON output to a valid FabricState patch.
 * @param {Object} llm - raw parsed LLM response
 * @param {import('../domain/fabricTypes.js').FabricState} current
 * @returns {import('../domain/fabricTypes.js').FabricState}
 */
export function buildStateFromLLM(llm, current) {
  const VALID_WEAVES = ['twill22','twill21','plain','satin5','twill31','basket2','hopsack']
  const next = { ...current }

  if (Array.isArray(llm.sett) && llm.sett.length > 0) {
    next.sett = llm.sett.map(s => ({
      c: typeof s.c === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.c) ? s.c : '#888888',
      n: Math.max(1, Math.min(32, Number(s.n) || 4)),
    }))
    next.activePreset = -1
  }
  if (llm.weave && VALID_WEAVES.includes(llm.weave))    next.weave = llm.weave
  if (llm.ts   && llm.ts >= 4  && llm.ts <= 22)         next.ts    = llm.ts
  if (llm.reps && llm.reps >= 1 && llm.reps <= 12)      next.reps  = llm.reps

  return next
}
