---
title: DesignDrop Component
type: module-doc
tags: [react, ai, variations, modal, lazy]
status: active
date: 2026-06-23
---

# DesignDrop Component

**File:** `src/components/DesignDrop.jsx`

AI-powered design variations modal. Lazy-loaded (only loads when opened).

## Props

```ts
{
  state: FabricState,
  dispatch: Dispatch,
  onClose: () => void,
}
```

## Features

- **6 Variations** — Generates 6 style variations of current sett:
  1. Darker, moodier version
  2. Lighter, pastel version
  3. More contrasting colors
  4. Analogous color harmony
  5. Complementary colors
  6. Desaturated, heritage tones
- **Stripe Previews** — Each variation shows a mini stripe bar
- **Click to Apply** — Replaces current sett with selected variation
- **Regenerate** — Re-runs all 6 prompts
- **ESC to Close** — Keyboard shortcut
- **Backdrop Click** — Click outside to dismiss

## API Strategy

Batched requests (2 concurrent) to avoid rate-limit thrashing. Each variation is an independent Groq API call.

## State Changes

On apply, dispatches:
```js
dispatch({
  type: 'APPLY',
  newState: { ...state, sett: variation.sett, weave: variation.weave || state.weave, activePreset: -1 }
})
```
