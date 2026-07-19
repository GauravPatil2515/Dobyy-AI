---
title: UpgradeModal Component
type: module-doc
tags: [react, modal, subscription, upsell]
status: active
date: 2026-06-23
---

# UpgradeModal Component

**File:** `src/components/UpgradeModal.jsx`

Pro tier upsell modal shown when user hits daily API limit.

## Props

```ts
{
  onClose: () => void,
  onUpgrade: () => void,
}
```

## Features

- **Progress Bar** — Shows daily usage (e.g., 3/5)
- **Pro Card** — Lists Pro benefits (100 calls, 200 saves, WIF, priority)
- **Pricing** — $9/month
- **CTA** — "Upgrade to Pro" button
- **Dismiss** — "Maybe Later" button
- **Backdrop Click** — Closes modal

## Styling

Uses CSS classes (migrated from inline styles in June 2026):
- `upgrade-modal-header` — centered icon + title
- `upgrade-icon` — gradient icon container
- `upgrade-progress` — usage bar section
- `upgrade-progress-bar` / `upgrade-progress-fill` — animated bar
- `upgrade-pro-card` — bordered pricing card
- `upgrade-pricing` — $9/month display
- `upgrade-actions` — button row
