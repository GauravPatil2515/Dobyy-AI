---
title: Gallery Component
type: module-doc
tags: [react, gallery, firestore, ui]
status: active
date: 2026-06-23
---

# Gallery Component

**File:** `src/components/Gallery.jsx`

Saved designs manager with save, load, rename, and delete.

## Props

```ts
{
  gallery: GalleryEntry[],
  activeId: string | null,
  onSave: (name?: string) => Promise<Design>,
  onLoad: (entry: GalleryEntry) => Promise<void>,
  onRemove: (id: string) => Promise<void>,
  onRename: (id: string, name: string) => Promise<void>,
  loading: boolean,
  canSaveMore: boolean,
  maxDesigns: number,
}
```

## Features

- **Save Input** — Name field + save button (💾)
- **Design Count** — Shows `gallery.length/maxDesigns`
- **Mini Previews** — Stripe thumbnails for each saved design
- **Rename** — Double-click name to edit inline
- **Delete** — × button with stopPropagation
- **Active Highlight** — Blue border on currently loaded design

## Offline Support

Gallery data persists to `localStorage` as fallback. When offline, all CRUD operations work locally and sync when back online.
