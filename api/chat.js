// Groq Chat Proxy API
// Env vars required: GROQ_API_KEY, ALLOWED_ORIGIN, FIREBASE_PROJECT_ID
// Rate limiting is enforced server-side here — do NOT rely on client-side quota tracking.

import crypto from 'node:crypto';

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

// --- Firebase ID token verification (real RS256 signature check, no Admin SDK) ---
// Google's public x509 certs for Firebase ID tokens, cached in-memory until expiry.
const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let _certCache = { certs: null, expiresAt: 0 };

async function getGoogleCerts() {
  const now = Date.now();
  if (_certCache.certs && now < _certCache.expiresAt) return _certCache.certs;
  const resp = await fetch(GOOGLE_CERTS_URL);
  if (!resp.ok) throw new Error(`Failed to fetch Google certs: ${resp.status}`);
  const certs = await resp.json();
  // Respect Cache-Control max-age so we refresh when Google rotates keys.
  const cc = resp.headers.get('cache-control') || '';
  const maxAge = Number((cc.match(/max-age=(\d+)/) || [])[1]) || 3600;
  _certCache = { certs, expiresAt: now + maxAge * 1000 };
  return certs;
}

function b64urlToJson(b64url) {
  return JSON.parse(Buffer.from(b64url, 'base64url').toString('utf8'));
}

/**
 * Verify a Firebase ID token: RS256 signature against Google's public certs,
 * plus issuer / audience / expiry / issued-at / subject validation.
 * Returns the decoded payload on success, null on any failure.
 */
async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('[Chat Proxy] FIREBASE_PROJECT_ID not set — cannot verify tokens');
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  let header, payload;
  try {
    header = b64urlToJson(headerB64);
    payload = b64urlToJson(payloadB64);
  } catch {
    return null;
  }

  // Header must declare RS256 and reference a key id.
  if (header.alg !== 'RS256' || !header.kid) return null;

  // Claim validation (Firebase spec).
  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec) return null;
  if (!payload.iat || payload.iat > nowSec + 300) return null; // small clock-skew tolerance
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (!payload.sub || typeof payload.sub !== 'string') return null;

  // Signature verification against the matching Google public cert.
  let certs;
  try {
    certs = await getGoogleCerts();
  } catch (e) {
    console.error('[Chat Proxy] Cert fetch failed:', e.message);
    return null;
  }
  const cert = certs[header.kid];
  if (!cert) return null; // unknown key id → reject

  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    const ok = verifier.verify(cert, Buffer.from(signatureB64, 'base64url'));
    if (!ok) return null;
  } catch (e) {
    console.error('[Chat Proxy] Signature verify error:', e.message);
    return null;
  }

  return payload;
}

export default async function handler(req, res) {
  const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://dobyy-ai.vercel.app';
  // Only use server-side env var — never VITE_ prefix (that exposes keys in the bundle)
  const apiKey = process.env.GROQ_API_KEY;

  // Scoped CORS — never wildcard
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

  // --- Auth: require a valid Firebase ID token (real signature verification) ---
  const authHeader = req.headers['authorization'];
  const decodedToken = await verifyFirebaseToken(authHeader);
  if (!decodedToken) {
    return res.status(401).json({ error: 'Unauthorized: valid sign-in required' });
  }

  // --- Server-side rate limiting ---
  const uid = decodedToken.sub;
  // Tier comes from the verified token's custom claim — NEVER a client header.
  const isPro = decodedToken.tier === 'pro' || decodedToken.pro === true;
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
