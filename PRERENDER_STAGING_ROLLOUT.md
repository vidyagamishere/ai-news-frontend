# Prerender Staging Rollout

This rollout must be completed in staging before enabling prerender middleware in production.

## Safety Defaults

- `prerender_middleware_enabled` defaults to disabled when Edge Config read fails.
- Middleware backend slug validation timeout: `650ms`.
- On backend validation timeout/error, middleware falls back to SPA (`NextResponse.next()`), never hangs and never 500s.

## Deploy Pipeline Wiring (CI)

Vercel build command is configured to run:

- `npm run build:prerender`

Which executes:

1. `npm run build`
2. `npm run prerender:manifest`
3. `npm run prerender:generate`

`build:prerender` auto-sets:

- `PRERENDER_PREVIOUS_MANIFEST_URL=https://www.vidyagam.com/prerender/route-manifest.json` (if unset)
- `PRERENDER_PREVIOUS_SITE_BASE_URL` derived from that URL (if unset)

This ensures fresh CI environments can bootstrap incremental mode from the last successful deployment artifact.

## Staging Validation Steps

1. Ensure staging deployment completed with Day 3 pipeline.
2. Enable Edge Config key only for staging rollout:
   - `prerender_middleware_enabled = true`
3. Validate known article slug serves prerendered HTML before JS:

```bash
curl -i "https://<staging-domain>/article/<known-slug>" | sed -n '1,40p'
```

Expected:
- HTTP 200
- HTML response body containing article page markup (not just SPA shell placeholders)

4. Validate known category slug serves prerendered HTML before JS:

```bash
curl -i "https://<staging-domain>/category/<known-category>" | sed -n '1,40p'
```

Expected:
- HTTP 200
- prerendered category HTML

5. Validate missing slug returns real 404:

```bash
curl -i "https://<staging-domain>/article/not-a-real-slug-404-check"
```

Expected:
- HTTP 404
- body from `404.html`

6. Validate gone slug returns real 410:

First mark one slug as gone via backend admin API, then test:

```bash
curl -i "https://<staging-domain>/article/<gone-slug>"
```

Expected:
- HTTP 410
- body from `410.html`

7. Keep production disabled until all above checks pass.

## Production Enablement Gate

Only after staging checks are clean:

- Set `prerender_middleware_enabled = true` for production traffic.
- Monitor 404/410 rates and fallback volume.
- If issues occur, disable immediately via Edge Config (no redeploy required).
