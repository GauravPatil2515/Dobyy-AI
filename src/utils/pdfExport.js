import { nearestPantone } from './pantoneData.js'
import { shaftCount } from './weaveUtils.js'

const WEAVE_LABELS = {
  twill22: '2/2 Twill',  twill21: '2/1 Twill',
  plain:   'Plain Weave', satin5:  '5-End Satin',
  twill31: '3/1 Twill',  basket2: 'Basket Weave',
  hopsack: 'Hopsack'
}

/**
 * Generates a professional PDF tech sheet for mill / buyer submission.
 * Uses browser's native Canvas + window.print() trick — no external PDF lib needed.
 * Opens a styled print window that maps perfectly to A4.
 *
 * @param {object} state  - fabric state (sett, weave, ts, reps)
 * @param {HTMLCanvasElement|null} fabricCanvas - the live fabric canvas (for PNG thumbnail)
 */
export function exportPDFTechSheet(state, fabricCanvas) {
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  const refNo = `DS-${Date.now().toString(36).toUpperCase().slice(-6)}`
  const totalThreads = state.sett.reduce((a, s) => a + s.n, 0)
  const shafts = shaftCount(state.weave)
  const weaveName = WEAVE_LABELS[state.weave] || state.weave

  // Get thumbnail from the live canvas (or blank)
  const thumbnail = fabricCanvas ? fabricCanvas.toDataURL('image/png') : ''

  // Build Pantone row for each stripe
  const stripeRows = state.sett.map((s, i) => {
    const ptone = nearestPantone(s.c)
    return `
      <tr>
        <td>${i + 1}</td>
        <td>
          <span class="swatch" style="background:${s.c}"></span>
          <code>${s.c.toUpperCase()}</code>
        </td>
        <td>${s.n} threads</td>
        <td>${Math.round((s.n / totalThreads) * 100)}%</td>
        <td><strong>${ptone.code}</strong> ${ptone.name}</td>
        <td>
          <span class="swatch" style="background:${ptone.pantoneHex};border:1px solid #bbb"></span>
          <small>\u0394${ptone.delta}</small>
        </td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Dobby Studio — Tech Sheet ${refNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    background: #fff;
    padding: 32px 40px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .logo { font-size: 22px; font-weight: 700; letter-spacing: -1px; }
  .logo span { font-weight: 300; color: #555; }
  .meta { text-align: right; color: #555; line-height: 1.6; }
  .meta strong { color: #1a1a1a; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px;
       margin: 20px 0 8px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .spec-table { width: 100%; border-collapse: collapse; }
  .spec-table td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  .spec-table td:first-child { color: #666; width: 40%; }
  .spec-table td:last-child { font-weight: 600; }
  .stripe-table { width: 100%; border-collapse: collapse; }
  .stripe-table th {
    background: #1a1a1a; color: #fff;
    padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .stripe-table td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: middle; }
  .stripe-table tr:hover { background: #f9f9f9; }
  .swatch {
    display: inline-block; width: 16px; height: 16px;
    border-radius: 3px; vertical-align: middle; margin-right: 6px;
    border: 1px solid rgba(0,0,0,.15);
  }
  code { font-family: monospace; font-size: 10px; color: #444; }
  .thumbnail { float: right; margin-left: 16px; }
  .thumbnail img { width: 140px; height: 140px; object-fit: cover;
                   border: 1px solid #ccc; border-radius: 4px; }
  .footer {
    margin-top: 24px; padding-top: 10px;
    border-top: 1px solid #ddd;
    color: #aaa; font-size: 9px;
    display: flex; justify-content: space-between;
  }
  @media print {
    body { padding: 20px 24px; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 10mm; }
  }
  .print-btn {
    display: block; margin: 0 auto 24px;
    padding: 10px 28px; background: #1a1a1a; color: #fff;
    border: none; border-radius: 6px; font-size: 13px;
    cursor: pointer; font-family: inherit;
  }
</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">\uD83D\uDDA8\uFE0F Print / Save as PDF</button>

<div class="header">
  <div>
    <div class="logo">Dobby<span> Studio</span></div>
    <div style="color:#888;margin-top:2px;font-size:10px;">AI Fabric Design • dobby.studio</div>
  </div>
  <div class="meta">
    <div>Tech Sheet</div>
    <div><strong>Ref: ${refNo}</strong></div>
    <div>Date: ${date}</div>
  </div>
</div>

<div class="grid">
  <div>
    <h2>Fabric Specification</h2>
    <table class="spec-table">
      <tr><td>Weave Structure</td><td>${weaveName}</td></tr>
      <tr><td>Shafts Required</td><td>${shafts}</td></tr>
      <tr><td>Total Warp Threads</td><td>${totalThreads} / repeat</td></tr>
      <tr><td>Stripe Count</td><td>${state.sett.length} colors</td></tr>
      <tr><td>Thread Size</td><td>${state.ts}px (visual)</td></tr>
      <tr><td>Repeat Count</td><td>${state.reps}×</td></tr>
      <tr><td>Generated By</td><td>Dobby Studio AI</td></tr>
    </table>
  </div>
  <div style="text-align:right">
    ${thumbnail ? `<img src="${thumbnail}" style="width:140px;height:140px;object-fit:cover;border:1px solid #ccc;border-radius:4px;"/>` : '<div style="width:140px;height:140px;border:1px dashed #ccc;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;color:#bbb;font-size:10px;">Preview<br>unavailable</div>'}
  </div>
</div>

<h2>Color Specification — Warp Sett</h2>
<table class="stripe-table">
  <thead>
    <tr>
      <th>#</th>
      <th>Hex Color</th>
      <th>Threads</th>
      <th>% of Repeat</th>
      <th>Nearest Pantone TCX</th>
      <th>Match Quality</th>
    </tr>
  </thead>
  <tbody>
    ${stripeRows}
  </tbody>
</table>

<div class="footer">
  <span>Generated by Dobby Studio · AI-Powered Textile Design · dobby.studio</span>
  <span>Ref: ${refNo} · Pantone® matches are nearest approximations only</span>
</div>

</body>
</html>`

  const win = window.open('', '_blank', 'width=860,height=1080')
  if (!win) {
    alert('Please allow popups for Dobby Studio to generate PDF tech sheets.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
}
