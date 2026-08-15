import { useState, useEffect } from 'react'
import { suggestColors, generateDesignDetails } from '../utils/groqClient.js'

export default function AiToolsModal({ isOpen, onClose, state, dispatch, initialTab = 'colors' }) {
  const [activeTab, setActiveTab] = useState(initialTab) // 'colors' | 'details'

  // AI Colour Suggestion State
  const [baseColorInput, setBaseColorInput] = useState('Blue')
  const [colorLoading, setColorLoading] = useState(false)
  const [colorPalettes, setColorPalettes] = useState(null)
  const [colorError, setColorError] = useState(null)

  // Design Details Generator State
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [designDetails, setDesignDetails] = useState(null)
  const [detailsError, setDetailsError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Sync tab state when modal opens or initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      if (initialTab === 'colors' && !colorPalettes && !colorLoading) {
        handleFetchColorSuggestions('Blue')
      } else if (initialTab === 'details' && !designDetails && !detailsLoading) {
        handleGenerateDetails()
      }
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null


  // Handle Colour Suggestion Request
  const handleFetchColorSuggestions = async (colorName) => {
    const query = colorName || baseColorInput
    if (!query.trim()) return
    setColorLoading(true)
    setColorError(null)
    try {
      const res = await suggestColors(query)
      if (res && res.palettes) {
        setColorPalettes(res.palettes)
      } else {
        throw new Error('No palettes returned from AI')
      }
    } catch (err) {
      console.error('[AiToolsModal] suggestColors error:', err)
      setColorError(err.message || 'Failed to generate color suggestions')
    } finally {
      setColorLoading(false)
    }
  }

  // Apply a suggested palette directly to the fabric design!
  const applyPaletteToDesign = (palette) => {
    if (!palette || !palette.colors || palette.colors.length === 0) return
    const newSett = palette.colors.map((c, idx) => ({
      c: c.hex,
      n: idx % 2 === 0 ? 12 : 4 // balanced thread counts
    }))
    dispatch({ type: 'APPLY', newState: { ...state, sett: newSett } })
    onClose()
  }

  // Handle Design Details Generation
  const handleGenerateDetails = async () => {
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const details = await generateDesignDetails(state)
      setDesignDetails(details)
    } catch (err) {
      console.error('[AiToolsModal] generateDesignDetails error:', err)
      setDetailsError(err.message || 'Failed to generate design details')
    } finally {
      setDetailsLoading(false)
    }
  }

  // Copy details to clipboard
  const handleCopyDetails = () => {
    if (!designDetails) return
    const text = `Design Name: ${designDetails.designName}\nStyle: ${designDetails.style}\nBest For: ${designDetails.bestFor}\nColours: ${Array.isArray(designDetails.colors) ? designDetails.colors.join(', ') : designDetails.colors}\nDescription: ${designDetails.description}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-surface"
        style={{ maxWidth: 640 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon-wrap">
              ✨
            </div>
            <div>
              <h2 className="modal-title">AI Studio Intelligence</h2>
              <p className="modal-sub">
                Colour Palette Matcher &amp; Design Description Generator
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">&times;</button>
        </div>

        {/* Navigation Tabs */}
        <div className="tab-nav">
          <button
            className={`btn-tab${activeTab === 'colors' ? ' active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            <span>🎨</span> AI Colour Suggestion
          </button>

          <button
            className={`btn-tab${activeTab === 'details' ? ' active' : ''}`}
            onClick={() => {
              setActiveTab('details')
              if (!designDetails && !detailsLoading) handleGenerateDetails()
            }}
          >
            <span>✨</span> Design Name &amp; Details
          </button>
        </div>

        {/* Tab 1: AI Colour Suggestion */}
        {activeTab === 'colors' && (
          <div className="tab-body">
            <div className="field-group">
              <label className="field-label">Select or Type a Base Colour:</label>
              <div className="input-group">
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. Blue, Maroon, Emerald Green"
                  value={baseColorInput}
                  onChange={e => setBaseColorInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetchColorSuggestions()}
                />
                <button
                  onClick={() => handleFetchColorSuggestions()}
                  disabled={colorLoading}
                  className="btn-gradient"
                >
                  {colorLoading ? 'Suggesting...' : '✨ Suggest Palette'}
                </button>
              </div>

              {/* Quick Presets */}
              <div className="preset-chips">
                {['Blue', 'Maroon', 'Golden', 'Emerald Green', 'Royal Purple', 'Teal'].map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      setBaseColorInput(c)
                      handleFetchColorSuggestions(c)
                    }}
                    className="chip"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {colorError && (
              <div className="error-banner">{colorError}</div>
            )}

            {/* Generated Color Palettes */}
            {colorPalettes && colorPalettes.length > 0 && (
              <div className="palette-list">
                <h4 className="palette-heading">Suggested Harmony Palettes:</h4>
                {colorPalettes.map((p, pIdx) => (
                  <div key={pIdx} className="palette-card">
                    <div className="palette-header">
                      <span className="palette-name">{p.themeName}</span>
                      <button
                        onClick={() => applyPaletteToDesign(p)}
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                      >
                        Apply to Design
                      </button>
                    </div>

                    <div className="palette-colors">
                      {p.colors.map((c, cIdx) => (
                        <div key={cIdx} className="swatch">
                          <span className="swatch-dot" style={{ background: c.hex }} />
                          <span className="swatch-name">{c.name}</span>
                          <span className="swatch-hex">({c.hex})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Design Name + Description Generator */}
        {activeTab === 'details' && (
          <div className="tab-body">
            <div className="details-header">
              <span className="modal-sub">
                Analyzes fabric weave, stripe ratios &amp; colors to generate details.
              </span>
              <button
                onClick={handleGenerateDetails}
                disabled={detailsLoading}
                className="btn-gradient"
              >
                {detailsLoading ? 'Generating...' : '✨ Regenerate'}
              </button>
            </div>

            {detailsError && (
              <div className="error-banner">{detailsError}</div>
            )}

            {detailsLoading && (
              <div className="state-loading">
                ✨ Analyzing colors &amp; crafting design details...
              </div>
            )}

            {designDetails && !detailsLoading && (
              <div className="details-card">
                <div>
                  <span className="detail-label">Design Name</span>
                  <h3 className="detail-value">{designDetails.designName}</h3>
                </div>

                <div className="detail-grid">
                  <div className="detail-field">
                    <span className="detail-field-label">Style</span>
                    <strong className="detail-field-value">{designDetails.style}</strong>
                  </div>
                  <div className="detail-field">
                    <span className="detail-field-label">Best For</span>
                    <strong className="detail-field-value">{designDetails.bestFor}</strong>
                  </div>
                </div>

                <div>
                  <span className="detail-label">Colours Palette</span>
                  <div className="palette-colors">
                    {(Array.isArray(designDetails.colors) ? designDetails.colors : [designDetails.colors]).map((c, i) => (
                      <span key={i} className="swatch" style={{ padding: '2px 8px', fontSize: '0.8rem' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="detail-label">Description</span>
                  <p className="detail-description">{designDetails.description}</p>
                </div>

                <div className="details-actions">
                  <button
                    onClick={handleCopyDetails}
                    className="btn-secondary"
                  >
                    {copied ? '✓ Copied Details!' : '📋 Copy Details'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
