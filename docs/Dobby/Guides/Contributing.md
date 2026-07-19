---
title: Contributing Guide
type: module-doc
tags: [contributing, code-style, pr, git]
status: active
date: 2026-06-23
---

# Contributing Guide

## Code Style

- **React:** Functional components with hooks
- **Styling:** CSS classes (no inline styles), design tokens from `main.css`
- **Naming:** `PascalCase` components, `camelCase` functions, `kebab-case` CSS classes
- **Imports:** React first, then external libs, then internal modules
- **File size:** Keep under 300 lines; split if growing beyond

## Branching

- `main` — production-ready
- `fix/<description>` — bug fixes
- `feat/<description>` — new features
- `refactor/<description>` — code restructuring

## Commit Convention

```
type: concise subject

Types: fix:, feat:, refactor:, docs:, chore:
```

## Pull Request Checklist

1. `npm run build` passes
2. No hardcoded secrets or API keys
3. CSS classes instead of inline styles
4. Shared constants in `src/constants.js` (not duplicated)
5. Lazy-load heavy components (Three.js, modals)
6. Update docs in `docs/Dobby/` if adding features

## Bug Fix Workflow

1. Reproduce the issue locally
2. Check sibling call paths for the same flaw
3. Fix root cause, not symptoms
4. Verify with `npm run build`
5. Test on both light and dark themes

## Key Patterns

- **State changes:** Always via `dispatch()` with action type + payload
- **History tracking:** Only `HISTORY_ACTIONS` create undo entries
- **API calls:** Always through `/api/chat` or `/api/openrouter` proxies
- **Offline support:** All Firestore operations have localStorage fallback
- **Theme:** Use CSS variables (`--bg`, `--tx`, `--ac`), never hardcoded colors
