---
title: AI Pipeline
type: module-doc
tags: [ai, llm, groq, openrouter, nlp, vision]
status: active
date: 2026-06-23
---

# AI Pipeline

Dobby Studio uses a 3-tier AI system: local NLP, Groq LLM, and OpenRouter Vision.

## Tier 1: Local NLP

Located in `src/utils/nlpEngine.js`.

No API calls needed. Handles:

1. **Presets** — Keyword matching for 8 classic tartans (Royal Stewart, Black Watch, etc.)
2. **Weave types** — "plain weave", "satin", "twill", "2/1", "basket", "hopsack"
3. **Thread size** — "very fine" → 4px, "finer" → -2px, "bolder" → +2px, "zoom in/out" → ±3px
4. **Repeats** — "more repeats" → +1, "fewer repeats" → -1, "3 repeats" → exact number
5. **Sett modifiers** — "invert", "double stripe", "half stripe"
6. **Color parsing** — 40+ named textile colors (navy → #003399, crimson → #b22222, etc.)
7. **Color tinting** — Single color blends across existing sett

Returns: `{ state, reply, intent }` — modified fabric state + chat message.

## Tier 2: Groq LLM

Located in `src/utils/groqClient.js` → `askGroq(messages, currentState, isPro)`.

### System Prompt

Expert fabric designer persona. Enforces JSON-only response:
```json
{
  "reply": "Short friendly message",
  "action": "sett|weave|ts|reps|none",
  "sett": [{"c": "#hex", "n": number}],
  "weave": "twill22",
  "ts": number,
  "reps": number,
  "intent": "description"
}
```

### Request Flow

1. Build context: current sett summary (colors × threads), weave, ts, reps
2. Send system prompt + state context + last 10 messages to `/api/chat`
3. Server proxies to Groq API with rate limiting
4. Parse JSON response (strips markdown fences, extracts from text if needed)
5. Apply validated changes to state via `dispatchRef.current({ type: 'APPLY', newState })`

### Rate Limiting

- Server-side in-memory store in `api/chat.js`
- Key: `uid:YYYY-MM-DD` (verified via Firebase JWT)
- Free: 5 calls/day, Pro: 100 calls/day
- Returns 429 when exceeded

## Tier 3: Image Analysis (OpenRouter Vision)

Located in `src/utils/imageAnalyzer.js`.

### Pipeline

1. **Resize** — Max 512px on longest side, JPEG 85% quality
2. **API Call** — POST to `/api/openrouter` with base64 image
3. **Model** — `meta-llama/llama-4-maverick:free`
4. **Parse** — 4 strategies: direct JSON parse → regex extraction → code block → manual field extraction
5. **Fallback** — Local k-means color extraction (16×16 grid sampling)

### Fallback: Local k-Means

- Downsample image to 16×16 pixels
- Skip near-white (>240) and near-black (<15) backgrounds
- Cluster by Manhattan distance < 60
- Take top 6 clusters by frequency
- Map cluster size to thread count (proportional)

### Response Validation

- Colors must match `^#[0-9a-fA-F]{6}$`
- Thread counts clamped to 1-12
- Minimum 2 stripes required
- Returns confidence score (API: 75-100, fallback: 55-60)
