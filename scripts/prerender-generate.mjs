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
const MAX_RENDER_ROUTES = Number(process.env.PRERENDER_MAX_RENDER_ROUTES || '0');

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
      return;
    }

    if (previousSiteBase) {
      const remoteUrl = `${previousSiteBase}/${relPath}`;
      try {
        const response = await fetchWithTimeout(remoteUrl, FETCH_ARTIFACT_TIMEOUT_MS);
        if (response.ok) {
          const html = await response.text();
          await ensureDir(distPath);
          await ensureDir(cachePath);
          await fs.writeFile(distPath, html, 'utf8');
          await fs.writeFile(cachePath, html, 'utf8');
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

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    let renderedCount = 0;

    try {
      await createTaskPool(renderQueue, RENDER_CONCURRENCY, async (route) => {
        const page = await browser.newPage();
        try {
          const routeUrl = `${previewBaseUrl}${route.path}`;
          await page.goto(routeUrl, { waitUntil: 'networkidle2', timeout: PAGE_TIMEOUT_MS });
          const html = await page.content();

          const relPath = routeToOutputPath(route);
          const distPath = path.join(distRoot, relPath);
          const cachePath = path.join(cacheRoot, relPath);

          await ensureDir(distPath);
          await ensureDir(cachePath);
          await fs.writeFile(distPath, html, 'utf8');
          await fs.writeFile(cachePath, html, 'utf8');
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
