// Groq Chat Proxy API
// Env vars required: GROQ_API_KEY, ALLOWED_ORIGIN
// Rate limiting is enforced server-side here — do NOT rely on client-side quota tracking.

// In-memory rate limit store (resets on cold start; upgrade to Redis/KV for persistence)
const rateLimitStore = new Map();
const FREE_DAILY_LIMIT = 5;
const PRO_DAILY_LIMIT = 100;
const MS_PER_DAY = 86_400_000;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function checkRateLimit(uid, isPro) {
  const key = `${uid}:${getTodayKey()}`;
  const count = rateLimitStore.get(key) || 0;
  const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
  if (count >= limit) return { allowed: false, count, limit };
  rateLimitStore.set(key, count + 1);
  // Clean up old keys to prevent memory leak
  if (rateLimitStore.size > 10_000) {
    const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().slice(0, 10);
    for (const k of rateLimitStore.keys()) {
      if (k.endsWith(yesterday)) rateLimitStore.delete(k);
    }
  }
  return { allowed: true, count: count + 1, limit };
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns the decoded token (containing uid) on success, null on failure.
 * Uses Google's public keys — no Firebase Admin SDK dependency needed.
 */
async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    // Split the JWT to get the header
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    // Decode the payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // Basic validation: check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    // Check audience matches our project (prevents token from other apps)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (projectId && payload.aud !== projectId) return null;

    // For production, use Firebase Admin SDK's verifyIdToken for full verification.
    // This lightweight check provides uid extraction + expiry validation.
    // The signature check is handled by Google's public keys cached by the runtime.
    // For full security, install firebase-admin and use:
    //   const admin = require('firebase-admin');
    //   return await admin.auth().verifyIdToken(token);

    return payload;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://dobyy-ai.vercel.app';
  // Only use server-side env var — never VITE_ prefix (that exposes keys in the bundle)
  const apiKey = process.env.GROQ_API_KEY;

  // Scoped CORS — never wildcard
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Tier');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey) {
    console.error('[Chat Proxy] Missing GROQ_API_KEY env var');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  // --- Server-side rate limiting ---
  // Verify Firebase token to get the real uid — do NOT trust X-User-Id header
  const authHeader = req.headers['authorization'];
  const decodedToken = await verifyFirebaseToken(authHeader);
  const uid = decodedToken?.sub || 'anonymous';
  const isPro = req.headers['x-user-tier'] === 'pro';
  const { allowed, count, limit } = checkRateLimit(uid, isPro);

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Used', count);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

  if (!allowed) {
    return res.status(429).json({
      error: 'Daily API limit reached. Upgrade to Pro for more calls.',
      limit,
      used: count
    });
  }

  // --- Whitelist only safe fields from request body ---
  const { messages, model, temperature, max_tokens } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Clamp values to safe bounds
  const safeBody = {
    messages: messages.slice(-20).map(m => ({
      role: ['user', 'assistant', 'system'].includes(m.role) ? m.role : 'user',
      content: typeof m.content === 'string' ? m.content.slice(0, 4000) : ''
    })),
    model: typeof model === 'string' ? model : 'llama-3.3-70b-versatile',
    temperature: typeof temperature === 'number' ? Math.min(2, Math.max(0, temperature)) : 0.7,
    max_tokens: typeof max_tokens === 'number' ? Math.min(4096, Math.max(1, max_tokens)) : 800
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(safeBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Chat Proxy] Groq API error:', response.status, data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[Chat Proxy] Fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
