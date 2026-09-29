import { L1_SIZE, L3_SIZE, TEAM } from './config.js';
import { getMeleeVolume } from './sim.js';

/**
 * World + units + projectiles + blocks + drops + place ghost.
 */
export function renderWorld(ctx, world, camera, match) {
  const zoom = camera.zoom;
  ctx.save();
  ctx.setTransform(zoom, 0, 0, zoom, -camera.x * zoom, -camera.y * zoom);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#1a1c1e';
  ctx.fillRect(0, 0, world.worldW, world.worldH);

  for (let i = 0; i < world.paths.length; i++) {
    const p = world.paths[i];
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
    drawBaseChunk(ctx, match.baseChunk, zoom);
    drawGeneralPaths(ctx, match.general, zoom);
    drawBlocks(ctx, match.blocks, zoom);
    drawDrops(ctx, match.pools.drops, zoom);
    drawPlaceGhost(ctx, match.placeGhost, zoom);
    drawUnits(ctx, match.pools.units, zoom);
    if (match.showMeleeVolume) {
      drawMeleeVolumes(ctx, match, zoom);
    }
    drawProjectiles(ctx, match.pools.projectiles, zoom);
    drawBeams(ctx, match.beams);
  }

  ctx.restore();
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

function drawGeneralPaths(ctx, general, zoom) {
  if (!general || !general.groups) return;
  ctx.strokeStyle = 'rgba(255,120,80,0.35)';
  ctx.lineWidth = 2 / zoom;
  for (let g = 0; g < general.groups.length; g++) {
    const group = general.groups[g];
    if (!group.pivots || group.pivots.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(group.pivots[0].x, group.pivots[0].y);
    for (let i = 1; i < group.pivots.length; i++) {
      ctx.lineTo(group.pivots[i].x, group.pivots[i].y);
    }
    ctx.stroke();
    for (let i = 0; i < group.pivots.length; i++) {
      const p = group.pivots[i];
      ctx.fillStyle = 'rgba(255,100,60,0.7)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6 / zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBlocks(ctx, blocks, zoom) {
  if (!blocks) return;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b || !b.alive) continue;
    ctx.globalAlpha = b.isOpen ? 0.35 : 1;
    ctx.fillStyle = b.color || (b.isDefeatCondition ? '#c4a35a' : '#8a8a8a');
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = b.isWire ? '#e8e060' : '#2a2010';
    ctx.lineWidth = (b.isWire ? 2 : 3) / zoom;
    if (b.isWire) {
      ctx.setLineDash([6 / zoom, 4 / zoom]);
    }
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Turret / armed base: layer 2 gun rotates; base rect above stays fixed.
    const isArmed = b.isTurret || (b.isDefeatCondition && b.weaponId);
    if (isArmed && b.weaponId) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const aim = typeof b.turretAimRad === 'number' ? b.turretAimRad : 0;
      const r = Math.min(b.w, b.h) * 0.22;
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(aim);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(r * 0.2, -r * 0.35, r * 1.6, r * 0.7);
      ctx.fillStyle = '#111';
      ctx.fillRect(r * 1.4, -r * 0.18, r * 0.9, r * 0.36);
      ctx.restore();
    }

    if (b.isGen && b.genStock > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = `${12 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(b.genStock), b.x + b.w / 2, b.y + b.h / 2);
    }

    const ratio = b.maxHp > 0 ? Math.max(0, b.hp / b.maxHp) : 0;
    if (ratio < 0.999) {
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
  // Heal range overlay after solids — opacity 50%, visual only (units draw above).
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

function drawMeleeVolumes(ctx, match, zoom) {
  const units = match.pools && match.pools.units;
  if (!units) return;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    if (u.role !== 'player' && u.team !== TEAM.PLAYER) continue;
    const vol = getMeleeVolume(u);
    ctx.save();
    ctx.translate(vol.ox, vol.oy);
    ctx.rotate(vol.ang);
    ctx.fillStyle = 'rgba(220, 40, 40, 0.28)';
    ctx.strokeStyle = 'rgba(220, 40, 40, 0.55)';
    ctx.lineWidth = 2 / zoom;
    const x0 = vol.start;
    const y0 = -vol.halfW;
    ctx.fillRect(x0, y0, vol.reach, vol.halfW * 2);
    ctx.strokeRect(x0, y0, vol.reach, vol.halfW * 2);
    ctx.restore();
  }
}

function drawDrops(ctx, drops, zoom) {
  if (!drops) return;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (!d.active) continue;
    ctx.fillStyle = '#d4c070';
    ctx.fillRect(d.x - 8, d.y - 8, 16, 16);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1 / zoom;
    ctx.strokeRect(d.x - 8, d.y - 8, 16, 16);
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

function drawUnits(ctx, units, zoom) {
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;

    const isPlayer = u.role === 'player' || u.team === TEAM.PLAYER;
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

    if (u.weaponId && !isPlayer) {
      ctx.fillStyle = '#333';
      ctx.fillRect(u.x + 4, u.y - 4, 10, 4);
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

function stageColor(u) {
  if (u.aiStage === 'retreat') return '#c48a5c';
  if (u.aiStage === 'engage') return '#c45c5c';
  return '#a05050';
}

function drawProjectiles(ctx, projectiles, zoom) {
  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i];
    if (!p.active) continue;
    ctx.fillStyle = p.team === TEAM.PLAYER ? '#ffe08a' : '#ff8866';
    ctx.fillRect(
      p.x - p.radius,
      p.y - p.radius,
      p.radius * 2,
      p.radius * 2
    );
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
