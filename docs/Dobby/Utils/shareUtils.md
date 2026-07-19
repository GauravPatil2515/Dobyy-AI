---
title: shareUtils
type: module-doc
tags: [utils, share, url, encoding]
status: active
date: 2026-06-23
---

# shareUtils

**File:** `src/utils/shareUtils.js`

URL share link encoding/decoding for design sharing.

## Exports

### `encodeState(state)`

Fabric state → URL-safe base64 string:
```js
{ sett:[{c:'#cc2211',n:6}], weave:'twill22', ts:8, reps:3 }
→ "eyJzIjpbImNjMjIxMSIsIjYiXSwidyIsInR3aWxsMjIiLCJ0Ijo4LCJyIjozfQ"
```

Strips `#` from hex colors, uses URL-safe base64 (no `+`, `/`, `=`).

### `decodeState(encoded)`

URL-safe base64 → fabric state. Returns `null` on failure.

### `copyShareLink(state)`

Encodes state and copies full URL to clipboard:
```
https://dobyy-ai.vercel.app?d=<encoded>
```
