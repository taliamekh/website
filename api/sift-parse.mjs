// Sift recipe parser — Vercel serverless function.
//
// Wraps lib/sift-parser/index.mjs (the parser library lifted verbatim from the
// stand-alone sift repo) and exposes it at /api/sift-parse. The original
// Express route was POST /api/parse — we preserve the same request/response
// contract so the only frontend change is the URL.

import { fetchAndParse } from '../lib/sift-parser/index.mjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A `url` field is required.' });
  }

  try {
    const recipe = await fetchAndParse(url.trim());
    if (!recipe.title) {
      return res.status(422).json({
        error:
          "We couldn't find a recipe on that page. Make sure the URL points " +
          'directly to a recipe (not a category or homepage).',
      });
    }
    return res.status(200).json({ recipe });
  } catch (err) {
    console.error('[sift-parse]', err.message);
    return res.status(502).json({ error: err.message });
  }
}
