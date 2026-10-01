/**
 * Parallel load helpers — start independent work together; per-stage timeout
 * so one hung fetch/alloc cannot freeze the whole gate forever.
 */

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run job with a hard timeout. Rejects with labeled Error on timeout.
 * @template T
 * @param {string} id
 * @param {() => (T|Promise<T>)} job
 * @param {number} timeoutMs
 * @returns {Promise<T>}
 */
export function timed(id, job, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${id} timed out (${timeoutMs}ms)`));
    }, timeoutMs);
    Promise.resolve()
      .then(() => job())
      .then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      );
  });
}

/**
 * Run independent stages in parallel (pipeline overlap).
 * Optional stages soft-fail; required stages collect in failedRequired.
 *
 * @param {Array<{ id: string, run: () => any, timeoutMs?: number, required?: boolean }>} stages
 * @param {{ onProgress?: (info: { done: number, total: number, id: string, ok: boolean, error?: string }) => void, defaultTimeoutMs?: number }} [opts]
 */
export async function runParallelStages(stages, opts = {}) {
  const defaultTimeoutMs = opts.defaultTimeoutMs ?? 8000;
  const onProgress = opts.onProgress || (() => {});
  const total = stages.length;
  let done = 0;
  const results = Object.create(null);
  const warnings = [];
  const failedRequired = [];

  await Promise.all(
    stages.map((stage) => {
      const timeoutMs = stage.timeoutMs ?? defaultTimeoutMs;
      const required = stage.required !== false;
      return timed(stage.id, stage.run, timeoutMs)
        .then((value) => {
          results[stage.id] = { ok: true, value };
          done += 1;
          onProgress({ done, total, id: stage.id, ok: true });
        })
        .catch((err) => {
          const msg = err && err.message ? err.message : String(err);
          results[stage.id] = { ok: false, error: msg };
          warnings.push(msg);
          if (required) failedRequired.push(stage.id);
          done += 1;
          onProgress({ done, total, id: stage.id, ok: false, error: msg });
          console.warn('[loadPipeline]', msg);
        });
    })
  );

  return { results, warnings, failedRequired };
}
