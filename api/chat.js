// Groq Chat Proxy API
// Env vars required: GROQ_API_KEY, ALLOWED_ORIGIN, FIREBASE_PROJECT_ID
// Rate limiting is enforced server-side here — do NOT rely on client-side quota tracking.

import { verifyFirebaseToken, isProToken, checkRateLimit } from './_auth.js';

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

  // --- Auth & Rate Limiting ---
  // Verified token if signed in; otherwise fall back to client IP for demo/guest quota.
  const decodedToken = await verifyFirebaseToken(req.headers['authorization']);
  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'demo';
  const uid = decodedToken ? decodedToken.sub : `ip_${clientIp}`;
  const isPro = decodedToken ? isProToken(decodedToken) : false;

  const { allowed, count, limit } = await checkRateLimit(uid, isPro);

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

  // Model fallback chain in case requested model is deprecated or inaccessible on user tier
  const CANDIDATE_MODELS = [
    typeof model === 'string' && model ? model : 'llama-3.1-8b-instant',
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama3-8b-8192',
    'llama3-70b-8192'
  ];
  // Deduplicate while preserving order
  const modelsToTry = [...new Set(CANDIDATE_MODELS)];

  const sanitizedMessages = messages.slice(-20).map(m => ({
    role: ['user', 'assistant', 'system'].includes(m.role) ? m.role : 'user',
    content: typeof m.content === 'string' ? m.content.slice(0, 4000) : ''
  }));

  let lastError = null;

  for (const targetModel of modelsToTry) {
    const safeBody = {
      messages: sanitizedMessages,
      model: targetModel,
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

      if (response.ok) {
        return res.status(200).json(data);
      }

      // If model not found or access denied, try next candidate model
      const errMsg = (data.error && data.error.message) || JSON.stringify(data);
      console.warn(`[Chat Proxy] Model ${targetModel} failed:`, errMsg);
      lastError = { status: response.status, data };

      if (response.status !== 400 && response.status !== 404) {
        // Non-model errors (e.g. 429 quota or 401 bad key) shouldn't cycle models indefinitely
        break;
      }
    } catch (error) {
      console.error(`[Chat Proxy] Network error with ${targetModel}:`, error);
      lastError = { status: 500, data: { error: error.message } };
    }
  }

  return res.status(lastError?.status || 500).json(lastError?.data || { error: 'Failed to process request with available AI models' });
}
