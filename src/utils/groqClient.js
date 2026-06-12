import { auth } from '../firebase.js'

const SYSTEM_PROMPT = `
You are Dobby, an expert AI fabric and tartan designer.
The user describes a fabric design in natural language or provides extracted colors.
You respond with EXACTLY this JSON format and nothing else:

{
  "reply": "A short friendly message about what you designed (max 2 sentences)",
  "action": "sett" | "weave" | "ts" | "reps" | "none",
  "sett": [{"c": "#hexcolor", "n": number}, ...],
  "weave": "twill22" | "twill21" | "plain" | "satin5" | "twill31" | "basket2" | "hopsack",
  "ts": number (4-22),
  "reps": number (1-12),
  "intent": "short description of what changed"
}

RULES:
- Always return valid JSON. No markdown. No explanation outside JSON.
- "reply" must be warm, short, design-focused (max 2 sentences)
- "action" tells what changed: "sett" if colors changed, "weave" if structure changed, "ts" if thread size changed, "reps" if repeats changed, "none" if unknown
- For "sett": create beautiful color combinations. Use rich, textile-appropriate hex colors.
  Each stripe: "c" = hex color string, "n" = thread count (2-16 for accent, 8-24 for main)
  Minimum 2 stripes, maximum 10 stripes.
  Always include at least one dark anchor color (#111111 or #1a1a1a) unless specifically a pastel design.
- For colors: use accurate hex values. Red=#cc2211, Navy=#003399, Green=#005522, Black=#111111, White=#ffffff, Gold=#ffcc00
- "weave", "ts", "reps" — only change if user explicitly asked, otherwise copy from current state
- If user says "make it finer/smaller" → ts = current ts - 2 (min 4)
- If user says "bolder/bigger/thicker" → ts = current ts + 2 (max 22)
- If user says "more repeats" → reps = current reps + 1 (max 12)
- If user says "plain weave" → weave = "plain"
- If user says "satin" → weave = "satin5"
- If user says "3/1 twill" or "twill31" → weave = "twill31"
- If user says "basket" or "basket weave" → weave = "basket2"
- If user says "hopsack" → weave = "hopsack"
- If user provides extracted hex colors from image analysis, validate and use them as-is with proper thread counts proportional to stripe widths

EXAMPLES:
User: "red and navy tartan"
Response: {"reply":"Classic red and navy tartan — bold and traditional.","action":"sett","sett":[{"c":"#cc2211","n":16},{"c":"#111111","n":2},{"c":"#003399","n":8},{"c":"#111111","n":2},{"c":"#cc2211","n":4}],"weave":"twill22","ts":8,"reps":3,"intent":"colors: red, navy"}

User: "Analyze this fabric - extracted 4 colors: #cc2211, #111111, #003399, #ffffff. red and navy tartan"
Response: {"reply":"Beautiful red and navy tartan detected from your image!","action":"sett","sett":[{"c":"#cc2211","n":12},{"c":"#111111","n":2},{"c":"#003399","n":8},{"c":"#ffffff","n":2}],"weave":"twill22","ts":8,"reps":3,"intent":"image analysis: red, navy, white"}
`

// FIX #9: accept isPro flag so Pro users get correct rate limit tier on server
export async function askGroq(messages, currentState, isPro = false) {
  const settSummary = currentState.sett
    .map(s => `${s.c}\u00d7${s.n}t`)
    .join(', ')
  const totalThreads = currentState.sett.reduce((a, s) => a + s.n, 0)

  const stateContext = `Current fabric state:
- Sett (${currentState.sett.length} stripes, ${totalThreads} threads total): [${settSummary}]
- Weave: ${currentState.weave}
- Thread size: ${currentState.ts}px
- Repeats: ${currentState.reps}x`

  const fullMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: stateContext },
    ...messages
  ]

  let token = null
  try {
    token = await auth.currentUser?.getIdToken()
  } catch (_) {}

  const headers = {
    'Content-Type': 'application/json',
    // FIX #9: pass tier so server-side rate limiter applies correct quota
    'X-User-Tier': isPro ? 'pro' : 'free',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 512
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${response.status}`)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content || data.content || data.message || ''

  // Strip markdown code fences if present
  const clean = raw.replace(/^```json\n?|^```\n?|\n?```$/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    // Attempt to extract JSON object from text
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Invalid JSON response from AI')
  }
}
