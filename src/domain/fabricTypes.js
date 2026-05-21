/**
 * Central JSDoc type definitions for Dobyy-AI.
 * Import these in any file for IDE autocomplete and documentation.
 */

/**
 * @typedef {Object} SettStripe
 * @property {string} c - hex color e.g. "#cc2211"
 * @property {number} n - thread count 1–32
 */

/**
 * @typedef {'plain'|'twill22'|'twill21'|'satin5'|'twill31'|'basket2'|'hopsack'} WeaveType
 */

/**
 * @typedef {Object} FabricState
 * @property {SettStripe[]} sett
 * @property {WeaveType} weave
 * @property {number} ts           - thread size px (4–22)
 * @property {number} reps         - repeat count (1–12)
 * @property {number} activePreset - preset index or -1
 * @property {'fabric'|'draft'|'peg'|'drape'} panel
 * @property {'light'|'dark'} theme
 * @property {boolean} _dirty      - true = unsaved changes
 */

/**
 * @typedef {'RULE'|'LLM'|'IMAGE'} CommandSource
 */

/**
 * @typedef {Object} CommandResult
 * @property {FabricState} state
 * @property {string} reply
 * @property {CommandSource} source
 * @property {string} intent
 */

/**
 * @typedef {'RATE_LIMIT'|'PARSE_FAILED'|'NETWORK'|'INVALID_STATE'|'EXPORT_FAILED'|'AUTH_REQUIRED'} DomainErrorCode
 */

/**
 * @typedef {Object} ServiceResult
 * @property {boolean} ok
 * @property {*} [data]
 * @property {DomainErrorCode} [errorCode]
 * @property {string} [message]
 */

export const VALID_WEAVES = ['twill22','twill21','plain','satin5','twill31','basket2','hopsack']
export const TS_MIN = 4
export const TS_MAX = 22
export const REPS_MIN = 1
export const REPS_MAX = 12
export const MAX_STRIPES = 10
export const MAX_HISTORY = 50
