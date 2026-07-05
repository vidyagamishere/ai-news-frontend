#!/usr/bin/env node

import { spawn } from 'node:child_process';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      env: process.env,
    });

    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

function ensureDeployDefaults() {
  // Production alias always points to the last successful deployment during a new build.
  if (!process.env.PRERENDER_PREVIOUS_MANIFEST_URL) {
    process.env.PRERENDER_PREVIOUS_MANIFEST_URL = 'https://www.vidyagam.com/prerender/route-manifest.json';
  }

  if (!process.env.PRERENDER_PREVIOUS_SITE_BASE_URL) {
    try {
      const u = new URL(process.env.PRERENDER_PREVIOUS_MANIFEST_URL);
      process.env.PRERENDER_PREVIOUS_SITE_BASE_URL = `${u.protocol}//${u.host}`;
    } catch {
      // leave unset if URL parsing fails
    }
  }

  if (!process.env.PRERENDER_API_BASE && process.env.VITE_API_BASE) {
    process.env.PRERENDER_API_BASE = process.env.VITE_API_BASE;
  }

  // Vercel production builds need a bounded first bootstrap render so the
  // pipeline can establish the manifest/artifact cache without timing out.
  if (process.env.VERCEL === '1' && !process.env.PRERENDER_MAX_RENDER_ROUTES) {
    process.env.PRERENDER_MAX_RENDER_ROUTES = '50';
  }
}

async function main() {
  ensureDeployDefaults();

  console.log('🔧 Prerender deploy pipeline configuration');
  console.log(`   PRERENDER_PREVIOUS_MANIFEST_URL=${process.env.PRERENDER_PREVIOUS_MANIFEST_URL}`);
  console.log(`   PRERENDER_PREVIOUS_SITE_BASE_URL=${process.env.PRERENDER_PREVIOUS_SITE_BASE_URL || '(unset)'}`);
  console.log(`   PRERENDER_API_BASE=${process.env.PRERENDER_API_BASE || '(unset)'}`);

  await run('npm', ['run', 'build']);
  await run('npm', ['run', 'prerender:manifest']);
  await run('npm', ['run', 'prerender:generate']);
}

main().catch((error) => {
  console.error(`❌ Build pipeline failed: ${error instanceof Error ? error.stack : String(error)}`);
  process.exit(1);
});
