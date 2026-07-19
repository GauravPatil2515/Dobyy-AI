---
title: Export Formats
type: module-doc
tags: [export, png, json, wif, pdf, pantone]
status: active
date: 2026-06-23
---

# Export Formats

Dobby Studio supports 4 export formats from the canvas toolbar.

## PNG

**Function:** `exportPNG(canvas)` in `src/components/FabricCanvas.jsx`

- Direct `canvas.toDataURL('image/png')`
- Downloads as `dobby-studio-<timestamp>.png`
- Resolution: `(totalThreads × ts) × (totalThreads × ts)` pixels
- At max settings: 2640×2640 (7 megapixels)

## JSON

**Function:** `exportJSON(state)` in `src/components/FabricCanvas.jsx`

```json
{
  "name": "Dobby Studio Export",
  "date": "2026-06-23T...",
  "sett": [{"c": "#cc2211", "n": 6}, ...],
  "weave": "twill22",
  "ts": 8,
  "reps": 3
}
```

## WIF (Weaving Interchange Format)

**Function:** `exportWIF(state)` in `src/components/FabricCanvas.jsx`

Standard `.wif` file readable by loom software:

```
[WIF]
Version=1.1
[CONTENTS]
Color Palette=true
Threading=true
Tieup=true
Weft Colors=true
[COLOR TABLE]
1=204,34,17
2=17,17,17
...
[THREADING]
1=1
2=2
...
[TIEUP]
1=1,3
2=2,4
...
[WEFT COLOR TABLE]
1=204,34,17
...
```

## PDF Tech Sheet

**Function:** `exportPDFTechSheet(state, canvas)` in `src/utils/pdfExport.js`

Generates a professional A4 tech sheet for mills/buyers:

- Header: Logo, reference number, date
- Fabric spec: weave structure, shafts, total threads, stripe count
- Thumbnail: 140×140px fabric preview
- Color table: hex, thread count, percentage, nearest Pantone TCX, match quality (Δ)
- Footer: disclaimer about Pantone approximation

Uses `window.open()` + `window.print()` — no PDF library needed.
