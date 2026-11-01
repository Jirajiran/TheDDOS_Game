# OOP / DOP definition spine (updated 2026-10-18)

## Principle
- (Engine) = capacity (pools, hit tests, Unified Input).
- (Pack JSON) = definitions (`data/pack/`).
- (API) = `js/defs/api.js` (prefer over digging config registries).

## Pack files (`pack_manifest.json` v1.2)
| File | Contents |
|------|----------|
| `weapons.json` | Weapon defs (`burstIntervalSec`, beam has no fake speed) |
| `armor.json` | Armor types / items |
| `damage_matrix.json` | damageType × armorType |
| `blocks.json` | Placeables + turrets (stats; fire via `weaponId`) |
| `items.json` | Hotbar / inventory items |
| `skills.json` | CAST_SKILL defs |
| `archetypes.json` | Enemy archetypes + wave tables + aliases (`allowedGoals` → stages) |
| `actors.json` | Player + default enemy sense (`senseRadiusPath`) |
| `weapon_upgrades.json` | Factory upgrade recipes |
| `craft.json` | Craft categories + recipes |

## Runtime API (`js/defs`)
- Lookup: `getWeapon` / `getBlock` / `getItem` / `getSkill` / `getArchetype` / `getActor` / `getWeaponUpgrade`
- Damage: `resolveDamage` / `getDamageMult`
- Craft: `getCraftRecipeById` / `getCraftRecipesByCategory`
- Spawn: `pickEdgeSpawnPosition`
- Boot: `loadDefinitionPack` (JSON overlay; seed fallback from `config.js`)

## Config adapters (compat)
`getWeaponDef` · `getBlockDef` · `getItemDef` · `getSkillDef` · `getUnitArchetype` · `getActorDef` · `getSenseRadiusPx` · `getUpgradeRecipe` · craft helpers · wave pickers → defs first, then in-module registry.

## Combat notes
- Burst = sequential shots (`burstCount` × `burstIntervalSec`), not multi-ammo one frame.
- Shotgun pellets = per-pellet deterministic spread (not fixed fan).
- Hotbar switch delay ≤ 0.1s; locked during burst / continuous beam.
- Sense gate (AI engage awareness) = actor `senseRadiusPath`; fire range stays `maxDistancePath`.

## Out of scope (still)
- Terrain Rule47 · visual art catalog / BulletSkin · mode-specific packs · player asset upload
