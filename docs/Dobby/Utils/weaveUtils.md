---
title: weaveUtils
type: module-doc
tags: [utils, weave, canvas, matrix, wif]
status: active
date: 2026-06-23
---

# weaveUtils

**File:** `src/utils/weaveUtils.js`

Core weave pattern generation and textile utility functions.

## Exports

### `expandSett(sett)`

Expands stripe array into flat color array:
```js
[{c:'#ccc', n: 4}] → ['#ccc', '#ccc', '#ccc', '#ccc']
```

### `weaveMatrix(type, size)`

Returns `size × size` 2D array. Values: `1` = warp up, `0` = weft up.

| Type | Formula | Shafts |
|------|---------|--------|
| twill22 | `(i+j)%4<2` | 4 |
| twill21 | `(i+j)%3<2` | 3 |
| plain | `(i+j)%2` | 2 |
| satin5 | `(i+j)%5===0` | 5 |
| twill31 | `(i+j)%4<3` | 4 |
| basket2 | `(floor(i/2)+floor(j/2))%2` | 2 |
| hopsack | `(floor(i/2)+j)%2` | 2 |

### `shaftCount(type)`

Returns number of shafts required for the weave type.

### `wifTieup(type)`

Returns WIF-format tieup lines for loom configuration.

### `getFiberCanvas()`

Returns cached 256×256 canvas with procedural fiber noise. Generated from 4 overlapping sine waves:
```js
sin(x*0.9 + y*0.3)*0.35
+ sin(x*2.3 + y*0.8)*0.2
+ sin(x*0.4 + y*3.1)*0.15
+ sin(x*5.1 + y*1.2)*0.08
```
Result: grayscale values 128 ± 110, applied via multiply blend.
