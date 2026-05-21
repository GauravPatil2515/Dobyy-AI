// Groq Chat Proxy API
// Env vars required: GROQ_API_KEY, ALLOWED_ORIGIN
// Rate limiting is enforced server-side — do NOT rely on client-side quota tracking.

const rateLimitStore = new Map();
const FREE_DAILY_LIMIT = 5;
const PRO_DAILY_LIMIT  = 100;
const MS_PER_DAY       = 86_400_000;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function checkRateLimit(uid, isPro) {
  const key   = `${uid}:${getTodayKey()}`;
  const count = rateLimitStore.get(key) || 0;
  const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
  if (count >= limit) return { allowed: false, count, limit };
  rateLimitStore.set(key, count + 1);
  // Clean up keys older than yesterday
  if (rateLimitStore.size > 10_000) {
    const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().slice(0, 10);
    for (const k of rateLimitStore.keys()) {
      if (k.endsWith(yesterday)) rateLimitStore.delete(k);
    }
  }
  return { allowed: true, count: count + 1, limit };
}

export default async function handler(req, res) {
  const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://dobyy-ai.vercel.app';
  const apiKey = process.env.GROQ_API_KEY;

  res.setHeader('Access-Control-Allow-Origin',  ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, X-User-Tier');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  if (!apiKey) {
    console.error('[Chat Proxy] Missing GROQ_API_KEY env var');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  // Request size guard
  const bodyStr = JSON.stringify(req.body || {});
  if (bodyStr.length > 32_000) {
    return res.status(413).json({ error: 'Request too large' });
  }

  const uid   = req.headers['x-user-id']   || 'anonymous';
  const isPro = req.headers['x-user-tier'] === 'pro';
  const traceId = `${uid.slice(-6)}-${Date.now().toString(36)}`;

  res.setHeader('X-Trace-Id', traceId);

  const { allowed, count, limit } = checkRateLimit(uid, isPro);
  res.setHeader('X-RateLimit-Limit',     limit);
  res.setHeader('X-RateLimit-Used',      count);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

  if (!allowed) {
    return res.status(429).json({
      error: 'Daily API limit reached. Upgrade to Pro for more calls.',
      traceId, limit, used: count
    });
  }

  const { messages, model, temperature, max_tokens } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required', traceId });
  }

  const safeBody = {
    messages: messages.slice(-20).map(m => ({
      role:    ['user','assistant','system'].includes(m.role) ? m.role : 'user',
      content: typeof m.content === 'string' ? m.content.slice(0, 4000) : ''
    })),
    // FIX: was 'llama3-8b-8192' — now correctly defaults to the same model as groqClient.js
    model:       typeof model === 'string' ? model : 'llama-3.3-70b-versatile',
    temperature: typeof temperature === 'number' ? Math.min(2, Math.max(0, temperature)) : 0.7,
    max_tokens:  typeof max_tokens  === 'number' ? Math.min(4096, Math.max(1, max_tokens)) : 800,
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
      return res.status(response.status).json({ ...data, traceId });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[Chat Proxy] Fetch error:', error);
    return res.status(500).json({ error: error.message, traceId });
  }
}
