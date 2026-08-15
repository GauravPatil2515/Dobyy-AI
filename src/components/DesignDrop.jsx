import { useState, useEffect } from 'react'
import { askGroq } from '../utils/groqClient.js'

/**
 * DesignDrop — AI variations modal.
 * FIX #2: Created and wired into App.jsx via showDesignDrop state + onDesignDropOpen prop.
 * Generates N variations of the current sett using Groq and lets the user pick one.
 */

const VARIATION_PROMPTS = [
  'darker, moodier version',
  'lighter, pastel version',
  'more contrasting colors',
  'analogous color harmony',
  'complementary colors',
  'desaturated, heritage tones',
]

export default function DesignDrop({ state, dispatch, onClose }) {
  const [variations, setVariations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    generateVariations()
    // ESC to close
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const generateVariations = async () => {
    setLoading(true)
    setError(null)
    try {
      const prompts = VARIATION_PROMPTS.slice(0, 6)
      // Run in batches of 2 to avoid rate-limit thrashing
      const results = []
      for (let i = 0; i < prompts.length; i += 2) {
        const batch = prompts.slice(i, i + 2)
        const batchResults = await Promise.all(
          batch.map(p =>
            askGroq([{ role: 'user', content: `Create a ${p} of the current tartan.` }], state)
              .catch(() => null)
          )
        )
        results.push(...batchResults)
      }
      const valid = results
        .filter(r => r && r.sett && r.sett.length > 0)
        .map((r, i) => ({ ...r, label: prompts[i] }))
      setVariations(valid)
    } catch (err) {
      setError('Failed to generate variations. Check your Groq API key.')
    } finally {
      setLoading(false)
    }
  }

  const applyVariation = (variation) => {
    dispatch({
      type: 'APPLY',
      newState: {
        ...state,
        sett: variation.sett,
        weave: variation.weave || state.weave,
        ts: variation.ts || state.ts,
        reps: variation.reps || state.reps,
        activePreset: -1,
      }
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-surface" style={{ maxWidth: 560, width: '90vw' }}>
        <div className="modal-header">
          <h3 className="modal-title">✨ Design Variations</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {loading && (
          <div className="state-loading">
            <div className="app-spinner" style={{ margin: '0 auto 12px' }} />
            <p>Generating variations…</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={generateVariations} className="btn-ghost" style={{ marginLeft: 12, padding: '2px 6px', fontSize: '0.85rem' }}>Retry</button>
          </div>
        )}

        {!loading && !error && variations.length === 0 && (
          <div className="state-empty">
            No variations could be generated.{' '}
            <button onClick={generateVariations} className="btn-ghost">Try again</button>
          </div>
        )}

        {!loading && variations.length > 0 && (
          <div className="variation-grid">
            {variations.map((v, i) => (
              <button
                key={i}
                onClick={() => applyVariation(v)}
                className="thumb-card"
              >
                {/* Stripe preview */}
                <div className="streak-preview">
                  {v.sett.map((s, j) => (
                    <div
                      key={j}
                      className="streak-segment"
                      style={{ flex: s.n, background: s.c }}
                    />
                  ))}
                </div>
                <div className="thumb-label">{v.label}</div>
                {v.reply && <div className="swatch-hex">{v.reply}</div>}
              </button>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <button onClick={generateVariations} disabled={loading} className="btn-secondary">↺ Regenerate</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  )
}
