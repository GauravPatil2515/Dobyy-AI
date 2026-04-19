# API Reference

Complete documentation for all external APIs and internal endpoints.

## Groq Chat API

AI fabric design assistant powered by Groq.

### Endpoint
```
POST https://api.groq.com/openai/v1/chat/completions
```

### Proxied Through
```
POST /api/chat (Vercel serverless function)
```

### Authentication
```
Authorization: Bearer GROQ_API_KEY
```

### Model
```
llama-3.3-70b-versatile
```

### Request Body
```javascript
{
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.7,
  "max_tokens": 512,
  "messages": [
    {
      "role": "system",
      "content": "<fabric context>"
    },
    {
      "role": "user",
      "content": "autumn forest tartan"
    }
  ]
}
```

### Response Format
```javascript
{
  "choices": [
    {
      "message": {
        "content": "{\"sett\": [...], \"weave\": \"...\", ...}"
      }
    }
  ]
}
```

### Expected JSON in Response
The AI returns JSON with these fields:
```javascript
{
  "reply": "Beautiful autumn design with warm forest tones.",
  "sett": [
    {"c": "#8B4513", "n": 12},
    {"c": "#228B22", "n": 8},
    {"c": "#FFD700", "n": 4},
    {"c": "#111111", "n": 2}
  ],
  "weave": "twill22",
  "threadSize": 8,
  "repeats": 3,
  "intent": "colors: browns, greens, golds"
}
```

### Error Responses
```javascript
{
  "error": {
    "type": "authentication_error",
    "message": "Invalid API key"
  }
}
// HTTP 401
```

### Rate Limits (Groq Free Tier)
- **30 requests per minute**
- **6000 tokens per minute**
- Sufficient for normal usage

### Timeout
30 seconds per request (Vercel function limit)

---

## Groq Vision API

Image analysis for extracting fabric designs from photos.

### Endpoint
```
POST https://api.groq.com/openai/v1/chat/completions
```

### Model
```
meta-llama/llama-4-scout-17b-16e-instruct
```

### Request Format (Multimodal)
```javascript
{
  "model": "meta-llama/llama-4-scout-17b-16e-instruct",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,/9j/4AAQSkZ..."
          }
        },
        {
          "type": "text",
          "text": "Analyze this fabric. Return JSON: {sett: [...], weave: '...', description: '...', confidence: 0.0-1.0}"
        }
      ]
    }
  ]
}
```

### Response
```javascript
{
  "sett": [
    {"c": "#CC0000", "n": 8},
    {"c": "#000000", "n": 2},
    {"c": "#003366", "n": 6},
    {"c": "#000000", "n": 2}
  ],
  "weave": "twill22",
  "description": "Classic red and navy tartan with black accents",
  "confidence": 0.92
}
```

### Image Requirements
- **Format:** JPG, PNG, WebP, GIF
- **Max size:** 20 MB (Groq limit)
- **Min resolution:** 100×100 px
- **Max resolution:** Unlimited (downsampled internally)

### Accuracy
- **Professional photographs:** 85–95% accuracy
- **Fashion/fabric images:** 70–85% accuracy
- **Low-quality phone photos:** 50–70% accuracy

---

## Vercel Serverless Function: /api/chat.js

Proxies Groq API calls server-side to keep API key safe.

### Location
```
/api/chat.js
```

### Method
```
POST
```

### Request
```javascript
{
  "model": "llama-3.3-70b-versatile",
  "messages": [],
  "temperature": 0.7,
  "max_tokens": 512
}
```

### Response
Direct pass-through of Groq API response.

### Environment Variables
```
GROQ_API_KEY          → Used by serverless function
VITE_GROQ_API_KEY     → Fallback (should match GROQ_API_KEY)
```

### Headers Set
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### CORS
✅ Enabled for cross-origin requests

### Error Handling
```javascript
// API key missing
{
  "error": "API key not configured",
  "statusCode": 500
}

// Invalid request
{
  "error": "<Groq error message>",
  "statusCode": 400
}

// Network timeout
{
  "error": "Network error: <details>",
  "statusCode": 500
}
```

### Function Configuration (vercel.json)
```json
{
  "functions": {
    "api/chat.js": {
      "maxDuration": 30
    }
  }
}
```

---

## Scottish Tartan Registry API

(Note: Currently using local preset data, not live API)

### If Implementing Live API
```
Endpoint: https://www.tartanregister.gov.uk/api/tartan/search
Method:   GET
Query:    ?name=Stewart
```

### Current Implementation
- Local JSON array of 100+ tartans
- Bundled with app (no runtime API call)
- Located in: `src/data/presets.js`

### Tartan Data Structure
```javascript
{
  "id": 123,
  "name": "Royal Stewart",
  "sett": "R/6 K/2 G/4 K/2 Y/2 K/2",
  "description": "The most popular tartan in the world",
  "color_notation": true,
  "threadCount": 20,
  "weaveType": "twill22"
}
```

---

## Internal Utilities

### sett.js

#### expandSett(sett)
Converts compact sett to full thread array with reflective repeat.

```javascript
function expandSett(sett: Array<{c, n}>): Array<string>

// Input
[{c: "#CC0000", n: 4}, {c: "#000000", n: 2}]

// Output (reflective)
[
  "#CC0000", "#CC0000", "#CC0000", "#CC0000",
  "#000000", "#000000",
  "#000000", "#000000",
  "#CC0000", "#CC0000", "#CC0000", "#CC0000"
]
```

### weaveMatrix.js

#### makeWeaveMatrix(weave, size)
Generates binary interlace pattern.

```javascript
// Input
makeWeaveMatrix("twill22", 8)

// Output
[
  [1, 0, 0, 1, 1, 0, 0, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  ...
]
```

#### getCachedMatrix(weave, size)
Memoized version preventing recalculation.

### colorUtils.js

#### hexToRgb(hex)
```javascript
hexToRgb("#FF9933") → {r: 255, g: 153, b: 51}
```

#### blendColors(color1, color2, ratio)
```javascript
blendColors("#FF0000", "#0000FF", 0.7)
→ Color that's 70% red, 30% blue
```

### notation.js

#### toSettNotation(sett)
```javascript
toSettNotation([
  {c: "#FF0000", n: 6},
  {c: "#000000", n: 2},
  {c: "#009900", n: 4}
])
→ "R/6 K/2 G/4"
```

#### parseSettNotation(text)
```javascript
parseSettNotation("R/6 K/2 G/4")
→ [
  {c: "#FF0000", n: 6},
  {c: "#000000", n: 2},
  {c: "#009900", n: 4}
]
```

### imageAnalysis.js

#### extractDominantColors(imageElement, k)
K-means clustering to find primary colors.

```javascript
extractDominantColors(imgEl, k=6)
→ ["#8B4513", "#228B22", "#FFD700", ...]
```

#### detectSettFromImage(imageElement, colors)
Band detection for thread width estimation.

```javascript
detectSettFromImage(imgEl, ["#8B", "#2B", ...])
→ [{c: "#8B4513", n: 8}, {c: "#228B22", n: 6}, ...]
```

### wif.js

#### toWIF(state)
Exports design as WIF 1.1 format.

```javascript
toWIF({sett, weave, epi, ppi, threadSize})
→ WIF text string (ready for download)
```

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 401 | Invalid API key | Check `GROQ_API_KEY` env var |
| 404 | Endpoint not found | Check `/api/chat` deployment |
| 429 | Rate limit exceeded | Wait 60s, try again |
| 500 | Server error | Check Vercel logs |
| 503 | Service unavailable | Groq API down, retry later |

---

## CORS & Security

### Cross-Origin Requests
✅ **Enabled:** Browser can call `/api/chat` from any origin

```
Access-Control-Allow-Origin: *
```

### API Key Security
⚠️ **Never** send `GROQ_API_KEY` in client code  
✅ **Always** proxy through serverless function `(/api/chat)`

### HTTPS
✅ All requests use HTTPS (Vercel enforces)

---

## Rate Limiting Strategy

Since Groq free tier has strict limits (30 req/min):

1. **Debounce chat input** — Wait for user to finish typing
2. **Cache responses** — Don't resend identical requests
3. **Batch multiple changes** — One request per design intent, not per keystroke
4. **Show rate limit message** — "Try again in X seconds"

---

## Testing APIs Locally

### Using curl
```bash
curl -X POST http://localhost:5173/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{
      "role": "user",
      "content": "red and navy tartan"
    }]
  }'
```

### Using fetch in browser console
```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'system',
      content: 'You are a fabric designer.'
    }, {
      role: 'user',
      content: 'autumn tartan'
    }]
  })
}).then(r => r.json()).then(d => console.log(d))
```

---

## Monitoring

### Vercel Logs
Check `/api/chat` function logs:
1. Vercel Dashboard → Deployments
2. Click latest deploy → Functions tab
3. Click `/api/chat.js` → View logs

### Groq Usage
Monitor API key usage:
1. https://console.groq.com
2. Dashboard → API Usage
3. See requests/tokens per day

### Client Errors
Browser DevTools → Network tab:
- Monitor `/api/chat` requests
- Check response times (2–5s normal)
- Look for 4xx/5xx errors
