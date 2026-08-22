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

import { nlp } from './nlpEngine.js'

// Tier is derived server-side from the verified token's custom claim or rate limiter.
export async function askGroq(messages, currentState, isPro = false) {
  const settSummary = currentState.sett
    .map(s => `${s.c}×${s.n}t`)
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

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        response_format: { type: "json_object" },
        messages: fullMessages
      })
    })

    if (response.ok) {
      const data = await response.json()
      const remainingHeader = response.headers.get('X-RateLimit-Remaining')
      const limitHeader = response.headers.get('X-RateLimit-Limit')
      const serverQuota = {
        remaining: remainingHeader != null ? Number(remainingHeader) : null,
        limit: limitHeader != null ? Number(limitHeader) : null,
      }
      const raw = data.choices?.[0]?.message?.content || data.content || data.message || ''
      const clean = raw.replace(/^```json\n?|^```\n?|\n?```$/g, '').trim()

      try {
        const parsed = JSON.parse(clean)
        return { ...parsed, _quota: serverQuota }
      } catch {
        const match = clean.match(/\{[\s\S]*\}/)
        if (match) return { ...JSON.parse(match[0]), _quota: serverQuota }
      }
    }
  } catch (err) {
    console.warn('[groqClient] askGroq API unavailable, utilizing local textile design engine:', err)
  }

  // Fallback to local NLP pattern generator
  const localRes = nlp(lastUserMsg, currentState)
  if (localRes && localRes.state) {
    return {
      reply: localRes.reply || `Generated design based on "${lastUserMsg}".`,
      action: localRes.intent?.includes('weave') ? 'weave' : localRes.intent?.includes('thread') ? 'ts' : localRes.intent?.includes('repeats') ? 'reps' : 'sett',
      sett: localRes.state.sett,
      weave: localRes.state.weave || currentState.weave,
      ts: localRes.state.ts || currentState.ts,
      reps: localRes.state.reps || currentState.reps,
      intent: localRes.intent || lastUserMsg
    }
  }

  // Final deterministic fallback for thematic queries (e.g. autumn forest, ocean, sunset)
  const lower = lastUserMsg.toLowerCase()
  let themeSett = currentState.sett
  let themeReply = `Custom fabric inspired by "${lastUserMsg}".`

  if (lower.includes('autumn') || lower.includes('forest')) {
    themeSett = [
      { c: '#8c4a2f', n: 14 },
      { c: '#1c2b1a', n: 12 },
      { c: '#d49a3d', n: 4 },
      { c: '#1c140a', n: 2 },
      { c: '#5c6b57', n: 6 }
    ]
    themeReply = 'Autumn forest tartan created with warm golden, rust, deep pine, and earthy tones.'
  } else if (lower.includes('ocean') || lower.includes('sea') || lower.includes('water')) {
    themeSett = [
      { c: '#0f2b48', n: 16 },
      { c: '#0284c7', n: 10 },
      { c: '#38bdf8', n: 4 },
      { c: '#ffffff', n: 2 },
      { c: '#0d9488', n: 6 }
    ]
    themeReply = 'Ocean breeze palette with deep navy, azure, coastal teal, and seafoam white.'
  } else if (lower.includes('royal') || lower.includes('gold')) {
    themeSett = [
      { c: '#4c1d95', n: 14 },
      { c: '#d97706', n: 8 },
      { c: '#1e1b4b', n: 12 },
      { c: '#fef08a', n: 2 }
    ]
    themeReply = 'Regal jewel composition with imperial purple, radiant gold, and midnight navy.'
  }

  return {
    reply: themeReply,
    action: 'sett',
    sett: themeSett,
    weave: currentState.weave,
    ts: currentState.ts,
    reps: currentState.reps,
    intent: lastUserMsg
  }
}

/**
 * AI Colour Suggestion Generator
 * User inputs a color (e.g. "Blue"), AI returns harmonizing palettes like:
 * Navy Blue + Golden + White + Light Blue
 */
export async function suggestColors(baseColor) {
  const systemPrompt = `You are a world-class AI textile and fashion color consultant.
Given a base color name or hex (e.g. "Blue", "Maroon", "#1E3A8A"), generate 3 distinct harmonious color palettes suitable for textiles, sarees, kilts, and fashion apparel.
Return EXACTLY JSON matching this schema:
{
  "baseColor": "${baseColor}",
  "palettes": [
    {
      "themeName": "Royal Harmony",
      "colors": [
        { "name": "Navy Blue", "hex": "#001f3f" },
        { "name": "Golden", "hex": "#ffd700" },
        { "name": "White", "hex": "#ffffff" },
        { "name": "Light Blue", "hex": "#87ceeb" }
      ]
    },
    {
      "themeName": "Ocean Contrast",
      "colors": [
        { "name": "Deep Royal Blue", "hex": "#0a192f" },
        { "name": "Teal Accent", "hex": "#64ffda" },
        { "name": "Ivory White", "hex": "#f8f9fa" },
        { "name": "Sky Blue", "hex": "#38bdf8" }
      ]
    },
    {
      "themeName": "Traditional Elegance",
      "colors": [
        { "name": "Sapphire Blue", "hex": "#1d4ed8" },
        { "name": "Metallic Gold", "hex": "#eab308" },
        { "name": "Crisp Cream", "hex": "#fef08a" },
        { "name": "Cobalt Blue", "hex": "#1e40af" }
      ]
    }
  ]
}`

  try {
    let token = null
    try { token = await auth.currentUser?.getIdToken() } catch (_) { }

    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Suggest complementary color palettes for base color: ${baseColor}` }
        ]
      })
    })

    if (response.ok) {
      const data = await response.json()
      const raw = data.choices?.[0]?.message?.content || ''
      const clean = raw.replace(/^```json\n?|^```\n?|\n?```$/g, '').trim()
      const parsed = JSON.parse(clean)
      if (parsed && parsed.palettes) return parsed
    }
  } catch (err) {
    console.warn('[groqClient] suggestColors API unavailable, utilizing smart textile color engine:', err)
  }

  // Smart Fallback Engine for Textile Colors
  const normalized = (baseColor || 'Blue').toLowerCase().trim()
  if (normalized.includes('red') || normalized.includes('maroon') || normalized.includes('crimson')) {
    return {
      baseColor,
      palettes: [
        {
          themeName: 'Royal Crimson & Gold',
          colors: [
            { name: 'Rich Maroon', hex: '#800000' },
            { name: 'Metallic Gold', hex: '#ffd700' },
            { name: 'Crisp Ivory', hex: '#fffdd0' },
            { name: 'Deep Crimson', hex: '#990000' }
          ]
        },
        {
          themeName: 'Modern Ruby Contrast',
          colors: [
            { name: 'Ruby Red', hex: '#e63946' },
            { name: 'Midnight Navy', hex: '#1d3557' },
            { name: 'Soft Cream', hex: '#f1faee' },
            { name: 'Dusty Pink', hex: '#f4a261' }
          ]
        },
        {
          themeName: 'Traditional Festive',
          colors: [
            { name: 'Deep Vermilion', hex: '#c1121f' },
            { name: 'Antique Gold', hex: '#d4af37' },
            { name: 'Emerald Touch', hex: '#006d77' },
            { name: 'Silk White', hex: '#ffffff' }
          ]
        }
      ]
    }
  } else if (normalized.includes('green') || normalized.includes('emerald') || normalized.includes('teal')) {
    return {
      baseColor,
      palettes: [
        {
          themeName: 'Emerald Heritage',
          colors: [
            { name: 'Emerald Green', hex: '#005522' },
            { name: 'Imperial Gold', hex: '#ffd700' },
            { name: 'Pure White', hex: '#ffffff' },
            { name: 'Mint Accent', hex: '#98ff98' }
          ]
        },
        {
          themeName: 'Forest Tartan',
          colors: [
            { name: 'Deep Forest', hex: '#1b4332' },
            { name: 'Navy Blue', hex: '#081c15' },
            { name: 'Bright Yellow', hex: '#ffb703' },
            { name: 'Ruby Red', hex: '#d90429' }
          ]
        },
        {
          themeName: 'Sage & Silk',
          colors: [
            { name: 'Sage Green', hex: '#52b788' },
            { name: 'Eucalyptus', hex: '#74c69d' },
            { name: 'Soft Linen', hex: '#f8f9fa' },
            { name: 'Dark Moss', hex: '#2d6a4f' }
          ]
        }
      ]
    }
  }

  // Default Fallback (Blue / General)
  return {
    baseColor,
    palettes: [
      {
        themeName: 'Royal Harmony',
        colors: [
          { name: 'Navy Blue', hex: '#001f3f' },
          { name: 'Golden', hex: '#ffd700' },
          { name: 'White', hex: '#ffffff' },
          { name: 'Light Blue', hex: '#87ceeb' }
        ]
      },
      {
        themeName: 'Ocean Contrast',
        colors: [
          { name: 'Deep Royal Blue', hex: '#0a192f' },
          { name: 'Teal Accent', hex: '#64ffda' },
          { name: 'Ivory White', hex: '#f8f9fa' },
          { name: 'Sky Blue', hex: '#38bdf8' }
        ]
      },
      {
        themeName: 'Traditional Elegance',
        colors: [
          { name: 'Sapphire Blue', hex: '#1d4ed8' },
          { name: 'Metallic Gold', hex: '#eab308' },
          { name: 'Crisp Cream', hex: '#fef08a' },
          { name: 'Cobalt Blue', hex: '#1e40af' }
        ]
      }
    ]
  }
}

/**
 * ✨ Design Name + Description Generator
 * Analyzes the fabric design state and returns structured details:
 * Design Name, Style, Best For, Colours, Description
 */
export async function generateDesignDetails(fabricState) {
  const settSummary = fabricState.sett.map(s => `${s.c} (${s.n} threads)`).join(', ')

  const systemPrompt = `You are Dobby, an elite AI textile curator and fashion designer.
Analyze the user's fabric design state (stripes, weave structure, thread count) and generate professional design metadata.
Return EXACTLY JSON matching this schema:
{
  "designName": "Royal Floral",
  "style": "Traditional Indian / Regal",
  "bestFor": "Saree & Kurti",
  "colors": ["Navy Blue", "Golden", "White", "Light Blue"],
  "description": "Elegant floral pattern inspired by traditional Indian textiles with rich gold accents."
}`

  try {
    let token = null
    try { token = await auth.currentUser?.getIdToken() } catch (_) { }

    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate design details for fabric state:\nSett Stripes: ${settSummary}\nWeave Type: ${fabricState.weave}\nThread Size: ${fabricState.ts}px\nRepeats: ${fabricState.reps}x` }
        ]
      })
    })

    if (response.ok) {
      const data = await response.json()
      const raw = data.choices?.[0]?.message?.content || ''
      const clean = raw.replace(/^```json\n?|^```\n?|\n?```$/g, '').trim()
      const parsed = JSON.parse(clean)
      if (parsed && parsed.designName) return parsed
    }
  } catch (err) {
    console.warn('[groqClient] generateDesignDetails API unavailable, utilizing local textile analysis engine:', err)
  }

  // Fallback Design Metadata Engine based on Sett Colors & Weave
  const hexes = fabricState.sett.map(s => s.c.toUpperCase())
  let primaryColorName = 'Royal'
  if (hexes.some(h => h.includes('00') || h.includes('11') || h.includes('1A') || h.includes('0A'))) primaryColorName = 'Midnight'
  if (hexes.some(h => h.includes('FFD') || h.includes('EAB') || h.includes('D4A'))) primaryColorName = 'Imperial Gold'
  if (hexes.some(h => h.includes('CC') || h.includes('99') || h.includes('C1'))) primaryColorName = 'Royal Crimson'
  if (hexes.some(h => h.includes('005') || h.includes('1B4') || h.includes('52B'))) primaryColorName = 'Emerald Heritage'

  const weaveName = fabricState.weave === 'twill22' ? 'Twill Weave' : fabricState.weave === 'satin5' ? 'Satin Weave' : 'Textile'

  return {
    designName: `${primaryColorName} ${weaveName}`,
    style: "Traditional & Contemporary Fusion",
    bestFor: "Saree, Kurti & Tailored Blazer",
    colors: hexes.slice(0, 4),
    description: `A sophisticated ${fabricState.weave || 'twill'} pattern with balanced stripe ratios (${fabricState.sett.length} active shades) engineered for premium drape and rich texture contrast.`
  }
}

