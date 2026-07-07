import * as cheerio from 'cheerio';
import { extractRecipeFromJsonLd } from './jsonld.mjs';
import { extractRecipeFromMicrodata } from './microdata.mjs';
import { extractRecipeFromHeuristics } from './heuristic.mjs';
import { parseDuration } from './duration.mjs';
import { parseIngredient } from './quantity.mjs';

const FETCH_HEADERS = {
  // Recipe sites often gate on bot user agents. Send Chrome's full client
  // hint set so we look like a real browser. AllRecipes blocks anything that
  // doesn't carry sec-ch-ua headers.
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

const FETCH_TIMEOUT_MS = 15000;

// SSRF guard: only allow http(s) to public hosts. Rejects loopback, private,
// link-local (incl. 169.254.169.254 cloud metadata), CGNAT and reserved
// address literals, plus internal hostnames, before we ever fetch a
// user-supplied URL. Real recipe URLs are public domain names, so this has no
// effect on legitimate use.
function assertSafeFetchUrl(raw) {
  let u;
  try {
    u = new URL(String(raw));
  } catch {
    throw new Error('URL must start with http:// or https://');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('URL must start with http:// or https://');
  }
  const host = u.hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local')
  ) {
    throw new Error('refusing to fetch a non-public host');
  }
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    ) {
      throw new Error('refusing to fetch a private or reserved address');
    }
  }
  if (host.includes(':')) {
    // IPv6 literal — block loopback (::1), unspecified (::), unique-local
    // (fc00::/7) and link-local (fe80::/10).
    if (
      host === '::1' || host === '::' ||
      host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')
    ) {
      throw new Error('refusing to fetch a private or reserved address');
    }
  }
}

export async function fetchAndParse(url) {
  assertSafeFetchUrl(url);
  let html;
  let fetchedVia = 'direct';
  try {
    html = await directFetch(url);
  } catch (directErr) {
    // Sites with aggressive bot management (AllRecipes uses Akamai) reject
    // server-side fetches no matter what headers we send. Fall back to the
    // jina.ai reader, which returns the page HTML — JSON-LD included.
    if (shouldFallback(directErr)) {
      try {
        html = await jinaFetch(url);
        fetchedVia = 'reader-proxy';
      } catch (proxyErr) {
        const reason = directErr.message;
        throw new Error(
          `Couldn't reach this recipe. ${reason}. ` +
          `If the site is blocking us, try the Chrome extension instead — it runs in your browser so it bypasses these checks.`
        );
      }
    } else {
      throw directErr;
    }
  }
  const result = parseHtml(html, url);
  result.fetchedVia = fetchedVia;
  return result;
}

async function directFetch(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`site returned ${res.status} ${res.statusText}`);
    const contentType = res.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml/.test(contentType) && contentType) {
      throw new Error(`unexpected content type: ${contentType}`);
    }
    return await res.text();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('the site took too long to respond');
    throw err;
  } finally {
    clearTimeout(t);
  }
}

async function jinaFetch(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const proxied = `https://r.jina.ai/${url}`;
    const res = await fetch(proxied, {
      headers: { 'X-Return-Format': 'html' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`reader proxy returned ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function shouldFallback(err) {
  const msg = String(err.message || '').toLowerCase();
  return /403|401|429|forbidden|blocked|too long|network|enotfound|econnrefused|certificate/.test(msg);
}

export function parseHtml(html, url) {
  const $ = cheerio.load(html);
  const sources = [
    { name: 'json-ld',    extract: extractRecipeFromJsonLd },
    { name: 'microdata',  extract: extractRecipeFromMicrodata },
    { name: 'heuristic',  extract: extractRecipeFromHeuristics },
  ];
  let recipe = null;
  let source = null;
  for (const s of sources) {
    try {
      const got = s.extract($);
      if (got && (got.ingredients?.length || got.instructions?.length)) {
        recipe = got;
        source = s.name;
        break;
      }
    } catch (err) {
      // Continue to next strategy; one parser's crash shouldn't kill the rest.
      console.warn(`[parser:${s.name}] ${err.message}`);
    }
  }
  if (!recipe) {
    const fallback = {
      name: $('h1').first().text().trim() || $('title').first().text().trim() || null,
      description: $('meta[name="description"]').attr('content') || null,
      image: $('meta[property="og:image"]').attr('content') || null,
      ingredients: [],
      instructions: [],
    };
    return enrich({ ...fallback, _source: 'none' }, url);
  }
  return enrich({ ...recipe, _source: source }, url);
}

function enrich(recipe, url) {
  const prepMinutes = parseDuration(recipe.prepTime);
  const cookMinutes = parseDuration(recipe.cookTime);
  const totalMinutes = parseDuration(recipe.totalTime)
    || ((prepMinutes || 0) + (cookMinutes || 0) || null);

  const servings = parseServings(recipe.yield);

  return {
    sourceUrl: url || null,
    parseSource: recipe._source,
    title: recipe.name,
    description: recipe.description,
    heroImage: recipe.image,
    author: recipe.author,
    yieldText: recipe.yield,
    servings,
    prepMinutes,
    cookMinutes,
    totalMinutes,
    ingredients: (recipe.ingredients || []).map(text => {
      const parsed = parseIngredient(text);
      return parsed || { text, quantity: null, unit: null, name: text };
    }),
    instructions: (recipe.instructions || []).map((step, i) => ({
      index: i,
      section: step.section || null,
      isHeading: !!step.isHeading,
      text: step.text || '',
    })),
    rating: recipe.rating || null,
    category: recipe.category || null,
    cuisine: recipe.cuisine || null,
    keywords: recipe.keywords || null,
  };
}

function parseServings(text) {
  if (!text) return null;
  if (typeof text === 'number' && Number.isFinite(text)) return text;
  const m = String(text).match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export { parseDuration } from './duration.mjs';
export { parseIngredient, scaleIngredient, renderIngredient, formatQuantity } from './quantity.mjs';
