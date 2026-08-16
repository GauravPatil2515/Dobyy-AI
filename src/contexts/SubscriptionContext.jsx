import { createContext, useContext, useState } from 'react'

const SubscriptionContext = createContext(null)

const PRO_SUBSCRIPTION = {
  plan: 'pro',
  dailyApiCalls: 100,
  maxSavedDesigns: 50
}

export function SubscriptionProvider({ children }) {
  const [subscription] = useState(PRO_SUBSCRIPTION)
  const [apiCallsUsed, setApiCallsUsed] = useState(0)

  const canMakeApiCall = () => true
  const getRemainingCalls = () => Math.max(0, subscription.dailyApiCalls - apiCallsUsed)
  const incrementApiCall = async () => setApiCallsUsed(prev => prev + 1)
  const decrementQuota = async () => setApiCallsUsed(prev => prev + 1)
  const syncServerQuota = () => {}

  const value = {
    subscription,
    usage: {
      count: apiCallsUsed,
      limit: subscription.dailyApiCalls,
      remaining: getRemainingCalls()
    },
    loading: false,
    isPro: true,
    canMakeApiCall,
    getRemainingCalls,
    incrementApiCall,
    decrementQuota,
    syncServerQuota
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
