// OpenRouter Proxy API (image / vision analysis)
// Env vars required: OPENROUTER_KEY, ALLOWED_ORIGIN, FIREBASE_PROJECT_ID
// Auth + rate limiting enforced server-side — this proxies a PAID key, so it must
// never be an open endpoint.

import { verifyFirebaseToken, isProToken, checkRateLimit } from './_auth.js';

const ALLOWED_ENDPOINTS = ['chat/completions', 'models'];
// Cap forwarded payload size (base64 images are large) — reject abusive bodies.
const MAX_BODY_CHARS = 2_000_000; // ~2 MB of JSON

export default async function handler(req, res) {
  const OR_KEY = process.env.OPENROUTER_KEY;
  const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://dobyy-ai.vercel.app';

  // Scoped CORS — never wildcard
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OR_KEY) {
    console.error('[OpenRouter Proxy] Missing OPENROUTER_KEY env var');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  // --- Auth: require a valid Firebase ID token ---
  const decodedToken = await verifyFirebaseToken(req.headers['authorization']);
  if (!decodedToken) {
    return res.status(401).json({ error: 'Unauthorized: valid sign-in required' });
  }

  // --- Server-side rate limiting: image analysis draws from the same daily quota ---
  const uid = decodedToken.sub;
  const isPro = isProToken(decodedToken);
  const { allowed, count, limit } = checkRateLimit(uid, isPro);

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Used', count);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

  if (!allowed) {
    return res.status(429).json({
      status: 429,
      ok: false,
      error: 'Daily API limit reached. Upgrade to Pro for more calls.'
    });
  }

  const body = req.body || {};

  // Whitelist endpoint — never trust client-supplied path
  const endpoint = ALLOWED_ENDPOINTS.includes(body.endpoint)
    ? body.endpoint
    : 'chat/completions';

  // Whitelist payload fields forwarded to OpenRouter
  const { messages, model, temperature, max_tokens, stream } = body.payload || {};
  const safePayload = {
    ...(messages   !== undefined && { messages }),
    ...(model      !== undefined && { model }),
    ...(temperature !== undefined && { temperature }),
    ...(max_tokens  !== undefined && { max_tokens }),
    ...(stream     !== undefined && { stream }),
  };

  const serialized = JSON.stringify(safePayload);
  if (serialized.length > MAX_BODY_CHARS) {
    return res.status(413).json({ status: 413, ok: false, error: 'Payload too large' });
  }

  try {
    const response = await fetch(`https://openrouter.ai/api/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OR_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': ORIGIN,
        'X-Title': 'Dobby Studio'
      },
      body: serialized
    });

    const data = await response.json();

    return res.status(response.status).json({
      status: response.status,
      ok: response.ok,
      data
    });
  } catch (error) {
    console.error('[OpenRouter Proxy] Error:', error);
    return res.status(500).json({
      status: 500,
      ok: false,
      error: error.message
    });
  }
}
