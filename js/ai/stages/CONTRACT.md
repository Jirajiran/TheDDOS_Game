# Stage contracts (Phase 2)

Rules enforced for `js/ai/stages/*`:

1. **Single job** — one stage file = one concern (approach / engage / retreat / regroup / seek / place).
2. **No cross-stage imports** — stages must not `import` other stages. Only Mediator selects the runner.
3. **Output = Action list** — return Unified Input actions only; no direct sim mutation of other units' AI.
4. **No story hardcode** — use blackboard coords / ids / flags; no archetype name branches inside stages.
5. **Mediator owns Goal→Stage** — see `js/ai/mediator.js` + pack `allowedGoals`.

Audit (2026-10-18): approach, engage, retreat, regroup, seek_point, place — no cross-imports found.
