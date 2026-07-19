---
title: Sidebar Component
type: module-doc
tags: [react, sidebar, ui]
status: active
date: 2026-06-23
---

# Sidebar Component

**File:** `src/components/Sidebar.jsx`

Left panel with sett builder, gallery, registry search, presets, and weave controls.

## Props

```ts
{
  state: FabricState,
  dispatch: Dispatch,
  className: string,
  gallery: GalleryEntry[],
  galleryActiveId: string | null,
  onSave: (name?: string) => Promise<Design>,
  onLoad: (entry: GalleryEntry) => Promise<void>,
  onRemove: (id: string) => Promise<void>,
  onRename: (id: string, name: string) => Promise<void>,
  galleryLoading: boolean,
  canSaveMore: boolean,
  maxDesigns: number,
}
```

## Sections

1. **SettBuilder** — Stripe editor (embedded component)
2. **Gallery** — Saved designs list (embedded component)
3. **RegistrySearch** — Scottish Tartans Authority search (embedded component)
4. **Presets** — 8 classic tartan presets with mini swatches
5. **Weave & Scale** — Weave type dropdown, thread size slider (4-22), repeats slider (1-12)
