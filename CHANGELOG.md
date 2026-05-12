# Dobby Studio — Full Session Changelog

> **Repository:** [GauravPatil2515/Dobyy-AI](https://github.com/GauravPatil2515/Dobyy-AI)  
> **Session Date:** Tuesday, May 12, 2026  
> **Commits Made:** 2 atomic commits on `main` branch

---

## Overview

This document records every change made to the **Dobby Studio** codebase during this session — a React + Vite AI-powered textile design tool. Changes span correctness fixes, AI quality improvements, new weave structures, and a complete premium CSS overhaul.

---

## Commit 1 — `b47a4fe` · Logic & Feature Fixes

> **Message:** `fix: loom-accurate WIF export, correct shaft counts, memoized renderer, context-aware AI, 3 new weaves, dynamic chips, repeats to 12×`

### 🔴 Correctness Fixes (Product was broken for weavers)

#### 1. WIF Export — Loom-Accurate Tieup (`weaveUtils.js` + `FabricCanvas.jsx`)

**Problem:** The WIF exporter always emitted a hardcoded twill tieup (`1=1,3 / 2=2,4`) regardless of the selected weave structure. A weaver loading a "plain weave" WIF into their loom software would receive twill threading instead.

**Fix:**
- Added `wifTieup(weave)` — generates the correct tieup per weave type:
  - `plain` → 2-shaft tieup
  - `twill` → 4-shaft tieup
  - `satin` → 5-shaft tieup
  - `twill31` → 4-shaft tieup
  - `basket2` / `hopsack` → 2-shaft tieup
- Added missing `[WEFT COLORS]` section — WIF readers require symmetric warp/weft color definitions; absence caused import failures in Fiberworks, WeavePoint, and PixeLoom.

#### 2. Draft Grid — Correct Shaft Count (`FabricCanvas.jsx`)

**Problem:** The threading draft always rendered with 4 shafts regardless of the weave, making plain weave look like a 4-shaft pattern.

**Fix:**
- Added `shaftCount(weave)` utility function.
- Draft grid now renders the correct number of shafts per weave: 2 for plain/basket, 3 for 2/1 twill, 4 for standard twill/twill31, 5 for satin.
- Draft header label updated to display: `"Threading Draft — Plain Weave · 2 shafts"`.

#### 3. Image Upload — Direct Sett Application (`ChatPanel.jsx`)

**Problem:** When a user uploaded a fabric photo, the extracted `result.sett` from `analyzeImageWithGroq` was routed through the LLM as natural language, which would reinterpret and corrupt the sett values.

**Fix:**
- Extracted `result.sett` is now dispatched directly to canvas via `dispatch({ type: 'APPLY' })` before any LLM involvement.
- Eliminates the lossy round-trip: `extracted sett → LLM text → re-interpreted different sett`.

---

### 🟠 Performance & AI Quality Fixes

#### 4. Renderer Memoization (`useFabricRenderer.js`)

**Problem:** The weave matrix and thread array were recomputed on every render, including on every mouse move during drag operations. For a 400×400 canvas, this was an `O(n²)` allocation per frame.

**Fix:**
- `threads` array wrapped in `useMemo(() => expandSett(state.sett), [state.sett])` — only recomputes when sett changes.
- `matrix` computed on a **single tile** (not full canvas size) and memoized on `[weave, tileSize]`.
- Render loop uses `matrix[i % tileSize][j % tileSize]` — constant memory regardless of canvas size.

#### 5. Context-Aware AI (`groqClient.js`)

**Problem:** The LLM had no knowledge of the current canvas state. Prompts like _"add more red"_ or _"make it darker"_ would generate an entirely new design from scratch rather than modifying the existing one.

**Fix:**
- State context now injected as: `"#cc2211×16t, #111111×2t, #003399×8t"` (actual sett) + total thread count.
- Added directive: `"Modify from this state unless user requests a completely new design"`.
- This single change makes all incremental modification prompts work correctly.

---

### 🟢 Content & UX Improvements

#### 6. Three New Weave Structures (`weaveUtils.js` + `Sidebar.jsx` + `groqClient.js`)

Added three weave types with correct implementations:

| Weave | Key | Matrix Formula | Shafts | WIF Tieup |
|-------|-----|----------------|--------|----------|
| 3/1 Twill | `twill31` | `(i+j) % 4 < 3` | 4 | 4-shaft |
| Basket Weave | `basket2` | `Math.floor(i/2+j/2) % 2` | 2 | 2-shaft |
| Hopsack | `hopsack` | `Math.floor(i/2+j/2+1) % 2` | 2 | 2-shaft |

Weave dropdown now shows 7 options (up from 4). LLM prompt updated to recognise all 7 by key name.

#### 7. Thread Count in Sett Builder (`SettBuilder.jsx` + `Sidebar.jsx`)

**Problem:** Users had no feedback on total thread count while building a sett, making it impossible to balance warp/weft without manual counting.

**Fix:**
- Section header now shows: `"Sett Builder — 48 threads / repeat"` with live count.
- Status bar gains a `"4-shaft"` pill so the current shaft count is always visible.

#### 8. Context-Aware Dynamic Chips (`ChatPanel.jsx`)

**Problem:** The suggestion chips were static and always showed the same options regardless of current state.

**Fix:**
- Added `getContextChips(state)` that generates suggestions based on current canvas state:
  - If weave is already `plain`, skip "plain weave" suggestion.
  - If `reps < 6`, suggest "more repeats".
  - If tile size is large, suggest "make it finer".
- Chips refresh automatically on every state change.

#### 9. Repeats Extended to 12× (`Sidebar.jsx` + `useFabricState.js` + `groqClient.js`)

- Slider `min=1 max=12` (was `max=8`).
- Reducer clamp updated: `Math.min(12, ...)`.
- LLM prompt updated to allow `reps 1–12`.

---

## Commit 2 — `e56b75d` · Premium CSS Overhaul

> **Message:** `css: premium overhaul — fix all 24 audit issues, fluid type, proper tokens, dark-mode completeness, UpgradeModal + LoginPage styles, resize handles, gallery thumbs, focus rings`

A full rewrite of `src/styles/main.css` — every style rule now references design tokens.

---

### Token System — Completely Rebuilt

**Added:**
- **9-step fluid type scale** using `clamp()` — `--text-xs` through `--text-hero`
- **10-token 4px spacing system** — `--sp-1` through `--sp-16`
- **6-level radius tokens** — `--r-xs` through `--r-full`
- **2 transition tokens** — `--ease-ui` (180ms) and `--ease-slow` (320ms)
- **4-level shadow tokens** — `--shadow-sm` through `--shadow-xl`, tone-matched per theme
- **Extended palette** — `--ac-h`, `--ac-a`, `--acl2`, `--off2`, `--warn`, `--warnl`, `--err`, `--errl`
- **System preference dark mode fallback** — `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { ... } }`

---

### Fixes by Category

#### Typography (3 fixes)

| # | Before | After |
|---|--------|-------|
| Body font size | `14px` hardcoded | `var(--text-base)` = `clamp(14px→15px)` |
| Section titles | `8px` — below 12px floor | `var(--text-xs)` = `clamp(12px→13px)` |
| `.badge` font | `font-family: monospace` | Inherits `var(--fb)` (DM Sans) |

#### Layout & Interaction (5 fixes)

| # | Before | After |
|---|--------|-------|
| Resize handles | `4px` wide, nearly invisible | `8px` wide + `::after` pseudo-element line (turns green on hover) |
| Section padding | `8px 9px` (asymmetric) | `12px 12px` via `var(--sp-3)` |
| Header height | `52px` | `56px` — better breathing room |
| Gallery thumbs | `44×20px` | `48×24px` with `box-shadow` |
| Chat depth | Same `--surf` as sidebar | Chat panel uses `--surf2` (white) — clear visual hierarchy |

#### Missing CSS Sections (4 new)

**LoginPage** — Was entirely unstyled. Now has complete card layout, input focus glows, Google button, error state.

**UpgradeModal** — Was entirely unstyled. Now has backdrop blur, animated entry, feature list, CTA + dismiss buttons.

**Loading Screen** — Was inline styles in `App.jsx`. Extracted to `.app-loading`, `.app-spinner`.

**Gallery Save Button** — Was unstyled. Now `.gallery-save-btn` — primary dark button with hover + active scale.

#### Dark Mode Completeness (3 fixes)

| # | Issue | Fix |
|---|-------|-----|
| No system pref fallback | Required manual toggle | `@media (prefers-color-scheme: dark)` added |
| Hardcoded light colors | `.stripe-del:hover` used `#fdf0e8` | Now `var(--errl)` / `var(--err)` |
| Dark shadow tokens | Not redefined in dark mode | Explicitly set with higher opacity |

#### Accessibility (4 fixes)

| # | Issue | Fix |
|---|-------|-----|
| No `:focus-visible` | No keyboard focus indicator | `2px solid var(--ac)` + `3px oklch glow` |
| No skip link | Screen readers had no bypass | `.skip-link` slides in on focus |
| `::selection` unstyled | Browser default blue | `oklch(from var(--ac) l c h / 0.22)` |
| Animations missing | `@keyframes spin` only in inline JSX | All 7 keyframes in CSS |

---

## Summary

| Commit | Files Changed | Category | Issues Fixed |
|--------|--------------|----------|--------------|
| `b47a4fe` | 8 source files | Logic + Features | 9 |
| `e56b75d` | `src/styles/main.css` | Design + CSS | 24 |
| **Total** | **9 files** | — | **33** |

---

## Files Changed — Complete List

```
src/
├── styles/
│   └── main.css                ← Full rewrite (commit 2)
├── components/
│   ├── FabricCanvas.jsx        ← WIF tieup, shaft count
│   ├── ChatPanel.jsx           ← Direct sett apply, dynamic chips
│   ├── Sidebar.jsx             ← New weaves dropdown, repeats 12×, thread count
│   └── SettBuilder.jsx         ← Thread count display
├── hooks/
│   ├── useFabricRenderer.js    ← Memoized matrix + threads
│   └── useFabricState.js       ← Repeats clamp 12×
└── utils/
    ├── weaveUtils.js           ← 3 new weaves, wifTieup(), shaftCount()
    └── groqClient.js           ← Context-aware prompts, state injection
```

---

*Generated from session on May 12, 2026 — Dobby Studio (GauravPatil2515/Dobyy-AI)*
