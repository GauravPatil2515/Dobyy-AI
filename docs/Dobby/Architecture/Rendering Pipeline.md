---
title: Rendering Pipeline
type: module-doc
tags: [canvas, rendering, weave, three.js]
status: active
date: 2026-06-23
---

# Rendering Pipeline

The fabric is rendered to an HTML `<canvas>` element using a multi-pass approach.

## Pipeline Stages

Located in `src/hooks/useFabricRenderer.js` → `renderFabric()`.

### Pass 1 — Optical Color Blend

For each pixel `(i, j)` in the total canvas:
- Look up weave matrix value: `matrix[i % size][j % size]`
- Get warp color (column) and weft color (row) from expanded thread array
- Blend with 70/30 ratio based on whether warp is "up"
- Fill 1px × 1px rectangle

### Pass 2 — Twill Strokes + Highlights

For each pixel:
- Draw lighter stroke line (top-left to bottom-right, 0.46 alpha)
- Draw darker stroke line (bottom-left to top-right, 0.36 alpha)
- Line width scales with thread size: `ts * 0.15` and `ts * 0.12`

### Pass 3 — Specular Highlights

Only when `ts >= 8` and warp is up:
- Radial gradient centered at `(ts*0.3, ts*0.27)`
- White center (0.32 alpha) fading to transparent
- Creates "thread bump" illusion

### Pass 4 — Shadow Grid

Only when `ts >= 6`:
- Subtle black grid lines (0.07 alpha, 0.5px width)
- Creates cell boundaries between threads

### Pass 5 — Fiber Noise Overlay

- Pre-computed 256×256 noise canvas (`getFiberCanvas()`)
- Generated from 4 overlapping sine waves at different frequencies
- Applied via `multiply` blend mode at 0.11 alpha
- Creates textile texture across entire fabric

### Pass 6 — Vignette

- Radial gradient from center
- Transparent center (28% of min dimension) to 8% black at edges (75% of max)
- Subtle depth effect

## Weave Matrix

Located in `src/utils/weaveUtils.js` → `weaveMatrix(type, size)`.

Generates a `size × size` 2D array where `1` = warp up, `0` = weft up.

| Type | Formula | Shafts |
|------|---------|--------|
| twill22 | `(i+j)%4<2` | 4 |
| twill21 | `(i+j)%3<2` | 3 |
| plain | `(i+j)%2` | 2 |
| satin5 | `(i+j)%5===0` | 5 |
| twill31 | `(i+j)%4<3` | 4 |
| basket2 | `(floor(i/2)+floor(j/2))%2` | 2 |
| hopsack | `(floor(i/2)+j)%2` | 2 |

## 3D Drape View

Lazy-loaded Three.js scene (`src/components/DrapeView.jsx`):
- Plane geometry (40×40 segments) with sine-wave vertex displacement
- Multi-wave drape: `sin(x*1.8)*0.12 + sin(y*1.2)*0.09 + cos((x+y)*0.9)*0.05 + sin(x*3.5)*0.03`
- Canvas texture mapped onto MeshStandardMaterial (roughness 0.88, metalness 0.02)
- Subtle auto-rotation: `sin(t*0.4)*0.18` on Y axis
- Texture rebuilds debounced (100ms) on state changes

## Performance Notes

- `useMemo` for `expandSett` and `weaveMatrix` (recompute only on change)
- `requestAnimationFrame` for render scheduling
- Canvas dimensions: `totalThreads × ts` pixels per side
- At max settings (22px, 12 reps, 20 threads): ~2640×2640 canvas (7MP)
