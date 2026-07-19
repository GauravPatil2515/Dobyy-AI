---
title: LoginPage Component
type: module-doc
tags: [react, login, auth, google]
status: active
date: 2026-06-23
---

# LoginPage Component

**File:** `src/components/LoginPage.jsx`

Login screen with Google sign-in and demo mode.

## Props

None — uses `useAuth()` context directly.

## Features

- **Logo** — SVG checkerboard in glassmorphism card
- **App Name** — "Dobby Studio"
- **Tagline** — "AI-powered fabric & tartan design"
- **Feature List** — Free plan benefits (5 designs/day, 20 saves, PDF, Pantone)
- **Google Sign-In** — White button with Google logo SVG
- **Demo Mode** — Shown when offline, allows trying without auth
- **Offline Detection** — Disables Google button, shows demo option

## Styling

Uses CSS classes (migrated from inline styles in June 2026):
- `login-page` — gradient background
- `login-card` — centered card with shadow
- `login-logo` — glassmorphism icon container
- `login-features` — feature list card
- `login-btn-google` — white Google button
- `login-btn-demo` — transparent offline button
- `login-footer` — terms text
