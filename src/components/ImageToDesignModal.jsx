import { useState, useRef, useEffect, useCallback } from 'react'
import { analyzeImageAdvanced, mergeNearColors } from '../utils/imageAnalyzer.js'
import { fileToBase64 } from '../utils/imageAnalyzer.js'
import { renderFabric } from '../hooks/useFabricRenderer.js'
import { expandSett, weaveMatrix } from '../utils/weaveUtils.js'
import { WEAVES, WEAVE_LABELS } from '../constants.js'

const HEX = /^#[0-9a-fA-F]{6}$/

// 6 AI style variations for Step 3.
const STYLE_VARIATIONS = [
  { key: 'darker',        label: 'Darker',        apply: s => darkenSett(s, 28) },
  { key: 'lighter',       label: 'Lighter',       apply: s => lightenSett(s, 28) },
  { key: 'saturated',     label: 'Saturated',     apply: s => saturateSett(s, 0.20) },
  { key: 'muted',         label: 'Muted',         apply: s => desaturateSett(s, 0.28) },
  { key: 'complementary', label: 'Complementary', apply: s => complementSett(s) },
  { key: 'analogous',     label: 'Analogous',     apply: s => analogousSett(s) },
]

function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 } }
function rgbToHex({r,g,b}) { return '#' + [r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('') }
function clamp(v) { return Math.max(0, Math.min(255, v)) }

function shiftChannel(v, d) { return clamp(v + d) }
function darkenSett(sett, d) {
  return sett.map(s => {
    const { r, g, b } = hexToRgb(s.c)
    return { ...s, c: rgbToHex({ r:shiftChannel(r,-d), g:shiftChannel(g,-d), b:shiftChannel(b,-d) }) }
  })
}
function lightenSett(sett, d) {
  return sett.map(s => {
    const { r, g, b } = hexToRgb(s.c)
    return { ...s, c: rgbToHex({ r:shiftChannel(r,d), g:shiftChannel(g,d), b:shiftChannel(b,d) }) }
  })
}
function saturateSett(sett, amt) {
  return sett.map(s => {
    const { r,g,b } = hexToRgb(s.c)
    const avg = (r+g+b)/3
    return { ...s, c: rgbToHex({ r:avg+(r-avg)*(1+amt), g:avg+(g-avg)*(1+amt), b:avg+(b-avg)*(1+amt) }) }
  })
}
function desaturateSett(sett, amt) {
  return sett.map(s => {
    const { r,g,b } = hexToRgb(s.c)
    const avg = (r+g+b)/3
    return { ...s, c: rgbToHex({ r:avg+(r-avg)*(1-amt), g:avg+(g-avg)*(1-amt), b:avg+(b-avg)*(1-amt) }) }
  })
}
function rotateHue({r,g,b}, deg) {
  const rd = deg * Math.PI / 180
  const y = 0.299*r + 0.587*g + 0.114*b
  const i = r - y, q = b - y
  const ni = i*Math.cos(rd) - q*Math.sin(rd)
  const nq = i*Math.sin(rd) + q*Math.cos(rd)
  return { r: clamp(y+ni+1.4075*nq), g: clamp(y-0.3451*ni-0.7169*nq), b: clamp(y-1.779*ni+0.3451*nq) }
}
function complementSett(sett) { return sett.map(s => ({ ...s, c: rgbToHex(rotateHue(hexToRgb(s.c), 180)) })) }
function analogousSett(sett)  {
  return sett.map((s, i) => ({ ...s, c: rgbToHex(rotateHue(hexToRgb(s.c), i % 2 === 0 ? 30 : -30)) }))
}

function MiniPreview({ sett, weave, ts = 8, reps = 2 }) {
  const ref = useRef(null)
  const threads = expandSett(sett)
  const tileSize = threads.length || 1
  const matrix = weaveMatrix(weave, tileSize)
  useEffect(() => {
    if (ref.current) renderFabric(ref.current, { sett, weave, ts, reps }, matrix, threads)
  }, [sett, weave, ts, reps, threads, matrix])
  return <canvas ref={ref} className="itd-mini-canvas" />
}

function sanitizeSett(sett) {
  return (sett || [])
    .filter(s => s && (HEX.test(s.c) || s.c == null))
    .map(s => ({ c: HEX.test(s.c) ? s.c.toLowerCase() : '#888888', n: Math.max(1, Math.min(32, Number(s.n) || 4)) }))
    .slice(0, 12)
}

export default function ImageToDesignModal({ imageDataUrl, base64, dispatch, onClose }) {
  const [step, setStep] = useState(1)
  const [analyzing, setAnalyzing] = useState(true)
  const [progress, setProgress] = useState({})
  const [result, setResult] = useState(null)
  const [draft, setDraft] = useState({ sett: [], weave: 'twill22', ts: 8, reps: 3 })
  const [styles, setStyles] = useState([])
  const [activeStyle, setActiveStyle] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!base64) { setError('No image data'); setAnalyzing(false); return }
      try {
        const res = await analyzeImageAdvanced(base64, (p) => { if (!cancelled) setProgress(p) })
        if (cancelled) return
        const merged = sanitizeSett(res.sett)
        const draftState = {
          sett: merged,
          weave: WEAVES.some(w => w.v === res.weave) ? res.weave : 'twill22',
          ts: 8,
          reps: 3,
        }
        setResult(res)
        setDraft(draftState)
        setStyles(STYLE_VARIATIONS.map(v => ({
          ...v,
          sett: sanitizeSett(v.apply(draftState.sett)),
        })))
      } catch (err) {
        console.error('[ImageToDesign] analysis error', err)
        if (!cancelled) { setError('Analysis failed'); }
      } finally {
        if (!cancelled) setAnalyzing(false)
      }
    })()
    return () => { cancelled = true }
  }, [base64])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const updateStripe = (idx, patch) =>
    setDraft(d => ({ ...d, sett: d.sett.map((s, i) => i === idx ? { ...s, ...patch } : s) }))
  const removeStripe = (idx) =>
    setDraft(d => ({ ...d, sett: d.sett.length > 1 ? d.sett.filter((_, i) => i !== idx) : d.sett }))
  const moveStripe = (idx, dir) =>
    setDraft(d => {
      const arr = [...d.sett]
      const j = idx + dir
      if (j < 0 || j >= arr.length) return d
      ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
      return { ...d, sett: arr }
    })

  const handleMerge = () => setDraft(d => ({ ...d, sett: mergeNearColors(d.sett, 48) }))

  const applyDesign = useCallback(() => {
    const finalSett = activeStyle != null ? styles[activeStyle].sett : draft.sett
    dispatch({
      type: 'APPLY',
      newState: {
        sett: finalSett,
        weave: draft.weave,
        ts: draft.ts,
        reps: draft.reps,
        activePreset: -1,
      }
    })
    onClose()
  }, [activeStyle, styles, draft, dispatch, onClose])

  const steps = [
    { n: 1, label: 'Analyze' },
    { n: 2, label: 'Refine' },
    { n: 3, label: 'Style' },
  ]

  return (
    <div className="modal-backdrop itd-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="itd-modal">
        <div className="itd-head">
          <h3 className="itd-title">📷 Image to Design</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>

        <div className="itd-steps">
          {steps.map((st, i) => (
            <div key={st.n} className={`itd-step${step === st.n ? ' active' : ''}${step > st.n ? ' done' : ''}`}>
              <span className="itd-step-num">{step > st.n ? '✓' : st.n}</span>
              <span className="itd-step-label">{st.label}</span>
              {i < steps.length - 1 && <span className="itd-step-bar" />}
            </div>
          ))}
        </div>

        <div className="itd-body">
          {/* Step 1 — Analyze */}
          {step === 1 && (
            <div className="itd-step1">
              <div className="itd-thumb">
                {imageDataUrl ? <img src={imageDataUrl} alt="source" /> : <div className="itd-thumb-empty">no image</div>}
              </div>
              {analyzing ? (
                <div className="itd-loading">
                  <div className="app-spinner" />
                  <p>{progress?.status === 'analyzing-colors' ? 'Extracting colors…' : 'Analyzing image…'}</p>
                  {progress?.message && <p className="itd-progress-msg">{progress.message}</p>}
                </div>
              ) : error ? (
                <div className="itd-error">{error}</div>
              ) : (
                <div className="itd-analyze-result">
                  <div className="itd-raw-stripes">
                    {result.sett.map((s, i) => (
                      <div key={i} style={{ flex: s.n, background: s.c }} />
                    ))}
                  </div>
                  <p className="itd-meta">
                    {result.description} · structure: <strong>{result.structure}</strong> · weave: <strong>{WEAVE_LABELS[result.weave]}</strong> · {result.confidence}% confidence
                  </p>
                  <button className="itd-btn-primary" onClick={() => setStep(2)}>Continue to Refine →</button>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Refine */}
          {step === 2 && (
            <div className="itd-step2">
              <div className="itd-refine-left">
                <div className="itd-refine-preview">
                  <MiniPreview sett={draft.sett} weave={draft.weave} ts={8} reps={2} />
                </div>
                <div className="itd-field">
                  <label>Weave</label>
                  <select value={draft.weave} onChange={e => setDraft(d => ({ ...d, weave: e.target.value }))}>
                    {WEAVES.map(w => <option key={w.v} value={w.v}>{w.l}</option>)}
                  </select>
                </div>
                <div className="itd-actions-row">
                  <button className="itd-btn-secondary" onClick={handleMerge}>Merge near colors</button>
                </div>
              </div>

              <div className="itd-refine-right">
                <div className="itd-stripes-head">Stripes</div>
                <div className="itd-stripes">
                  {draft.sett.map((s, i) => (
                    <div key={i} className="itd-stripe">
                      <input type="color" value={s.c} onChange={e => updateStripe(i, { c: e.target.value })} />
                      <input
                        type="number" min="1" max="32" value={s.n}
                        onChange={e => updateStripe(i, { n: Math.max(1, Math.min(32, Number(e.target.value) || 1)) })}
                      />
                      <span className="itd-t">t</span>
                      <div className="itd-stripe-move">
                        <button onClick={() => moveStripe(i, -1)} disabled={i === 0} title="Move left">◀</button>
                        <button onClick={() => moveStripe(i, 1)} disabled={i === draft.sett.length - 1} title="Move right">▶</button>
                        <button onClick={() => removeStripe(i)} title="Remove">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="itd-step-nav">
                <button className="itd-btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="itd-btn-primary" onClick={() => setStep(3)}>Continue to Style →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Style */}
          {step === 3 && (
            <div className="itd-step3">
              <p className="itd-step3-hint">Pick a style variation (optional) before applying:</p>
              <div className="itd-style-grid">
                <button
                  className={`itd-style-card${activeStyle === null ? ' selected' : ''}`}
                  onClick={() => setActiveStyle(null)}>
                  <div className="itd-style-preview">
                    <MiniPreview sett={draft.sett} weave={draft.weave} ts={8} reps={2} />
                  </div>
                  <div className="itd-style-label">Original</div>
                </button>
                {styles.map((st, i) => (
                  <button
                    key={st.key}
                    className={`itd-style-card${activeStyle === i ? ' selected' : ''}`}
                    onClick={() => setActiveStyle(i)}>
                    <div className="itd-style-preview">
                      <MiniPreview sett={st.sett} weave={draft.weave} ts={8} reps={2} />
                    </div>
                    <div className="itd-style-label">{st.label}</div>
                  </button>
                ))}
              </div>
              <div className="itd-step-nav">
                <button className="itd-btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="itd-btn-primary" onClick={applyDesign}>✓ Apply Design</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
