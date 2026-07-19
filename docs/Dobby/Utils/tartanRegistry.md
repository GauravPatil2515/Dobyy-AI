---
title: tartanRegistry
type: module-doc
tags: [utils, tartan, api, scottish]
status: active
date: 2026-06-23
---

# tartanRegistry

**File:** `src/utils/tartanRegistry.js`

Scottish Tartans Authority API client.

## API Base

```
https://www.tartanregister.gov.uk/json
```

Free, no authentication required.

## Exports

### `searchTartans(query)`

GET `/json/search?term=<query>`

Returns array of: `{ id, name, sett, palette }` (max 8 results)

### `parseTartanSett(threadcount, palette)`

Parses official threadcount format into Dobby sett:

```
threadcount: "R6 B4 G2 R6"
palette: "R=#cc1122;B=#003399;G=#005522"
→ [{c:'#cc1122', n: 6}, {c:'#003399', n: 4}, {c:'#005522', n: 2}, {c:'#cc1122', n: 6}]
```

Merges adjacent same-color tokens. Returns `null` if fewer than 2 stripes parsed.
