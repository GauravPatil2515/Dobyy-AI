---
title: pantoneData
type: module-doc
tags: [utils, pantone, color, matching]
status: active
date: 2026-06-23
---

# pantoneData

**File:** `src/utils/pantoneData.js`

Pantone TCX (Textile Color Exchange) nearest-match lookup.

## Data

`PANTONE_TCX` — Array of 200 fashion/textile colors:
```js
['19-1664', 'Red', '#CC2211']
['19-3950', 'Black Iris', '#1B1F5E']
...
```

## Exports

### `nearestPantone(hex)`

Returns: `{ code, name, pantoneHex, delta }`

Algorithm: Euclidean distance in RGB space across all 200 entries.

```js
nearestPantone('#cc2211') → { code: '19-1664', name: 'Red', pantoneHex: '#CC2211', delta: 0 }
```

## Use Cases

- PDF Tech Sheet: shows nearest Pantone for each stripe
- FabricCanvas: hover tooltip on color swatches
- Mill-ready color specification
