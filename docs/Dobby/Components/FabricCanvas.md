---
title: FabricCanvas Component
type: module-doc
tags: [react, canvas, rendering, ui]
status: active
date: 2026-06-23
---

# FabricCanvas Component

**File:** `src/components/FabricCanvas.jsx`

Central canvas area with 4 view modes and export toolbar.

## Props

```ts
{
  state: FabricState,
  dispatch: Dispatch,
}
```

## View Modes

| Panel | Component | Description |
|-------|-----------|-------------|
| `fabric` | `<canvas>` + Pantone tooltips | Realistic weave rendering |
| `draft` | `<DraftGrid>` | Threading diagram + tieup + interlock |
| `peg` | `<PegPlan>` | Peg plan for loom setup |
| `drape` | `<DrapeView>` (lazy) | Three.js 3D cloth simulation |

## Export Buttons

| Button | Format | Function |
|--------|--------|----------|
| ⬇ PNG | PNG | `exportPNG(canvas)` |
| ⬇ JSON | JSON | `exportJSON(state)` |
| ⬇ WIF | WIF | `exportWIF(state)` |
| ⬇ PDF Sheet | PDF | `exportPDFTechSheet(state, canvas)` |
| 🔗 Share | URL | `copyShareLink(state)` |

## Zoom Controls

+/− buttons dispatch `SET_TS` with ±2px delta (clamped 4-22).

## Status Bar

Shows: Ready indicator, total threads, weave type, shaft count, ts × reps.

## Pantone Tooltips

Below fabric canvas, each stripe shows a color swatch. Hover reveals nearest Pantone TCX match with Δ distance.
