---
title: RegistrySearch Component
type: module-doc
tags: [react, tartan, api, search]
status: active
date: 2026-06-23
---

# RegistrySearch Component

**File:** `src/components/RegistrySearch.jsx`

Search and load real tartan patterns from the Scottish Tartans Authority database.

## Props

```ts
{
  dispatch: Dispatch,
}
```

## Features

- **Search Input** — Enter tartan name (e.g., "Stewart", "MacDonald")
- **Results List** — Shows tartan name + unique reference ID
- **Click to Load** — Parses threadcount + palette, dispatches APPLY

## API

Uses `src/utils/tartanRegistry.js`:
- Search: `GET https://www.tartanregister.gov.uk/json/search?term=<query>`
- Parsing: Threadcount format "R6 B4 G2" + palette "R=#cc1122;B=#003399"

## Error Handling

- Shows "No tartans found" for empty results
- Shows "Could not parse sett" if threadcount format is unrecognized
