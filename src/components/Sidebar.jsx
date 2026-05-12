import SettBuilder from './SettBuilder.jsx'
import RegistrySearch from './RegistrySearch.jsx'
import Gallery from './Gallery.jsx'
import { PRESETS } from '../data/presets.js'

const WEAVES = [
  { v:'twill22', l:'2/2 Twill (Tartan)' },
  { v:'twill21', l:'2/1 Twill' },
  { v:'twill31', l:'3/1 Twill' },
  { v:'plain',   l:'Plain Weave' },
  { v:'basket2', l:'Basket Weave' },
  { v:'hopsack', l:'Hopsack' },
  { v:'satin5',  l:'5-End Satin' },
]

export default function Sidebar({
  state, dispatch, className='',
  gallery, galleryActiveId, onSave, onLoad, onRemove, onRename,
  galleryLoading, canSaveMore, maxDesigns
}) {
  const totalThreads = state.sett.reduce((a,s) => a+s.n, 0)

  return (
    <aside className={`sidebar ${className}`}>
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
        <div className="section-title">Presets</div>
        <div className="preset-list">
          {PRESETS.map((p, i) => (
            <div
              key={i}
              className={`preset-item${state.activePreset===i?' active':''}`}
              onClick={() => dispatch({type:'SET_PRESET', idx:i})}>
              <div className="preset-swatch">
                {p.sett.slice(0,6).map((s,j) => (
                  <div key={j} style={{flex:s.n, background:s.c, minWidth:2}}/>
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
        <div className="section-title">Weave &amp; Scale</div>
        <select
          className="ctrl-select"
          value={state.weave}
          onChange={e => dispatch({type:'SET_WEAVE', weave:e.target.value})}>
          {WEAVES.map(w => (
            <option key={w.v} value={w.v}>{w.l}</option>
          ))}
        </select>
        <div className="ctrl-row">
          <span className="ctrl-label">Thread px</span>
          <input type="range" className="ctrl-range"
            min={4} max={22} value={state.ts}
            onChange={e => dispatch({type:'SET_TS', ts:+e.target.value})}/>
          <span className="ctrl-val">{state.ts}px</span>
        </div>
        <div className="ctrl-row">
          <span className="ctrl-label">Repeats</span>
          <input type="range" className="ctrl-range"
            min={1} max={12} value={state.reps}
            onChange={e => dispatch({type:'SET_REPS', reps:+e.target.value})}/>
          <span className="ctrl-val">{state.reps}×</span>
        </div>
      </div>
    </aside>
  )
}
