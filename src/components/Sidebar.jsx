import { useState, useEffect } from 'react'
import SettBuilder from './SettBuilder.jsx'
import RegistrySearch from './RegistrySearch.jsx'
import Gallery from './Gallery.jsx'
import { PRESETS } from '../data/presets.js'
import { t, getLang } from '../utils/i18n.js'
import { WEAVES } from '../constants.js'

export default function Sidebar({
  state, dispatch, className='',
  gallery, galleryActiveId, onSave, onLoad, onRemove, onRename,
  galleryLoading, canSaveMore, maxDesigns, onAiToolsOpen
}) {
  const totalThreads = state.sett.reduce((a,s) => a+s.n, 0)
  const [, setLangTick] = useState(0)
  useEffect(() => {
    const h = () => setLangTick(n => n + 1)
    window.addEventListener('dobby-lang-change', h)
    return () => window.removeEventListener('dobby-lang-change', h)
  }, [])

  return (
    <aside className={`sidebar ${className}`}>
      <div className="section-accent">
        <div className="section-title">✨ AI Design Intelligence</div>
        <div className="ai-btn-group">
          <button
            className="btn-gradient w-full"
            onClick={() => onAiToolsOpen && onAiToolsOpen('colors')}
          >
            {t('sidebar.aiColours')}
          </button>
          <button
            className="btn-secondary w-full"
            onClick={() => onAiToolsOpen && onAiToolsOpen('details')}
          >
            {t('sidebar.aiDetails')}
          </button>
        </div>
      </div>

      <SettBuilder sett={state.sett} dispatch={dispatch} totalThreads={totalThreads}/>
      <Gallery
        gallery={gallery}
        activeId={galleryActiveId}
        onSave={onSave}
        onLoad={onLoad}
        onRemove={onRemove}
        onRename={onRename}
        loading={galleryLoading}
        canSaveMore={canSaveMore}
        maxDesigns={maxDesigns}/>
      <RegistrySearch dispatch={dispatch}/>

      <div className="section">
        <div className="section-title">{t('sidebar.presets')}</div>
        <div className="preset-list">
          {PRESETS.map((p, i) => (
            <div
              key={i}
              className={`preset-item${state.activePreset===i?' active':''}`}
              onClick={() => dispatch({type:'SET_PRESET', idx:i})}>
              <div className="preset-swatch">
                {p.sett.slice(0,6).map((s,j) => (
                  <div key={j} className="streak-segment" style={{flex:s.n, background:s.c, minWidth:2}}/>
                ))}
              </div>
              <div>
                <div className="preset-name">{p.name}</div>
                <div className="preset-meta">{p.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">{t('sidebar.weave')} &amp; Scale</div>
        <select
          className="ctrl-select"
          value={state.weave || 'twill22'}
          onChange={e => dispatch({type:'SET_WEAVE', weave:e.target.value})}>
          {WEAVES.map(w => (
            <option key={w.v} value={w.v}>{w.l}</option>
          ))}
        </select>
        <div className="ctrl-row">
          <span className="ctrl-label">{t('sidebar.ts')}</span>
          <input type="range" className="ctrl-range"
            min={4} max={22} value={state.ts ?? 8}
            onChange={e => dispatch({type:'SET_TS', ts:+e.target.value})}/>
          <span className="ctrl-val">{state.ts ?? 8}px</span>
        </div>
        <div className="ctrl-row">
          <span className="ctrl-label">{t('sidebar.reps')}</span>
          <input type="range" className="ctrl-range"
            min={1} max={12} value={state.reps ?? 3}
            onChange={e => dispatch({type:'SET_REPS', reps:+e.target.value})}/>
          <span className="ctrl-val">{state.reps ?? 3}×</span>
        </div>
      </div>
    </aside>
  )
}
