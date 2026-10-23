import { playSfx } from '../../audio/sfx.js';
import {
  BTN_SVG_URL,
  SVG_NS,
  ROSTER_SLOTS,
} from './constants.js';
import {
  PLAYABLE_MENU_SKINS,
  clampPlayableMenuSkinId,
} from '../../view/unitVisual.js';

export function installMenuButtons(api) {
  api.makeHitTarget = function makeHitTarget(el) {
    if (!el) return;
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto';
    try {
      el.setAttribute('pointer-events', 'bounding-box');
    } catch (_) {
      /* ignore */
    }
  }
  
  api.wireKickButtons = function wireKickButtons() {
    if (api.state.kicksWired) return;
    api.state.kicksWired = true;
    for (let i = 0; i < ROSTER_SLOTS.length; i++) {
      const slot = i;
      const kick = api.$(ROSTER_SLOTS[i].kick);
      if (!kick) continue;
      api.makeHitTarget(kick);
      kick.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        if (typeof api.opts.onKick === 'function') api.opts.onKick(slot);
      });
    }
  }
  
  api.wireScrollbar = function wireScrollbar(cfg) {
    const handle = api.$(cfg.handleId);
    if (!handle || !cfg.contentIds || !cfg.contentIds.length) return;
  
    const nodes = [];
    for (let i = 0; i < cfg.contentIds.length; i++) {
      const n = api.$(cfg.contentIds[i]);
      if (n) nodes.push({ el: n, base: api.parseMatrix(n) });
    }
    if (!nodes.length) return;
  
    const handleBase = api.parseMatrix(handle);
    const maxScroll = cfg.maxScroll != null ? cfg.maxScroll : 120;
    const handleTravel = cfg.handleTravel != null ? cfg.handleTravel : 90;
    let scroll = 0;
    let dragging = false;
    let startClientY = 0;
    let startScroll = 0;
  
    function applyScroll() {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        api.setMatrix(n.el, {
          ...n.base,
          f: n.base.f - scroll,
        });
      }
      const t = maxScroll <= 0 ? 0 : scroll / maxScroll;
      api.setMatrix(handle, {
        ...handleBase,
        f: handleBase.f + t * handleTravel,
      });
    }
  
    api.makeHitTarget(handle);
  
    const onMove = (e) => {
      if (!dragging) return;
      const dy = e.clientY - startClientY;
      // Rough screen→SVG: viewBox 720 tall letterboxed in api.mount.
      const svg = api.state.svgRoot;
      const vb = svg.viewBox && svg.viewBox.baseVal;
      const rect = svg.getBoundingClientRect();
      const scale = vb && rect.height ? vb.height / rect.height : 1;
      scroll = Math.max(0, Math.min(maxScroll, startScroll + dy * scale));
      applyScroll();
    };
  
    const onUp = () => {
      dragging = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      startClientY = e.clientY;
      startScroll = scroll;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  
    // Wheel over content also scrolls.
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].el.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          scroll = Math.max(0, Math.min(maxScroll, scroll + e.deltaY * 0.35));
          applyScroll();
        },
        { passive: false }
      );
    }
  }
  
  api.wireAllScrollbars = function wireAllScrollbars() {
    api.wireScrollbar({
      handleId: 'HandleBar',
      contentIds: [
        'Player_n',
        'Player_n_FL',
        'Player_n_FL_FL',
        'Player_n_FL_FL_FL',
        'Player_n_FL_FL_FL_FL',
        'Player_n_FL_FL_FL_FL_FL',
        'Player_n_FL_FL_FL_FL_FL_FL',
      ],
      maxScroll: 140,
      handleTravel: 100,
    });
    api.wireScrollbar({
      handleId: 'HandleBar_Default_skin',
      contentIds: PLAYABLE_MENU_SKINS.slice(),
      maxScroll: 0,
      handleTravel: 0,
    });
    // Custom / extra default slots deferred — hide their scroll handles.
    const hideBars = ['HandleBar_Custom_skin'];
    for (let i = 0; i < hideBars.length; i++) {
      const bar = api.$(hideBars[i]);
      if (bar) {
        bar.style.display = 'none';
        bar.style.pointerEvents = 'none';
      }
    }
  }
  
  api.injectMuteIconFromBtn = async function injectMuteIconFromBtn() {
    const btn = api.$('btn_Audio');
    if (!btn || !api.state.svgRoot || btn.dataset.audioArtReady === '1') return;
    try {
      const res = await fetch(`${BTN_SVG_URL}?v=20261021b`, { cache: 'no-cache' });
      if (!res.ok) return;
      const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
      const trueSrc = doc.getElementById('btn_Audio_True');
      const falseSrc = doc.getElementById('btn_Audio_False');
      if (!trueSrc || !falseSrc) return;
  
      let defs = api.state.svgRoot.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS(SVG_NS, 'defs');
        api.state.svgRoot.insertBefore(defs, api.state.svgRoot.firstChild);
      }
      const needIds = [
        'Ui_Btn_Color_0_Layer1_0_FILL',
        'Ui_Btn_Color_0_Layer0_0_1_STROKES',
        'Ui_Btn_Color_4_Layer1_0_FILL',
        'Ui_Btn_Color_4_Layer0_0_1_STROKES',
        'Ui_IconUi_2_Layer1_0_FILL',
        'Ui_IconUi_3_Layer1_0_FILL',
        'IconUi_3_Layer1_0_FILL',
      ];
      for (let i = 0; i < needIds.length; i++) {
        const id = needIds[i];
        if (api.state.svgRoot.getElementById(id)) continue;
        const src = doc.getElementById(id);
        if (!src) continue;
        const clone = src.cloneNode(true);
        clone.setAttribute('id', id);
        defs.appendChild(clone);
      }
  
      // Hide baked MainMenu art under the hit target.
      const kids = Array.from(btn.children);
      for (let i = 0; i < kids.length; i++) {
        if (kids[i].getAttribute('data-audio-art')) continue;
        kids[i].style.display = 'none';
        kids[i].setAttribute('aria-hidden', 'true');
      }
  
      const mountArt = (src, key) => {
        const g = src.cloneNode(true);
        api.stripIds(g);
        g.setAttribute('data-audio-art', key);
        g.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,0) ');
        btn.appendChild(g);
        return g;
      };
      mountArt(trueSrc, 'true');
      mountArt(falseSrc, 'false');
      btn.dataset.audioArtReady = '1';
    } catch (_) {
      /* optional — syncAudioIcon falls back to baked icons */
    }
  }
  
  api.wireClicks = function wireClicks() {
    const map = [
      [
        'Select_Alone_player',
        () => {
          api.state.playSession = 'alone';
          api.syncPlaySessionUi();
        },
      ],
      [
        'Select_JoinRoom_player',
        () => {
          api.state.playSession = 'join';
          api.syncPlaySessionUi();
        },
      ],
      [
        'Select_FlatLand_Mode',
        () => {
          api.state.worldPick = 'flat';
          api.syncWorldPickUi();
        },
      ],
      [
        'Select_Resource',
        () => {
          api.state.worldPick = 'resource';
          api.syncWorldPickUi();
        },
      ],
      [
        'Select_Resource_FL',
        () => {
          api.state.worldPick = 'loadFile';
          api.syncWorldPickUi();
          if (typeof api.opts.onLoadFile === 'function') api.opts.onLoadFile();
        },
      ],
      [
        'PlayNow',
        () => {
          if (typeof api.opts.onPlay === 'function') api.opts.onPlay();
        },
      ],
      [
        'Join_or_Crate',
        () => {
          if (typeof api.opts.onJoinStub === 'function') api.opts.onJoinStub();
        },
      ],
      [
        'btn_Audio',
        () => {
          api.state.audioMuted = !api.state.audioMuted;
          try {
            localStorage.setItem('theddos_mute', api.state.audioMuted ? '1' : '0');
          } catch (_) {
            /* ignore */
          }
          api.syncAudioIcon();
          if (typeof api.opts.onAudioToggle === 'function') {
            api.opts.onAudioToggle(api.state.audioMuted);
          }
        },
      ],
      [
        'btn_Link',
        () => {
          if (typeof api.opts.onLink === 'function') api.opts.onLink();
        },
      ],
      [
        'Btn_Red_LabelShow_on',
        () => {
          api.state.labelShowOpen = !api.state.labelShowOpen;
          api.syncLabelShow();
        },
      ],
    ];
  
    for (let i = 0; i < map.length; i++) {
      const id = map[i][0];
      const fn = map[i][1];
      const el = api.$(id);
      if (!el) continue;
      api.makeHitTarget(el);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        fn();
      });
    }
  
    // Default: How-to panel hidden until red button.
    api.state.labelShowOpen = false;
    api.syncLabelShow();
  
    // PlayNow: brief onPress flash from Btn.svg language (raised → pressed yellow).
    const play = api.$('PlayNow');
    if (play) {
      const falseBtn = play.querySelector('[id^="Btn_Press_"]');
      const trueSrc = api.$('Btn_Press_True');
      if (falseBtn && trueSrc) {
        const press = trueSrc.cloneNode(true);
        api.stripIds(press);
        press.setAttribute('data-press', 'true');
        press.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,3) ');
        play.insertBefore(press, falseBtn);
        api.setVisible(press, false);
        play.addEventListener('pointerdown', () => {
          api.setVisible(press, true);
          api.setVisible(falseBtn, false);
        });
        play.addEventListener('pointerup', () => {
          api.setVisible(press, false);
          api.setVisible(falseBtn, true);
        });
        play.addEventListener('pointerleave', () => {
          api.setVisible(press, false);
          api.setVisible(falseBtn, true);
        });
      }
    }
  
    for (let i = 0; i < PLAYABLE_MENU_SKINS.length; i++) {
      const id = PLAYABLE_MENU_SKINS[i];
      const el = api.$(id);
      if (!el) continue;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        api.state.skinId = clampPlayableMenuSkinId(id);
        api.syncSkinUi();
      });
    }
  }
}
