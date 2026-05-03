/**
 * Image Analysis Pipeline for Fabric Design Recognition
 * Handles: resizing, Groq Vision API calls, robust JSON parsing, and fallback k-means extraction
 */

// ════════════════════════════════════════════════════════════
// FIX 1: IMAGE RESIZING (max 512×512)
// ════════════════════════════════════════════════════════════
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // Resize to max 512px on longest side
        const MAX = 512;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        // Return only the base64 data part (no prefix)
        resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ════════════════════════════════════════════════════════════
// FIX 4: BETTER K-MEANS FALLBACK (grid sampling 16×16)
// ════════════════════════════════════════════════════════════
export function localKMeansExtract(imageData) {
  // imageData can be: base64 string, data URL, or canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const GRID = 16;
      const tc = document.createElement('canvas');
      tc.width = GRID; tc.height = GRID;
      const ctx = tc.getContext('2d');
      ctx.drawImage(img, 0, 0, GRID, GRID);
      const pixelData = ctx.getImageData(0, 0, GRID, GRID).data;

      // Collect all pixel colors
      const allPixels = [];
      for (let i = 0; i < GRID * GRID; i++) {
        const r = pixelData[i*4], g = pixelData[i*4+1], b = pixelData[i*4+2];
        // Skip near-white and near-black backgrounds
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 15  && g < 15  && b < 15)  continue;
        allPixels.push([r, g, b]);
      }

      if (allPixels.length === 0) {
        // All pixels were filtered, use them anyway
        for (let i = 0; i < GRID * GRID; i++) {
          allPixels.push([pixelData[i*4], pixelData[i*4+1], pixelData[i*4+2]]);
        }
      }

      // Simple K-means: group nearby colors
      const clusters = [];
      for (const [r, g, b] of allPixels) {
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        const existing = clusters.find(c => {
          const cr = parseInt(c.hex.slice(1,3), 16);
          const cg = parseInt(c.hex.slice(3,5), 16);
          const cb = parseInt(c.hex.slice(5,7), 16);
          return Math.abs(cr-r) + Math.abs(cg-g) + Math.abs(cb-b) < 60;
        });
        if (existing) {
          // Update centroid
          existing.count++;
          existing.r = Math.round((existing.r * (existing.count-1) + r) / existing.count);
          existing.g = Math.round((existing.g * (existing.count-1) + g) / existing.count);
          existing.b = Math.round((existing.b * (existing.count-1) + b) / existing.count);
          existing.hex = '#' + [existing.r, existing.g, existing.b]
            .map(v => v.toString(16).padStart(2,'0')).join('');
        } else {
          clusters.push({ hex, r, g, b, count: 1 });
        }
      }

      // Sort by frequency, take top 6
      const result = clusters
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map(c => ({
          c: c.hex,
          n: Math.max(2, Math.min(10, Math.round(c.count / allPixels.length * 40)))
        }));

      resolve(result);
    };
    
    // Handle different input types
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:')) {
        img.src = imageData;
      } else {
        img.src = `data:image/jpeg;base64,${imageData}`;
      }
    }
  });
}

// ════════════════════════════════════════════════════════════
// FIX 2 & 3 & 7: IMAGE ANALYSIS WITH GROQ VISION
// ════════════════════════════════════════════════════════════
export async function analyzeImageWithGroq(base64Data, onProgress) {
  try {
    // Check for API key
    const OR_KEY = document.querySelector('meta[name="openrouter-key"]')?.content?.trim()
                || window.__OPENROUTER_KEY?.trim()
                || process.env.VITE_OPENROUTER_API_KEY
                || '***REMOVED***';

    if (!OR_KEY || OR_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
      onProgress({ error: 'no-key', message: '⚠️ No OpenRouter API key found. Using local color extraction.' });
      const fallback = await localKMeansExtract(base64Data);
      return {
        sett: fallback,
        weave: 'twill22',
        confidence: 60,
        description: 'Local K-means color extraction (no API key)',
        source: 'fallback-nokey'
      };
    }

    onProgress({ status: 'analyzing' });

    // Use OpenRouter proxy endpoint for vision analysis
    const res = await fetch('/api/openrouter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'chat/completions',
        payload: {
          model: 'meta-llama/llama-4-maverick:free',
          messages: [
            {
              role: 'system',
              content: `You are a textile pattern analysis API.
You MUST respond with ONLY a raw JSON object.
NO explanation. NO markdown. NO prose. NO code blocks.
ONLY the JSON object starting with { and ending with }.
Any other text will break the application.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this fabric/tartan image.
Return ONLY this exact JSON structure (no markdown, no explanation):
{"sett":[{"c":"#hexcolor","n":threadcount}],"weave":"twill22","confidence":85,"description":"brief description"}

Rules:
- c: dominant hex color of each visible stripe (e.g. "#cc2211")
- n: integer thread count 2-12, proportional to stripe width
- List stripes left-to-right in sequence order
- 4 to 8 stripes maximum
- weave: one of: twill22, twill21, plain, satin5
- confidence: integer 0-100
- description: max 10 words

Example valid response:
{"sett":[{"c":"#cc2211","n":6},{"c":"#111111","n":2},{"c":"#003399","n":6}],"weave":"twill22","confidence":88,"description":"red and navy tartan with black stripe"}`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Data}`
                  }
                }
              ]
            }
          ],
          max_tokens: 200,
          temperature: 0.05
        }
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[Dobby Vision] API error:', res.status, errBody);
      
      let errorMsg = `API error ${res.status}`;
      if (res.status === 401) {
        errorMsg = '❌ Invalid OpenRouter API key';
      } else if (res.status === 429) {
        errorMsg = '⏳ Rate limit hit - wait 10 seconds';
      } else if (res.status === 413) {
        errorMsg = '📦 Image too large';
      }
      
      onProgress({ error: `http-${res.status}`, message: errorMsg });
      
      const fallback = await localKMeansExtract(base64Data);
      return {
        sett: fallback,
        weave: 'twill22',
        confidence: 55,
        description: `Fallback (API error ${res.status})`,
        source: 'fallback-error'
      };
    }

    const data = await res.json();
    
    // FIX 3: ROBUST JSON PARSER with multiple strategies
    const raw = data.data?.choices?.[0]?.message?.content || '';
    console.log('[Dobby Vision] Raw API response:', raw);

    let json = null;

    // Strategy 1: Direct parse
    try { json = JSON.parse(raw.trim()); } catch(e) {}

    // Strategy 2: Extract JSON object from text
    if (!json) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { json = JSON.parse(match[0]); } catch(e) {}
      }
    }

    // Strategy 3: Extract from code block
    if (!json) {
      const cbMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (cbMatch) {
        try { json = JSON.parse(cbMatch[1].trim()); } catch(e) {}
      }
    }

    // Strategy 4: Manual field extraction if JSON is malformed
    if (!json && raw.includes('"c"') && raw.includes('"n"')) {
      try {
        const colors = [];
        const colorRegex = /"c"\s*:\s*"(#[0-9a-fA-F]{6})"\s*,\s*"n"\s*:\s*(\d+)/g;
        let m;
        while ((m = colorRegex.exec(raw)) !== null) {
          colors.push({ c: m[1], n: parseInt(m[2]) });
        }
        if (colors.length >= 2) {
          const weaveMatch = raw.match(/"weave"\s*:\s*"(\w+)"/);
          const confMatch  = raw.match(/"confidence"\s*:\s*(\d+)/);
          const descMatch  = raw.match(/"description"\s*:\s*"([^"]+)"/);
          json = {
            sett: colors,
            weave: weaveMatch?.[1] || 'twill22',
            confidence: confMatch ? parseInt(confMatch[1]) : 70,
            description: descMatch?.[1] || 'extracted from image'
          };
        }
      } catch(e) {}
    }

    console.log('[Dobby Vision] Parsed JSON:', json);

    // Validate and sanitize
    if (json && json.sett && Array.isArray(json.sett) && json.sett.length >= 2) {
      const sanitized = json.sett
        .filter(s => s.c && s.n && parseInt(s.n) > 0)
        .map(s => ({
          c: /^#[0-9a-fA-F]{6}$/i.test(s.c) ? s.c.toLowerCase() : '#888888',
          n: Math.max(1, Math.min(12, parseInt(s.n)))
        }));
      
      if (sanitized.length >= 2) {
        return {
          sett: sanitized,
          weave: json.weave || 'twill22',
          confidence: json.confidence || 75,
          description: json.description || 'Fabric pattern extracted',
          source: 'api-success'
        };
      }
    }

    // All strategies failed
    console.warn('[Dobby Vision] All parse strategies failed. Raw was:', raw);
    onProgress({ error: 'parse-failed', message: 'AI returned unexpected format. Using color extraction fallback...' });
    
    const fallback = await localKMeansExtract(base64Data);
    return {
      sett: fallback,
      weave: 'twill22',
      confidence: 60,
      description: 'Local color extraction (parse failed)',
      source: 'fallback-parse'
    };

  } catch (networkErr) {
    console.error('[Dobby Vision] Network error:', networkErr);
    onProgress({ error: 'network', message: '🌐 Network error — using local color extraction.' });
    
    const fallback = await localKMeansExtract(base64Data);
    return {
      sett: fallback,
      weave: 'twill22',
      confidence: 55,
      description: 'Local color extraction (network error)',
      source: 'fallback-network'
    };
  }
}

/**
 * FIX 5: Build visual debug HTML with color swatches
 */
export function buildAnalysisMessage(sett, weave, confidence, description) {
  const swatchHtml = sett.map(s =>
    `<span style="display:inline-block;width:14px;height:14px;
      background:${s.c};border:1px solid rgba(0,0,0,0.2);
      border-radius:2px;margin-right:2px;vertical-align:middle"
      title="${s.c} × ${s.n}t"></span>`
  ).join('');

  const conf = confidence ? ` (${confidence}% confidence)` : '';
  const msg = `✅ Extracted ${sett.length} colors${conf}\n${swatchHtml}\n${description || ''}\n\nTip: type "adjust colors" or "make it darker" to refine`;

  return msg;
}
