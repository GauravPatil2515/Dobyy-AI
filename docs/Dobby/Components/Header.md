---
title: Header Component
type: module-doc
tags: [react, header, ui]
status: active
date: 2026-06-23
---

# Header Component

**File:** `src/components/Header.jsx`

Top navigation bar with logo, undo/redo, language switcher, and profile.

## Props

```ts
{
  state: FabricState,
  dispatch: Dispatch,
  undo: () => void,
  redo: () => void,
  canUndo: boolean,
  canRedo: boolean,
  onMenuToggle: () => void,
  onDesignDropOpen: () => void,
}
```

## Features

- **Logo** — SVG checkerboard icon + "Dobby Studio" text
- **Undo/Redo** — Icon buttons with Ctrl+Z / Ctrl+Y keyboard shortcuts
- **Language Switcher** — EN/HI/GU flags, dispatches `dobby-lang-change` event
- **Badge** — Shows thread count, color count, weave type (e.g., "24T · 5c · 2/2 twill")
- **Variations Button** — Opens DesignDrop modal
- **Theme Toggle** — Light/dark mode switch
- **Profile Dropdown** — User avatar, name, email, sign out button

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
