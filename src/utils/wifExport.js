// wifExport — generates a valid WIF 1.1 file from FabricState.
// WIF (Weaving Information File) is the industry-standard loom interchange format.
import { expandSett, wifTieup, shaftCount } from './weaveUtils.js'
import { nearestPantone } from './pantoneData.js'

const WEAVE_LABELS = {
  twill22: '2/2 Twill', twill21: '2/1 Twill',
  plain:   'Plain Weave', satin5: '5-End Satin',
  twill31: '3/1 Twill', basket2: 'Basket Weave',
  hopsack: 'Hopsack',
}

/**
 * Generate a WIF 1.1 string from FabricState.
 * @param {import('../domain/fabricTypes.js').FabricState} state
 * @returns {string} WIF file content
 */
export function generateWIF(state) {
  const threads    = expandSett(state.sett)
  const numThreads = threads.length
  const numShafts  = shaftCount(state.weave)
  const tieupLines = wifTieup(state.weave)
  const date       = new Date().toISOString().slice(0, 10)
  const label      = WEAVE_LABELS[state.weave] || state.weave

  // ---- [WIF] header ----
  const wif = []
  wif.push('[WIF]')
  wif.push('Version=1.1')
  wif.push(`Date=${date}`)
  wif.push('Developers=Dobby Studio AI (dobby.studio)')
  wif.push('Source Program=Dobby Studio')
  wif.push('Source Version=2.0')
  wif.push('')

  // ---- [CONTENTS] ----
  wif.push('[CONTENTS]')
  wif.push('COLOR PALETTE=true')
  wif.push('WARP SYMBOL PALETTE=false')
  wif.push('WEFT SYMBOL PALETTE=false')
  wif.push('COLOR TABLE=true')
  wif.push('WARP=true')
  wif.push('WEFT=true')
  wif.push('THREADING=true')
  wif.push('TIEUP=true')
  wif.push('TREADLING=true')
  wif.push('LIFTPLAN=false')
  wif.push('')

  // ---- [COLOR PALETTE] ----
  const uniqueColors = [...new Set(threads)]
  wif.push('[COLOR PALETTE]')
  wif.push(`Entries=${uniqueColors.length}`)
  wif.push('Form=RGB')
  wif.push('Range=0,255')
  wif.push('')

  // ---- [COLOR TABLE] ----
  wif.push('[COLOR TABLE]')
  uniqueColors.forEach((hex, idx) => {
    const r = parseInt(hex.slice(1,3), 16)
    const g = parseInt(hex.slice(3,5), 16)
    const b = parseInt(hex.slice(5,7), 16)
    const pt = nearestPantone(hex)
    wif.push(`${idx + 1}=${r},${g},${b}\t; ${pt.code} ${pt.name}`)
  })
  wif.push('')

  // ---- [WEAVING STYLE] ----
  wif.push('[WEAVING STYLE]')
  wif.push(`Weave=Balanced`)
  wif.push(`Weave Structure=${label}`)
  wif.push('')

  // ---- [WARP] ----
  wif.push('[WARP]')
  wif.push(`Threads=${numThreads}`)
  wif.push(`Shafts=${numShafts}`)
  wif.push(`Treadles=${numShafts}`)
  wif.push('Units=Centimeters')
  wif.push('Sett=24')
  wif.push('Spacing=24')
  wif.push('Thickness=0.04')
  wif.push('Color=1')
  wif.push('')

  // ---- [WEFT] ----
  wif.push('[WEFT]')
  wif.push(`Threads=${numThreads}`)
  wif.push('Units=Centimeters')
  wif.push('Sett=24')
  wif.push('Spacing=24')
  wif.push('Thickness=0.04')
  wif.push('Color=1')
  wif.push('')

  // ---- [THREADING] ----
  // Assign each warp thread to a shaft via standard threading draft
  wif.push('[THREADING]')
  threads.forEach((color, i) => {
    // Standard sequential threading: shaft cycles 1..numShafts
    const shaft = (i % numShafts) + 1
    wif.push(`${i + 1}=${shaft}`)
  })
  wif.push('')

  // ---- [TIEUP] ----
  wif.push('[TIEUP]')
  tieupLines.forEach(line => wif.push(line))
  wif.push('')

  // ---- [TREADLING] ----
  // Standard treadling: each weft row cycles treadles 1..numShafts
  wif.push('[TREADLING]')
  threads.forEach((_, i) => {
    const treadle = (i % numShafts) + 1
    wif.push(`${i + 1}=${treadle}`)
  })
  wif.push('')

  // ---- [WARP COLOR] ----
  wif.push('[WARP COLOR]')
  threads.forEach((color, i) => {
    const idx = uniqueColors.indexOf(color) + 1
    wif.push(`${i + 1}=${idx}`)
  })
  wif.push('')

  // ---- [WEFT COLOR] ----
  // For balanced (symmetrical) tartan, weft mirrors warp
  wif.push('[WEFT COLOR]')
  threads.forEach((color, i) => {
    const idx = uniqueColors.indexOf(color) + 1
    wif.push(`${i + 1}=${idx}`)
  })
  wif.push('')

  return wif.join('\r\n')
}
