// DELETED: This file is superseded by useFirestoreGallery.js (FIX #4).
// useFirestoreGallery.js supports Firebase Firestore + localStorage fallback.
// This file is kept as a stub to avoid import errors during transition.
// Safe to remove after confirming no remaining imports.
export function useGallery() {
  console.warn('[useGallery] Deprecated — use useFirestoreGallery instead.')
  return { gallery: [], save: () => {}, load: () => {}, remove: () => {}, rename: () => {}, canSaveMore: false }
}
