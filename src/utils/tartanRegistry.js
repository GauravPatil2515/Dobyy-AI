// Scottish Tartans Authority register (free, no auth needed)
const BASE = 'https://www.tartanregister.gov.uk/json'

export async function searchTartans(query) {
  if (!query || query.length < 2) return []
  try {
    const res  = await fetch(`${BASE}/search?term=${encodeURIComponent(query)}`)
    const data = await res.json()
    return (data.items || []).slice(0, 8).map(t => ({
      id:     t.uniqueRef,
      name:   t.name,
      sett:   t.threadcount || '',
      palette: t.palette    || '',
    }))
  } catch {
    return []
  }
}

export function parseTartanSett(threadcount, palette) {
  // threadcount format: "R6 B4 G2 R6" — alternating color code + count
  // palette format: "R=#cc1122;B=#003399;G=#005522"
  if (!threadcount || !palette) return null

  const colorMap = {}
  palette.split(';').forEach(p => {
    const [k, v] = p.split('=')
    if (k && v) colorMap[k.trim()] = v.trim()
  })

  const tokens = threadcount.trim().split(/\s+/)
  const sett = []

  tokens.forEach(token => {
    const match = token.match(/^([A-Z]+)(\d+)$/)
    if (!match) return
    const [, code, n] = match
    if (colorMap[code]) {
      // Merge adjacent same-color tokens
      const last = sett[sett.length - 1]
      if (last && last.c === colorMap[code]) {
        last.n += parseInt(n)
      } else {
        sett.push({ c: colorMap[code], n: parseInt(n) })
      }
    }
  })

  return sett.length >= 2 ? sett : null
}
