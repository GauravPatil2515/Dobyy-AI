---
title: DrapeView Component
type: module-doc
tags: [react, three.js, 3d, cloth, lazy]
status: active
date: 2026-06-23
---

# DrapeView Component

**File:** `src/components/DrapeView.jsx`

Three.js 3D cloth simulation showing fabric draped with realistic folds.

**Lazy-loaded** — Only loads when user switches to Drape tab (~500KB Three.js bundle).

## Props

```ts
{
  state: FabricState,
}
```

## Scene Setup

- **Renderer:** WebGLRenderer with antialias, alpha, shadow maps
- **Camera:** PerspectiveCamera (45° FOV, 3.2 distance)
- **Lights:** Ambient (0.7), Directional (1.2, shadows), Fill (0.4)
- **Background:** Dark (#1a1815)

## Cloth Geometry

PlaneGeometry (2.4 × 3.0, 40×40 segments) with vertex displacement:

```
z = sin(x*1.8 + 0.5) * 0.12
  + sin(y*1.2 - 0.3) * 0.09
  + cos((x+y)*0.9) * 0.05
  + sin(x*3.5) * 0.03
```

## Material

MeshStandardMaterial with:
- `map`: CanvasTexture from `buildFabricTexture(state)`
- `roughness`: 0.88 (fabric-like)
- `metalness`: 0.02
- `side`: DoubleSide

## Animation

Subtle auto-rotation: `sin(t*0.4) * 0.18` on Y axis, gentle X oscillation.

## Texture Updates

Debounced (100ms) on state changes. Rebuilds fabric canvas texture and updates `texture.needsUpdate = true`.
