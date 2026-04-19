export function encodeState(state) {
  const slim = {
    s: state.sett.map(s => ({ c: s.c.replace('#',''), n: s.n })),
    w: state.weave,
    t: state.ts,
    r: state.reps,
  }
  return btoa(JSON.stringify(slim))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function decodeState(encoded) {
  try {
    const padded = encoded + '==='.slice((encoded.length + 3) % 4)
    const str = padded.replace(/-/g,'+').replace(/_/g,'/')
    const slim = JSON.parse(atob(str))
    return {
      sett:  slim.s.map(s => ({ c: '#' + s.c, n: s.n })),
      weave: slim.w,
      ts:    slim.t,
      reps:  slim.r,
    }
  } catch {
    return null
  }
}

export async function copyShareLink(state) {
  const code   = encodeState(state)
  const url    = `${window.location.origin}${window.location.pathname}?d=${code}`
  await navigator.clipboard.writeText(url)
  return url
}
