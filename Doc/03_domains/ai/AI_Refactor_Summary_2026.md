# AI Architecture & Refactor Summary (2026)

Merged from `FSMBot_Breach2` into live `js/ai/` (sandbox deleted).

Blueprint: `AI-Stage-Goals-and-Actions.txt`  
Pipeline: Event → Blackboard → Mediator → Stage → Unified Input

---

## 1. Refactored files

### A. `js/ai/blackboard.js` — three-axis contract
- **Decision:** `activeGoal`, `activeStage`, priority maps, combat lock / aggro
- **Navigation:** `pathGoal*`, pivots, sector, `slotAngle`, `slotDistRatio`, local steering
- **Survival:** `retreatHpRatio`, `recoverHpRatio`, `isRetreatLatched`, seek / ally / threat
- Flat top-level mirrors kept for legacy readers
- `ensureBlackboard` fills missing `slotAngle` / survival fields (no NaN path goals)

### B. `js/ai/mediator.js` — scoring + LOD
- Target-lock baseline factor (+220) when combat target reserved
- Pre-score clear of dead / ghost targets
- Event queue drained **after** `processUnitEvents` (same tick taunt/hit kept)
- LOD: combat thinks every frame; else every 4 `match.aiTick` steps; stage still runs

### C. `js/ai/general.js` — squad circle on pivot chain
- Groups get `groupRadius` / `groupX` / `groupY`
- `attachUnitToGroup` / `advanceUnitAlongChain` offset `pathGoal` by `navigation.slotAngle`
- Imports `ensureBlackboard`

### D. Tick source
- `match.aiTick` init in `sim.js`; incremented in `decideEnemyActions` each brain tick

---

## 2. Merge notes
- Do not clear `bb.events` before `processUnitEvents`
- Do not rely on missing `match.frame` — use `match.aiTick` only
