import { useState, useCallback } from 'react'
import { searchTartans, parseTartanSett } from '../utils/tartanRegistry.js'

export default function RegistrySearch({ dispatch }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const search = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    const res = await searchTartans(query)
    if (res.length === 0) setError('No tartans found. Try "Stewart" or "MacDonald".')
    setResults(res)
    setLoading(false)
  }, [query])

  const loadTartan = (item) => {
    const sett = parseTartanSett(item.sett, item.palette)
    if (sett) {
      dispatch({ type: 'APPLY', newState: {
        sett, activePreset: -1,
        weave: 'twill22', ts: 8, reps: 3,
        panel: 'fabric', theme: document.documentElement.dataset.theme || 'light'
      }})
    } else {
      alert(`Could not parse sett for "${item.name}". Try another.`)
    }
  }

  return (
    <div className="section">
      <div className="section-title">Tartan Registry</div>
      <div className="reg-search-row">
        <input
          className="reg-input"
          placeholder='Try "Stewart", "MacDonald"…'
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}/>
        <button className="reg-btn" onClick={search} disabled={loading}>
          {loading ? '…' : '🔍'}
        </button>
      </div>
      {error && <div className="reg-error">{error}</div>}
      <div className="reg-results">
        {results.map(item => (
          <div key={item.id} className="reg-item" onClick={() => loadTartan(item)}>
            <div className="reg-name">{item.name}</div>
            <div className="reg-id">#{item.id}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
