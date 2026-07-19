---
title: Colors
type: module-doc
tags: [data, colors, textile, hex]
status: active
date: 2026-06-23
---

# Colors

**File:** `src/data/colors.js`

Named color → hex mapping for textile/fashion colors.

## Exports

### `COLOR_MAP`

Sorted by key length (longest first) for greedy matching in NLP engine:
```js
{
  'forest green': '#1a5c1a',
  'dark green': '#1a4a1a',
  'olive green': '#6b8e23',
  'dark blue': '#1a2a5a',
  'sky blue': '#4499dd',
  ...
}
```

### `RAW_COLORS`

Unsorted original map.

## Color Count

40+ named colors covering:
- **Reds:** red, crimson, dark red, maroon, burgundy, coral, rose, pink
- **Blues:** navy, dark blue, sky blue, light blue, teal, cyan, indigo
- **Greens:** green, dark green, forest green, olive green, lime, teal
- **Neutrals:** black, white, grey, silver, cream, beige, tan, brown, khaki
- **Yellows:** yellow, gold, orange
- **Purples:** purple, violet, magenta

## Usage

Used by `nlpEngine.js` for color name → hex conversion in natural language input.
