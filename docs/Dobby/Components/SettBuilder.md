---
title: SettBuilder Component
type: module-doc
tags: [react, dnd, sett, stripes, ui]
status: active
date: 2026-06-23
---

# SettBuilder Component

**File:** `src/components/SettBuilder.jsx`

Drag-and-drop stripe editor for the fabric sett (color pattern).

## Props

```ts
{
  sett: Stripe[],
  dispatch: Dispatch,
  totalThreads: number,
}
```

## Features

- **Sett Bar Preview** — Horizontal stripe visualization at top
- **Sortable List** — Each stripe row is draggable (dnd-kit)
- **Color Picker** — Click swatch to open native color input
- **Thread Count Input** — Number input (1-32) with validation
- **Delete Button** — Remove stripe (disabled when only 1 stripe)
- **Add Stripe Button** — Adds default gray stripe

## dnd-kit Integration

Uses `@dnd-kit/core` + `@dnd-kit/sortable`:
- `PointerSensor` with 4px activation constraint
- `KeyboardSensor` with `sortableKeyboardCoordinates`
- `DragOverlay` for visual feedback during drag
- Stable `id` on each stripe for `useSortable` key

## Stripe Row Structure

```
┌─────────────────────────────────────────────┐
│ ⠿  ■ #cc2211  [  6]  6t  × │
│   drag  color   count  label  delete │
└─────────────────────────────────────────────┘
```
