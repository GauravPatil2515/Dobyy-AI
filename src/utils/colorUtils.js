export const h2r = hex => {
  const n = parseInt(hex.replace('#','').padEnd(6,'0'), 16)
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 }
}
export const blend = (a, b, t) => ({
  r: Math.round(a.r*t + b.r*(1-t)),
  g: Math.round(a.g*t + b.g*(1-t)),
  b: Math.round(a.b*t + b.b*(1-t)),
})
export const toRgba = (c, a=1) => `rgba(${c.r},${c.g},${c.b},${a})`
export const lighter = (c, v) => ({ r:Math.min(255,c.r+v), g:Math.min(255,c.g+v), b:Math.min(255,c.b+v) })
export const darker  = (c, v) => ({ r:Math.max(0,c.r-v),  g:Math.max(0,c.g-v),  b:Math.max(0,c.b-v)  })
export const hexFromRgb = c => '#' + [c.r,c.g,c.b].map(v=>v.toString(16).padStart(2,'0')).join('')
