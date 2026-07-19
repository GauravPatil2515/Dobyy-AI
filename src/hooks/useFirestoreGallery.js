import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useSubscription } from '../contexts/SubscriptionContext.jsx'
import { db } from '../firebase.js'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore'

const getStorageKey = (userId) => `dobby-gallery-${userId}`

export function useFirestoreGallery(state, dispatch) {
  const { user, isAuthenticated, isOffline, isDemoMode } = useAuth()
  const { subscription } = useSubscription()
  const [gallery, setGallery] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setGallery([])
      setLoading(false)
      return
    }

    const offline = isOffline || isDemoMode
    setIsOfflineMode(offline)

    if (offline) {
      try {
        const saved = localStorage.getItem(getStorageKey(user.uid))
        setGallery(saved ? JSON.parse(saved) : [])
        setError(null)
      } catch (err) {
        console.error('Error loading from localStorage:', err)
        setGallery([])
      } finally {
        setLoading(false)
      }
      return
    }

    const loadDesigns = async () => {
      try {
        setLoading(true)
        const designsRef = collection(db, 'designs')
        const q = query(
          designsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(subscription.maxSavedDesigns)
        )
        const snapshot = await getDocs(q)
        const designs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || new Date()
        }))
        setGallery(designs)
        localStorage.setItem(getStorageKey(user.uid), JSON.stringify(designs))
        setError(null)
      } catch (err) {
        console.error('Error loading designs:', err)
        setError(err.message)
        const saved = localStorage.getItem(getStorageKey(user.uid))
        if (saved) setGallery(JSON.parse(saved))
      } finally {
        setLoading(false)
      }
    }

    loadDesigns()
  }, [user, isAuthenticated, subscription.maxSavedDesigns, isOffline, isDemoMode])

  const save = useCallback(async (name) => {
    if (!isAuthenticated || !user) throw new Error('Must be logged in to save designs')

    if (gallery.length >= subscription.maxSavedDesigns) {
      throw new Error(`Free tier limited to ${subscription.maxSavedDesigns} designs. Upgrade to Pro for more.`)
    }

    const designData = {
      userId: user.uid,
      name: name || `Design ${new Date().toLocaleTimeString()}`,
      sett: state.sett.map(s => ({ ...s })),
      weave: state.weave,
      ts: state.ts,
      reps: state.reps,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (isOfflineMode) {
      const newDesign = { id: `local-${Date.now()}`, ...designData }
      const updated = [newDesign, ...gallery]
      setGallery(updated)
      localStorage.setItem(getStorageKey(user.uid), JSON.stringify(updated))
      setActiveId(newDesign.id)
      return newDesign
    }

    try {
      const docRef = await addDoc(collection(db, 'designs'), {
        ...designData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      const newDesign = { id: docRef.id, ...designData, createdAt: new Date() }
      const updated = [newDesign, ...gallery]
      setGallery(updated)
      localStorage.setItem(getStorageKey(user.uid), JSON.stringify(updated))
      setActiveId(docRef.id)
      return newDesign
    } catch (err) {
      console.error('Error saving design:', err)
      const newDesign = { id: `local-${Date.now()}`, ...designData }
      const updated = [newDesign, ...gallery]
      setGallery(updated)
      localStorage.setItem(getStorageKey(user.uid), JSON.stringify(updated))
      setActiveId(newDesign.id)
      return newDesign
    }
  }, [state, user, isAuthenticated, gallery, subscription.maxSavedDesigns, isOfflineMode])

  // BUG FIX: removed `state` from dependency array and from the dispatch payload.
  // The old version spread the entire canvas state into the loaded design, meaning
  // every canvas change recreated this callback and caused unnecessary re-renders.
  // Now we only dispatch the design's own fields — exactly what should be restored.
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
    if (!isAuthenticated || !user) return
    setGallery(prev => {
      const updated = prev.filter(e => e.id !== id)
      localStorage.setItem(getStorageKey(user.uid), JSON.stringify(updated))
      return updated
    })
    if (activeId === id) setActiveId(null)
    if (!isOfflineMode && !id.startsWith('local-')) {
      try {
        await deleteDoc(doc(db, 'designs', id))
      } catch (err) {
        console.error('Error deleting from Firestore:', err)
      }
    }
  }, [user, isAuthenticated, activeId, isOfflineMode])

  const rename = useCallback(async (id, name) => {
    if (!isAuthenticated || !user) return
    setGallery(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, name, updatedAt: new Date() } : e)
      localStorage.setItem(getStorageKey(user.uid), JSON.stringify(updated))
      return updated
    })
    if (!isOfflineMode && !id.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'designs', id), { name, updatedAt: serverTimestamp() })
      } catch (err) {
        console.error('Error renaming in Firestore:', err)
      }
    }
  }, [user, isAuthenticated, isOfflineMode])

  return {
    gallery,
    activeId,
    loading,
    error,
    save,
    load,
    remove,
    rename,
    canSaveMore: gallery.length < subscription.maxSavedDesigns,
    maxDesigns: subscription.maxSavedDesigns
  }
}
