/**
 * MATCH LOADING — parallel pipeline:
 *   Stage A: allocate pools
 *   Stage B: build Path world
 *   (overlap A+B — do not wait for A to finish before B starts)
 *   Stage C: occupancy + placeSlots (needs world from B)
 *
 * Each stage has a timeout so a hung alloc surfaces in the label instead of infinite hang.
 */

import { allocatePools } from './pools.js';
import { createWorld } from './world.js';
import { PATH_GRID_N } from './config.js';
import { createOccupancy } from './occupancy.js';
import { runParallelStages, timed, wait } from './loadPipeline.js';
import { preloadEquipArtCache } from './cosmetics.js';

const STAGE_TIMEOUT_MS = 10000;

/**
 * @param {(pct: number, label: string) => void} onProgress
 */
export async function runLoading(onProgress) {
  const report = (pct, label) => {
    onProgress(Math.max(0, Math.min(100, pct)), label);
  };

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
        run: () => createWorld(PATH_GRID_N),
      },
      {
        id: 'equip_art_cache',
        required: false,
        timeoutMs: 2000,
        run: () => preloadEquipArtCache(),
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
    loadedAt: Date.now(),
    warnings: wave1.warnings.slice(),
  };
}
