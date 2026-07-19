---
title: colorUtils
type: module-doc
tags: [utils, color, conversion, blending]
status: active
date: 2026-06-23
---

# colorUtils

**File:** `src/utils/colorUtils.js`

Color conversion and manipulation utilities.

## Exports

### `h2r(hex)`

Hex string → RGB object:
```js
h2r('#cc2211') → { r: 204, g: 34, b: 17 }
```

### `blend(a, b, t)`

Linear interpolation between two colors:
```js
blend({r:204,g:34,b:17}, {r:17,g:17,b:17}, 0.7)
→ { r: 148, g: 29, b: 17 }  // 70% color A, 30% color B
```

### `toRgba(c, a=1)`

RGB object → CSS rgba string:
```js
toRgba({r:204,g:34,b:17}, 0.7) → 'rgba(204,34,17,0.7)'
```

### `lighter(c, v)` / `darker(c, v)`

Add/subtract value from all channels (clamped 0-255):
```js
lighter({r:200,g:100,b:50}, 50) → {r:250,g:150,b:100}
darker({r:200,g:100,b:50}, 30) → {r:170,g:70,b:20}
```

### `hexFromRgb(c)`

RGB object → hex string:
```js
hexFromRgb({r:204,g:34,b:17}) → '#cc2211'
```
