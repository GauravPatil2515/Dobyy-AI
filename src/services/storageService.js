// storageService — single gateway for all localStorage access.
// No component should read/write localStorage directly.
const PREFIX = 'dobby-'

export const uiPrefs = {
  /**
   * @param {string} key
   * @param {*} fallback
   */
  get(key, fallback) {
    try {
      const val = localStorage.getItem(PREFIX + key)
      return val !== null ? JSON.parse(val) : fallback
    } catch {
      return fallback
    }
  },
  /**
   * @param {string} key
   * @param {*} val
   */
  set(key, val) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(val))
    } catch {
      // quota exceeded — silent
    }
  }
}

export const PREF_KEYS = {
  LEFT_WIDTH:  'leftSidebarWidth',
  RIGHT_WIDTH: 'rightSidebarWidth',
  LOCALE:      'locale',
  LANG:        'lang',
}
