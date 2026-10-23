import {
  ART_W,
  ART_H,
  ART_CX,
  ART_CY,
  ANCHOR_PRESETS,
} from './constants.js';

export function installPlayLayout(api) {
  api.applyViewBox = function applyViewBox() {
    const svg = api.state.svgRoot;
    if (!svg || !api.mount) return null;
    const rect = api.mount.getBoundingClientRect();
    const mw = rect.width || 1;
    const mh = rect.height || 1;
    const s = Math.min(1, mw / ART_W, mh / ART_H);
    const vbW = mw / s;
    const vbH = mh / s;
    const vbX = (ART_W - vbW) / 2;
    const vbY = (ART_H - vbH) / 2;
    const value = `${vbX} ${vbY} ${vbW} ${vbH}`;
    const sheets = api.state.stage ? api.state.stage.querySelectorAll('svg') : [svg];
    for (let i = 0; i < sheets.length; i++) {
      sheets[i].setAttribute('viewBox', value);
      sheets[i].setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
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
    const vb = api.applyViewBox();
    if (!vb || !api.state.anchorBase) return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
  
    const left = vb.x - ART_CX;
    const right = vb.x + vb.w - ART_CX;
    const top = vb.y - ART_CY;
    const bottom = vb.y + vb.h - ART_CY;
  
    const artCorners = [
      { e: -ART_CX, f: -ART_CY, ve: left, vf: top },
      { e: ART_CX, f: -ART_CY, ve: right, vf: top },
      { e: -ART_CX, f: ART_CY, ve: left, vf: bottom },
      { e: ART_CX, f: ART_CY, ve: right, vf: bottom },
    ];
  
    api.state.anchorBase.forEach((base, id) => {
      const el = api.$(id);
      if (!el || !base) return;
      const preset = ANCHOR_PRESETS[id];
      if (coarse && id === 'Anchor_Top_Left_2') {
        const shift = api.genPanelCenter(el);
        api.setMatrix(el, {
          ...base,
          e: shift ? shift.e : 0,
          f: shift ? shift.f : 0,
        });
        return;
      }
      if (preset && preset.kind === 'center') {
        if (id === 'Anchor_Center_Top' || id === 'Anchor_Center_Bottom') {
          const artF = preset.artF;
          const vf = artF < 0 ? top : artF > 0 ? bottom : 0;
          api.setMatrix(el, { ...base, e: 0, f: vf + (base.f - artF) });
          return;
        }
        api.setMatrix(el, { ...base, e: 0, f: 0 });
        return;
      }
      let bestD = Infinity;
      let chosen = null;
      for (let i = 0; i < artCorners.length; i++) {
        const c = artCorners[i];
        const d =
          (base.e - c.e) * (base.e - c.e) + (base.f - c.f) * (base.f - c.f);
        if (d < bestD) {
          bestD = d;
          chosen = c;
        }
      }
      if (!chosen) return;
      let e = chosen.ve + (base.e - chosen.e);
      let f = chosen.vf + (base.f - chosen.f);
      if (coarse) {
        if (chosen.ve < 0) e = Math.max(e, chosen.ve);
        else if (chosen.ve > 0) e = Math.min(e, chosen.ve);
        if (chosen.vf < 0) f = Math.max(f, chosen.vf);
        else if (chosen.vf > 0) f = Math.min(f, chosen.vf);
      }
      api.setMatrix(el, { ...base, e, f });
    });
  }
  
  api.genPanelCenter = function genPanelCenter(el) {
    if (api.state.genCenter) return api.state.genCenter;
    const hidden = el.style.display === 'none';
    if (hidden) el.style.display = '';
    const box = el.getBBox();
    if (hidden) el.style.display = 'none';
    if (!box || box.width <= 0 || box.height <= 0) return null;
    api.state.genCenter = {
      e: -(box.x + box.width / 2),
      f: -(box.y + box.height / 2),
    };
    return api.state.genCenter;
  }
  
  api.ensureStage = function ensureStage() {
    if (api.state.stage && api.state.stage.parentNode) return api.state.stage;
    const stage = document.createElement('div');
    stage.className = 'player-ui-stage';
    api.mount.appendChild(stage);
    api.state.stage = stage;
    return stage;
  }
  
  api.layout = function layout() {
    api.layoutAnchors();
    api.layoutChatInput();
  }
  
  api.bindLayoutListeners = function bindLayoutListeners() {
    if (api.state.layoutBound) return;
    api.state.layoutBound = true;
    window.addEventListener('resize', api.layout);
    if (typeof ResizeObserver !== 'undefined' && api.mount) {
      const ro = new ResizeObserver(() => api.layout());
      ro.observe(api.mount);
    }
    const coarse = window.matchMedia('(pointer: coarse)');
    if (coarse.addEventListener) coarse.addEventListener('change', api.layout);
    else if (coarse.addListener) coarse.addListener(api.layout);
  }
}
