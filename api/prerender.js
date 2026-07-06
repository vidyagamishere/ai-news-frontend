import { get as getEdgeConfigValue } from '@vercel/edge-config';

const MANIFEST_CACHE_TTL_MS = 60_000;
const FLAG_CACHE_TTL_MS = 30_000;
const EDGE_FLAG_TIMEOUT_MS = 40;
const MANIFEST_FETCH_TIMEOUT_MS = Number(process.env.PRERENDER_MANIFEST_FETCH_TIMEOUT_MS || '1200');
const BACKEND_VALIDATE_TIMEOUT_MS = 650;
const DEFAULT_BACKEND_BASE = 'https://mindful-adventure-production-50fa.up.railway.app';
const DEFAULT_SITE_URL = 'https://www.vidyagam.com';

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function absoluteUrl(value, siteUrl) {
  if (!value) return '';
  const text = String(value).trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith('//')) return `https:${text}`;
  return `${siteUrl}${text.startsWith('/') ? text : `/${text}`}`;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 10);
}

async function fetchSeoSource(type, slug) {
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

    if (!response.ok) return null;

    const payload = await response.json();
    return type === 'article' ? payload?.article ?? null : payload?.category ?? null;
  } catch {
    return null;
  }
}

function buildSeoPayload(type, slug, seoSource, siteUrl) {
  if (!seoSource) return null;

  if (type === 'article') {
    const title = firstText(seoSource.title, slug);
    const description = firstText(seoSource.summary, seoSource.description, seoSource.content_summary, title);
    const canonicalUrl = `${siteUrl}/article/${encodeURIComponent(slug)}`;
    const imageUrl = absoluteUrl(seoSource.image || seoSource.image_url || seoSource.thumbnail_url || seoSource.thumbnail || seoSource.imageUrl, siteUrl);
    const articleSection = firstText(seoSource.category_label, seoSource.category_name, seoSource.category, 'Generative AI');
    const authorName = firstText(seoSource.author, seoSource.source_name, seoSource.source, 'Vidyagam');
    const publishedTime = firstText(seoSource.published_date, seoSource.time, seoSource.created_date);
    const tags = normalizeTags(seoSource.topic_names || seoSource.topics?.map?.((topic) => topic?.name) || seoSource.metadata?.tags);

    return {
      title: `${title} – Vidyagam`,
      description,
      canonicalUrl,
      imageUrl,
      ogType: 'article',
      publishedTime,
      authorName,
      articleSection,
      tags,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        articleSection,
        ...(publishedTime ? { datePublished: publishedTime } : {}),
        ...(imageUrl ? { image: [imageUrl] } : {}),
        author: { '@type': 'Person', name: authorName },
        publisher: {
          '@type': 'Organization',
          name: 'Vidyagam',
          url: siteUrl,
        },
        ...(tags.length ? { keywords: tags } : {}),
      },
    };
  }

  const title = firstText(seoSource.name, seoSource.title, slug);
  const description = firstText(seoSource.description, `Browse the latest ${title.toLowerCase()} coverage on Vidyagam.`);
  const canonicalUrl = `${siteUrl}/category/${encodeURIComponent(slug)}`;

  return {
    title: `${title} – Vidyagam`,
    description,
    canonicalUrl,
    imageUrl: '',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${title} – Vidyagam`,
      description,
      url: canonicalUrl,
      publisher: {
        '@type': 'Organization',
        name: 'Vidyagam',
        url: siteUrl,
      },
    },
  };
}

function injectSeoIntoHtml(html, seo) {
  if (!seo) return html;

  const tags = [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="title" content="${escapeHtml(seo.title)}" />`,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`,
    `<meta property="og:type" content="${escapeHtml(seo.ogType)}" />`,
    `<meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    ...(seo.imageUrl ? [`<meta property="og:image" content="${escapeHtml(seo.imageUrl)}" />`] : []),
    `<meta property="og:site_name" content="Vidyagam" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:url" content="${escapeHtml(seo.canonicalUrl)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    ...(seo.imageUrl ? [`<meta name="twitter:image" content="${escapeHtml(seo.imageUrl)}" />`] : []),
    ...(seo.publishedTime ? [`<meta property="article:published_time" content="${escapeHtml(seo.publishedTime)}" />`] : []),
    ...(seo.authorName ? [`<meta property="article:author" content="${escapeHtml(seo.authorName)}" />`] : []),
    ...(seo.articleSection ? [`<meta property="article:section" content="${escapeHtml(seo.articleSection)}" />`] : []),
    ...(seo.tags || []).map((tag) => `<meta property="article:tag" content="${escapeHtml(tag)}" />`),
    `<script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>`,
  ].join('\n    ');

  let nextHtml = html;
  nextHtml = nextHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  nextHtml = nextHtml.replace(/<meta[^>]+name=["']title["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']og:type["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']og:url["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']og:title["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']og:description["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']og:image["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']og:site_name["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+name=["']twitter:card["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+name=["']twitter:url["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+name=["']twitter:title["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+name=["']twitter:description["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+name=["']twitter:image["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']article:published_time["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']article:author["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']article:section["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<meta[^>]+property=["']article:tag["'][^>]*>/gi, '');
  nextHtml = nextHtml.replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

  return nextHtml.replace('</head>', `    ${tags}\n  </head>`);
}

async function respondWithSeoHtml(res, origin, path, statusCode, type, slug) {
  try {
    const response = await fetch(`${origin}${path}`, { cache: 'no-store' });
    if (!response.ok) return false;

    const html = await response.text();
    const siteUrl = process.env.PRERENDER_SITE_URL || DEFAULT_SITE_URL;
    const seoSource = await fetchSeoSource(type, slug);
    const seo = buildSeoPayload(type, slug, seoSource, siteUrl);
    const output = injectSeoIntoHtml(html, seo);

    res.status(statusCode);
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', statusCode === 200 ? 'public, max-age=60' : 'public, max-age=30');
    res.send(output);
    return true;
  } catch {
    return false;
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

async function respondWithSeoSpaFallback(res, origin, type, slug) {
  try {
    const response = await fetch(`${origin}/index.html`, { cache: 'no-store' });
    if (!response.ok) return false;

    const html = await response.text();
    const siteUrl = process.env.PRERENDER_SITE_URL || DEFAULT_SITE_URL;
    const seoSource = await fetchSeoSource(type, slug);
    const seo = buildSeoPayload(type, slug, seoSource, siteUrl);
    const output = injectSeoIntoHtml(html, seo);

    res.status(200);
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'public, max-age=60');
    res.send(output);
    return true;
  } catch {
    return false;
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
      const served = await respondWithSeoHtml(
        res,
        origin,
        `/prerender/article/${encodeURIComponent(slug)}.html`,
        200,
        'article',
        slug
      );

      if (served) return;
    }

    const articleState = await backendSlugState('article', slug);
    if (articleState === 'missing') {
      await respondWithStaticError(res, origin, 404);
      return;
    }

    if (articleState === 'exists') {
      const seoFallbackServed = await respondWithSeoSpaFallback(res, origin, 'article', slug);
      if (seoFallbackServed) return;
    }

    await respondWithSpaFallback(res, origin);
    return;
  }

  if (manifest.categoryRoutes.includes(slug)) {
    const served = await respondWithSeoHtml(
      res,
      origin,
      `/prerender/category/${encodeURIComponent(slug)}.html`,
      200,
      'category',
      slug
    );

    if (served) return;
  }

  const categoryState = await backendSlugState('category', slug);
  if (categoryState === 'missing') {
    await respondWithStaticError(res, origin, 404);
    return;
  }

  if (categoryState === 'exists') {
    const seoFallbackServed = await respondWithSeoSpaFallback(res, origin, 'category', slug);
    if (seoFallbackServed) return;
  }

  await respondWithSpaFallback(res, origin);
}
