import {
  MENU_ART_W,
  MENU_ART_H,
  MENU_ART_CX,
  MENU_ART_CY,
  ANCHOR_PRESETS,
} from './constants.js';

export function installMenuLayout(api) {
  api.applyMenuViewBox = function applyMenuViewBox() {
    const svg = api.state.svgRoot;
    if (!svg || !api.mount) return null;
    if (window.matchMedia('(pointer: coarse)').matches) {
      svg.setAttribute('viewBox', `0 0 ${MENU_ART_W} ${MENU_ART_H}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      return { x: 0, y: 0, w: MENU_ART_W, h: MENU_ART_H };
    }
    const rect = api.mount.getBoundingClientRect();
    const mw = rect.width || 1;
    const mh = rect.height || 1;
    const aspect = mw / mh;
    const artAspect = MENU_ART_W / MENU_ART_H;
    let vbW;
    let vbH;
    let vbX;
    let vbY;
    if (aspect > artAspect) {
      vbH = MENU_ART_H;
      vbW = MENU_ART_H * aspect;
      vbX = (MENU_ART_W - vbW) / 2;
      vbY = 0;
    } else {
      vbW = MENU_ART_W;
      vbH = MENU_ART_W / aspect;
      vbX = 0;
      vbY = (MENU_ART_H - vbH) / 2;
    }
    svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
    return { x: vbX, y: vbY, w: vbW, h: vbH };
  }
  
  api.captureAnchorBases = function captureAnchorBases() {
    if (api.state.anchorBase) return;
    api.state.anchorBase = new Map();
    const ids = Object.keys(ANCHOR_PRESETS);
    for (let i = 0; i < ids.length; i++) {
      const el = api.$(ids[i]);
      if (el) api.state.anchorBase.set(ids[i], api.parseMatrix(el));
    }
  }
  
  api.layoutAnchors = function layoutAnchors() {
    if (!api.state.ready || !api.state.svgRoot) return;
    api.captureAnchorBases();
    const vb = api.applyMenuViewBox();
    if (!vb || !api.state.anchorBase) return;
    if (window.matchMedia('(pointer: coarse)').matches) {
      api.state.anchorBase.forEach((base, id) => {
        const el = api.$(id);
        if (el && base) api.setMatrix(el, base);
      });
      return;
    }
  
    const left = vb.x - MENU_ART_CX;
    const right = vb.x + vb.w - MENU_ART_CX;
    const top = vb.y - MENU_ART_CY;
    const bottom = vb.y + vb.h - MENU_ART_CY;
  
    const artCorners = [
      { e: -MENU_ART_CX, f: -MENU_ART_CY, ve: left, vf: top },
      { e: MENU_ART_CX, f: -MENU_ART_CY, ve: right, vf: top },
      { e: -MENU_ART_CX, f: MENU_ART_CY, ve: left, vf: bottom },
      { e: MENU_ART_CX, f: MENU_ART_CY, ve: right, vf: bottom },
    ];
  
    api.state.anchorBase.forEach((base, id) => {
      const el = api.$(id);
      if (!el || !base) return;
      const preset = ANCHOR_PRESETS[id];
      if (preset && preset.kind === 'center') {
        api.setMatrix(el, { ...base, e: 0, f: 0 });
        return;
      }
  
      // Prefer preset art corner from id; if baked pivot is clearly nearer another
      // corner (export naming quirk), snap that geometric corner instead.
      let artE = preset ? preset.artE : 0;
      let artF = preset ? preset.artF : 0;
      let ve = 0;
      let vf = 0;
      let bestD = Infinity;
      let chosen = null;
      for (let i = 0; i < artCorners.length; i++) {
        const c = artCorners[i];
        const d = (base.e - c.e) * (base.e - c.e) + (base.f - c.f) * (base.f - c.f);
        if (d < bestD) {
          bestD = d;
          chosen = c;
        }
      }
      if (chosen) {
        artE = chosen.e;
        artF = chosen.f;
        ve = chosen.ve;
        vf = chosen.vf;
      } else if (preset) {
        // Fallback map preset → viewport edge
        ve = preset.artE < 0 ? left : preset.artE > 0 ? right : 0;
        vf = preset.artF < 0 ? top : preset.artF > 0 ? bottom : 0;
      }
  
      const insetE = base.e - artE;
      const insetF = base.f - artF;
      api.setMatrix(el, {
        ...base,
        e: ve + insetE,
        f: vf + insetF,
      });
    });
  }
  
  api.layoutInputs = function layoutInputs() {
    if (!api.state.ready || !api.state.svgRoot) return;
    api.layoutAnchors();
    const overlayRoot =
      (api.opts.nameInput && api.opts.nameInput.parentElement) ||
      document.querySelector('.main-menu-overlays');
    if (!overlayRoot) return;
  
    for (let i = 0; i < api.inputBindings.length; i++) {
      const b = api.inputBindings[i];
      if (b.input.hidden || b.input.style.display === 'none') continue;
      const slot = api.resolveSlotElement(b);
      if (!slot) continue;
      let box = api.svgElToOverlayBox(slot, overlayRoot);
      if (!box || box.width < 2 || box.height < 2) continue;
      box = api.expandOverlayBoxFree(box, b.input);
  
      // Hide SVG placeholder — HTML input draws free (no mask width).
      const textEl = api.resolvePlaceholderText(b);
      if (textEl) textEl.style.visibility = 'hidden';
  
      b.input.style.position = 'absolute';
      b.input.style.left = `${Math.round(box.left)}px`;
      b.input.style.top = `${Math.round(box.top)}px`;
      b.input.style.width = `${Math.round(box.width)}px`;
      b.input.style.height = `${Math.round(box.height)}px`;
      b.input.style.transform = 'none';
      b.input.style.minWidth = '0';
      b.input.style.maxWidth = 'none';
      b.input.style.boxSizing = 'border-box';
      b.input.style.overflow = 'visible';
    }
  }
  
  api.bindLayoutListeners = function bindLayoutListeners() {
    if (api.state.layoutBound) return;
    api.state.layoutBound = true;
    window.addEventListener('resize', api.layoutInputs);
    if (typeof ResizeObserver !== 'undefined' && api.mount) {
      const ro = new ResizeObserver(() => api.layoutInputs());
      ro.observe(api.mount);
    }
    const coarse = window.matchMedia('(pointer: coarse)');
    if (coarse.addEventListener) coarse.addEventListener('change', api.layoutInputs);
    else if (coarse.addListener) coarse.addListener(api.layoutInputs);
  }

  api.overlayRootEl = function overlayRootEl() {
    return (
      (api.opts.nameInput && api.opts.nameInput.parentElement) ||
      document.querySelector('.main-menu-overlays')
    );
  }

  api.playEnterTween = function playEnterTween(optsTween = {}) {
    const force = !!optsTween.force;
    if (api.state.enterTweenPlayed && !force) return false;
    if (!api.state.ready || !api.state.svgRoot) return false;

    const main = api.$('MainMeun');
    const overlays = api.overlayRootEl();
    if (!main) return false;

    api.layoutInputs();

    const reduce =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      api.state.enterTweenPlayed = true;
      main.style.opacity = '1';
      main.style.transform = '';
      if (overlays) {
        overlays.style.opacity = '1';
        overlays.style.transform = '';
      }
      return true;
    }

    const risePx = optsTween.risePx != null ? optsTween.risePx : 64;
    const ms = optsTween.ms != null ? optsTween.ms : 700;
    const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

    const prep = (el) => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.opacity = '0';
      el.style.transform = `translateY(${risePx}px)`;
      el.classList && el.classList.add('menu-tween-prep');
    };
    prep(main);
    prep(overlays);

    void (api.mount && api.mount.offsetWidth);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const play = (el) => {
          if (!el) return;
          el.style.transition = `opacity ${ms}ms ease-out, transform ${ms}ms ${ease}`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.classList && el.classList.remove('menu-tween-prep');
          el.classList && el.classList.add('menu-tween-in');
        };
        play(main);
        play(overlays);
      });
    });

    const clear = () => {
      api.state.enterTweenPlayed = true;
      if (main) {
        main.style.transition = '';
        main.classList && main.classList.remove('menu-tween-in');
      }
      if (overlays) {
        overlays.style.transition = '';
        overlays.classList && overlays.classList.remove('menu-tween-in');
      }
      api.layoutInputs();
      api.syncRoster();
    };
    window.setTimeout(clear, ms + 40);
    return true;
  }
}
