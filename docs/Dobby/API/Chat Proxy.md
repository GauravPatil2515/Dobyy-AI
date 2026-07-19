---
title: Chat Proxy API
type: module-doc
tags: [api, groq, rate-limiting, serverless]
status: active
date: 2026-06-23
---

# Chat Proxy API

**Endpoint:** `/api/chat`

Vercel serverless function that proxies requests to Groq's OpenAI-compatible API with rate limiting.

## Request

```json
POST /api/chat
Authorization: Bearer <firebase_token>
X-User-Tier: free | pro
Content-Type: application/json

{
  "messages": [
    { "role": "system", "content": "You are Dobby..." },
    { "role": "user", "content": "Current fabric state: ..." },
    { "role": "user", "content": "red and navy tartan" }
  ]
}
```

## Response

```json
{
  "choices": [{
    "message": {
      "content": "{\"reply\":\"Classic red and navy tartan.\",\"action\":\"sett\",...}"
    }
  }]
}
```

## Rate Limiting

- Key: `uid:YYYY-MM-DD` (uid from verified Firebase JWT)
- Free tier: 5 calls/day
- Pro tier: 100 calls/day
- Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Used`, `X-RateLimit-Remaining`
- 429 returned when exceeded

## Security

- CORS scoped to `ALLOWED_ORIGIN`
- Input sanitized: max 20 messages, 4000 char limit per message
- Role whitelist: `[user, assistant, system]`
- Model defaults to `llama3-8b-8192`
- Temperature clamped 0-2, max_tokens clamped 1-4096
