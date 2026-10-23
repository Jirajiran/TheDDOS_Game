
export function installMenuFields(api) {
  api.findTspanByText = function findTspanByText(exact) {
    if (!api.state.svgRoot) return null;
    const spans = api.state.svgRoot.querySelectorAll('tspan');
    for (let i = 0; i < spans.length; i++) {
      if ((spans[i].textContent || '').trim() === exact) return spans[i];
    }
    return null;
  }
  
  api.resolvePlaceholderText = function resolvePlaceholderText(binding) {
    const tspan = api.findTspanByText(binding.placeholderText);
    if (!tspan) return null;
    return tspan.closest('text') || tspan;
  }
  
  api.resolveSlotElement = function resolveSlotElement(binding) {
    binding.slotEl = null;
    const textEl = api.resolvePlaceholderText(binding);
    if (textEl) {
      binding.slotEl = textEl;
      return textEl;
    }
    return null;
  }
  
  api.svgElToOverlayBox = function svgElToOverlayBox(el, overlayRoot) {
    if (!el || !api.state.svgRoot || !overlayRoot) return null;
    const or = overlayRoot.getBoundingClientRect();
    try {
      const svg = api.state.svgRoot;
      const bb = el.getBBox();
      const ctm = el.getScreenCTM && el.getScreenCTM();
      if (ctm && typeof svg.createSVGPoint === 'function') {
        const pt = svg.createSVGPoint();
        const corners = [
          [bb.x, bb.y],
          [bb.x + bb.width, bb.y],
          [bb.x, bb.y + bb.height],
          [bb.x + bb.width, bb.y + bb.height],
        ];
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < corners.length; i++) {
          pt.x = corners[i][0];
          pt.y = corners[i][1];
          const p = pt.matrixTransform(ctm);
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
        return {
          left: minX - or.left,
          top: minY - or.top,
          width: maxX - minX,
          height: maxY - minY,
        };
      }
    } catch (_) {
      /* fall through */
    }
    const r = el.getBoundingClientRect();
    if (!r || r.width < 1) return null;
    return {
      left: r.left - or.left,
      top: r.top - or.top,
      width: r.width,
      height: r.height,
    };
  }
  
  api.measureInputTextWidth = function measureInputTextWidth(input, sample) {
    try {
      const cs = window.getComputedStyle(input);
      const canvas = measureInputTextWidth._c || document.createElement('canvas');
      measureInputTextWidth._c = canvas;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      return Math.ceil(ctx.measureText(sample || '').width);
    } catch (_) {
      return 0;
    }
  }
  
  api.expandOverlayBoxFree = function expandOverlayBoxFree(box, input) {
    if (!box || !input) return box;
    const sample =
      String(input.value || '').trim() ||
      String(input.placeholder || api.bindingPlaceholder(input) || 'W');
    const pad = 28;
    let need = api.measureInputTextWidth(input, sample) + pad;
    // Room for typing beyond placeholder (name up to ~16 glyphs visible).
    if (input.classList.contains('menu-name-input')) {
      need = Math.max(need, api.measureInputTextWidth(input, 'W'.repeat(14)) + pad);
    } else {
      need = Math.max(need, api.measureInputTextWidth(input, 'W'.repeat(10)) + pad);
    }
    need = Math.max(need, Math.ceil(box.width * 1.25) + pad);
    const grow = Math.max(0, need - box.width);
    const hPad = 6;
    const centered = input.classList.contains('menu-name-input');
    return {
      left: centered ? box.left - grow / 2 : box.left,
      top: box.top - hPad / 2,
      width: box.width + grow,
      height: Math.max(box.height + hPad, 28),
    };
  }
  
  api.bindingPlaceholder = function bindingPlaceholder(input) {
    for (let i = 0; i < api.inputBindings.length; i++) {
      if (api.inputBindings[i].input === input) {
        return api.inputBindings[i].placeholderText;
      }
    }
    return '';
  }
  
  api.bindPlaceholderInput = function bindPlaceholderInput(input, placeholderText, bindOpts) {
    if (!input) return;
    api.inputBindings.push({
      input,
      placeholderText,
      hideWhenAlone: !!(bindOpts && bindOpts.hideWhenAlone),
      readOnlyInJoin: !!(bindOpts && bindOpts.readOnlyInJoin),
      slotEl: null,
    });
    // Relayout while typing so long names stay unclipped.
    input.addEventListener('input', () => {
      if (api.state.ready) api.layoutInputs();
    });
  }
  
  api.wireInputFields = function wireInputFields() {
    // Art text = position only; overlay width free (no Mask_* sizing).
    api.bindPlaceholderInput(api.opts.nameInput, 'YOUR NAME', {
      hideWhenAlone: false,
    });
    api.bindPlaceholderInput(api.opts.roomInput, '1234567', {
      hideWhenAlone: true,
      readOnlyInJoin: true,
    });
    api.bindPlaceholderInput(api.opts.joinInput, 'Input', {
      hideWhenAlone: true,
    });
  
    if (api.opts.nameInput) {
      api.opts.nameInput.value = api.state.playerName;
      api.opts.nameInput.addEventListener('input', () => {
        api.state.playerName = String(api.opts.nameInput.value || 'Player').slice(0, 24);
        if (typeof api.opts.onNameChange === 'function') {
          api.opts.onNameChange(api.state.playerName);
        }
        api.syncRoster();
      });
    }
    if (api.opts.roomInput) {
      // Host code display (art sample was 1234567) — not free-typed when hosting.
      api.opts.roomInput.readOnly = true;
    }
    if (api.opts.joinInput) {
      api.opts.joinInput.addEventListener('input', () => {
        api.state.joinText = String(api.opts.joinInput.value || '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8);
        api.opts.joinInput.value = api.state.joinText;
      });
    }
  }
}
