---
title: groqClient
type: module-doc
tags: [utils, groq, llm, ai]
status: active
date: 2026-06-23
---

# groqClient

**File:** `src/utils/groqClient.js`

Groq LLM client with system prompt and JSON response parsing.

## Exports

### `askGroq(messages, currentState, isPro)`

Sends a chat completion request to `/api/chat`.

**Parameters:**
- `messages` — Array of `{ role, content }` conversation messages
- `currentState` — Current fabric state (sett, weave, ts, reps)
- `isPro` — Boolean, sent as `X-User-Tier` header

**Returns:** Parsed JSON object with `{ reply, action, sett, weave, ts, reps, intent }`

## System Prompt

Expert fabric designer persona enforcing JSON-only responses. Key rules:
- Always valid JSON, no markdown
- Sett: 2-10 stripes, each with hex color + thread count (2-16 accent, 8-24 main)
- Include dark anchor color unless pastel
- Only change weave/ts/reps if explicitly requested
- Thread size adjustments: "finer" → -2, "bolder" → +2

## Response Parsing

1. Strip markdown code fences
2. Direct JSON.parse attempt
3. Regex extraction: `\{[\s\S]*\}`
4. Throw error if all strategies fail
