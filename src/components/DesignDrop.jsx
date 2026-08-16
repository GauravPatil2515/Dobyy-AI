import { useState, useEffect, useCallback } from 'react'
import { askGroq } from '../utils/groqClient.js'
import { h2r, lighter, darker, hexFromRgb } from '../utils/colorUtils.js'
import { t } from '../utils/i18n.js'

function generateLocalVariations(sett) {
  if (!sett || !sett.length) return []

  // 1. Midnight Dark
  const midnight = sett.map((s, i) => {
    const rgb = h2r(s.c)
    const darkRgb = darker(rgb, 45)
    return { c: hexFromRgb(darkRgb), n: i % 2 === 0 ? s.n + 2 : Math.max(2, s.n - 1) }
  })

  // 2. Pastel Soft
  const pastel = sett.map((s) => {
    const rgb = h2r(s.c)
    const lightRgb = lighter(rgb, 50)
    return { c: hexFromRgb(lightRgb), n: s.n }
  })

  // 3. High Contrast / Bold
  const bold = sett.map((s, i) => {
    const rgb = h2r(s.c)
    const extremeRgb = (rgb.r + rgb.g + rgb.b) / 3 > 128 ? lighter(rgb, 30) : darker(rgb, 30)
    return { c: hexFromRgb(extremeRgb), n: i % 2 === 0 ? Math.min(24, s.n * 2) : Math.max(2, Math.floor(s.n / 2)) }
  })

  // 4. Inverted Sequence
  const inverted = [...sett].reverse().map(s => ({ c: s.c, n: s.n }))

  // 5. Jewel Tones (Ruby, Sapphire, Emerald, Gold, Obsidian)
  const jewelColors = ['#990000', '#003399', '#006633', '#d97706', '#111111', '#4c1d95']
  const jewel = sett.map((s, i) => ({
    c: jewelColors[i % jewelColors.length],
    n: s.n
  }))

  // 6. Vintage Sepia / Earthy Tones
  const earthy = sett.map((s, i) => {
    const earthPalette = ['#2d241e', '#8c6d53', '#d9c5b2', '#4a3b32', '#c29b38', '#5c6b57']
    return { c: earthPalette[i % earthPalette.length], n: s.n }
  })

  return [
    { label: '🌙 Midnight Mood', sett: midnight, type: 'dark' },
    { label: '✨ Soft Pastel', sett: pastel, type: 'light' },
    { label: '🔥 Bold Contrast', sett: bold, type: 'contrast' },
    { label: '🔄 Inverted Sett', sett: inverted, type: 'inverted' },
    { label: '💎 Royal Jewel', sett: jewel, type: 'jewel' },
    { label: '🍂 Vintage Earth', sett: earthy, type: 'earth' },
  ]
}

export default function DesignDrop({ state, dispatch, onClose }) {
  const [variations, setVariations] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  // Initialize with instant local variations
  useEffect(() => {
    const initial = generateLocalVariations(state.sett)
    setVariations(initial)

    // Close on Escape key
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.sett, onClose])

  // Optional AI variation fetch
  const fetchAiVariations = useCallback(async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const promptList = [
        'Create a luxury haute-couture variation of this fabric',
        'Create a traditional Scottish clan heritage variation',
        'Create a modern minimalist aesthetic variation'
      ]
      const results = await Promise.all(
        promptList.map(p =>
          askGroq([{ role: 'user', content: p }], state)
            .catch(() => null)
        )
      )

      const aiVars = results
        .filter(r => r && r.sett && r.sett.length > 0)
        .map((r, i) => ({
          label: `✨ AI ${['Haute Couture', 'Clan Heritage', 'Modern Minimal'][i]}`,
          sett: r.sett,
          weave: r.weave,
          ts: r.ts,
          reps: r.reps,
          reply: r.reply
        }))

      if (aiVars.length > 0) {
        setVariations(prev => [...aiVars, ...prev])
      } else {
        setAiError('AI variations unavailable; showing instant color harmonies.')
      }
    } catch (err) {
      console.warn('AI variation error:', err)
      setAiError('Unable to reach AI service. Showing instant algorithmic variations.')
    } finally {
      setAiLoading(false)
    }
  }, [state])

  const applyVariation = (v) => {
    dispatch({
      type: 'APPLY',
      newState: {
        ...state,
        sett: v.sett,
        weave: v.weave || state.weave,
        ts: v.ts || state.ts,
        reps: v.reps || state.reps,
        activePreset: -1,
      }
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-surface" style={{ maxWidth: 640, width: '92vw' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon-wrap">✨</div>
            <div>
              <h3 className="modal-title">Design Variations &amp; Harmonies</h3>
              <p className="modal-sub">Explore instant color variations &amp; AI pattern harmonies</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {/* AI Action Row */}
        <div style={{ padding: '12px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--mt)' }}>
            Select any variation below to apply to your live canvas:
          </span>
          <button
            onClick={fetchAiVariations}
            disabled={aiLoading}
            className="btn-gradient"
            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
          >
            {aiLoading ? '✨ Generating...' : '✨ Generate AI Variations'}
          </button>
        </div>

        {aiError && (
          <div className="error-banner" style={{ margin: '8px 20px' }}>
            {aiError}
          </div>
        )}

        {/* Variation Grid */}
        <div className="variation-grid">
          {variations.map((v, i) => (
            <button
              key={i}
              onClick={() => applyVariation(v)}
              className="thumb-card"
              style={{ textAlign: 'left', padding: '8px' }}
            >
              <div className="streak-preview" style={{ height: '36px', borderRadius: '4px' }}>
                {v.sett.map((s, j) => (
                  <div
                    key={j}
                    className="streak-segment"
                    style={{ flex: s.n, background: s.c }}
                    title={`${s.c} (${s.n}t)`}
                  />
                ))}
              </div>
              <div className="thumb-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginTop: '4px' }}>
                {v.label}
              </div>
              {v.reply && (
                <div style={{ fontSize: '0.72rem', color: 'var(--mt)', marginTop: '2px', lineHeight: 1.3 }}>
                  {v.reply}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={() => setVariations(generateLocalVariations(state.sett))} className="btn-secondary">
            ↺ Reset
          </button>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
