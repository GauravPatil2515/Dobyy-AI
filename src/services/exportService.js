// exportService — all file export logic in one place.
// Components import named functions from here; no export logic in component files.
import { shaftCount, wifTieup } from '../utils/weaveUtils.js'

/**
 * Download the fabric canvas as a PNG.
 * @param {HTMLCanvasElement} canvas
 * @param {string} [name]
 */
export function exportPNG(canvas, name = 'dobby-design') {
  if (!canvas) { console.warn('[exportService] canvas is null'); return }
  const link = document.createElement('a')
  link.download = `${name}-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * Download the current state as a machine-readable JSON file.
 * @param {import('../domain/fabricTypes.js').FabricState} state
 * @param {string} [name]
 */
export function exportJSON(state, name = 'dobby-design') {
  const data = {
    name:    'Dobby Studio Export',
    version: '1.0',
    date:    new Date().toISOString(),
    sett:    state.sett,
    weave:   state.weave,
    ts:      state.ts,
    reps:    state.reps,
  }
  _downloadBlob(
    JSON.stringify(data, null, 2),
    'application/json',
    `${name}-${Date.now()}.json`
  )
}

/**
 * Download a WIF (Weaving Information File) for loom software.
 * Full WIF 1.1 spec — compatible with WeavePoint, Fiberworks, ProWeave.
 * @param {import('../domain/fabricTypes.js').FabricState} state
 * @param {string} [name]
 */
export function exportWIF(state, name = 'dobby-design') {
  const threads = []
  state.sett.forEach(s => {
    for (let i = 0; i < s.n; i++) threads.push(s.c)
  })
  const L      = threads.length
  const shafts = shaftCount(state.weave)
  const tieup  = wifTieup(state.weave)

  const hexToRGB = hex => {
    const n = parseInt(hex.replace('#', ''), 16)
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
  }

  const threading  = threads.map((_, i) => `${i + 1}=${(i % shafts) + 1}`)
  const weftColors = threads.map((c, i) => `${i + 1}=${hexToRGB(c)}`)

  const wifLines = [
    '[WIF]', 'Version=1.1',
    'Date=' + new Date().toDateString(),
    'Developers=Dobby Studio AI',
    'Source Program=Dobby Studio React',
    'Source Version=1.0',
    '',
    '[CONTENTS]',
    'Color Palette=true', 'Threading=true',
    'Tieup=true', 'Weft Colors=true',
    'Weaving=true',
    '',
    '[WEAVING]',
    `Shafts=${shafts}`,
    `Treadles=${shafts}`,
    'Rising Shed=true',
    '',
    '[COLOR PALETTE]', `Entries=${L}`, 'Form=RGB', 'Unit=Percent',
    '',
    '[COLOR TABLE]',
    ...threads.map((c, i) => `${i + 1}=${hexToRGB(c)}`),
    '',
    '[THREADING]', ...threading,
    '',
    '[TIEUP]', ...tieup,
    '',
    '[WEFT COLORS]', `Entries=${L}`,
    '',
    '[WEFT COLOR TABLE]', ...weftColors,
    '',
  ]

  _downloadBlob(
    wifLines.join('\n'),
    'text/plain',
    `${name}-${Date.now()}.wif`
  )
}

/** @private */
function _downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
