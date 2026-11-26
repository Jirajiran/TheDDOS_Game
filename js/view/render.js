import {
  GAME_PACK,
  L1_SIZE,
  L3_SIZE,
  TEAM,
  getBlockDef,
  getItemDef,
  getWeaponDef,
} from '../config.js';
import { drawUnitEquipCosmetics, weaponArtSpec } from './cosmetics.js';
import {
  drawUnitVisualBack,
  drawUnitVisualFront,
  getUnitArm1PivotWorld,
} from './unitVisual.js';
import { getNightOverlayStyle } from './dayCycle.js';
import {
  getProjectileArt,
  getWeaponBtnImage,
  getWeaponBtnLayout,
} from './weaponBtnArt.js';
import { blockTurretWorldPoints, drawBlockHull, preloadBlockArt } from './blockArt.js';
preloadBlockArt();
import { drawVehicleArt, getVehicleAnchors } from './vehicleArt.js';
import {
  vehicleAnchorWorld,
  vehicleVisualState,
} from '../sim/vehicle.js';
import {
  artPoolKeyStructure,
  drawArtPoolEntry,
  getGameplayArtPool,
} from './artPool.js';

/**
 * World + units + projectiles + blocks + drops + place ghost.
 * @param {number} [dpr=1] devicePixelRatio scale — must match drawPlaying buffer.
 * @param {number} [viewCssW] CSS viewport width for night overlay
 * @param {number} [viewCssH] CSS viewport height for night overlay
 */
export function renderWorld(ctx, world, camera, match, dpr = 1, viewCssW, viewCssH) {
  if (!world) return;
  const zoom = camera && camera.zoom > 0 ? camera.zoom : 1;
  const scale = (dpr > 0 ? dpr : 1) * zoom;
  const camX = camera && Number.isFinite(camera.x) ? camera.x : 0;
  const camY = camera && Number.isFinite(camera.y) ? camera.y : 0;

  ctx.save();
  // Compose DPR + camera: world unit → device pixels (do not wipe DPR).
  ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#1a1c1e';
  ctx.fillRect(0, 0, world.worldW, world.worldH);

  const paths = world.paths || [];
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2 / zoom;
    for (let gx = 1; gx < 2; gx++) {
      const lx = p.x + gx * L1_SIZE;
      ctx.beginPath();
      ctx.moveTo(lx, p.y);
      ctx.lineTo(lx, p.y + p.h);
      ctx.stroke();
    }
    for (let gy = 1; gy < 2; gy++) {
      const ly = p.y + gy * L1_SIZE;
      ctx.beginPath();
      ctx.moveTo(p.x, ly);
      ctx.lineTo(p.x + p.w, ly);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 4 / zoom;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = '#f5f5f0';
    ctx.font = 'bold 96px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.index), p.x + p.w / 2, p.y + p.h / 2);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1 / zoom;
  for (let x = L3_SIZE; x < world.worldW; x += L3_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.worldH);
    ctx.stroke();
  }
  for (let y = L3_SIZE; y < world.worldH; y += L3_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.worldW, y);
    ctx.stroke();
  }

  if (match) {
    drawBotAreas(ctx, world);
    drawEditorMapAreas(ctx, match.mapAreas);
    if (match.territories && match.territories.length) drawTerritories(ctx, match.territories);
    else drawBaseChunk(ctx, match.baseChunk, zoom);
    drawBlockBodies(ctx, match.blocks, zoom);
    drawTurretGuns(ctx, match.blocks);
    drawBlockHealRanges(ctx, match.blocks);
    drawVehicles(ctx, match.vehicles, zoom, match);
    drawDrops(ctx, match.pools && match.pools.drops, zoom);
    drawPlaceGhost(ctx, match.placeGhost, zoom);
    drawUnits(ctx, match.pools && match.pools.units, zoom, match);
    drawMeleeVfx(ctx, match.meleeVfx, zoom);
    drawExplosionVfx(ctx, match.explosionVfx, zoom);
    drawProjectiles(ctx, match.pools, zoom, match);
    drawBeams(ctx, match.beams);
    drawBlockHpBars(ctx, match);
  }

  ctx.restore();

  // Night tint — screen-space over world, under HTML/SVG HUD.
  if (match) {
    const ov = getNightOverlayStyle(match.nightBlend || 0);
    if (ov.alpha > 0.001) {
      const cssW = viewCssW > 0 ? viewCssW : ctx.canvas.width / (dpr || 1);
      const cssH = viewCssH > 0 ? viewCssH : ctx.canvas.height / (dpr || 1);
      ctx.save();
      ctx.setTransform(dpr > 0 ? dpr : 1, 0, 0, dpr > 0 ? dpr : 1, 0, 0);
      ctx.globalAlpha = ov.alpha;
      ctx.fillStyle = ov.color;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.restore();
    }
  }
}

function rectsShareEdge(a, b) {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;
  const vertical = (ax2 === b.x || bx2 === a.x) && a.y < by2 && ay2 > b.y;
  const horizontal = (ay2 === b.y || by2 === a.y) && a.x < bx2 && ax2 > b.x;
  return vertical || horizontal;
}

/** One fill per connected set of edge Areas. Open and closed stay separate bodies. */
function drawBotAreas(ctx, world) {
  const areas = world && world.edgeAreas;
  if (!areas || !areas.length) return;
  fillAreaGroups(ctx, areas, true, 'rgba(220, 48, 40, 0.34)');
  fillAreaGroups(ctx, areas, false, 'rgba(220, 48, 40, 0.12)');
}

/** Editor / map-file areas (not FlatLand red rim). */
function drawEditorMapAreas(ctx, areas) {
  if (!areas || !areas.length) return;
  fillAreaGroups(ctx, areas, true, 'rgba(48, 160, 220, 0.28)');
  fillAreaGroups(ctx, areas, false, 'rgba(48, 160, 220, 0.10)');
}

function fillAreaGroups(ctx, areas, open, fillStyle) {
  const list = [];
  for (let i = 0; i < areas.length; i++) {
    if (!!areas[i].open === open) list.push(areas[i]);
  }
  if (!list.length) return;
  const parent = new Array(list.length);
  for (let i = 0; i < list.length; i++) parent[i] = i;
  function find(i) {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (!rectsShareEdge(list[i], list[j])) continue;
      parent[find(i)] = find(j);
    }
  }
  const groups = [];
  const byRoot = Object.create(null);
  for (let i = 0; i < list.length; i++) {
    const root = find(i);
    let group = byRoot[root];
    if (!group) {
      group = [];
      byRoot[root] = group;
      groups.push(group);
    }
    group.push(list[i]);
  }
  ctx.fillStyle = fillStyle;
  for (let g = 0; g < groups.length; g++) {
    const pads = groups[g];
    ctx.beginPath();
    for (let p = 0; p < pads.length; p++) {
      const pad = pads[p];
      ctx.rect(pad.x, pad.y, pad.w, pad.h);
    }
    ctx.fill();
  }
}

function drawTerritories(ctx, territories) {
  ctx.fillStyle = 'rgba(196, 163, 90, 0.28)';
  for (let i = 0; i < territories.length; i++) {
    const pads = territories[i].pads;
    if (!pads || !pads.length) continue;
    ctx.beginPath();
    for (let p = 0; p < pads.length; p++) {
      const pad = pads[p];
      ctx.rect(pad.x, pad.y, pad.w, pad.h);
    }
    ctx.fill();
  }
}

function drawBaseChunk(ctx, zone, zoom) {
  if (!zone) return;
  ctx.fillStyle = 'rgba(196, 163, 90, 0.12)';
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  ctx.strokeStyle = 'rgba(196, 163, 90, 0.55)';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([8 / zoom, 6 / zoom]);
  ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
  ctx.setLineDash([]);
}

function turretWeaponFrame(weaponId) {
  const keys = ['rpg-loaded', 'pyro-body', 'base'];
  const candidates = [];
  const def = getWeaponDef(weaponId);
  const art =
    (def && typeof def.artId === 'string' && def.artId) ||
    (def && typeof def.mountArtId === 'string' && def.mountArtId) ||
    '';
  if (/^Weapon_Turrent_[123]$/i.test(art)) candidates.push(art);
  const spec = weaponArtSpec(weaponId);
  if (spec && spec.group && /^Weapon_Turrent_[123]$/i.test(spec.group)) {
    candidates.push(spec.group);
  }
  candidates.push('Weapon_Turrent_1');
  if (weaponId) candidates.push(weaponId);
  for (let c = 0; c < candidates.length; c++) {
    for (let i = 0; i < keys.length; i++) {
      const img = getWeaponBtnImage(candidates[c], keys[i]);
      if (img) {
        return { img, lay: getWeaponBtnLayout(candidates[c], keys[i]) };
      }
    }
  }
  return { img: null, lay: null };
}

function drawGunAt(ctx, x, y, aim, frame) {
  const img = frame.img;
  const lay = frame.lay;
  ctx.save();
  ctx.translate(x, y);
  const packOff =
    GAME_PACK.unitVisualFacingOffsetRad != null
      ? GAME_PACK.unitVisualFacingOffsetRad
      : -Math.PI / 2;
  ctx.rotate(aim + packOff);
  // 1 SizeView = L3_SIZE — do not stretch gun to full Base footprint.
  const scale = L3_SIZE / 64;
  if (img && img.width > 0 && lay && lay.w > 0 && lay.h > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, lay.x * scale, lay.y * scale, lay.w * scale, lay.h * scale);
  } else {
    const r = L3_SIZE * 0.22;
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(r * 0.2, -r * 0.35, r * 1.6, r * 0.7);
  }
  ctx.restore();
}

function mountGunGroupOf(weaponId) {
  if (!weaponId) return '';
  const def = getWeaponDef(weaponId);
  if (def && typeof def.mountArtId === 'string' && def.mountArtId.trim()) {
    return def.mountArtId.trim();
  }
  if (def && typeof def.artId === 'string' && def.artId.trim()) {
    return def.artId.trim();
  }
  const spec = weaponArtSpec(weaponId);
  return (spec && spec.group) || '';
}

/**
 * Prefer hull-only bake (no gun) so Pivot_turrent guns layer live like vehicle.
 * Falls back to with-gun bake only when body-only missing (then skip live guns).
 */
function structureCompositeEntry(block) {
  const pool = getGameplayArtPool();
  if (!pool || !block) return null;
  const gun = block.weaponId ? mountGunGroupOf(block.weaponId) : '';
  const fw = block.fw || 1;
  const fh = block.fh || 1;
  const artId = block.artId || '';
  const bodyOnly = pool.get(artPoolKeyStructure(artId, '', fw, fh));
  if (bodyOnly) return { entry: bodyOnly, bakedGuns: false };
  const withGun = gun ? pool.get(artPoolKeyStructure(artId, gun, fw, fh)) : null;
  if (withGun) return { entry: withGun, bakedGuns: !!gun };
  return null;
}

/** Hull + seat + turrets are layered at runtime — baked composite freezes wrong unit/facing. */

function drawTurretGun(ctx, block) {
  const aim = typeof block.turretAimRad === 'number' ? block.turretAimRad : 0;
  const frame = turretWeaponFrame(block.weaponId);
  const points = blockTurretWorldPoints(block);
  for (let i = 0; i < points.length; i++) {
    drawGunAt(ctx, points[i].x, points[i].y, aim, frame);
  }
}

function resolveRuntimeBlockArtId(b) {
  if (!b) return '';
  if (typeof b.artId === 'string' && b.artId.trim()) return b.artId.trim();
  const def = getBlockDef(b.itemId) || getItemDef(b.itemId);
  if (def && typeof def.artId === 'string' && def.artId.trim()) {
    b.artId = def.artId.trim();
    return b.artId;
  }
  if (b.isDefeatCondition) {
    b.artId = 'Block_Base';
    return b.artId;
  }
  if (b.isTurret) {
    b.artId = 'Block_Turrent_1';
    return b.artId;
  }
  return '';
}

function drawBlockBodies(ctx, blocks, zoom) {
  if (!blocks) return;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b || !b.alive) continue;
    ctx.globalAlpha = b.isOpen ? 0.35 : 1;
    let drew = false;
    b._structureBakedGuns = false;
    const artId = resolveRuntimeBlockArtId(b);
    // Prefer live BlockArt hull (SizeView pin) — same SVG Editor Map uses.
    if (artId && drawBlockHull(ctx, artId, b.x, b.y, b.w, b.h)) {
      drew = true;
      b._drewPoolComposite = false;
    } else {
      const picked = structureCompositeEntry(b);
      // Skip color-foot-only pool entries (empty tan slab) when we expect BlockArt.
      const poolOk =
        picked &&
        picked.entry &&
        !(b.artId && picked.entry.kind === 'structure' && !picked.entry.image && !picked.entry.dataUrl);
      if (
        poolOk &&
        drawArtPoolEntry(ctx, picked.entry, b.x, b.y, b.w, b.h)
      ) {
        drew = true;
        b._drewPoolComposite = true;
        b._structureBakedGuns = !!picked.bakedGuns;
      }
    }
    if (!drew) {
      b._drewPoolComposite = false;
      // Never paint empty color when artId is set — wait for BlockArt preload.
      if (!b.artId) {
        ctx.fillStyle = b.color || (b.isDefeatCondition ? '#c4a35a' : '#8a8a8a');
        ctx.fillRect(b.x, b.y, b.w, b.h);
      } else {
        preloadBlockArt();
      }
    }
    ctx.strokeStyle = b.isWire ? '#e8e060' : '#2a2010';
    ctx.lineWidth = (b.isWire ? 2 : 3) / zoom;
    if (b.isWire) {
      ctx.setLineDash([6 / zoom, 4 / zoom]);
    }
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    if (b.isGen && b.genStock > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = `${12 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(b.genStock), b.x + b.w / 2, b.y + b.h / 2);
    }
  }
}

function drawTurretGuns(ctx, blocks) {
  if (!blocks) return;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b || !b.alive || !b.weaponId) continue;
    // Live guns at SizeView-origin pivots — skip only when bake already has guns.
    if (b._structureBakedGuns) continue;
    const isArmed = b.isTurret || (b.isDefeatCondition && b.weaponId);
    if (!isArmed) continue;
    drawTurretGun(ctx, b);
  }
}

function localPlayerUnit(match) {
  const units = match.pools && match.pools.units;
  if (!units) return null;
  const id = match.playerUnitId;
  let fallback = null;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u || !u.active) continue;
    if (id != null && u.id === id) return u;
    if (!fallback && u.role === 'player') fallback = u;
  }
  return fallback;
}

function drawBlockHpBars(ctx, match) {
  const blocks = match.blocks;
  const player = localPlayerUnit(match);
  if (!blocks || !player) return;
  const radiusL3 =
    GAME_PACK.blockHpBarRadiusL3 > 0 ? GAME_PACK.blockHpBarRadiusL3 : 6;
  const cap = GAME_PACK.blockHpBarCap > 0 ? GAME_PACK.blockHpBarCap | 0 : 8;
  const reach = radiusL3 * L3_SIZE;
  const reach2 = reach * reach;
  const near = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b || !b.alive || !(b.maxHp > 0)) continue;
    const ratio = Math.max(0, b.hp / b.maxHp);
    if (ratio >= 0.999) continue;
    const dx = b.x + b.w / 2 - player.x;
    const dy = b.y + b.h / 2 - player.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > reach2) continue;
    near.push({ b: b, d2: d2, ratio: ratio });
  }
  if (near.length > cap) {
    near.sort(function (a, c) {
      return a.d2 - c.d2;
    });
    near.length = cap;
  }
  for (let i = 0; i < near.length; i++) {
    const b = near[i].b;
    const ratio = near[i].ratio;
    const barW = b.w;
    const barH = 8;
    const bx = b.x;
    const by = b.y - 14;
    ctx.fillStyle = '#222';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = ratio > 0.35 ? '#6dbf7a' : '#c45c5c';
    ctx.fillRect(bx, by, barW * ratio, barH);
  }
}

function drawBlockHealRanges(ctx, blocks) {
  if (!blocks) return;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b || !b.alive || !b.isHeal || !(b.healRadius > 0)) continue;
    const hx = b.x + b.w / 2;
    const hy = b.y + b.h / 2;
    ctx.fillStyle = 'rgba(92, 191, 138, 0.5)';
    ctx.beginPath();
    ctx.arc(hx, hy, b.healRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDrops(ctx, drops, zoom) {
  if (!drops) return;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (!d.active) continue;
    const r = d.radius > 0 ? d.radius : 8;
    ctx.fillStyle = '#d4c070';
    ctx.fillRect(d.x - r, d.y - r, r * 2, r * 2);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1 / zoom;
    ctx.strokeRect(d.x - r, d.y - r, r * 2, r * 2);
  }
}

/**
 * Turrets parented to hull: Pivot_turrent local → world via visual facing.
 * Gun aim uses same south-art offset as drawGunAt.
 */
function drawVehicleGuns(ctx, vehicle) {
  if (!vehicle || !vehicle.weaponId) return;
  const state = vehicleVisualState(vehicle);
  const anchors = getVehicleAnchors(state);
  const locals =
    anchors && anchors.turrets && anchors.turrets.length
      ? anchors.turrets
      : anchors && anchors.turret
        ? [anchors.turret]
        : [{ x: 0, y: 0 }];
  const aim =
    typeof vehicle.turretAimRad === 'number'
      ? vehicle.turretAimRad
      : vehicle.facingRad || 0;
  const frame = turretWeaponFrame(vehicle.weaponId);
  for (let i = 0; i < locals.length; i++) {
    const world = vehicleAnchorWorld(vehicle, locals[i]);
    drawGunAt(ctx, world.x, world.y, aim, frame);
  }
}

/** Live driver at Pivot_Unit — skin + wear from unit state (not baked template). */
function drawSeatedDriver(ctx, match, vehicle, zoom) {
  if (!match || !match.pools || vehicle.driverUnitId == null) return;
  const u = match.pools.units[vehicle.driverUnitId];
  if (!u || !u.active) return;
  // Enter/exit tween owns the single body — do not also pin a ghost at the seat/exit.
  if (u.vehicleTween) return;
  const state = vehicleVisualState(vehicle);
  const anchors = getVehicleAnchors(state);
  const seat =
    anchors && anchors.seats && anchors.seats[0]
      ? anchors.seats[0]
      : { x: 0, y: 0 };
  const pos = vehicleAnchorWorld(vehicle, seat);
  const ox = u.x;
  const oy = u.y;
  const oface = u.facingRad;
  const oaim = u.aimRad;
  const ohide = u.hiddenInVehicle;
  u.x = pos.x;
  u.y = pos.y;
  u.facingRad = vehicle.facingRad || 0;
  u.aimRad = vehicle.facingRad || 0;
  u.hiddenInVehicle = false;
  const drewBack = drawUnitVisualBack(ctx, u, zoom);
  if (drewBack) {
    const cosOpts = {
      isPlayer: u.role === 'player',
      arm1Pivot: getUnitArm1PivotWorld(u),
      match,
    };
    if (u.role === 'player' && match) {
      cosOpts.inventory = match.inventory || match.hotbar;
      cosOpts.activeHotbar = match.activeHotbar;
    }
    drawUnitEquipCosmetics(ctx, u, zoom, cosOpts);
    drawUnitVisualFront(ctx, u, zoom);
  }
  u.x = ox;
  u.y = oy;
  u.facingRad = oface;
  u.aimRad = oaim;
  u.hiddenInVehicle = ohide;
}

function drawVehicles(ctx, vehicles, zoom, match) {
  if (!vehicles || !vehicles.length) return;
  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    if (!v || !v.active) continue;
    // Layer order: hull → seated unit → turrets (all share visual facing).
    const state = vehicleVisualState(v);
    const ok = drawVehicleArt(ctx, state, v.x, v.y, v.facingRad || 0, zoom);
    if (!ok) {
      ctx.fillStyle = '#5a6670';
      ctx.fillRect(v.x - 40, v.y - 28, 80, 56);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2 / (zoom > 0 ? zoom : 1);
      ctx.strokeRect(v.x - 40, v.y - 28, 80, 56);
    }
    drawSeatedDriver(ctx, match, v, zoom);
    drawVehicleGuns(ctx, v);
    if (v.maxHp > 0 && v.hp < v.maxHp) {
      const ratio = Math.max(0, v.hp / v.maxHp);
      ctx.fillStyle = '#222';
      ctx.fillRect(v.x - 36, v.y - 40, 72, 6);
      ctx.fillStyle = ratio > 0.35 ? '#6bcf7a' : '#e07070';
      ctx.fillRect(v.x - 36, v.y - 40, 72 * ratio, 6);
    }
  }
}

function drawPlaceGhost(ctx, ghost, zoom) {
  if (!ghost) return;
  ctx.fillStyle = ghost.valid ? 'rgba(0, 255, 0, 0.28)' : 'rgba(255, 0, 0, 0.28)';
  ctx.fillRect(ghost.x, ghost.y, ghost.w, ghost.h);
  ctx.strokeStyle = ghost.valid ? '#00ff00' : '#ff0000';
  ctx.lineWidth = 2 / zoom;
  ctx.strokeRect(ghost.x, ghost.y, ghost.w, ghost.h);
  if (ghost.color) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = ghost.color;
    ctx.fillRect(ghost.x + 4, ghost.y + 4, ghost.w - 8, ghost.h - 8);
    ctx.globalAlpha = 1;
  }
}

function drawUnits(ctx, units, zoom, match) {
  if (!units) return;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    // Driver body hidden inside vehicle (still exists for HP / team).
    if (u.hiddenInVehicle && !u.vehicleTween) continue;

    const isPlayer = u.role === 'player';
    // Z: AssetBottom → Arm → Weapon → Body → AssetTop
    const drewBack = drawUnitVisualBack(ctx, u, zoom);
    if (!drewBack) {
      // Fallback circle until Unit_Template raster ready.
      ctx.fillStyle = isPlayer ? '#f0e6c8' : stageColor(u);
      ctx.beginPath();
      ctx.arc(u.x, u.y, u.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      const len = isPlayer ? u.radius + 16 : u.radius + 8;
      ctx.strokeStyle = isPlayer ? '#ffe08a' : '#ffaaaa';
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.moveTo(u.x, u.y);
      ctx.lineTo(u.x + Math.cos(u.aimRad) * len, u.y + Math.sin(u.aimRad) * len);
      ctx.stroke();
    }

    // Weapon/item between arms and body (tools snap Pivot_Arm_1).
    const cosOpts = { isPlayer, arm1Pivot: getUnitArm1PivotWorld(u), match };
    if (isPlayer && match) {
      cosOpts.inventory = match.inventory || match.hotbar;
      cosOpts.activeHotbar = match.activeHotbar;
    }
    drawUnitEquipCosmetics(ctx, u, zoom, cosOpts);

    if (drewBack) {
      drawUnitVisualFront(ctx, u, zoom);
    }

    if (u.maxHp > 0 && u.hp < u.maxHp) {
      const ratio = Math.max(0, u.hp / u.maxHp);
      const w = u.radius * 2;
      ctx.fillStyle = '#222';
      ctx.fillRect(u.x - u.radius, u.y - u.radius - 8, w, 4);
      ctx.fillStyle = '#6dbf7a';
      ctx.fillRect(u.x - u.radius, u.y - u.radius - 8, w * ratio, 4);
    }
  }
}

function drawMeleeVfx(ctx, list, zoom) {
  if (!list || !list.length) return;
  for (let i = 0; i < list.length; i++) {
    const fx = list[i];
    const t = Math.max(0, fx.life / (fx.maxLife || 0.14));
    const size = (fx.size || L3_SIZE * 0.7) * (0.55 + 0.45 * t);
    ctx.save();
    ctx.translate(fx.x, fx.y);
    ctx.rotate(fx.ang || 0);
    ctx.globalAlpha = 0.25 + 0.55 * t;
    ctx.fillStyle = fx.color || '#e8dcc0';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.55, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = fx.color || '#fff';
    ctx.lineWidth = 2 / zoom;
    ctx.globalAlpha = 0.4 + 0.4 * t;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, -0.9, 0.9);
    ctx.stroke();
    ctx.restore();
  }
}

/** Red AoE ring at explosion impact — fades with life (mirrors meleeVfx spirit). */
function drawExplosionVfx(ctx, list, zoom) {
  if (!list || !list.length) return;
  for (let i = 0; i < list.length; i++) {
    const fx = list[i];
    const maxLife = fx.maxLife || 0.35;
    const t = Math.max(0, fx.life / maxLife);
    const rad = fx.radius || L3_SIZE;
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.45 * t;
    ctx.fillStyle = fx.color || '#e04040';
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35 + 0.55 * t;
    ctx.strokeStyle = fx.color || '#ff6060';
    ctx.lineWidth = Math.max(1.5, 3 / zoom);
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function stageColor(u) {
  if (u.aiStage === 'retreat') return '#c48a5c';
  if (u.aiStage === 'engage') return '#c45c5c';
  return '#a05050';
}

function drawProjectiles(ctx, pools, zoom, match) {
  const projectiles = pools && pools.projectiles;
  if (!projectiles) return;
  const z = zoom > 0 ? zoom : 1;
  const strokeW = Math.max(2.5, 3.5 / z);
  const playerTeam =
    match && match.playerTeam != null ? match.playerTeam | 0 : null;
  const n =
    pools.projectileActiveCount != null
      ? pools.projectileActiveCount | 0
      : projectiles.length;
  for (let i = 0; i < n; i++) {
    const p = projectiles[i];
    if (!p || !p.active) continue;
    // World-space length — do NOT scale() then divide lineWidth (that made ~0.2px strokes).
    const len = Math.max(10, (p.radius || 4) * 3.2);
    const aim =
      p.vx || p.vy ? Math.atan2(p.vy || 0, p.vx || 0) : 0;
    const cos = Math.cos(aim);
    const sin = Math.sin(aim);
    const half = len * 0.5;
    const color =
      playerTeam != null && p.team === playerTeam ? '#ffe08a' : '#ff8866';
    // Art from WeaponDef.bulletArtId on the projectile — not a weapon id whitelist.
    if (p.bulletArtId) {
      const shot = getProjectileArt(p.bulletArtId);
      const lay = shot && shot._layout;
      if (shot && lay && lay.w > 0 && lay.h > 0) {
        // ItemHold Bullet_* face south (+Y); rotate from travel aim.
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(aim - Math.PI / 2);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(shot, -lay.w * 0.5, -lay.h * 0.5, lay.w, lay.h);
        ctx.restore();
        continue;
      }
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x - cos * half, p.y - sin * half);
    ctx.lineTo(p.x + cos * half, p.y + sin * half);
    ctx.stroke();
    // Tip dot — easier to spot at high bullet speeds.
    ctx.beginPath();
    ctx.arc(p.x + cos * half, p.y + sin * half, Math.max(2, strokeW * 0.85), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBeams(ctx, beams) {
  if (!beams || !beams.length) return;
  for (let i = 0; i < beams.length; i++) {
    const b = beams[i];
    if (!b.active) continue;
    const x1 =
      typeof b.x1 === 'number'
        ? b.x1
        : b.x0 + Math.cos(b.aimRad) * b.maxRange;
    const y1 =
      typeof b.y1 === 'number'
        ? b.y1
        : b.y0 + Math.sin(b.aimRad) * b.maxRange;
    ctx.strokeStyle = b.color || (b.targetFaction === 'FRIENDLY' ? '#7dffb0' : '#ff6b9a');
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.55 + 0.35 * Math.min(1, b.durationLeft);
    ctx.beginPath();
    ctx.moveTo(b.x0, b.y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Hit tip
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
  }
}

export function clearCanvas(ctx, w, h) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#121416';
  ctx.fillRect(0, 0, w, h);
}
