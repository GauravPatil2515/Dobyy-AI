import { useState } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext.jsx'

export default function Gallery({ 
  gallery, 
  activeId, 
  onSave, 
  onLoad, 
  onRemove, 
  onRename,
  loading: galleryLoading,
  canSaveMore,
  maxDesigns
}) {
  const [saveName,    setSaveName]    = useState('')
  const [editingId,   setEditingId]   = useState(null)
  const [editingName, setEditingName] = useState('')

  const handleSave = async () => {
    if (!canSaveMore) {
      alert(`Free tier limited to ${maxDesigns} designs. Delete some to save more.`)
      return
    }
    try {
      await onSave(saveName || undefined)
      setSaveName('')
    } catch (err) {
      alert(err.message)
    }
  }

  const startRename = (entry) => {
    setEditingId(entry.id)
    setEditingName(entry.name)
  }

  const commitRename = (id) => {
    if (editingName.trim()) onRename(id, editingName.trim())
    setEditingId(null)
  }

  return (
    <div className="section">
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>My Designs</span>
        {galleryLoading && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Loading...</span>}
        {!galleryLoading && (
          <span style={{ fontSize: '0.75rem', color: gallery.length >= maxDesigns ? '#dc2626' : '#9ca3af' }}>
            {gallery.length}/{maxDesigns}
          </span>
        )}
      </div>

      {/* Save current design */}
      <div className="gallery-save-row">
        <input
          className="reg-input"
          placeholder={canSaveMore ? "Design name (optional)" : "Limit reached - delete to save"}
          value={saveName}
          disabled={!canSaveMore || galleryLoading}
          onChange={e => setSaveName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}/>
        <button 
          className="reg-btn" 
          onClick={handleSave} 
          disabled={!canSaveMore || galleryLoading}
          title={canSaveMore ? "Save design" : "Design limit reached"}
          style={{ opacity: canSaveMore ? 1 : 0.5 }}
        >
          💾
        </button>
      </div>

      {gallery.length === 0 && (
        <div style={{fontSize:10, color:'var(--ft)', padding:'6px 2px'}}>
          No saved designs yet. Click 💾 to save the current one.
        </div>
      )}

      {/* Gallery list */}
      <div className="gallery-list">
        {gallery.map(entry => (
          <div
            key={entry.id}
            className={`gallery-item${activeId===entry.id?' active':''}`}>

            {/* Sett mini preview */}
            <div className="gallery-thumb" onClick={() => onLoad(entry)}>
              {entry.sett.slice(0,8).map((s,i) => (
                <div key={i} style={{flex:s.n, background:s.c, minWidth:2}}/>
              ))}
            </div>

            {/* Name — click to rename */}
            <div className="gallery-info" onClick={() => onLoad(entry)}>
              {editingId === entry.id ? (
                <input
                  className="gallery-rename"
                  value={editingName}
                  autoFocus
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={() => commitRename(entry.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename(entry.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onClick={e => e.stopPropagation()}/>
              ) : (
                <div className="gallery-name"
                  onDoubleClick={e => { e.stopPropagation(); startRename(entry) }}>
                  {entry.name}
                </div>
              )}
              <div className="gallery-meta">
                {entry.sett.length} colors · {entry.weave}
              </div>
            </div>

            {/* Delete */}
            <button className="stripe-del gallery-del"
              onClick={e => { e.stopPropagation(); onRemove(entry.id) }}
              title="Delete design">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
