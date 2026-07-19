---
title: Adding Weave Types
type: module-doc
tags: [weave, canvas, development, extension]
status: active
date: 2026-06-23
---

# Adding Weave Types

Guide to adding a new weave pattern to Dobby Studio.

## Step 1: Add Matrix Formula

In `src/utils/weaveUtils.js`, add a case to `weaveMatrix()`:

```js
if(type==='myNewWeave') return (i+j)%3===0 ? 1 : 0
```

The function returns a `size × size` 2D array where:
- `1` = warp thread is up (warp floats on top)
- `0` = weft thread is up (weft floats on top)

## Step 2: Add Shaft Count

In `shaftCount()`:

```js
myNewWeave: 3  // number of shafts required
```

## Step 3: Add WIF Tieup

In `wifTieup()`:

```js
myNewWeave: ['1=1,2', '2=2,3', '3=3=1']  // shaft → treadle mapping
```

## Step 4: Add Labels

In `src/constants.js`:

```js
// WEAVE_LABELS
myNewWeave: 'My New Weave'

// WEAVES array
{ v: 'myNewWeave', l: 'My New Weave' }
```

## Step 5: Add to NLP Engine (Optional)

In `src/utils/nlpEngine.js`, add keyword matching:

```js
if(t.includes('my new keyword'))
  return { state:{...S,weave:'myNewWeave'}, reply:'Switched to my new weave.', intent:'weave → myNewWeave' }
```

## Step 6: Validate

1. Run `npm run dev`
2. Select new weave from sidebar dropdown
3. Verify fabric renders correctly
4. Check all 4 view modes (Fabric, Draft, Peg, Drape)
5. Test WIF export includes correct tieup
6. Test share link encodes/decodes correctly

## Common Pitfalls

- **Matrix must be square** — `weaveMatrix(type, size)` generates `size × size`
- **Pattern must repeat** — the matrix tiles across the full canvas via `matrix[i % size][j % size]`
- **Satin weaves** need exactly 1 warp up per every N threads
- **Twill weaves** need a diagonal progression pattern
