import { useState, useEffect, useCallback, useRef } from 'react'
import { suggestColors, generateDesignDetails } from '../utils/groqClient.js'
import { t, getLang } from '../utils/i18n.js'

const COLOR_PRESETS = [
  { label: 'Blue',         hex: '#1d4ed8' },
  { label: 'Maroon',       hex: '#800000' },
  { label: 'Golden',       hex: '#d97706' },
  { label: 'Emerald',      hex: '#065f46' },
  { label: 'Purple',       hex: '#6b21a8' },
  { label: 'Teal',         hex: '#0f766e' },
  { label: 'Crimson',      hex: '#b91c1c' },
  { label: 'Slate',        hex: '#334155' },
]

export default function AiToolsModal({ isOpen, onClose, state, dispatch, initialTab = 'colors' }) {
  /* ── All hooks MUST be declared unconditionally before any early return ── */
  const [activeTab, setActiveTab] = useState(initialTab)
  const [baseColorInput, setBaseColorInput] = useState('Blue')
  const [pickerHex, setPickerHex] = useState('#1d4ed8')
  const [colorLoading, setColorLoading] = useState(false)
  const [colorPalettes, setColorPalettes] = useState(null)
  const [colorError, setColorError] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [designDetails, setDesignDetails] = useState(null)
  const [detailsError, setDetailsError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [lang, setLangState] = useState(getLang())
  const prevIsOpen = useRef(false)

  // Sync lang label reactively
  useEffect(() => {
    const handler = (e) => setLangState(e.detail)
    window.addEventListener('dobby-lang-change', handler)
    return () => window.removeEventListener('dobby-lang-change', handler)
  }, [])

  const handleFetchColorSuggestions = useCallback(async (colorName) => {
    const query = (colorName || baseColorInput).trim()
    if (!query) return
    setColorLoading(true)
    setColorError(null)
    try {
      const res = await suggestColors(query)
      if (res && res.palettes) {
        setColorPalettes(res.palettes)
      } else {
        throw new Error('No palettes returned')
      }
    } catch (err) {
      console.error('[AiToolsModal] suggestColors:', err)
      setColorError(err.message || 'Failed to generate suggestions')
    } finally {
      setColorLoading(false)
    }
  }, [baseColorInput])

  const handleGenerateDetails = useCallback(async () => {
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const details = await generateDesignDetails(state)
      setDesignDetails(details)
    } catch (err) {
      console.error('[AiToolsModal] generateDesignDetails:', err)
      setDetailsError(err.message || 'Failed to generate details')
    } finally {
      setDetailsLoading(false)
    }
  }, [state])

  // Sync tab + auto-load when modal opens
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setActiveTab(initialTab)
      if (initialTab === 'colors' && !colorPalettes && !colorLoading) {
        handleFetchColorSuggestions('Blue')
      } else if (initialTab === 'details' && !designDetails && !detailsLoading) {
        handleGenerateDetails()
      }
    }
    prevIsOpen.current = isOpen
  }, [isOpen, initialTab, colorPalettes, colorLoading, designDetails, detailsLoading, handleFetchColorSuggestions, handleGenerateDetails])

  // Now we can safely early-return after all hooks
  if (!isOpen) return null

  const applyPaletteToDesign = (palette) => {
    if (!palette?.colors?.length) return
    const newSett = palette.colors.map((c, idx) => ({
      c: c.hex,
      n: [16, 4, 12, 2, 8, 2][idx] ?? (idx % 2 === 0 ? 12 : 4)
    }))
    dispatch({ type: 'APPLY', newState: { ...state, sett: newSett } })
    onClose()
  }

  const handleCopyDetails = () => {
    if (!designDetails) return
    const colorList = Array.isArray(designDetails.colors) ? designDetails.colors.join(', ') : designDetails.colors
    const text = `Design Name: ${designDetails.designName}\nStyle: ${designDetails.style}\nBest For: ${designDetails.bestFor}\nColours: ${colorList}\nDescription: ${designDetails.description}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePresetClick = (preset) => {
    setBaseColorInput(preset.label)
    setPickerHex(preset.hex)
    handleFetchColorSuggestions(preset.label)
  }

  const handlePickerChange = (e) => {
    setPickerHex(e.target.value)
    setBaseColorInput(e.target.value)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-surface"
        style={{ maxWidth: 660 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon-wrap">✨</div>
            <div>
              <h2 className="modal-title">AI Studio Intelligence</h2>
              <p className="modal-sub">Colour Palette Matcher &amp; Design Description Generator</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">&times;</button>
        </div>

        {/* Tabs */}
        <div className="tab-nav">
          <button
            className={`btn-tab${activeTab === 'colors' ? ' active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            <span>🎨</span> {t('ai.colourSuggestion')}
          </button>
          <button
            className={`btn-tab${activeTab === 'details' ? ' active' : ''}`}
            onClick={() => {
              setActiveTab('details')
              if (!designDetails && !detailsLoading) handleGenerateDetails()
            }}
          >
            <span>✨</span> {t('ai.designDetails')}
          </button>
        </div>

        {/* ── TAB 1: AI Colour Suggestion ── */}
        {activeTab === 'colors' && (
          <div className="tab-body">
            <div className="field-group">
              <label className="field-label">{t('ai.baseColour')}</label>

              {/* Text + Color Picker row */}
              <div className="input-group">
                <div className="color-pick-wrap">
                  <input
                    type="color"
                    className="color-picker-input"
                    value={pickerHex}
                    onChange={handlePickerChange}
                    title="Pick exact colour"
                  />
                  <span className="color-pick-dot" style={{ background: pickerHex }} />
                </div>
                <input
                  type="text"
                  className="input-text"
                  placeholder={t('ai.colourPlaceholder')}
                  value={baseColorInput}
                  onChange={e => setBaseColorInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetchColorSuggestions()}
                />
                <button
                  onClick={() => handleFetchColorSuggestions()}
                  disabled={colorLoading}
                  className="btn-gradient"
                >
                  {colorLoading ? t('ai.suggesting') : `✨ ${t('ai.suggestPalette')}`}
                </button>
              </div>

              {/* Color Preset Chips with swatches */}
              <div className="preset-chips">
                {COLOR_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => handlePresetClick(p)}
                    className="chip"
                    title={p.label}
                  >
                    <span className="chip-dot" style={{ background: p.hex }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {colorError && <div className="error-banner">{colorError}</div>}

            {colorLoading && (
              <div className="state-loading">🎨 {t('ai.generating')}…</div>
            )}

            {/* Generated Palettes */}
            {colorPalettes && colorPalettes.length > 0 && (
              <div className="palette-list">
                <h4 className="palette-heading">{t('ai.suggestedPalettes')}</h4>
                {colorPalettes.map((p, pIdx) => (
                  <div key={pIdx} className="palette-card">
                    <div className="palette-header">
                      <span className="palette-name">{p.themeName}</span>
                      <button
                        onClick={() => applyPaletteToDesign(p)}
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                      >
                        {t('ai.applyDesign')}
                      </button>
                    </div>
                    <div className="palette-colors">
                      {p.colors.map((c, cIdx) => (
                        <div key={cIdx} className="swatch">
                          <span className="swatch-dot" style={{ background: c.hex }} />
                          <span className="swatch-name">{c.name}</span>
                          <span className="swatch-hex">{c.hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Design Name + Details ── */}
        {activeTab === 'details' && (
          <div className="tab-body">
            <div className="details-header">
              <span className="modal-sub">{t('ai.detailsSubtitle')}</span>
              <button
                onClick={handleGenerateDetails}
                disabled={detailsLoading}
                className="btn-gradient"
              >
                {detailsLoading ? t('ai.generating') : `✨ ${t('ai.regenerate')}`}
              </button>
            </div>

            {detailsError && <div className="error-banner">{detailsError}</div>}

            {detailsLoading && (
              <div className="state-loading">✨ {t('ai.analyzingFabric')}…</div>
            )}

            {designDetails && !detailsLoading && (
              <div className="details-card">
                <div>
                  <span className="detail-label">{t('ai.designName')}</span>
                  <h3 className="detail-value">{designDetails.designName}</h3>
                </div>

                <div className="detail-grid">
                  <div className="detail-field">
                    <span className="detail-field-label">{t('ai.style')}</span>
                    <strong className="detail-field-value">{designDetails.style}</strong>
                  </div>
                  <div className="detail-field">
                    <span className="detail-field-label">{t('ai.bestFor')}</span>
                    <strong className="detail-field-value">{designDetails.bestFor}</strong>
                  </div>
                </div>

                <div>
                  <span className="detail-label">{t('ai.colourPalette')}</span>
                  <div className="palette-colors">
                    {(Array.isArray(designDetails.colors) ? designDetails.colors : [designDetails.colors]).map((c, i) => (
                      <span key={i} className="swatch" style={{ padding: '2px 10px', fontSize: '0.8rem' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="detail-label">{t('ai.description')}</span>
                  <p className="detail-description">{designDetails.description}</p>
                </div>

                <div className="details-actions">
                  <button onClick={handleCopyDetails} className="btn-secondary">
                    {copied ? `✓ ${t('ai.copied')}` : `📋 ${t('ai.copyDetails')}`}
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
