// Tiny global toast. Call toast(message) from anywhere; mount <Toaster/> once
// at the app root. Replaces native alert() with a styled, auto-dismissing toast.
const subscribers = new Set()

export function toast(message, kind = 'info', ms = 2600) {
  const id = Math.random().toString(36).slice(2)
  subscribers.forEach(fn => fn({ type: 'add', id, message, kind }))
  if (ms) setTimeout(() => {
    subscribers.forEach(fn => fn({ type: 'remove', id }))
  }, ms)
}

export function subscribeToasts(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}
