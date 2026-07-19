---
title: pdfExport
type: module-doc
tags: [utils, pdf, export, tech-sheet, pantone]
status: active
date: 2026-06-23
---

# pdfExport

**File:** `src/utils/pdfExport.js`

Generates professional PDF tech sheets for mill/buyer submission.

## Exports

### `exportPDFTechSheet(state, fabricCanvas)`

Opens a new window with styled HTML that maps to A4 for `window.print()`.

**Includes:**
- Header: "Dobby Studio" logo, reference number (DS-XXXXXX), date
- Fabric spec table: weave, shafts, total threads, stripe count, ts, reps
- Thumbnail: 140×140px fabric preview (from canvas)
- Color table: #, hex, threads, %, nearest Pantone TCX, match quality (Δ)
- Footer: disclaimer about Pantone approximation

**Print:** User clicks "🖨️ Print / Save as PDF" button in the generated window.
