/**
 * MATCH LOADING — parallel pipeline:
 *   Stage A: allocate pools
 *   Stage B: build Path world
 *   (overlap A+B — do not wait for A to finish before B starts)
 *   Stage C: occupancy + placeSlots (needs world from B)
 *
 * Each stage has a timeout so a hung alloc surfaces in the label instead of infinite hang.
 */

import { allocatePools } from '../world/pools.js';
import { createWorld } from '../world/world.js';
import { PATH_GRID_N } from '../config.js';
import { createOccupancy } from '../world/occupancy.js';
import { runParallelStages, timed, wait } from './loadPipeline.js';
import { preloadEquipArtCache } from '../view/cosmetics.js';
import { warmSfxPool } from '../audio/sfx.js';
import {
  buildGameplayLayerArtPool,
  isUnitVisualReady,
} from '../view/unitVisual.js';
import { getGameplayArtPool } from '../view/artPool.js';
const STAGE_TIMEOUT_MS = 10000;

/**
 * @param {(pct: number, label: string) => void} onProgress
 * @param {{ pathCols?: number, pathRows?: number, pathGridN?: number, playMap?: object|null }} [opts]
 */
export async function runLoading(onProgress, opts = {}) {
  const report = (pct, label) => {
    onProgress(Math.max(0, Math.min(100, pct)), label);
  };

  const playMap = opts.playMap || null;
  const pathCols =
    (opts.pathCols | 0) ||
    (playMap && playMap.pathCols) ||
    (opts.pathGridN | 0) ||
    (playMap && playMap.pathGridN) ||
    PATH_GRID_N;
  const pathRows =
    (opts.pathRows | 0) ||
    (playMap && playMap.pathRows) ||
    pathCols;

  report(5, 'Match load — parallel pools + world…');

  const wave1 = await runParallelStages(
    [
      {
        id: 'pools',
        required: true,
        timeoutMs: STAGE_TIMEOUT_MS,
        run: () => allocatePools(),
      },
      {
        id: 'world',
        required: true,
        timeoutMs: STAGE_TIMEOUT_MS,
        run: () =>
          createWorld({
            cols: pathCols,
            rows: pathRows,
            // Editor / theddos-map: no FlatLand handmade red edgeAreas.
            skipEdgeAreas: !!(
              playMap &&
              (playMap.source === 'editor' ||
                playMap.mapDoc ||
                (playMap.roomMap && playMap.roomMap.kind === 'theddos-map'))
            ),
          }),
      },
      {
        id: 'equip_art_cache',
        required: true,
        timeoutMs: 60000,
        run: () => preloadEquipArtCache(),
      },
      {
        id: 'art_pool',
        required: true,
        timeoutMs: 120000,
        run: async () => {
          if (isUnitVisualReady() && getGameplayArtPool() && getGameplayArtPool().size) {
            return getGameplayArtPool();
          }
          return buildGameplayLayerArtPool((label, done, total) => {
            report(
              5 + Math.round(((done || 0) / Math.max(1, total || 1)) * 20),
              label || 'Art pool…'
            );
          });
        },
      },
      {
        id: 'sfx_pool',
        required: true,
        timeoutMs: STAGE_TIMEOUT_MS,
        run: () => warmSfxPool(),
      },
    ],
    {
      onProgress: ({ done, total, id, ok, error }) => {
        const pct = 5 + Math.round((done / total) * 50);
        report(
          pct,
          ok ? `OK ${id} (${done}/${total})` : `FAIL ${id}: ${error}`
        );
      },
    }
  );

  if (wave1.failedRequired.length) {
    throw new Error(
      `Match load failed: ${wave1.failedRequired.join(', ')} — ${wave1.warnings.join(' | ')}`
    );
  }

  const pools = wave1.results.pools.value;
  const world = wave1.results.world.value;

  report(60, 'Occupancy + place slots…');

  const { occupancy, placeSlots } = await timed(
    'occupancy',
    () => {
      const occupancy = createOccupancy(world);
      const l3PerPath = (world.pathSize / world.l3Size) ** 2;
      const placeSlots = new Array(world.pathCount * l3PerPath);
      for (let i = 0; i < placeSlots.length; i++) {
        placeSlots[i] = { active: false, typeId: 0 };
      }
      return { occupancy, placeSlots };
    },
    STAGE_TIMEOUT_MS
  );

  report(95, 'Finalizing…');
  await wait(16);
  report(100, 'Ready');
  await wait(16);

  return {
    pools,
    world,
    occupancy,
    placeSlots,
    playMap: playMap || null,
    pathCols,
    pathRows,
    pathGridN: Math.max(pathCols, pathRows),
    loadedAt: Date.now(),
    warnings: wave1.warnings.slice(),
  };
}
