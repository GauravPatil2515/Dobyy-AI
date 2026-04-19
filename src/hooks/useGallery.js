import { useState, useCallback } from 'react'

const STORAGE_KEY = 'dobby-gallery'

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch { return [] }
}

export function useGallery(state, dispatch) {
  const [gallery, setGallery] = useState(loadFromStorage)
  const [activeId, setActiveId] = useState(null)

  const save = useCallback((name) => {
    const entry = {
      id:    Date.now(),
      name:  name || `Design ${new Date().toLocaleTimeString()}`,
      sett:  state.sett.map(s => ({...s})),
      weave: state.weave,
      ts:    state.ts,
      reps:  state.reps,
      thumb: null,
    }
    const updated = [entry, ...gallery].slice(0, 20) // max 20 saved
    setGallery(updated)
    setActiveId(entry.id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return entry
  }, [state, gallery])

  const load = useCallback((entry) => {
    dispatch({ type: 'APPLY', newState: {
      ...state,
      sett:  entry.sett.map(s => ({...s})),
      weave: entry.weave,
      ts:    entry.ts,
      reps:  entry.reps,
      activePreset: -1,
    }})
    setActiveId(entry.id)
  }, [state, dispatch])

  const remove = useCallback((id) => {
    const updated = gallery.filter(e => e.id !== id)
    setGallery(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    if (activeId === id) setActiveId(null)
  }, [gallery, activeId])

  const rename = useCallback((id, name) => {
    const updated = gallery.map(e => e.id === id ? {...e, name} : e)
    setGallery(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [gallery])

  return { gallery, activeId, save, load, remove, rename }
}
