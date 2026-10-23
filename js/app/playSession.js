import {
  makeCastSkillAction,
  makeSelectHotbarAction,
  makeTakeBaseAction,
  makeTakeGenAction,
} from '../player/actions.js';
import { GAME_PACK, getBalancePack, getWeaponDef } from '../config.js';
import { panCamera } from '../view/camera.js';
import { tickNightBlend } from '../view/dayCycle.js';
import { hostIngestActions } from '../session/host.js';
import {
  countItem,
  getActiveSlot,
  isBackpackSlot,
  isWeaponSlot,
} from '../player/inventory.js';
import {
  findInteractTarget,
  findNearbyBackpackDrop,
  getEquippedBackpackTier,
  getPlayerUnit,
  tickMatch,
  tryEquipBackpackFromDrop,
  tryEquipBackpackFromSlot,
  tryUnequipBackpackToDrop,
  updatePlaceGhost,
} from '../sim.js';
import { SkillPhase } from '../combat/skills.js';
import { formatAmmoHud } from '../combat/weapons.js';

/**
 * Play frame: poll input, send the same actions into the sim, refresh the HUD.
 * The hub owns screen changes and the animation loop.
 */
export function createPlaySession(hub) {
  function inventoryFingerprint(inv) {
    const { state } = hub;
    if (!inv) return '';
    let s = `${state.match && state.match.equippedBackpackId}|`;
    for (let i = 0; i < inv.length; i++) {
      const slot = inv[i];
      s += `${slot.itemId || ''}:${slot.count}:${slot.ammoInMag || 0}:${slot.mags || 0}|`;
    }
    return s;
  }

  function syncInteractiveUi(match) {
    const { state, playerUi } = hub;
    if (!playerUi || !playerUi.isReady()) return;
    const player = getPlayerUnit(match);
    if (!player) {
      playerUi.setInteractiveVisible(false);
      return;
    }
    const best = findInteractTarget(match, player);
    const nearGenOrBase = !!(
      best &&
      ((best.isGen && best.genRate) || best.isDefeatCondition)
    );
    const slot = getActiveSlot(match.inventory, match.activeHotbar);
    playerUi.setInteractiveVisible(isWeaponSlot(slot) || nearGenOrBase);

    if (playerUi.isGenOpen && playerUi.isGenOpen() && !nearGenOrBase) {
      playerUi.setGenOpen(false);
      if (state.panels) state.panels.close();
    }
  }

  function handleCraftOrBackpackF(polled, match, dt) {
    const { state, playerUi } = hub;
    const fDown = !!(state.input && state.input.keys && state.input.keys.KeyF);
    const craftOpen = state.panels && state.panels.getOpenKind() === 'craft';
    const settingOpen = playerUi && playerUi.isSettingOpen();

    if (!fDown || craftOpen || settingOpen) {
      state.fHoldAcc = 0;
    } else if (match.equippedBackpackId && !findNearbyBackpackDrop(match)) {
      state.fHoldAcc += dt;
      if (state.fHoldAcc >= 3) {
        state.fHoldAcc = 0;
        tryUnequipBackpackToDrop(match);
        hub.refreshHotbar();
        return;
      }
    } else {
      state.fHoldAcc = 0;
    }

    if (!polled.craftTogglePressed) return;
    if (settingOpen) return;

    const near = findNearbyBackpackDrop(match);
    if (near) {
      tryEquipBackpackFromDrop(match, near);
      hub.refreshHotbar();
      return;
    }
    const active = getActiveSlot(match.inventory, match.activeHotbar);
    if (isBackpackSlot(active)) {
      tryEquipBackpackFromSlot(match, match.activeHotbar);
      hub.refreshHotbar();
      return;
    }
    hub.dispatchUi('craftToggle');
  }

  function updateHud(match) {
    const { state, playerUi } = hub;
    const player = getPlayerUnit(match);
    let gunName = 'EMPTY';
    let ammoLine = 'AMMO : —';
    const slot = getActiveSlot(match.inventory, match.activeHotbar);
    if (isWeaponSlot(slot)) {
      const wdef = getWeaponDef(slot.weaponId || slot.itemId);
      const reserve =
        wdef && wdef.ammoTypeId
          ? countItem(match.inventory, wdef.ammoTypeId)
          : null;
      gunName = slot.label || slot.itemId;
      ammoLine = `AMMO : ${formatAmmoHud(slot, wdef, reserve)}`;
    } else if (slot && slot.itemId) {
      gunName = slot.label || slot.itemId;
      ammoLine = `×${slot.count}`;
    }
    hub.syncDebugHudButtons(match);

    if (playerUi && playerUi.isReady()) {
      const skills = [];
      const skillIds =
        player && Array.isArray(player.skillIds) && player.skillIds.length
          ? player.skillIds
          : getBalancePack().playerActiveSkills || ['FIST', 'SELF_HEAL'];
      for (let si = 0; si < skillIds.length; si++) {
        const sid = skillIds[si];
        const rt = player && player.skills ? player.skills[sid] : null;
        const cd =
          rt && rt.phase === SkillPhase.COOLDOWN
            ? rt.cooldownTimer || 0
            : rt && rt.phase === SkillPhase.ACTIVE
              ? rt.activeTimer || 0
              : 0;
        skills.push({ id: sid, cooldownSec: cd });
      }
      if (!skills.length) skills.push({ id: 'FIST', cooldownSec: 0 });
      const effects = Array.isArray(match.playerEffects)
        ? match.playerEffects
        : player && Array.isArray(player.effects)
          ? player.effects
          : [];
      playerUi.syncHud({
        waveIndex: match.waveIndex || 0,
        waveActive: !!(match.waveActive && match.enemiesAlive > 0),
        baseHp: match.base ? match.base.hp : 0,
        baseMaxHp: match.base ? match.base.maxHp : 0,
        baseAlive: !!(match.base && match.base.alive),
        playerHp: player ? player.hp : 0,
        playerMaxHp: player ? player.maxHp : 1,
        gunName,
        ammoLine,
        simTimeSec: match.simTime != null ? match.simTime : match.time || 0,
        enemiesPresent: (match.enemiesAlive || 0) > 0,
        slots: match.inventory || [],
        activeHotbar: match.activeHotbar || 0,
        backpackTier: getEquippedBackpackTier(match),
        skills,
        effects,
        dt: state._hudDt || 1 / 60,
      });
    }
  }

  function updatePlaying(dt) {
    const { state, canvas, playerUi } = hub;
    const match = state.match;
    if (!match) return;
    state._hudDt = dt;
    tickNightBlend(match, dt);

    try {
      state.autosaveAcc += dt;
      hub.tryAutosave(false);

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const playerId = match.playerUnitId >= 0 ? match.playerUnitId : 0;
      const anchor = getPlayerUnit(match);
      if (anchor && state.input.setAimAnchor) {
        state.input.setAimAnchor(anchor.x, anchor.y);
      }
      const polled = state.input.poll(
        playerId,
        state.camera,
        cssW,
        cssH,
        match.activeHotbar,
        match.inventory
      );
      state.mouseScreenX = polled.mouseScreenX;
      state.mouseScreenY = polled.mouseScreenY;

      if (polled.escapePressed) {
        if (playerUi && playerUi.isChatOpen && playerUi.isChatOpen()) {
          playerUi.closeChat();
        } else if (hub.isCheatOpen()) hub.closeCheat();
        else if (playerUi && playerUi.isSettingOpen()) {
          playerUi.setSettingOpen(false);
          if (state.input) state.input.setUiBlocked(false);
        } else if (playerUi && playerUi.isGenOpen && playerUi.isGenOpen()) {
          playerUi.setGenOpen(false);
          if (state.panels) state.panels.close();
        } else if (state.panels && state.panels.isOpen()) state.panels.close();
      }

      if (polled.chatTogglePressed) {
        hub.dispatchUi('chatToggle');
      }

      syncInteractiveUi(match);

      handleCraftOrBackpackF(polled, match, dt);
      if (polled.interactTogglePressed) {
        if (state.panels && state.panels.isReceiveOpen()) hub.dispatchUi('genClose');
        else hub.dispatchUi('interact');
      }
      if (polled.fistTogglePressed) hub.dispatchUi('castFist');
      if (polled.healSkillTogglePressed) hub.dispatchUi('castHeal');

      if (match.playerDead || match.cameraFreeFly) {
        hub.ensureFreeFlyCamera(match, cssW, cssH);
        const speed = GAME_PACK.cameraFreeFlySpeed || 520;
        panCamera(
          state.camera,
          (polled.moveDx || 0) * speed * dt,
          (polled.moveDy || 0) * speed * dt,
          match.world.worldW,
          match.world.worldH,
          cssW,
          cssH
        );
        const outcome = tickMatch(match, [], polled.mouseWorld, dt);
        if (state.panels) {
          state.panels.consumePendingUi(match);
          state.panels.tick(dt);
        }
        if (outcome === 'win' || outcome === 'lose') {
          hub.endMatch(outcome);
        }
        return;
      }

      const prevHotbar = match.activeHotbar;
      const invFingerprint = inventoryFingerprint(match.inventory);
      let actions = hostIngestActions(state.host, polled.actions, null) || [];
      if (state.pendingHotbarSelect >= 0) {
        const slot = state.pendingHotbarSelect;
        state.pendingHotbarSelect = -1;
        actions = [
          makeSelectHotbarAction(playerId, slot),
          ...actions.filter((a) => a.type !== 'SELECT_HOTBAR'),
        ];
      }
      if (state.pendingFistCast) {
        state.pendingFistCast = false;
        actions = actions.concat([makeCastSkillAction(playerId, 'FIST')]);
      }
      if (state.pendingHealCast) {
        state.pendingHealCast = false;
        actions = actions.concat([makeCastSkillAction(playerId, 'SELF_HEAL')]);
      }
      if (state.pendingTake) {
        const pend = state.pendingTake;
        state.pendingTake = null;
        if (pend.kind === 'gen') {
          actions = actions.concat([
            makeTakeGenAction(playerId, pend.blockId),
          ]);
        } else if (pend.kind === 'base') {
          actions = actions.concat([
            makeTakeBaseAction(playerId, pend.itemId),
          ]);
        }
      }
      updatePlaceGhost(match, polled.mouseWorld);
      const outcome = tickMatch(match, actions, polled.mouseWorld, dt);

      if (state.panels) {
        state.panels.consumePendingUi(match);
        state.panels.tick(dt);
      }

      if (
        match.activeHotbar !== prevHotbar ||
        inventoryFingerprint(match.inventory) !== invFingerprint
      ) {
        hub.refreshHotbar();
        if (state.panels) state.panels.refreshCraftIfOpen();
      }

      if (outcome === 'win' || outcome === 'lose') {
        hub.endMatch(outcome);
      }
    } finally {
      updateHud(match);
    }
  }

  return { updatePlaying };
}
