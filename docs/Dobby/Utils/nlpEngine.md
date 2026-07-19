---
title: nlpEngine
type: module-doc
tags: [utils, nlp, local, presets, colors]
status: active
date: 2026-06-23
---

# nlpEngine

**File:** `src/utils/nlpEngine.js`

Local NLP engine for handling user input without API calls.

## Exports

### `nlp(text, state)`

**Parameters:**
- `text` — User input string
- `state` — Current fabric state

**Returns:** `{ state, reply, intent }`

## Matching Order

1. **Presets** — "royal stewart", "black watch", "burberry", etc.
2. **Weave types** — "plain weave", "satin", "twill", "2/1", "basket", "hopsack"
3. **Thread size** — "very fine" → 4, "finer" → -2, "bolder" → +2, "zoom in/out" → ±3
4. **Repeats** — "more repeats" → +1, "fewer repeats" → -1, "N repeats" → exact
5. **Sett modifiers** — "invert", "double stripe", "half stripe"
6. **Color parsing (2+)** — Builds sett from named colors with proportional thread counts
7. **Color tint (1)** — Blends single color across existing sett
8. **Fallback** — Returns help text with examples

## Color Mapping

Uses `src/data/colors.js` — 40+ textile-accurate colors:
- navy → #003399, red → #cc2211, green → #005522
- black → #111111, white → #ffffff, gold → #ffcc00
- Plus: crimson, teal, burgundy, khaki, coral, indigo, etc.
