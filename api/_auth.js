// Shared rate-limit helpers for serverless API routes (Standalone / Zero Firebase Auth).

const FREE_DAILY_LIMIT = 50;
const PRO_DAILY_LIMIT = 500;
const MS_PER_DAY = 86_400_000;

const rateLimitStore = new Map();
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const kvAvailable = Boolean(KV_URL && KV_TOKEN);

async function kvIncr(key, ttlSec) {
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
  return new Date().toISOString().slice(0, 10);
}

export async function checkRateLimit(uid, isPro = true) {
  const key = `ratelimit:${uid}:${getTodayKey()}`;
  const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

  if (kvAvailable) {
    const secsUntilMidnight = Math.ceil((Date.now() % MS_PER_DAY) / 1000) + 60;
    const count = (await kvIncr(key, secsUntilMidnight)) ?? 0;
    if (count > limit) return { allowed: false, count, limit };
    return { allowed: true, count, limit };
  }

  const count = rateLimitStore.get(key) || 0;
  if (count >= limit) return { allowed: false, count, limit };
  rateLimitStore.set(key, count + 1);
  return { allowed: true, count: count + 1, limit };
}

export async function verifyFirebaseToken() {
  return null;
}

export function isProToken() {
  return true;
}
