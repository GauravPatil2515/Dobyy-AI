// Dobby Studio — Standalone Local Stub (Firebase & Remote Auth Removed)
// All design operations run 100% client-side with zero external auth dependencies.

export const app = null
export const analytics = null
export const auth = {
  currentUser: null,
  onAuthStateChanged: (cb) => {
    setTimeout(() => cb(null), 0)
    return () => {}
  },
  signInWithPopup: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
}
export const db = {}
export const googleProvider = {}
