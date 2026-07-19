// Shared auth + rate-limit helpers for serverless API routes.
// Verifies Firebase ID tokens (real RS256 signature check, no Admin SDK) and
// enforces per-uid daily quotas. Import from api/chat.js and api/openrouter.js.

import crypto from 'node:crypto';

const FREE_DAILY_LIMIT = 5;
const PRO_DAILY_LIMIT = 100;
const MS_PER_DAY = 86_400_000;

// In-memory rate limit store — used only as a fallback when no durable KV is
// configured. On Vercel, set KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV)
// so the quota survives cold starts and is shared across all lambda instances.
const rateLimitStore = new Map();
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const kvAvailable = Boolean(KV_URL && KV_TOKEN);

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.result ?? null; // Vercel KV REST returns { result }
}

async function kvIncr(key, ttlSec) {
  // Atomic increment with daily expiry (best-effort; Vercel KV supports INCR + EXPIRE).
  const res = await fetch(`${KV_URL}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const value = data?.result;
  if (typeof value === 'number') {
    await fetch(`${KV_URL}/expire/${encodeURIComponent(key)}/${ttlSec}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    }).catch(() => {});
  }
  return value;
}

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

/**
 * Per-uid daily quota. Uses Vercel KV when configured (durable, shared across
 * instances), otherwise the in-memory Map (per-instance, resets on cold start).
 */
export async function checkRateLimit(uid, isPro) {
  const key = `ratelimit:${uid}:${getTodayKey()}`;
  const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

  if (kvAvailable) {
    // TTL slightly past end of day so the key auto-expires (secs until UTC midnight + 60s buffer).
    const secsUntilMidnight = Math.ceil((Date.now() % MS_PER_DAY) / 1000) + 60;
    const count = (await kvIncr(key, secsUntilMidnight)) ?? 0;
    if (count > limit) return { allowed: false, count, limit };
    return { allowed: true, count, limit };
  }

  // Fallback: in-memory store.
  const count = rateLimitStore.get(key) || 0;
  if (count >= limit) return { allowed: false, count, limit };
  rateLimitStore.set(key, count + 1);
  if (rateLimitStore.size > 10_000) {
    const yKey = `ratelimit:${new Date(Date.now() - MS_PER_DAY).toISOString().slice(0, 10)}:`;
    for (const k of rateLimitStore.keys()) {
      if (k.startsWith(yKey)) rateLimitStore.delete(k);
    }
  }
  return { allowed: true, count: count + 1, limit };
}

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
export async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('[auth] FIREBASE_PROJECT_ID not set — cannot verify tokens');
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

  if (header.alg !== 'RS256' || !header.kid) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec) return null;
  if (!payload.iat || payload.iat > nowSec + 300) return null; // clock-skew tolerance
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (!payload.sub || typeof payload.sub !== 'string') return null;

  let certs;
  try {
    certs = await getGoogleCerts();
  } catch (e) {
    console.error('[auth] Cert fetch failed:', e.message);
    return null;
  }
  const cert = certs[header.kid];
  if (!cert) return null;

  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    if (!verifier.verify(cert, Buffer.from(signatureB64, 'base64url'))) return null;
  } catch (e) {
    console.error('[auth] Signature verify error:', e.message);
    return null;
  }

  return payload;
}

export function isProToken(decodedToken) {
  return decodedToken?.tier === 'pro' || decodedToken?.pro === true;
}
