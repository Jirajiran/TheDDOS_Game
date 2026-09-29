import { allocatePools } from './pools.js';
import { createWorld } from './world.js';
import { PATH_GRID_N } from './config.js';
import { createOccupancy } from './occupancy.js';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * LOADING: reserve pools + build world + L3 occupancy. Reports progress 0→100.
 * Must finish before PLAYING.
 */
export async function runLoading(onProgress) {
  const report = (pct, label) => {
    onProgress(Math.max(0, Math.min(100, pct)), label);
  };

  report(0, 'Starting…');
  await wait(80);

  report(15, 'Allocating unit pool…');
  await wait(120);

  report(35, 'Allocating projectile pool…');
  await wait(120);

  report(55, 'Allocating drop pool…');
  await wait(100);

  const pools = allocatePools();
  report(70, 'Building Path grid…');
  await wait(100);

  const world = createWorld(PATH_GRID_N);
  report(85, 'Reserving L3 occupancy…');
  await wait(100);

  const occupancy = createOccupancy(world);
  const l3PerPath = (world.pathSize / world.l3Size) ** 2;
  const placeSlots = new Array(world.pathCount * l3PerPath);
  for (let i = 0; i < placeSlots.length; i++) {
    placeSlots[i] = { active: false, typeId: 0 };
  }

  report(95, 'Finalizing…');
  await wait(80);

  report(100, 'Ready');
  await wait(60);

  return {
    pools,
    world,
    occupancy,
    placeSlots,
    loadedAt: Date.now(),
  };
}
