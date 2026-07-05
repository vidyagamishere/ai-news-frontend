#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const DEFAULT_MANIFEST_PATH = 'dist/prerender/route-manifest.json';
const DEFAULT_CACHE_ROOT = '.vercel/cache/prerender/html';
const PREVIEW_HOST = '127.0.0.1';
const PREVIEW_PORT = Number(process.env.PRERENDER_PREVIEW_PORT || '4173');
const PREVIEW_START_TIMEOUT_MS = Number(process.env.PRERENDER_PREVIEW_START_TIMEOUT_MS || '45000');
const PAGE_TIMEOUT_MS = Number(process.env.PRERENDER_PAGE_TIMEOUT_MS || '45000');
const RENDER_CONCURRENCY = Number(process.env.PRERENDER_RENDER_CONCURRENCY || '8');
const RESTORE_CONCURRENCY = Number(process.env.PRERENDER_RESTORE_CONCURRENCY || '32');
const FETCH_ARTIFACT_TIMEOUT_MS = Number(process.env.PRERENDER_FETCH_ARTIFACT_TIMEOUT_MS || '8000');
const MAX_RENDER_ROUTES = Number(
  process.env.PRERENDER_MAX_RENDER_ROUTES || (process.env.VERCEL === '1' ? '50' : '0')
);
const ENABLE_SEO_INJECTION = process.env.PRERENDER_ENABLE_SEO_INJECTION === 'true';
const SITE_URL = (process.env.PRERENDER_SITE_URL || 'https://www.vidyagam.com').replace(/\/$/, '');
const BACKEND_BASE = (process.env.PRERENDER_API_BASE || 'https://mindful-adventure-production-50fa.up.railway.app').replace(/\/$/, '');

async function launchBrowser() {
  if (process.env.VERCEL === '1' || process.env.PRERENDER_BROWSER === 'serverless') {
    const chromiumModule = await import('@sparticuz/chromium');
    const chromium = chromiumModule.default ?? chromiumModule;

    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  }

  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

function parseArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function routeToOutputPath(route) {
  if (route.kind === 'article') return `prerender/article/${route.slug}.html`;
  if (route.kind === 'category') return `prerender/category/${route.slug}.html`;
  const clean = route.path === '/' ? 'index' : route.path.replace(/^\//, '').replace(/\//g, '_');
  return `prerender/static/${clean}.html`;
}

function buildRouteCatalog(manifest) {
  const changedArticle = new Set(manifest?.render_plan?.article_routes_to_render || []);
  const changedCategory = new Set(manifest?.render_plan?.category_routes_to_render || []);

  const staticRoutes = (manifest?.render_plan?.static_routes_to_render || manifest?.static_routes || []).map((p) => ({
    kind: 'static',
    path: p,
    renderRequired: true,
  }));

  const articleRoutes = (manifest?.article_routes || []).map((slug) => ({
    kind: 'article',
    slug,
    path: `/article/${encodeURIComponent(slug)}`,
    renderRequired: changedArticle.has(slug),
  }));

  const categoryRoutes = (manifest?.category_routes || []).map((slug) => ({
    kind: 'category',
    slug,
    path: `/category/${encodeURIComponent(slug)}`,
    renderRequired: changedCategory.has(slug),
  }));

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes];
}

function createTaskPool(items, concurrency, worker) {
  let index = 0;
  const results = [];

  async function runOne() {
    while (true) {
      const i = index;
      index += 1;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => runOne());
  return Promise.all(workers).then(() => results);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeout);
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

function absoluteUrl(value) {
  if (!value) return '';
  const text = String(value).trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith('//')) return `https:${text}`;
  return `${SITE_URL}${text.startsWith('/') ? text : `/${text}`}`;
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 10);
}

async function fetchSeoData(route) {
  if (route.kind !== 'article' && route.kind !== 'category') return null;

  const endpoint = route.kind === 'article'
    ? `${BACKEND_BASE}/article/${encodeURIComponent(route.slug)}`
    : `${BACKEND_BASE}/category/${encodeURIComponent(route.slug)}?limit=1&days_filter=3650`;

  try {
    const response = await fetchWithTimeout(endpoint, FETCH_ARTIFACT_TIMEOUT_MS);
    if (!response.ok) return null;

    const payload = await response.json();
    return route.kind === 'article' ? payload?.article ?? null : payload?.category ?? null;
  } catch {
    return null;
  }
}

function buildSeoInjection(route, seoData) {
  if (!seoData) return null;

  if (route.kind === 'article') {
    const title = firstText(seoData.title, route.slug);
    const description = firstText(seoData.summary, seoData.description, seoData.content_summary, title);
    const canonicalUrl = `${SITE_URL}/article/${encodeURIComponent(route.slug)}`;
    const imageUrl = absoluteUrl(seoData.image || seoData.image_url || seoData.thumbnail_url || seoData.thumbnail || seoData.imageUrl);
    const articleSection = firstText(seoData.category_label, seoData.category_name, seoData.category, 'Generative AI');
    const authorName = firstText(seoData.author, seoData.source_name, seoData.source, 'Vidyagam');
    const publishedTime = firstText(seoData.published_date, seoData.time, seoData.created_date);
    const tags = normalizeTags(seoData.topic_names || seoData.topics?.map?.((topic) => topic?.name) || seoData.metadata?.tags);

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
          url: SITE_URL,
        },
        ...(tags.length ? { keywords: tags } : {}),
      },
    };
  }

  const title = firstText(seoData.name, seoData.title, route.slug);
  const description = firstText(seoData.description, `Browse the latest ${title.toLowerCase()} coverage on Vidyagam.`);
  const canonicalUrl = `${SITE_URL}/category/${encodeURIComponent(route.slug)}`;

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
        url: SITE_URL,
      },
    },
  };
}

function injectSeoIntoHtml(html, seo) {
  if (!seo) return html;

  const injectedTags = [
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

  return nextHtml.replace('</head>', `    ${injectedTags}\n  </head>`);
}

function derivePreviousSiteBase(manifestUrlEnv) {
  if (!manifestUrlEnv) return null;
  try {
    const parsed = new URL(manifestUrlEnv);
    parsed.pathname = '/';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function runNpmPreview(cwd) {
  const child = spawn('npm', ['run', 'preview', '--', '--host', PREVIEW_HOST, '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd,
    stdio: 'inherit',
    shell: false,
  });
  return child;
}

async function waitForPreview(baseUrl) {
  const started = Date.now();
  while (Date.now() - started < PREVIEW_START_TIMEOUT_MS) {
    try {
      const response = await fetchWithTimeout(baseUrl, 1500);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Preview server did not start within ${PREVIEW_START_TIMEOUT_MS}ms`);
}

async function writeHtmlArtifact(route, html, distRoot, cacheRoot) {
  const outputHtml = ENABLE_SEO_INJECTION
    ? injectSeoIntoHtml(html, buildSeoInjection(route, await fetchSeoData(route)))
    : html;
  const relPath = routeToOutputPath(route);
  const distPath = path.join(distRoot, relPath);
  const cachePath = path.join(cacheRoot, relPath);

  await ensureDir(distPath);
  await ensureDir(cachePath);
  await fs.writeFile(distPath, outputHtml, 'utf8');
  await fs.writeFile(cachePath, outputHtml, 'utf8');
}

async function main() {
  const manifestPath = path.resolve(process.cwd(), parseArg('--manifest', DEFAULT_MANIFEST_PATH));
  const cacheRoot = path.resolve(process.cwd(), parseArg('--cache-root', DEFAULT_CACHE_ROOT));

  const manifestText = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestText);

  const previousSiteBase =
    process.env.PRERENDER_PREVIOUS_SITE_BASE_URL ||
    derivePreviousSiteBase(process.env.PRERENDER_PREVIOUS_MANIFEST_URL) ||
    null;

  const routeCatalog = buildRouteCatalog(manifest);
  const distRoot = path.dirname(path.dirname(manifestPath));

  let restoreCacheHits = 0;
  let restoreRemoteHits = 0;
  let renderQueue = [];

  const restoreCandidates = routeCatalog.filter((route) => !route.renderRequired);

  await createTaskPool(restoreCandidates, RESTORE_CONCURRENCY, async (route) => {
    const relPath = routeToOutputPath(route);
    const distPath = path.join(distRoot, relPath);
    const cachePath = path.join(cacheRoot, relPath);

    if (await fileExists(cachePath)) {
      await ensureDir(distPath);
      await fs.copyFile(cachePath, distPath);
      restoreCacheHits += 1;
      if (route.kind === 'article' || route.kind === 'category') {
        const html = await fs.readFile(distPath, 'utf8');
        await writeHtmlArtifact(route, html, distRoot, cacheRoot);
      }
      return;
    }

    if (previousSiteBase) {
      const remoteUrl = `${previousSiteBase}/${relPath}`;
      try {
        const response = await fetchWithTimeout(remoteUrl, FETCH_ARTIFACT_TIMEOUT_MS);
        if (response.ok) {
          const html = await response.text();
          await writeHtmlArtifact(route, html, distRoot, cacheRoot);
          restoreRemoteHits += 1;
          return;
        }
      } catch {
        // fall through to render queue
      }
    }

    renderQueue.push(route);
  });

  renderQueue = [...routeCatalog.filter((route) => route.renderRequired), ...renderQueue];

  if (MAX_RENDER_ROUTES > 0 && renderQueue.length > MAX_RENDER_ROUTES) {
    renderQueue = renderQueue.slice(0, MAX_RENDER_ROUTES);
  }

  const previewBaseUrl = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;
  const previewProcess = runNpmPreview(process.cwd());

  try {
    await waitForPreview(previewBaseUrl);

    const browser = await launchBrowser();

    let renderedCount = 0;

    try {
      await createTaskPool(renderQueue, RENDER_CONCURRENCY, async (route) => {
        const page = await browser.newPage();
        try {
          const routeUrl = `${previewBaseUrl}${route.path}`;
          await page.goto(routeUrl, { waitUntil: 'networkidle2', timeout: PAGE_TIMEOUT_MS });
          const html = await page.content();
          await writeHtmlArtifact(route, html, distRoot, cacheRoot);
          renderedCount += 1;
        } finally {
          await page.close();
        }
      });
    } finally {
      await browser.close();
    }

    const summary = {
      generated_at: new Date().toISOString(),
      total_routes_considered: routeCatalog.length,
      rendered_routes: renderedCount,
      restored_from_cache: restoreCacheHits,
      restored_from_previous_deploy: restoreRemoteHits,
      previous_site_base: previousSiteBase,
      max_render_routes_limit: MAX_RENDER_ROUTES,
    };

    manifest.artifact_generation = summary;
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    console.log('✅ Prerender artifact generation complete');
    console.log(`   total routes considered: ${summary.total_routes_considered}`);
    console.log(`   rendered routes: ${summary.rendered_routes}`);
    console.log(`   restored from cache: ${summary.restored_from_cache}`);
    console.log(`   restored from previous deploy: ${summary.restored_from_previous_deploy}`);
  } finally {
    if (!previewProcess.killed) {
      previewProcess.kill('SIGTERM');
    }
  }
}

main().catch((error) => {
  console.error(`❌ Prerender artifact generation failed: ${error instanceof Error ? error.stack : String(error)}`);
  process.exit(1);
});
