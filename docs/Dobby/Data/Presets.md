---
title: Presets
type: module-doc
tags: [data, presets, tartan, colors]
status: active
date: 2026-06-23
---

# Presets

**File:** `src/data/presets.js`

8 classic tartan presets available in the sidebar.

## Presets

| Index | Name | Meta | Colors | Threads/Repeat |
|-------|------|------|--------|----------------|
| 0 | Royal Stewart | Classic red | Red, black, green, white, gold | 36 |
| 1 | Black Watch | Military green | Black, navy, green | 36 |
| 2 | Burberry | Heritage camel | Camel, white, black, red | 18 |
| 3 | MacGregor | Red & black | Red, black, green | 24 |
| 4 | Dress Stewart | Ceremonial | Red, white, navy, green, gold | 30 |
| 5 | Hunting Stewart | Forest greens | Dark green, black, brown, tan | 28 |
| 6 | Pastel Plaid | Modern soft | Pink, blue, green, yellow, purple | 28 |
| 7 | Bold Navy | Contemporary | Navy, red, white | 20 |

## Data Structure

```js
{
  name: 'Royal Stewart',
  meta: 'Classic red',
  sett: [
    { c: '#cc1122', n: 6 },  // red
    { c: '#111111', n: 2 },  // black
    { c: '#cc1122', n: 2 },  // red
    { c: '#111111', n: 2 },  // black
    { c: '#006633', n: 4 },  // green
    { c: '#111111', n: 2 },  // black
    { c: '#ffffff', n: 2 },  // white
    { c: '#111111', n: 2 },  // black
    { c: '#ffffff', n: 2 },  // white
    { c: '#111111', n: 2 },  // black
    { c: '#ffcc00', n: 2 },  // gold
  ]
}
```

## Loading

Dispatches `SET_PRESET` which re-injects stable IDs into each stripe for dnd-kit.
