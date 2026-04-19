import { COLOR_MAP, RAW_COLORS } from '../data/colors.js'
import { PRESETS } from '../data/presets.js'
import { h2r, blend, hexFromRgb } from './colorUtils.js'

function parseColors(text) {
  const found = [], t = text.toLowerCase()
  for(const [name, hex] of Object.entries(COLOR_MAP))
    if(t.includes(name) && !found.includes(hex)) found.push(hex)
  return found
}

export function nlp(text, state) {
  const t = text.toLowerCase().trim()
  const S = { ...state, sett: state.sett.map(s => ({...s})) }

  // 1. PRESETS
  const presetKeys = [
    {keys:['royal stewart'], i:0}, {keys:['black watch'], i:1},
    {keys:['burberry','heritage camel'], i:2}, {keys:['macgregor'], i:3},
    {keys:['dress stewart'], i:4}, {keys:['hunting stewart','hunting'], i:5},
    {keys:['pastel plaid','pastel rainbow'], i:6}, {keys:['bold navy'], i:7},
  ]
  for(const {keys,i} of presetKeys)
    if(keys.some(k => t.includes(k)))
      return {
        state: { ...S, sett: PRESETS[i].sett.map(s=>({...s})), activePreset: i },
        reply: `"${PRESETS[i].name}" loaded — ${PRESETS[i].sett.reduce((a,s)=>a+s.n,0)} threads/repeat.`,
        intent: 'preset: ' + PRESETS[i].name
      }

  // 2. WEAVE
  if(t.includes('plain weave') || (t.includes('plain') && !t.includes('plaid')))
    return { state:{...S,weave:'plain'}, reply:'Switched to plain weave.', intent:'weave → plain' }
  if(t.includes('satin'))
    return { state:{...S,weave:'satin5'}, reply:'5-end satin.', intent:'weave → satin5' }
  if(t.includes('2/1') || t.includes('twill21'))
    return { state:{...S,weave:'twill21'}, reply:'2/1 twill.', intent:'weave → twill21' }
  if(t.includes('twill') || t.includes('2/2'))
    return { state:{...S,weave:'twill22'}, reply:'2/2 twill.', intent:'weave → twill22' }

  // 3. THREAD SIZE
  if(t.includes('very fine') || t.includes('micro'))
    return { state:{...S,ts:4}, reply:'Very fine → 4px.', intent:'thread → 4px' }
  if(t.includes('finer') || t.includes('smaller') || (t.includes('fine') && !t.includes('refine'))) {
    const ts = Math.max(4, S.ts-2)
    return { state:{...S,ts}, reply:`Finer → ${ts}px.`, intent:`thread → ${ts}px` }
  }
  if(t.includes('bolder') || t.includes('coarser') || t.includes('thicker') || t.includes('bigger')) {
    const ts = Math.min(22, S.ts+2)
    return { state:{...S,ts}, reply:`Bolder → ${ts}px.`, intent:`thread → ${ts}px` }
  }
  if(t.includes('zoom in'))  { const ts=Math.min(22,S.ts+3); return {state:{...S,ts},reply:`Zoomed in → ${ts}px.`,intent:'zoom'} }
  if(t.includes('zoom out')) { const ts=Math.max(4,S.ts-3);  return {state:{...S,ts},reply:`Zoomed out → ${ts}px.`,intent:'zoom'} }

  // 4. REPEATS
  if(t.includes('more repeat') || t.includes('tile more')) {
    const reps=Math.min(6,S.reps+1); return {state:{...S,reps},reply:`Repeats → ${reps}×.`,intent:`repeats → ${reps}`}
  }
  if(t.includes('fewer repeat') || t.includes('less repeat')) {
    const reps=Math.max(1,S.reps-1); return {state:{...S,reps},reply:`Repeats → ${reps}×.`,intent:`repeats → ${reps}`}
  }
  const numRep = t.match(/(\d+)\s*(?:repeat|rep|x)/i)
  if(numRep) {
    const reps=Math.max(1,Math.min(6,+numRep[1]))
    return {state:{...S,reps},reply:`Repeats → ${reps}×.`,intent:`repeats → ${reps}`}
  }

  // 5. SETT MODIFIERS
  if(t.includes('invert') || t.includes('reverse'))
    return {state:{...S,sett:[...S.sett].reverse(),activePreset:-1},reply:'Sett reversed.',intent:'invert'}
  if(t.includes('double stripe'))
    return {state:{...S,sett:S.sett.map(s=>({...s,n:Math.min(32,s.n*2)})),activePreset:-1},reply:'Stripes doubled.',intent:'double'}
  if(t.includes('half stripe') || t.includes('narrow stripe'))
    return {state:{...S,sett:S.sett.map(s=>({...s,n:Math.max(1,Math.round(s.n/2))})),activePreset:-1},reply:'Stripes halved.',intent:'halve'}

  // 6. COLOR PARSING (2+ colors)
  const colors = parseColors(t)
  if(colors.length >= 2) {
    const base = t.includes('bold') ? 12 : 8
    const acc  = t.includes('bold') ? 5  : 3
    const newSett = colors.map((c,i) => ({c, n: i===0 ? base*2 : i===1 ? base : acc}))
    const hasDark = colors.some(c => { const r=h2r(c); return r.r+r.g+r.b < 180 })
    if(!hasDark && colors.length < 5) newSett.push({c:'#111111', n:2})
    const names = colors.map(hex => Object.keys(RAW_COLORS).find(k=>RAW_COLORS[k]===hex)||hex).join(', ')
    return {state:{...S,sett:newSett,activePreset:-1},reply:`Built sett: ${names}.`,intent:`colors: ${names}`}
  }

  // 7. COLOR TINTING (1 color)
  if(colors.length === 1) {
    const target = h2r(colors[0])
    const newSett = S.sett.map((s,i) => ({...s, c: hexFromRgb(blend(target, h2r(s.c), i===0?0.8:0.35))}))
    const name = Object.keys(RAW_COLORS).find(k=>RAW_COLORS[k]===colors[0]) || colors[0]
    return {state:{...S,sett:newSett,activePreset:-1},reply:`Applied ${name} tone.`,intent:`tint: ${name}`}
  }

  // 8. FALLBACK
  return {
    state: S,
    reply: 'Try: "red and navy plaid", "Black Watch", "make it finer", "plain weave", "more repeats".',
    intent: 'no match'
  }
}
