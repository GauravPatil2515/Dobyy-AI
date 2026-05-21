// commandRouter — decides whether a text command goes to the rule engine or the LLM.
// Rule engine handles deterministic, loom-domain commands.
// LLM handles open-ended creative descriptions.
import { nlp } from '../utils/nlpEngine.js'

/**
 * Patterns that are always deterministic — never send to LLM.
 * Ordered from most-specific to most-general.
 * @type {RegExp[]}
 */
const RULE_PATTERNS = [
  // Preset names
  /\b(royal stewart|black watch|burberry|macgregor|dress stewart|hunting stewart|hunting|pastel plaid|bold navy|school uniform|school|shirting|shirt check|heritage suiting|suiting|home linen|home textile)\b/i,
  // Weave types
  /\b(plain weave|plain|twill|2\/2|2\/1|3\/1|satin|basket weave|basket|hopsack)\b/i,
  // Thread size adjectives
  /\b(very fine|micro|finer|smaller|fine|bolder|coarser|thicker|bigger)\b/i,
  // Zoom
  /\b(zoom in|zoom out)\b/i,
  // Repeats
  /\b(more repeat|fewer repeat|less repeat|tile more|\d+\s*(?:repeat|rep|x))\b/i,
  // Sett modifiers
  /\b(invert|reverse|double stripe|half stripe|narrow stripe|symmetric|mirror)\b/i,
  // Tone adjustments (new intents added in nlpEngine)
  /\b(darker|lighter|more contrast|bolder colors|muted|desaturate)\b/i,
  // Utility commands
  /\b(reset|start over|new design|random|surprise me|save|save design|save this)\b/i,
]

/**
 * @param {string} text
 * @returns {'rule'|'llm'}
 */
export function classifyCommand(text) {
  const t = text.toLowerCase().trim()
  return RULE_PATTERNS.some(r => r.test(t)) ? 'rule' : 'llm'
}

/**
 * Try the rule engine first. Returns null if no rule matched (caller should go to LLM).
 * @param {string} text
 * @param {import('./fabricTypes.js').FabricState} state
 * @returns {import('./fabricTypes.js').CommandResult|null}
 */
export function tryRuleEngine(text, state) {
  const result = nlp(text, state)
  if (result.intent === 'no match') return null
  return {
    state:  result.state,
    reply:  result.reply,
    intent: result.intent,
    source: 'RULE',
  }
}
