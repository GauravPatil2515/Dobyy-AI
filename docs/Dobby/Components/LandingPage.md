---
title: LandingPage Component
type: module-doc
tags: [react, landing, intro, animation]
status: active
date: 2026-06-23
---

# LandingPage Component

**File:** `src/components/LandingPage.jsx`

Animated intro screen shown on first visit (sessionStorage-gated).

## Props

```ts
{
  onEnter: () => void,
}
```

## Features

- **Background Canvas** — Animated Royal Stewart tartan weave
- **Light Streaks** — 3 horizontal shine animations (6s cycle)
- **Hero Text** — "Dobby" with gold shimmer gradient
- **Tagline** — "An AI-powered tartan & fabric design tool"
- **Swatch Row** — 10 textile colors
- **CTA Button** — "Enter Studio" with gold gradient
- **B2B Link** — "Request a Demo for your Mill" (mailto)
- **Community Links** — Ravelry + Spoonflower
- **Skip Button** — "Press any key to continue"
- **Language Switcher** — Top-right (EN/HI/GU)

## Animation

- CSS `@keyframes shine` for light streaks
- CSS `@keyframes shimmer` for gold text
- CSS `@keyframes fadeup` for staggered entrance
- Canvas resize handler for tartan background

## Dismissal

Any keypress, button click, or "Enter Studio" triggers `onEnter()` which sets `sessionStorage['dobby-entered']` and hides the landing page.
