---
title: OpenRouter Proxy API
type: module-doc
tags: [api, openrouter, vision, image-analysis]
status: active
date: 2026-06-23
---

# OpenRouter Proxy API

**Endpoint:** `/api/openrouter`

Proxies image analysis requests to OpenRouter's Vision API.

## Request

```json
POST /api/openrouter
Content-Type: application/json

{
  "endpoint": "chat/completions",
  "payload": {
    "model": "meta-llama/llama-4-maverick:free",
    "messages": [
      { "role": "system", "content": "You are a textile pattern analysis API..." },
      { "role": "user", "content": [
        { "type": "text", "text": "Analyze this fabric image..." },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }
      ]}
    ],
    "max_tokens": 200,
    "temperature": 0.05
  }
}
```

## Response

```json
{
  "status": 200,
  "ok": true,
  "data": {
    "choices": [{
      "message": {
        "content": "{\"sett\":[{\"c\":\"#cc2211\",\"n\":6}],\"weave\":\"twill22\",\"confidence\":88,\"description\":\"red tartan\"}"
      }
    }]
  }
}
```

## Security

- **Requires a valid Firebase ID token** (`Authorization: Bearer …`); unauthenticated requests get 401.
- Draws from the same per-uid daily quota as `/api/chat` (Free 5 / Pro 100) — `429` when exhausted.
- Endpoint whitelist: `[chat/completions, models]`
- Payload fields whitelist: `[messages, model, temperature, max_tokens, stream]`
- Body size capped at ~2 MB (413 if exceeded)
- CORS scoped to `ALLOWED_ORIGIN`
- Server-side `OPENROUTER_KEY` only

