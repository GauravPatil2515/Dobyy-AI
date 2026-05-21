// exportService — single entry point for all export formats.
// Components import only this; never import pdfExport / wifExport directly.
import { exportPDFTechSheet }  from '../utils/pdfExport.js'
import { generateWIF }         from '../utils/wifExport.js'

/**
 * Export the canvas as a PNG download.
 * @param {HTMLCanvasElement} canvas
 * @param {string} [name]
 */
export function exportPNG(canvas, name = 'dobby-design') {
  if (!canvas) { alert('Canvas not ready — try again in a moment.'); return }
  try {
    const link = document.createElement('a')
    link.download = `${name}.png`
    link.href     = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('[exportService] PNG error:', err)
    alert('PNG export failed: ' + err.message)
  }
}

/**
 * Export state as a JSON file download.
 * @param {import('../domain/fabricTypes.js').FabricState} state
 * @param {string} [name]
 */
export function exportJSON(state, name = 'dobby-design') {
  try {
    const payload = JSON.stringify({
      _v:   2,
      sett: state.sett,
      weave: state.weave,
      ts:    state.ts,
      reps:  state.reps,
      exportedAt: new Date().toISOString(),
    }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const link = document.createElement('a')
    link.download = `${name}.json`
    link.href     = URL.createObjectURL(blob)
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 60_000)
  } catch (err) {
    console.error('[exportService] JSON error:', err)
    alert('JSON export failed: ' + err.message)
  }
}

/**
 * Export WIF 1.1 file for loom-compatible CAD software.
 * @param {import('../domain/fabricTypes.js').FabricState} state
 * @param {string} [name]
 */
export function exportWIF(state, name = 'dobby-design') {
  try {
    const wif  = generateWIF(state)
    const blob = new Blob([wif], { type: 'text/plain' })
    const link = document.createElement('a')
    link.download = `${name}.wif`
    link.href     = URL.createObjectURL(blob)
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 60_000)
  } catch (err) {
    console.error('[exportService] WIF error:', err)
    alert('WIF export failed: ' + err.message)
  }
}

/**
 * Export PDF tech sheet (opens print window).
 * @param {import('../domain/fabricTypes.js').FabricState} state
 * @param {HTMLCanvasElement|null} canvas
 */
export function exportPDF(state, canvas) {
  try {
    exportPDFTechSheet(state, canvas)
  } catch (err) {
    console.error('[exportService] PDF error:', err)
    alert('PDF export failed: ' + err.message)
  }
}
