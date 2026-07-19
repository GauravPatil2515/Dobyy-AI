---
title: imageAnalyzer
type: module-doc
tags: [utils, image, vision, openrouter, kmeans]
status: active
date: 2026-06-23
---

# imageAnalyzer

**File:** `src/utils/imageAnalyzer.js`

Image upload → color extraction pipeline.

## Exports

### `fileToBase64(file)`

Resizes image to max 512px, returns base64 JPEG (85% quality).

### `localKMeansExtract(imageData)`

Fallback color extraction (16×16 grid sampling):
1. Downsample to 16×16
2. Filter near-white (>240) and near-black (<15)
3. Cluster by Manhattan distance < 60
4. Take top 6 by frequency
5. Map cluster size to thread count (proportional)

### `analyzeImageWithGroq(base64Data, onProgress)`

Main analysis function:
1. Check for API key (meta tag, window global, env var, or fallback)
2. POST to `/api/openrouter` with image
3. Parse response (4 strategies: direct JSON, regex, code block, manual)
4. Validate and sanitize
5. Fallback to k-means on any error

### `buildAnalysisMessage(sett, weave, confidence, description)`

Formats analysis result as chat message with inline color swatches.
