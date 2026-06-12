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
      const results = await Promise.all(
        prompts.map(p =>
          askGroq([{ role: 'user', content: `Create a ${p} of the current tartan.` }], state)
            .catch(() => null)
        )
      )
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
      <div className="modal-box" style={{ maxWidth: 560, width: '90vw' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:600 }}>✨ Design Variations</h3>
          <button onClick={onClose} className="btn-ghost" style={{ padding:'4px 8px', fontSize:'1.2rem', lineHeight:1 }} aria-label="Close">×</button>
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--fg2)' }}>
            <div className="app-spinner" style={{ margin:'0 auto 12px' }}/>
            <p>Generating variations…</p>
          </div>
        )}

        {error && (
          <div style={{ padding:16, background:'#fee2e2', borderRadius:8, color:'#dc2626', marginBottom:12 }}>
            {error}
            <button onClick={generateVariations} style={{ marginLeft:12, textDecoration:'underline', background:'none', border:'none', cursor:'pointer', color:'#dc2626' }}>Retry</button>
          </div>
        )}

        {!loading && !error && variations.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--fg2)' }}>
            No variations could be generated. <button onClick={generateVariations} style={{ textDecoration:'underline', background:'none', border:'none', cursor:'pointer' }}>Try again</button>
          </div>
        )}

        {!loading && variations.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:12 }}>
            {variations.map((v, i) => (
              <button
                key={i}
                onClick={() => applyVariation(v)}
                style={{
                  background:'var(--surface)',
                  border:'1px solid var(--border)',
                  borderRadius:10,
                  padding:12,
                  cursor:'pointer',
                  textAlign:'left',
                  transition:'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Stripe preview */}
                <div style={{ display:'flex', height:32, borderRadius:6, overflow:'hidden', marginBottom:8 }}>
                  {v.sett.map((s, j) => (
                    <div
                      key={j}
                      style={{
                        flex: s.n,
                        background: s.c,
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize:'0.7rem', color:'var(--fg2)', lineHeight:1.3 }}>{v.label}</div>
                {v.reply && <div style={{ fontSize:'0.65rem', color:'var(--fg3)', marginTop:4, lineHeight:1.3 }}>{v.reply}</div>}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop:20, display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={generateVariations} disabled={loading} className="btn-secondary" style={{ fontSize:'0.8rem' }}>↺ Regenerate</button>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize:'0.8rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
