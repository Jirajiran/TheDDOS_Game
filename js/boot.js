/**
 * Boot preload — runs once when the page opens, before MENU is interactive.
 * Assets prefetch in parallel (overlap); each has its own timeout — miss = warn, continue.
 */

import { runParallelStages, wait } from './loadPipeline.js';

export const BOOT_ASSETS = Object.freeze([
  { id: 'css', url: 'css/main.css' },
  { id: 'favicon', url: 'favicon.svg' },
  { id: 'place_object', url: 'Asset/AssetSVG/PlaceHold/Object_01.svg' },
  { id: 'unit_template', url: 'Asset/AssetSVG/Unit/Unit_Template.svg' },
]);

const ASSET_TIMEOUT_MS = 4000;

function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {
    cache: 'no-cache',
    signal: ctrl.signal,
  }).finally(() => clearTimeout(timer));
}

async function fetchAsset(entry) {
  const res = await fetchWithTimeout(entry.url, ASSET_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`${entry.id} → ${entry.url} (${res.status})`);
  }
  const text = await res.text();
  return { id: entry.id, url: entry.url, text, ok: true };
}

/**
 * @param {(pct: number, label: string) => void} onProgress
 * @param {{ requiredDomIds?: string[] }} [options]
 */
export async function runBootPreload(onProgress, options = {}) {
  const report = (pct, label) => {
    onProgress(Math.max(0, Math.min(100, pct)), label);
  };

  report(5, 'Checking shell…');
  await wait(16);

  const requiredDomIds = options.requiredDomIds || [
    'app',
    'screen-menu',
    'screen-loading',
    'screen-playing',
    'screen-result',
    'game-canvas',
    'btn-start',
    'progress-fill',
    'progress-label',
  ];
  for (const id of requiredDomIds) {
    if (!document.getElementById(id)) {
      throw new Error(`Missing DOM #${id}`);
    }
  }

  report(20, 'Shell OK — parallel asset prefetch…');

  const stages = BOOT_ASSETS.map((entry) => ({
    id: `asset:${entry.id}`,
    timeoutMs: ASSET_TIMEOUT_MS + 500,
    required: false,
    run: () => fetchAsset(entry),
  }));

  const { results, warnings } = await runParallelStages(stages, {
    defaultTimeoutMs: ASSET_TIMEOUT_MS + 500,
    onProgress: ({ done, total, id, ok, error }) => {
      const pct = 20 + Math.round((done / total) * 70);
      report(pct, ok ? `OK ${id} (${done}/${total})` : `SKIP ${id}: ${error}`);
    },
  });

  const assets = Object.create(null);
  for (const entry of BOOT_ASSETS) {
    const key = `asset:${entry.id}`;
    const r = results[key];
    if (r && r.ok) {
      assets[entry.id] = r.value;
    } else {
      assets[entry.id] = {
        id: entry.id,
        url: entry.url,
        ok: false,
        error: (r && r.error) || 'failed',
      };
    }
  }

  report(95, 'Finalizing boot…');
  await wait(16);
  report(100, warnings.length ? `Ready (${warnings.length} warn)` : 'Ready');
  await wait(16);

  return {
    ready: true,
    assets,
    warnings,
    bootedAt: Date.now(),
  };
}
