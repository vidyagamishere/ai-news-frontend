import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { get as getEdgeConfigValue } from '@vercel/edge-config';

type RouteManifest = {
  article_routes: string[];
  category_routes: string[];
  gone_article_routes: string[];
};

type CachedManifest = {
  manifest: RouteManifest;
  expiresAt: number;
};

type CachedFlag = {
  enabled: boolean;
  expiresAt: number;
};

const MANIFEST_CACHE_TTL_MS = 60_000;
const FLAG_CACHE_TTL_MS = 30_000;
const EDGE_FLAG_TIMEOUT_MS = 40;
const MANIFEST_FETCH_TIMEOUT_MS = 250;
const BACKEND_VALIDATE_TIMEOUT_MS = 650;

const DEFAULT_BACKEND_BASE =
  'https://mindful-adventure-production-50fa.up.railway.app';

let manifestCache: CachedManifest | null = null;
let middlewareFlagCache: CachedFlag | null = null;

function boolFromEnv(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);

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

async function getMiddlewareEnabled(): Promise<boolean> {
  const now = Date.now();
  if (middlewareFlagCache && middlewareFlagCache.expiresAt > now) {
    return middlewareFlagCache.enabled;
  }

  // Safe default is fail-open: keep middleware behavior OFF if flag cannot be read.
  const defaultEnabled = boolFromEnv(process.env.PRERENDER_MIDDLEWARE_DEFAULT, false);

  const localOverride = process.env.PRERENDER_MIDDLEWARE_FORCE;
  if (localOverride != null) {
    const forced = boolFromEnv(localOverride, defaultEnabled);
    middlewareFlagCache = { enabled: forced, expiresAt: now + FLAG_CACHE_TTL_MS };
    return forced;
  }

  try {
    const edgeValue = await withTimeout(
      getEdgeConfigValue<boolean>('prerender_middleware_enabled'),
      EDGE_FLAG_TIMEOUT_MS
    );
    const enabled = edgeValue === true;
    middlewareFlagCache = { enabled, expiresAt: now + FLAG_CACHE_TTL_MS };
    return enabled;
  } catch {
    middlewareFlagCache = { enabled: defaultEnabled, expiresAt: now + FLAG_CACHE_TTL_MS };
    return defaultEnabled;
  }
}

async function getManifest(request: NextRequest): Promise<RouteManifest | null> {
  const now = Date.now();
  if (manifestCache && manifestCache.expiresAt > now) {
    return manifestCache.manifest;
  }

  try {
    const manifestUrl = new URL('/prerender/route-manifest.json', request.url);
    const response = await withTimeout(fetch(manifestUrl, { cache: 'no-store' }), MANIFEST_FETCH_TIMEOUT_MS);
    if (!response.ok) return null;

    const json = (await response.json()) as Partial<RouteManifest>;
    if (!Array.isArray(json.article_routes) || !Array.isArray(json.category_routes) || !Array.isArray(json.gone_article_routes)) {
      return null;
    }

    const manifest: RouteManifest = {
      article_routes: json.article_routes,
      category_routes: json.category_routes,
      gone_article_routes: json.gone_article_routes,
    };

    manifestCache = { manifest, expiresAt: now + MANIFEST_CACHE_TTL_MS };
    return manifest;
  } catch {
    return null;
  }
}

function getSlug(pathname: string, prefix: '/article/' | '/category/'): string | null {
  if (!pathname.startsWith(prefix)) return null;
  const raw = pathname.slice(prefix.length).split('/')[0];
  const slug = decodeURIComponent(raw || '').trim();
  return slug.length > 0 ? slug : null;
}

async function serveStaticError(request: NextRequest, statusCode: 404 | 410): Promise<Response> {
  const staticPath = statusCode === 410 ? '/410.html' : '/404.html';
  try {
    const page = await fetch(new URL(staticPath, request.url), { cache: 'no-store' });
    if (page.ok) {
      const html = await page.text();
      return new Response(html, {
        status: statusCode,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=60',
        },
      });
    }
  } catch {
    // Fall through to plain-text fallback.
  }

  return new Response(statusCode === 410 ? 'Gone' : 'Not Found', {
    status: statusCode,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

async function backendSlugState(kind: 'article' | 'category', slug: string): Promise<'exists' | 'missing' | 'unknown'> {
  const backendBase = (process.env.PRERENDER_API_BASE || DEFAULT_BACKEND_BASE).replace(/\/$/, '');
  const path =
    kind === 'article'
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

export default async function middleware(request: NextRequest): Promise<Response> {
  const pathname = request.nextUrl.pathname;
  const isArticlePath = pathname.startsWith('/article/');
  const isCategoryPath = pathname.startsWith('/category/');

  if (!isArticlePath && !isCategoryPath) {
    return NextResponse.next();
  }

  const enabled = await getMiddlewareEnabled();
  if (!enabled) {
    return NextResponse.next();
  }

  const manifest = await getManifest(request);
  if (!manifest) {
    // Fail-open if manifest cannot be loaded.
    return NextResponse.next();
  }

  if (isArticlePath) {
    const slug = getSlug(pathname, '/article/');
    if (!slug) return NextResponse.next();

    if (manifest.gone_article_routes.includes(slug)) {
      return serveStaticError(request, 410);
    }

    if (manifest.article_routes.includes(slug)) {
      const rewriteUrl = new URL(`/prerender/article/${encodeURIComponent(slug)}.html`, request.url);
      return NextResponse.rewrite(rewriteUrl);
    }

    const state = await backendSlugState('article', slug);
    if (state === 'missing') {
      return serveStaticError(request, 404);
    }

    // exists or unknown -> SPA fallback for gap window / transient failures
    return NextResponse.next();
  }

  const categorySlug = getSlug(pathname, '/category/');
  if (!categorySlug) return NextResponse.next();

  if (manifest.category_routes.includes(categorySlug)) {
    const rewriteUrl = new URL(`/prerender/category/${encodeURIComponent(categorySlug)}.html`, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }

  const categoryState = await backendSlugState('category', categorySlug);
  if (categoryState === 'missing') {
    return serveStaticError(request, 404);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/article/:path*', '/category/:path*'],
};
