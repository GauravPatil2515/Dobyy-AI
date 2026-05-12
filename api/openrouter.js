// OpenRouter Proxy API
// Env vars required: OPENROUTER_KEY, ALLOWED_ORIGIN

const ALLOWED_ENDPOINTS = ['chat/completions', 'models'];

export default async function handler(req, res) {
  const OR_KEY = process.env.OPENROUTER_KEY;
  const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://dobyy-ai.vercel.app';

  // Scoped CORS — never wildcard
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

  try {
    const response = await fetch(`https://openrouter.ai/api/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OR_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': ORIGIN,
        'X-Title': 'Dobby Studio'
      },
      body: JSON.stringify(safePayload)
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
