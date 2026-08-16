import { useState, useCallback, useEffect } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext.jsx'

const STORAGE_KEY = 'dobby-gallery-designs'

export function useFirestoreGallery(state, dispatch) {
  const { subscription } = useSubscription()
  const [gallery, setGallery] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setGallery(saved ? JSON.parse(saved) : [])
    } catch (err) {
      console.error('Error loading gallery from localStorage:', err)
      setGallery([])
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (name) => {
    if (gallery.length >= subscription.maxSavedDesigns) {
      throw new Error(`Limit reached (${subscription.maxSavedDesigns} designs max). Delete old designs to save more.`)
    }

    const newDesign = {
      id: `design-${Date.now()}`,
      name: name || `Design ${new Date().toLocaleTimeString()}`,
      sett: state.sett.map(s => ({ ...s })),
      weave: state.weave,
      ts: state.ts,
      reps: state.reps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updated = [newDesign, ...gallery]
    setGallery(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setActiveId(newDesign.id)
    return newDesign
  }, [state, gallery, subscription.maxSavedDesigns])

  const load = useCallback(async (entry) => {
    dispatch({
      type: 'APPLY',
      newState: {
        sett: entry.sett.map(s => ({ ...s })),
        weave: entry.weave,
        ts: entry.ts,
        reps: entry.reps,
        activePreset: -1
      }
    })
    setActiveId(entry.id)
  }, [dispatch])

  const remove = useCallback(async (id) => {
    setGallery(prev => {
      const updated = prev.filter(e => e.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    if (activeId === id) setActiveId(null)
  }, [activeId])

  const rename = useCallback(async (id, name) => {
    setGallery(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, name, updatedAt: new Date().toISOString() } : e)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return {
    gallery,
    activeId,
    loading,
    error: null,
    save,
    load,
    remove,
    rename,
    canSaveMore: gallery.length < subscription.maxSavedDesigns,
    maxDesigns: subscription.maxSavedDesigns
  }
}
