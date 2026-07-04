import { get as getEdgeConfigValue } from '@vercel/edge-config';

const MANIFEST_CACHE_TTL_MS = 60_000;
const FLAG_CACHE_TTL_MS = 30_000;
const EDGE_FLAG_TIMEOUT_MS = 40;
const MANIFEST_FETCH_TIMEOUT_MS = 250;
const BACKEND_VALIDATE_TIMEOUT_MS = 650;
const DEFAULT_BACKEND_BASE = 'https://mindful-adventure-production-50fa.up.railway.app';

let manifestCache = null;
let flagCache = null;

function boolFromEnv(value, fallback) {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}

function normalizeQueryValue(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function getOrigin(req) {
  const protoHeader = req.headers['x-forwarded-proto'];
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : String(protoHeader || 'https').split(',')[0];
  const host = Array.isArray(hostHeader) ? hostHeader[0] : String(hostHeader || '').split(',')[0];
  return `${protocol}://${host}`;
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function parseSlug(rawSlug) {
  const firstSegment = String(rawSlug || '').split('/')[0];
  if (!firstSegment) return null;

  try {
    const decoded = decodeURIComponent(firstSegment).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

async function getMiddlewareEnabled() {
  const now = Date.now();
  if (flagCache && flagCache.expiresAt > now) {
    return flagCache.enabled;
  }

  const defaultEnabled = boolFromEnv(process.env.PRERENDER_MIDDLEWARE_DEFAULT, false);

  const forceOverride = process.env.PRERENDER_MIDDLEWARE_FORCE;
  if (forceOverride != null) {
    const forced = boolFromEnv(forceOverride, defaultEnabled);
    flagCache = { enabled: forced, expiresAt: now + FLAG_CACHE_TTL_MS };
    return forced;
  }

  const edgeConfigKey = process.env.PRERENDER_EDGE_CONFIG_KEY || 'prerender_middleware_enabled';
  try {
    const edgeValue = await withTimeout(getEdgeConfigValue(edgeConfigKey), EDGE_FLAG_TIMEOUT_MS);
    const enabled = edgeValue === true;
    flagCache = { enabled, expiresAt: now + FLAG_CACHE_TTL_MS };
    return enabled;
  } catch {
    flagCache = { enabled: defaultEnabled, expiresAt: now + FLAG_CACHE_TTL_MS };
    return defaultEnabled;
  }
}

async function getManifest(origin) {
  const now = Date.now();
  if (manifestCache && manifestCache.expiresAt > now) {
    return manifestCache.manifest;
  }

  try {
    const response = await withTimeout(
      fetch(`${origin}/prerender/route-manifest.json`, {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      }),
      MANIFEST_FETCH_TIMEOUT_MS
    );

    if (!response.ok) return null;

    const json = await response.json();
    if (!Array.isArray(json.article_routes) || !Array.isArray(json.category_routes) || !Array.isArray(json.gone_article_routes)) {
      return null;
    }

    const manifest = {
      articleRoutes: json.article_routes,
      categoryRoutes: json.category_routes,
      goneArticleRoutes: json.gone_article_routes,
    };

    manifestCache = { manifest, expiresAt: now + MANIFEST_CACHE_TTL_MS };
    return manifest;
  } catch {
    return null;
  }
}

async function backendSlugState(type, slug) {
  const backendBase = (process.env.PRERENDER_API_BASE || DEFAULT_BACKEND_BASE).replace(/\/$/, '');
  const path =
    type === 'article'
      ? `/article/${encodeURIComponent(slug)}`
      : `/category/${encodeURIComponent(slug)}?limit=1&days_filter=3650`;

  try {
    const response = await withTimeout(
      fetch(`${backendBase}${path}`, {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      }),
      BACKEND_VALIDATE_TIMEOUT_MS
    );

    if (response.status === 404) return 'missing';
    if (response.ok) return 'exists';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

async function respondWithStaticHtml(res, origin, path, statusCode) {
  try {
    const response = await fetch(`${origin}${path}`, { cache: 'no-store' });
    if (!response.ok) return false;

    const html = await response.text();
    res.status(statusCode);
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', statusCode === 200 ? 'public, max-age=60' : 'public, max-age=30');
    res.send(html);
    return true;
  } catch {
    return false;
  }
}

async function respondWithSpaFallback(res, origin) {
  const served = await respondWithStaticHtml(res, origin, '/index.html', 200);
  if (!served) {
    res.status(200).send('');
  }
}

async function respondWithStaticError(res, origin, statusCode) {
  const staticPath = statusCode === 410 ? '/410.html' : '/404.html';
  const served = await respondWithStaticHtml(res, origin, staticPath, statusCode);
  if (!served) {
    res.status(statusCode).setHeader('content-type', 'text/plain; charset=utf-8');
    res.send(statusCode === 410 ? 'Gone' : 'Not Found');
  }
}

export default async function handler(req, res) {
  const origin = getOrigin(req);
  const enabled = await getMiddlewareEnabled();

  if (!enabled) {
    await respondWithSpaFallback(res, origin);
    return;
  }

  const type = String(normalizeQueryValue(req.query?.type)).trim();
  const slug = parseSlug(normalizeQueryValue(req.query?.slug));
  if (!slug || (type !== 'article' && type !== 'category')) {
    await respondWithSpaFallback(res, origin);
    return;
  }

  const manifest = await getManifest(origin);
  if (!manifest) {
    await respondWithSpaFallback(res, origin);
    return;
  }

  if (type === 'article') {
    if (manifest.goneArticleRoutes.includes(slug)) {
      await respondWithStaticError(res, origin, 410);
      return;
    }

    if (manifest.articleRoutes.includes(slug)) {
      const served = await respondWithStaticHtml(
        res,
        origin,
        `/prerender/article/${encodeURIComponent(slug)}.html`,
        200
      );

      if (served) return;
    }

    const articleState = await backendSlugState('article', slug);
    if (articleState === 'missing') {
      await respondWithStaticError(res, origin, 404);
      return;
    }

    await respondWithSpaFallback(res, origin);
    return;
  }

  if (manifest.categoryRoutes.includes(slug)) {
    const served = await respondWithStaticHtml(
      res,
      origin,
      `/prerender/category/${encodeURIComponent(slug)}.html`,
      200
    );

    if (served) return;
  }

  const categoryState = await backendSlugState('category', slug);
  if (categoryState === 'missing') {
    await respondWithStaticError(res, origin, 404);
    return;
  }

  await respondWithSpaFallback(res, origin);
}
