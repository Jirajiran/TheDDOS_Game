import {
  ROSTER_SLOTS,
} from './constants.js';
import {
  GameMode,
} from '../../config.js';
import {
  HIDDEN_SKIN_IDS,
  PLAYABLE_MENU_SKINS,
  clampPlayableMenuSkinId,
} from '../../view/unitVisual.js';

export function installMenuPanels(api) {
  api.ensurePressPair = function ensurePressPair(selectId) {
    if (api.state.pressPairs.has(selectId)) return api.state.pressPairs.get(selectId);
    const selectEl = api.$(selectId);
    if (!selectEl) return null;
  
    const trueSrc =
      api.state.pressTrueTpl ||
      api.$('Btn_Press_True') ||
      api.$('Btn_Press_True_FL');
    const falseSrc =
      api.state.pressFalseTpl ||
      api.$('Btn_Press_false') ||
      api.$('Btn_Press_false_FL') ||
      api.$('Btn_Press_False');
    if (!trueSrc || !falseSrc) return null;
  
    const originals = [];
    for (let i = 0; i < selectEl.children.length; i++) {
      const c = selectEl.children[i];
      if (c.id && String(c.id).indexOf('Btn_Press_') === 0) originals.push(c);
    }
  
    const trueEl = trueSrc.cloneNode(true);
    const falseEl = falseSrc.cloneNode(true);
    api.stripIds(trueEl);
    api.stripIds(falseEl);
    trueEl.setAttribute('data-press', 'true');
    falseEl.setAttribute('data-press', 'false');
    trueEl.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,3) ');
    falseEl.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,3) ');
  
    const insertBefore = originals[0] || selectEl.firstChild;
    selectEl.insertBefore(trueEl, insertBefore);
    selectEl.insertBefore(falseEl, insertBefore);
    for (let i = 0; i < originals.length; i++) {
      originals[i].style.display = 'none';
      originals[i].setAttribute('aria-hidden', 'true');
    }
  
    const pair = { trueEl, falseEl };
    api.state.pressPairs.set(selectId, pair);
    return pair;
  }
  
  api.setSelectPressed = function setSelectPressed(selectId, pressed) {
    const pair = api.ensurePressPair(selectId);
    if (!pair) {
      const el = api.$(selectId);
      if (el) {
        el.style.opacity = pressed ? '1' : '0.55';
        el.style.cursor = 'pointer';
      }
      return;
    }
    api.setVisible(pair.trueEl, pressed);
    api.setVisible(pair.falseEl, !pressed);
    const el = api.$(selectId);
    if (el) {
      el.style.opacity = '1';
      el.style.filter = 'none';
      el.style.cursor = 'pointer';
      api.makeHitTarget(el);
    }
  }
  
  api.syncLabelShow = function syncLabelShow() {
    // Panel id LabelShow (legacy) or decorative siblings under Anchor_Top_Right.
    const panel = api.$('LabelShow');
    if (panel) {
      api.setVisible(panel, api.state.labelShowOpen);
    } else {
      const anchor = api.$('Anchor_Top_Right');
      if (anchor) {
        for (let i = 0; i < anchor.children.length; i++) {
          const c = anchor.children[i];
          if (c && c.id === 'Btn_Red_LabelShow_on') continue;
          api.setVisible(c, api.state.labelShowOpen);
        }
      }
    }
    const btn = api.$('Btn_Red_LabelShow_on');
    if (btn) {
      api.makeHitTarget(btn);
      btn.style.opacity = api.state.labelShowOpen ? '1' : '0.85';
    }
  }
  
  api.syncAudioIcon = function syncAudioIcon() {
    const btn = api.$('btn_Audio');
    if (!btn) return;
    const artTrue = btn.querySelector('[data-audio-art="true"]');
    const artFalse = btn.querySelector('[data-audio-art="false"]');
    if (artTrue && artFalse) {
      api.setVisible(artTrue, !api.state.audioMuted);
      api.setVisible(artFalse, api.state.audioMuted);
    } else {
      // Fallback: baked Icon_Audio / Icon_Audio_Close
      let iconOn = btn.querySelector('[data-audio-icon="on"]');
      let iconOff = btn.querySelector('[data-audio-icon="off"]');
      const baked = api.$('Icon_Audio');
      if (!iconOn && baked) {
        iconOn = baked;
        iconOn.setAttribute('data-audio-icon', 'on');
      }
      if (iconOn) api.setVisible(iconOn, !api.state.audioMuted);
      if (iconOff) api.setVisible(iconOff, api.state.audioMuted);
    }
    // Contract: unmuted = btn_Audio_True · muted = btn_Audio_False (api.state idle)
    btn.setAttribute(
      'data-audio-state',
      api.state.audioMuted ? 'btn_Audio_False' : 'btn_Audio_True'
    );
  }
  
  api.syncPlaySessionUi = function syncPlaySessionUi() {
    const alone = api.state.playSession === 'alone';
    api.setSelectPressed('Select_Alone_player', alone);
    api.setSelectPressed('Select_JoinRoom_player', !alone);
    api.setVisible(api.$('GroupJoinRoom'), !alone);
    api.setVisible(api.$('Join_or_Crate'), !alone);
    api.setVisible(api.$('NumberHushing'), !alone);
  
    for (let i = 0; i < api.inputBindings.length; i++) {
      const b = api.inputBindings[i];
      if (!b.hideWhenAlone) continue;
      b.input.hidden = alone;
      b.input.style.display = alone ? 'none' : 'block';
      if (!alone && b.readOnlyInJoin) {
        b.input.readOnly = true;
        b.input.value = api.state.roomCode;
      } else if (!b.readOnlyInJoin) {
        b.input.readOnly = false;
      }
    }
    api.syncRoster();
    api.layoutInputs();
  }
  
  api.syncRoster = function syncRoster() {
    if (!api.state.svgRoot) return;
    const players =
      typeof api.opts.getPlayers === 'function' ? api.opts.getPlayers() || [] : [];
    const amHost =
      typeof api.opts.isHost === 'function' ? !!api.opts.isHost() : true;
  
    for (let i = 0; i < ROSTER_SLOTS.length; i++) {
      const spec = ROSTER_SLOTS[i];
      const row = api.$(spec.row);
      const kick = api.$(spec.kick);
      const p = players[i];
      if (!row) continue;
  
      if (!p || p.connected === false) {
        api.setVisible(row, false);
        continue;
      }
  
      api.setVisible(row, true);
      const tspan = row.querySelector('tspan');
      if (tspan) {
        const label = `${i + 1}# ${p.name || 'Player'}`;
        tspan.textContent = label;
        tspan.style.visibility = '';
        const textEl = tspan.closest('text');
        if (textEl) textEl.style.visibility = '';
      }
  
      if (kick) {
        const canKick = amHost && !p.isHost && i > 0;
        api.setVisible(kick, canKick);
        if (canKick) api.makeHitTarget(kick);
      }
    }
  }
  
  api.syncWorldPickUi = function syncWorldPickUi() {
    api.setSelectPressed('Select_FlatLand_Mode', api.state.worldPick === 'flat');
    api.setSelectPressed('Select_Resource', api.state.worldPick === 'resource');
    api.setSelectPressed('Select_Resource_FL', api.state.worldPick === 'loadFile');
  }
  
  api.syncSkinUi = function syncSkinUi() {
    api.state.skinId = clampPlayableMenuSkinId(api.state.skinId);
    for (let i = 0; i < PLAYABLE_MENU_SKINS.length; i++) {
      const id = PLAYABLE_MENU_SKINS[i];
      const el = api.$(id);
      if (!el) continue;
      el.style.display = '';
      el.style.opacity = id === api.state.skinId ? '1' : '0.4';
      el.style.filter = id === api.state.skinId ? 'none' : 'grayscale(0.25)';
      api.makeHitTarget(el);
    }
    // Asset / Custom slots — deferred; hide until pack expands.
    for (let i = 0; i < HIDDEN_SKIN_IDS.length; i++) {
      const el = api.$(HIDDEN_SKIN_IDS[i]);
      if (!el) continue;
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    }
  }
  
  api.applyAll = function applyAll() {
    api.syncPlaySessionUi();
    api.syncWorldPickUi();
    api.syncSkinUi();
    api.syncAudioIcon();
    api.syncLabelShow();
    api.syncRoster();
    api.layoutInputs();
  }
  
  api.gameModeFromPick = function gameModeFromPick() {
    if (api.state.worldPick === 'resource') return GameMode.WORLD_TYPE;
    return GameMode.FLAT_SURVIVAL;
  }
}
