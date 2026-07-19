---
title: Security
type: module-doc
tags: [security, firebase, rate-limiting, cors, firestore]
status: active
date: 2026-07-20
---

# Security

## Token Verification (real RS256 signature check)

**Location:** `api/_auth.js` → `verifyFirebaseToken(authHeader)` (shared by both proxies).

1. Extract Bearer token from `Authorization` header; reject if missing/malformed (≠ 3 parts).
2. Decode JWT header + payload (base64url).
3. Reject unless `header.alg === 'RS256'` and `header.kid` present (blocks `alg: none`).
4. Claim validation (Firebase spec):
   - `exp` must be in the future
   - `iat` not in the future (+5 min clock-skew tolerance)
   - `aud === FIREBASE_PROJECT_ID`
   - `iss === https://securetoken.google.com/<FIREBASE_PROJECT_ID>`
   - `sub` (uid) present and a string
5. **Verify the RSA-SHA256 signature** against Google's public x509 cert for `header.kid`
   (`https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`,
   cached until `cache-control` max-age). Uses Node's built-in `crypto` — no Admin SDK dependency.
6. Return the verified payload; `sub` is the rate-limit key, `tier`/`pro` claim drives the quota tier.

> Requests without a valid token get **401** from both `/api/chat` and `/api/openrouter`.
> The tier is read from the verified token's custom claim — **never** from a client header.

## Rate Limiting

**Location:** `api/_auth.js` → `checkRateLimit(uid, isPro)` (shared by both proxies).

- Key: `ratelimit:<uid>:<YYYY-MM-DD>`
- Limits: **Free = 5/day**, **Pro = 100/day** (tier from verified token claim).
- **Durable store:** when `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Vercel KV) are set, counts live in
  KV with a daily TTL (survives cold starts, shared across all lambda instances). Otherwise falls back
  to an in-memory `Map` (per-instance; resets on cold start — dev/local only).
- Both proxies return `X-RateLimit-Limit` / `X-RateLimit-Used` / `X-RateLimit-Remaining`; the client
  drives its remaining-calls pill from `X-RateLimit-Remaining` so it can't desync from the server.
- A `429` is returned when the daily limit is reached.

## CORS

All API responses include:
```
Access-Control-Allow-Origin: https://dobyy-ai.vercel.app  (scoped, never wildcard)
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Vary: Origin
```
(`X-User-Tier` was removed from the allow-list because tier is no longer client-supplied.)

## Input Sanitization

**`api/chat.js`:**
- Messages array: max 20 messages
- Content: strings only, truncated to 4000 chars
- Role: whitelist `[user, assistant, system]`
- Model: defaults to `llama-3.3-70b-versatile`
- Temperature: clamped 0-2
- Max tokens: clamped 1-4096

**`api/openrouter.js`:**
- Endpoint whitelist: `[chat/completions, models]`
- Payload fields whitelist: `[messages, model, temperature, max_tokens, stream]`
- Body size capped at ~2 MB (413 if exceeded)
- Auth + rate limiting enforced (see above) — no longer an open proxy to the paid key

## Firestore Rules

**Location:** `firestore.rules`

### Users Collection (`/users/{userId}`)
- Read: authenticated user can read own document
- Create: only with `tier: 'free'` (new signup)
- Update: safe fields only (`email`, `displayName`, `photoURL`, `usage`, `updatedAt`)
- **Tier cannot be changed by client** — must go through payment verification
- Delete: denied

### Designs Collection (`/designs/{designId}`)
- Top-level collection (not sub-collection)
- Read/Write: only by `userId` field in document
- Delete: only by `userId` field in document

## Client-Side Secrets
- Firebase config uses `import.meta.env.VITE_FIREBASE_*` (safe to expose)
- Groq API key: server-side only (`GROQ_API_KEY`, never `VITE_` prefixed)
- OpenRouter key: server-side only (`OPENROUTER_KEY`)
- Vercel KV: `KV_REST_API_URL` + `KV_REST_API_TOKEN` (server-side only)
