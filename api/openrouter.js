// OpenRouter Proxy API
// This endpoint handles all OpenRouter requests to avoid CORS issues

export default async function handler(req, res) {
  const OR_KEY = process.env.OPENROUTER_KEY || '***REMOVED***';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse request body
  const body = req.body || {};
  const endpoint = body.endpoint || 'chat/completions'; // 'chat/completions' or 'models'

  try {
    const response = await fetch(`https://api.openrouter.ai/api/v1/${endpoint}`, {
      method: req.method || 'POST',
      headers: {
        'Authorization': `Bearer ${OR_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5175',
        'X-Title': 'Dobby Studio'
      },
      body: req.method === 'POST' ? JSON.stringify(body.payload || {}) : undefined
    });

    const data = await response.json();

    return res.status(response.status).json({
      status: response.status,
      ok: response.ok,
      data: data
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
