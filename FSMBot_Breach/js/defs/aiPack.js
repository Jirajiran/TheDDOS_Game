/**
 * AI mediator tables from data/pack/ai.json.
 * Installed at boot; sim reads the live bindings synchronously after that.
 */

function cloneFreeze(value) {
  if (Array.isArray(value)) {
    const next = new Array(value.length);
    for (let i = 0; i < value.length; i++) next[i] = cloneFreeze(value[i]);
    return Object.freeze(next);
  }
  if (value && typeof value === 'object') {
    const next = {};
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      next[keys[i]] = cloneFreeze(value[keys[i]]);
    }
    return Object.freeze(next);
  }
  return value;
}

export let AI_GOAL_BASE_WEIGHTS = Object.freeze({});
export let AI_GOAL_TO_STAGE = Object.freeze({});
export let AI_EVENT_BOOSTS = Object.freeze({});
export let AI_LOCAL_PATH = Object.freeze({});

export function installAiPack(doc) {
  const d = doc || {};
  AI_GOAL_BASE_WEIGHTS = cloneFreeze(d.goalBaseWeights || {});
  AI_GOAL_TO_STAGE = cloneFreeze(d.goalToStage || {});
  AI_EVENT_BOOSTS = cloneFreeze(d.eventBoosts || {});
  AI_LOCAL_PATH = cloneFreeze(d.localPath || {});
}
