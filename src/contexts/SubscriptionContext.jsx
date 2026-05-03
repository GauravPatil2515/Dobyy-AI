import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import { db } from '../firebase.js'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const SubscriptionContext = createContext(null)

// Free tier limits
const FREE_TIER = {
  name: 'free',
  dailyApiCalls: 5,
  maxSavedDesigns: 20,
  canExportWif: false
}

// Pro tier limits
const PRO_TIER = {
  name: 'pro',
  dailyApiCalls: 100,
  maxSavedDesigns: 200,
  canExportWif: true
}

export function SubscriptionProvider({ children }) {
  const { user, isAuthenticated, isOffline, isDemoMode } = useAuth()
  const [subscription, setSubscription] = useState(FREE_TIER)
  const [usage, setUsage] = useState({ dailyCalls: 0, lastReset: null })
  const [loading, setLoading] = useState(true)

  // Fetch or create user subscription data
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUsage({ dailyCalls: 0, lastReset: null })
      setLoading(false)
      return
    }

    // Offline mode - use local storage for usage tracking
    // Also check navigator.onLine as a safeguard
    if (isOffline || isDemoMode || !navigator.onLine) {
      const savedUsage = localStorage.getItem(`dobby-usage-${user.uid}`)
      if (savedUsage) {
        const parsed = JSON.parse(savedUsage)
        const lastReset = new Date(parsed.lastReset)
        const today = new Date()
        
        if (lastReset.toDateString() === today.toDateString()) {
          setUsage({ dailyCalls: parsed.dailyCalls || 0, lastReset })
        } else {
          setUsage({ dailyCalls: 0, lastReset: today })
          localStorage.setItem(`dobby-usage-${user.uid}`, JSON.stringify({ dailyCalls: 0, lastReset: today }))
        }
      } else {
        const today = new Date()
        setUsage({ dailyCalls: 0, lastReset: today })
        localStorage.setItem(`dobby-usage-${user.uid}`, JSON.stringify({ dailyCalls: 0, lastReset: today }))
      }
      setSubscription(FREE_TIER) // Demo mode always free tier
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true)
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const data = userSnap.data()
          setSubscription(data.tier === 'pro' ? PRO_TIER : FREE_TIER)
          
          // Check if we need to reset daily counter
          const lastReset = data.usage?.lastReset?.toDate?.() || new Date(0)
          const today = new Date()
          const isSameDay = lastReset.toDateString() === today.toDateString()
          
          if (isSameDay) {
            setUsage({
              dailyCalls: data.usage?.dailyCalls || 0,
              lastReset: lastReset
            })
          } else {
            // Reset counter for new day
            setUsage({ dailyCalls: 0, lastReset: today })
            await updateDoc(userRef, {
              'usage.dailyCalls': 0,
              'usage.lastReset': serverTimestamp()
            })
          }
        } else {
          // Create new user document
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            tier: 'free',
            createdAt: serverTimestamp(),
            usage: {
              dailyCalls: 0,
              lastReset: serverTimestamp()
            }
          })
          setSubscription(FREE_TIER)
          setUsage({ dailyCalls: 0, lastReset: new Date() })
        }
      } catch (error) {
        // Only log error if not offline (expected to fail when offline)
        if (!isOffline && !isDemoMode) {
          console.error('Error fetching subscription:', error)
        }
        // Fallback to local storage on error
        const today = new Date()
        setUsage({ dailyCalls: 0, lastReset: today })
        setSubscription(FREE_TIER)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, isAuthenticated, subscription.maxSavedDesigns, isOffline, isDemoMode])

  // Increment API call counter
  const incrementApiCall = useCallback(async () => {
    if (!isAuthenticated || !user) return false

    // Offline mode - use localStorage (also check navigator.onLine as safeguard)
    if (isOffline || isDemoMode || !navigator.onLine) {
      const currentCalls = usage.dailyCalls
      if (currentCalls >= FREE_TIER.dailyApiCalls) {
        return false // Limit exceeded
      }
      const newCount = currentCalls + 1
      const today = new Date()
      setUsage({ dailyCalls: newCount, lastReset: today })
      localStorage.setItem(`dobby-usage-${user.uid}`, JSON.stringify({ dailyCalls: newCount, lastReset: today }))
      return true
    }

    try {
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      
      if (!userSnap.exists()) return false

      const data = userSnap.data()
      const currentCalls = data.usage?.dailyCalls || 0
      const tier = data.tier === 'pro' ? PRO_TIER : FREE_TIER

      if (currentCalls >= tier.dailyApiCalls) {
        return false // Limit exceeded
      }

      await updateDoc(userRef, {
        'usage.dailyCalls': currentCalls + 1
      })

      setUsage(prev => ({ ...prev, dailyCalls: currentCalls + 1 }))
      return true
    } catch (error) {
      // Only log error if not offline (expected to fail when offline)
      if (!isOffline && !isDemoMode) {
        console.error('Error incrementing API call:', error)
      }
      // Fallback to local tracking
      const currentCalls = usage.dailyCalls
      const newCount = currentCalls + 1
      const today = new Date()
      setUsage({ dailyCalls: newCount, lastReset: today })
      localStorage.setItem(`dobby-usage-${user.uid}`, JSON.stringify({ dailyCalls: newCount, lastReset: today }))
      return true
    }
  }, [user, isAuthenticated, isOffline, isDemoMode, usage.dailyCalls])

  // Check if user can make API call
  const canMakeApiCall = useCallback(() => {
    return usage.dailyCalls < subscription.dailyApiCalls
  }, [usage.dailyCalls, subscription.dailyApiCalls])

  // Get remaining calls
  const getRemainingCalls = useCallback(() => {
    return Math.max(0, subscription.dailyApiCalls - usage.dailyCalls)
  }, [subscription.dailyApiCalls, usage.dailyCalls])

  // Upgrade to pro (placeholder - integrate with Stripe later)
  const upgradeToPro = useCallback(async () => {
    if (!isAuthenticated || !user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, { tier: 'pro' })
      setSubscription(PRO_TIER)
    } catch (error) {
      console.error('Error upgrading:', error)
      throw error
    }
  }, [user, isAuthenticated])

  const value = {
    subscription,
    usage,
    loading,
    incrementApiCall,
    canMakeApiCall,
    getRemainingCalls,
    upgradeToPro,
    isPro: subscription.name === 'pro'
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
