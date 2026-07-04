#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const STATIC_PUBLIC_ROUTES = ['/', '/about', '/terms', '/privacy'];

function toSet(values) {
  return new Set(Array.isArray(values) ? values : []);
}

function setDifference(current, previous) {
  const out = [];
  for (const value of current) {
    if (!previous.has(value)) out.push(value);
  }
  return out;
}

function estimateDurationSeconds(routeCount, concurrency, averageRenderMs) {
  if (routeCount <= 0) return 0;
  const workerBatches = Math.ceil(routeCount / Math.max(1, concurrency));
  return Math.ceil((workerBatches * Math.max(1, averageRenderMs)) / 1000);
}

async function readJsonIfExists(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function getArgValue(flag, fallback = undefined) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(`Manifest request failed (${response.status}): ${bodyText.slice(0, 200)}`);
    }
    return JSON.parse(bodyText);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonIfAvailable(url, timeoutMs) {
  try {
    return await fetchWithTimeout(url, timeoutMs);
  } catch {
    return null;
  }
}

function validateManifest(manifest, maxAgeSeconds, strictMode) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== 'object') {
    errors.push('Manifest payload is not a valid JSON object.');
    return { errors, warnings };
  }

  if (!Array.isArray(manifest.active_article_slugs)) {
    errors.push('Missing required array: active_article_slugs');
  }
  if (!Array.isArray(manifest.active_category_slugs)) {
    errors.push('Missing required array: active_category_slugs');
  }
  if (!Array.isArray(manifest.gone_article_slugs)) {
    errors.push('Missing required array: gone_article_slugs');
  }

  if (!manifest.generated_at) {
    errors.push('Missing required field: generated_at');
  }

  if (Array.isArray(manifest.active_article_slugs) && manifest.active_article_slugs.length === 0) {
    const msg = 'active_article_slugs is empty.';
    if (strictMode) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  }

  const generatedAtMs = Date.parse(manifest.generated_at || '');
  if (!Number.isFinite(generatedAtMs)) {
    errors.push('generated_at is not a valid ISO timestamp.');
  } else {
    const ageSeconds = Math.floor((Date.now() - generatedAtMs) / 1000);
    if (ageSeconds > maxAgeSeconds) {
      const msg = `Manifest is stale: ${ageSeconds}s old, max allowed ${maxAgeSeconds}s.`;
      if (strictMode) {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    }
  }

  return { errors, warnings };
}

async function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const strictMode = hasFlag('--strict');
  const timeoutMs = Number(getArgValue('--timeout-ms', process.env.PRERENDER_MANIFEST_TIMEOUT_MS || '20000'));
  const maxAgeSeconds = Number(getArgValue('--max-age-seconds', process.env.PRERENDER_MANIFEST_MAX_AGE_SECONDS || '21600'));
  const outputPath = getArgValue('--output', 'dist/prerender/route-manifest.json');
  const previousManifestPath = getArgValue(
    '--previous-manifest',
    process.env.PRERENDER_PREVIOUS_MANIFEST_PATH || '.vercel/cache/prerender/route-manifest.json'
  );
  const previousManifestUrl = getArgValue('--previous-manifest-url', process.env.PRERENDER_PREVIOUS_MANIFEST_URL);
  const averageRenderMs = Number(getArgValue('--avg-render-ms', process.env.PRERENDER_PAGE_RENDER_MS || '900'));
  const concurrency = Number(getArgValue('--concurrency', process.env.PRERENDER_CONCURRENCY || '8'));

  const apiBase = process.env.PRERENDER_API_BASE || process.env.VITE_API_BASE || 'http://localhost:8000';
  const manifestUrl = process.env.PRERENDER_MANIFEST_URL || `${apiBase.replace(/\/$/, '')}/prerender/manifest`;

  let backendManifest;
  try {
    backendManifest = await fetchWithTimeout(manifestUrl, timeoutMs);
  } catch (err) {
    const message = `Unable to fetch manifest from ${manifestUrl}: ${err instanceof Error ? err.message : String(err)}`;
    if (strictMode) {
      console.error(`❌ ${message}`);
      process.exit(1);
    }
    console.warn(`⚠️ ${message}`);
    process.exit(0);
  }

  const { errors, warnings } = validateManifest(backendManifest, maxAgeSeconds, strictMode);

  warnings.forEach((w) => console.warn(`⚠️ ${w}`));
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`❌ ${e}`));
    process.exit(1);
  }

  const resolvedPreviousManifest = path.resolve(process.cwd(), previousManifestPath);
  let previousManifest = await readJsonIfExists(resolvedPreviousManifest);
  if (!previousManifest && previousManifestUrl) {
    previousManifest = await fetchJsonIfAvailable(previousManifestUrl, timeoutMs);
  }

  const currentArticleSet = toSet(backendManifest.active_article_slugs);
  const currentCategorySet = toSet(backendManifest.active_category_slugs);
  const previousArticleSet = toSet(previousManifest?.article_routes);
  const previousCategorySet = toSet(previousManifest?.category_routes);

  const articleRoutesToRender = previousManifest
    ? setDifference(currentArticleSet, previousArticleSet)
    : backendManifest.active_article_slugs;

  const categoryRoutesToRender = previousManifest
    ? setDifference(currentCategorySet, previousCategorySet)
    : backendManifest.active_category_slugs;

  const mode = previousManifest ? 'incremental' : 'full';
  const fullDynamicRouteCount = backendManifest.active_article_slugs.length + backendManifest.active_category_slugs.length;
  const incrementalDynamicRouteCount = articleRoutesToRender.length + categoryRoutesToRender.length;

  const routeManifest = {
    schema_version: '2026-07-04',
    generated_at: new Date().toISOString(),
    source_manifest_url: manifestUrl,
    strict_mode: strictMode,
    max_age_seconds: maxAgeSeconds,
    static_routes: STATIC_PUBLIC_ROUTES,
    article_routes: backendManifest.active_article_slugs,
    category_routes: backendManifest.active_category_slugs,
    gone_article_routes: backendManifest.gone_article_slugs,
    routing_policy: {
      known_slug_behavior: 'serve_prerendered_html',
      unknown_slug_behavior: 'spa_fallback',
      notes: 'Unknown slugs published between deploys must fall through to SPA until next prerender cycle.',
      middleware_kill_switch_env: 'PRERENDER_MIDDLEWARE_ENABLED',
    },
    render_plan: {
      mode,
      static_routes_to_render: STATIC_PUBLIC_ROUTES,
      article_routes_to_render: articleRoutesToRender,
      category_routes_to_render: categoryRoutesToRender,
      full_dynamic_route_count: fullDynamicRouteCount,
      incremental_dynamic_route_count: incrementalDynamicRouteCount,
      changed_counts: {
        new_articles_since_previous: articleRoutesToRender.length,
        new_categories_since_previous: categoryRoutesToRender.length,
      },
      estimates: {
        concurrency,
        average_render_ms_per_route: averageRenderMs,
        full_dynamic_render_seconds: estimateDurationSeconds(fullDynamicRouteCount, concurrency, averageRenderMs),
        incremental_dynamic_render_seconds: estimateDurationSeconds(incrementalDynamicRouteCount, concurrency, averageRenderMs),
      },
    },
    backend_manifest: {
      generated_at: backendManifest.generated_at,
      counts: backendManifest.counts || {},
      unknown_slug_policy: backendManifest.unknown_slug_policy || null,
    },
  };

  const resolvedOutput = path.resolve(process.cwd(), outputPath);
  await ensureDirForFile(resolvedOutput);
  await fs.writeFile(resolvedOutput, JSON.stringify(routeManifest, null, 2), 'utf8');

  await ensureDirForFile(resolvedPreviousManifest);
  await fs.writeFile(resolvedPreviousManifest, JSON.stringify(routeManifest, null, 2), 'utf8');

  console.log('✅ Prerender manifest scaffold generated');
  console.log(`   source: ${manifestUrl}`);
  console.log(`   output: ${resolvedOutput}`);
  console.log(`   static routes: ${routeManifest.static_routes.length}`);
  console.log(`   article routes: ${routeManifest.article_routes.length}`);
  console.log(`   category routes: ${routeManifest.category_routes.length}`);
  console.log(`   gone article routes: ${routeManifest.gone_article_routes.length}`);
  console.log(`   render mode: ${routeManifest.render_plan.mode}`);
  console.log(`   article routes to render: ${routeManifest.render_plan.article_routes_to_render.length}`);
  console.log(`   category routes to render: ${routeManifest.render_plan.category_routes_to_render.length}`);
  console.log(`   estimated full dynamic render: ${routeManifest.render_plan.estimates.full_dynamic_render_seconds}s`);
  console.log(`   estimated incremental dynamic render: ${routeManifest.render_plan.estimates.incremental_dynamic_render_seconds}s`);

  const articlePreview = routeManifest.article_routes.slice(0, 5);
  const categoryPreview = routeManifest.category_routes.slice(0, 5);
  console.log(`   sample article slugs: ${articlePreview.join(', ') || '(none)'}`);
  console.log(`   sample category slugs: ${categoryPreview.join(', ') || '(none)'}`);
}

main().catch((err) => {
  console.error(`❌ Unexpected prerender manifest script error: ${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
});
