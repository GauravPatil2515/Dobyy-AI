// nlpEngine — deterministic NLP rule engine for fabric design commands.
// Returns { state, reply, intent } or { intent: 'no match' } for LLM fallback.
import { COLOR_MAP, RAW_COLORS } from '../data/colors.js'
import { PRESETS } from '../data/presets.js'
import { h2r, blend, hexFromRgb } from './colorUtils.js'

function parseColors(text) {
  const found = [], t = text.toLowerCase()
  for (const [name, hex] of Object.entries(COLOR_MAP))
    if (t.includes(name) && !found.includes(hex)) found.push(hex)
  return found
}

/** Clamp a value between min and max */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/** Shift every color's L channel (HSL) by delta percent (-100..100) */
function shiftLightness(sett, delta) {
  return sett.map(s => {
    const r = h2r(s.c)
    // Simple RGB lightness shift
    const shift = delta / 100
    const r2 = clamp(Math.round(r.r + 255 * shift), 0, 255)
    const g2 = clamp(Math.round(r.g + 255 * shift), 0, 255)
    const b2 = clamp(Math.round(r.b + 255 * shift), 0, 255)
    return { ...s, c: hexFromRgb({ r: r2, g: g2, b: b2 }) }
  })
}

export function nlp(text, state) {
  const t = text.toLowerCase().trim()
  const S = { ...state, sett: state.sett.map(s => ({ ...s })) }

  // ─── 0. UTILITY COMMANDS (reset, random, save) ─────────────────────────────
  if (/\b(reset|start over|new design)\b/.test(t))
    return { state: { ...S }, reply: 'To start fresh, use the New Design button in the header.', intent: 'reset-hint' }

  if (/\b(random|surprise me|generate random)\b/.test(t)) {
    const idx = Math.floor(Math.random() * PRESETS.length)
    return {
      state: { ...S, sett: PRESETS[idx].sett.map(s => ({ ...s })), activePreset: idx },
      reply: `Random design: "${PRESETS[idx].name}" — ${PRESETS[idx].sett.reduce((a,s)=>a+s.n,0)} threads/repeat.`,
      intent: 'random: ' + PRESETS[idx].name
    }
  }

  if (/\b(save|save this|save design)\b/.test(t))
    return { state: S, reply: 'Use the Save button in the sidebar to save your design.', intent: 'save-hint' }

  // ─── 1. PRESETS ────────────────────────────────────────────────────────────
  const presetKeys = [
    { keys: ['royal stewart'],                  i: 0  },
    { keys: ['black watch'],                    i: 1  },
    { keys: ['burberry','heritage camel'],       i: 2  },
    { keys: ['macgregor'],                      i: 3  },
    { keys: ['dress stewart'],                  i: 4  },
    { keys: ['hunting stewart','hunting'],      i: 5  },
    { keys: ['pastel plaid','pastel rainbow'],   i: 6  },
    { keys: ['bold navy'],                      i: 7  },
    // New textile niche presets (indices 8–11)
    { keys: ['school uniform','school'],        i: 8  },
    { keys: ['classic shirting','shirting','shirt check'], i: 9  },
    { keys: ['heritage suiting','suiting'],     i: 10 },
    { keys: ['home linen','home textile','linen'], i: 11 },
  ]
  for (const { keys, i } of presetKeys)
    if (PRESETS[i] && keys.some(k => t.includes(k)))
      return {
        state: { ...S, sett: PRESETS[i].sett.map(s => ({ ...s })), activePreset: i },
        reply: `"${PRESETS[i].name}" loaded — ${PRESETS[i].sett.reduce((a,s)=>a+s.n,0)} threads/repeat.`,
        intent: 'preset: ' + PRESETS[i].name
      }

  // ─── 2. WEAVE ──────────────────────────────────────────────────────────────
  if (t.includes('plain weave') || (t.includes('plain') && !t.includes('plaid')))
    return { state: { ...S, weave: 'plain' },   reply: 'Switched to plain weave.',  intent: 'weave → plain'   }
  if (t.includes('satin'))
    return { state: { ...S, weave: 'satin5' },  reply: '5-end satin.',              intent: 'weave → satin5'  }
  if (t.includes('hopsack'))
    return { state: { ...S, weave: 'hopsack' }, reply: 'Hopsack weave.',            intent: 'weave → hopsack' }
  if (t.includes('basket'))
    return { state: { ...S, weave: 'basket2' }, reply: 'Basket weave.',             intent: 'weave → basket2' }
  if (t.includes('3/1') || t.includes('twill31'))
    return { state: { ...S, weave: 'twill31' }, reply: '3/1 twill.',                intent: 'weave → twill31' }
  if (t.includes('2/1') || t.includes('twill21'))
    return { state: { ...S, weave: 'twill21' }, reply: '2/1 twill.',                intent: 'weave → twill21' }
  if (t.includes('twill') || t.includes('2/2'))
    return { state: { ...S, weave: 'twill22' }, reply: '2/2 twill.',                intent: 'weave → twill22' }

  // ─── 3. THREAD SIZE ────────────────────────────────────────────────────────
  if (t.includes('very fine') || t.includes('micro'))
    return { state: { ...S, ts: 4 }, reply: 'Very fine → 4px.', intent: 'thread → 4px' }
  if (t.includes('finer') || t.includes('smaller') || (t.includes('fine') && !t.includes('refine'))) {
    const ts = clamp(S.ts - 2, 4, 22)
    return { state: { ...S, ts }, reply: `Finer → ${ts}px.`, intent: `thread → ${ts}px` }
  }
  if (t.includes('bolder') || t.includes('coarser') || t.includes('thicker') || t.includes('bigger')) {
    const ts = clamp(S.ts + 2, 4, 22)
    return { state: { ...S, ts }, reply: `Bolder → ${ts}px.`, intent: `thread → ${ts}px` }
  }
  if (t.includes('zoom in'))  { const ts = clamp(S.ts+3,4,22); return { state:{...S,ts}, reply:`Zoomed in → ${ts}px.`,  intent:'zoom in'  } }
  if (t.includes('zoom out')) { const ts = clamp(S.ts-3,4,22); return { state:{...S,ts}, reply:`Zoomed out → ${ts}px.`, intent:'zoom out' } }

  // ─── 4. REPEATS ────────────────────────────────────────────────────────────
  if (/\b(more repeat|tile more)\b/.test(t)) {
    const reps = clamp(S.reps + 1, 1, 12)
    return { state: { ...S, reps }, reply: `Repeats → ${reps}×.`, intent: `repeats → ${reps}` }
  }
  if (/\b(fewer repeat|less repeat)\b/.test(t)) {
    const reps = clamp(S.reps - 1, 1, 12)
    return { state: { ...S, reps }, reply: `Repeats → ${reps}×.`, intent: `repeats → ${reps}` }
  }
  const numRep = t.match(/(\d+)\s*(?:repeat|rep|x)/i)
  if (numRep) {
    const reps = clamp(+numRep[1], 1, 12)
    return { state: { ...S, reps }, reply: `Repeats → ${reps}×.`, intent: `repeats → ${reps}` }
  }

  // ─── 5. SETT MODIFIERS ─────────────────────────────────────────────────────
  if (/\b(invert|reverse)\b/.test(t))
    return { state: { ...S, sett: [...S.sett].reverse(), activePreset: -1 }, reply: 'Sett reversed.', intent: 'invert' }
  if (/\b(symmetric|mirror)\b/.test(t)) {
    const half = [...S.sett]
    const mirrored = [...half, ...[...half].reverse().slice(1)]
    return { state: { ...S, sett: mirrored, activePreset: -1 }, reply: 'Sett mirrored symmetrically.', intent: 'symmetric' }
  }
  if (t.includes('double stripe'))
    return { state: { ...S, sett: S.sett.map(s => ({ ...s, n: clamp(s.n * 2, 1, 32) })), activePreset: -1 }, reply: 'Stripes doubled.', intent: 'double' }
  if (t.includes('half stripe') || t.includes('narrow stripe'))
    return { state: { ...S, sett: S.sett.map(s => ({ ...s, n: clamp(Math.round(s.n / 2), 1, 32) })), activePreset: -1 }, reply: 'Stripes halved.', intent: 'halve' }

  // ─── 6. TONE ADJUSTMENTS (new) ─────────────────────────────────────────────
  if (/\b(darker|make it darker)\b/.test(t)) {
    return {
      state: { ...S, sett: shiftLightness(S.sett, -15), activePreset: -1 },
      reply: 'Shifted palette darker.',
      intent: 'tone: darker'
    }
  }
  if (/\b(lighter|make it lighter|brighter)\b/.test(t)) {
    return {
      state: { ...S, sett: shiftLightness(S.sett, +15), activePreset: -1 },
      reply: 'Shifted palette lighter.',
      intent: 'tone: lighter'
    }
  }
  if (/\b(more contrast|bolder colors)\b/.test(t)) {
    // Push each color away from mid-grey in lightness
    const adjusted = S.sett.map(s => {
      const r = h2r(s.c)
      const lum = (r.r * 0.299 + r.g * 0.587 + r.b * 0.114) / 255
      const push = lum > 0.5 ? +20 : -20
      const r2 = clamp(Math.round(r.r + push * 2.55), 0, 255)
      const g2 = clamp(Math.round(r.g + push * 2.55), 0, 255)
      const b2 = clamp(Math.round(r.b + push * 2.55), 0, 255)
      return { ...s, c: hexFromRgb({ r: r2, g: g2, b: b2 }) }
    })
    return { state: { ...S, sett: adjusted, activePreset: -1 }, reply: 'Increased color contrast.', intent: 'tone: contrast' }
  }
  if (/\b(muted|desaturate|softer colors)\b/.test(t)) {
    const adjusted = S.sett.map(s => {
      const r = h2r(s.c)
      const grey = Math.round(r.r * 0.3 + r.g * 0.59 + r.b * 0.11)
      const r2 = Math.round(r.r * 0.6 + grey * 0.4)
      const g2 = Math.round(r.g * 0.6 + grey * 0.4)
      const b2 = Math.round(r.b * 0.6 + grey * 0.4)
      return { ...s, c: hexFromRgb({ r: r2, g: g2, b: b2 }) }
    })
    return { state: { ...S, sett: adjusted, activePreset: -1 }, reply: 'Palette muted and desaturated.', intent: 'tone: muted' }
  }

  // ─── 7. COLOR PARSING (2+ colors) ──────────────────────────────────────────
  const colors = parseColors(t)
  if (colors.length >= 2) {
    const base = t.includes('bold') ? 12 : 8
    const acc  = t.includes('bold') ? 5  : 3
    const newSett = colors.map((c, i) => ({ c, n: i === 0 ? base * 2 : i === 1 ? base : acc }))
    const hasDark = colors.some(c => { const r = h2r(c); return r.r + r.g + r.b < 180 })
    if (!hasDark && colors.length < 5) newSett.push({ c: '#111111', n: 2 })
    const names = colors.map(hex => Object.keys(RAW_COLORS).find(k => RAW_COLORS[k] === hex) || hex).join(', ')
    return { state: { ...S, sett: newSett, activePreset: -1 }, reply: `Built sett: ${names}.`, intent: `colors: ${names}` }
  }

  // ─── 8. COLOR TINTING (1 color) ────────────────────────────────────────────
  if (colors.length === 1) {
    const target = h2r(colors[0])
    const newSett = S.sett.map((s, i) => ({ ...s, c: hexFromRgb(blend(target, h2r(s.c), i === 0 ? 0.8 : 0.35)) }))
    const name = Object.keys(RAW_COLORS).find(k => RAW_COLORS[k] === colors[0]) || colors[0]
    return { state: { ...S, sett: newSett, activePreset: -1 }, reply: `Applied ${name} tone.`, intent: `tint: ${name}` }
  }

  // ─── 9. FALLBACK ───────────────────────────────────────────────────────────
  return {
    state: S,
    reply: 'Try: "red and navy plaid", "Black Watch", "make it finer", "plain weave", "more repeats", "darker", "surprise me".',
    intent: 'no match'
  }
}
