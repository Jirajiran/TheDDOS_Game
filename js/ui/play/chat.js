import {
  SVG_NS,
  CHAT_CAP,
  CHAT_LINE_H,
  CHAT_VISIBLE,
} from './constants.js';

export function installPlayChat(api) {
  api.styleChatShowText = function styleChatShowText(el) {
    if (!el) return;
    const texts = el.querySelectorAll('text');
    for (let i = 0; i < texts.length; i++) {
      texts[i].setAttribute('paint-order', 'stroke fill');
      texts[i].setAttribute('stroke', '#000000');
      texts[i].setAttribute('stroke-width', '2.5');
      texts[i].setAttribute('text-anchor', 'start');
    }
    const spans = api.allTspans(el);
    for (let i = 0; i < spans.length; i++) {
      spans[i].setAttribute('font-size', '32');
      spans[i].setAttribute('fill', '#FFFFFF');
      spans[i].setAttribute('stroke', '#000000');
      spans[i].setAttribute('stroke-width', '2.5');
      spans[i].setAttribute('paint-order', 'stroke fill');
      spans[i].setAttribute('text-anchor', 'start');
    }
  }
  
  api.renderChatShow = function renderChatShow() {
    const show = api.$('ChatShow');
    if (!show) return;
    const text = show.querySelector('text');
    if (!text) return;
    const lines = api.state.chatLines.map((l) => `You: ${l}`);
    const maxScroll = Math.max(0, lines.length - CHAT_VISIBLE);
    if (api.state.chatScroll > maxScroll) api.state.chatScroll = maxScroll;
    if (api.state.chatScroll < 0) api.state.chatScroll = 0;
    const slice = lines.slice(api.state.chatScroll, api.state.chatScroll + CHAT_VISIBLE);
  
    let spans = api.allTspans(show);
    const base = spans[0];
    const baseX = base ? base.getAttribute('x') || '-13.05' : '-13.05';
    const baseY = base ? Number(base.getAttribute('y') || -332.95) : -332.95;
  
    while (spans.length < Math.max(1, slice.length)) {
      const sp = document.createElementNS(SVG_NS, 'tspan');
      sp.setAttribute('x', baseX);
      text.appendChild(sp);
      spans = api.allTspans(show);
    }
    for (let i = 0; i < spans.length; i++) {
      if (i < slice.length) {
        spans[i].textContent = slice[i];
        spans[i].setAttribute('x', baseX);
        spans[i].setAttribute('y', String(baseY + i * CHAT_LINE_H));
        spans[i].style.display = '';
      } else {
        spans[i].textContent = '';
        spans[i].style.display = 'none';
      }
    }
    api.styleChatShowText(show);
    api.applyTextColumn(show, 'start');
  }
  
  api.clearChat = function clearChat() {
    api.state.chatLines.length = 0;
    api.state.chatScroll = 0;
    api.closeChat();
    const show = api.$('ChatShow');
    if (show) {
      const spans = api.allTspans(show);
      for (let i = 0; i < spans.length; i++) {
        spans[i].textContent = '';
        if (i > 0) spans[i].style.display = 'none';
      }
    }
  }
  
  api.bindChatScroll = function bindChatScroll() {
    const show = api.$('ChatShow');
    if (!show || show.dataset.chatWheel === '1') return;
    show.dataset.chatWheel = '1';
    show.style.pointerEvents = 'auto';
    show.addEventListener(
      'wheel',
      (e) => {
        if (api.state.chatLines.length <= CHAT_VISIBLE) return;
        e.preventDefault();
        e.stopPropagation();
        api.state.chatScroll += e.deltaY > 0 ? 1 : -1;
        api.renderChatShow();
      },
      { passive: false }
    );
  }
  
  api.setInputChatPlaceholderVisible = function setInputChatPlaceholderVisible(showPlaceholder) {
    const el = api.$('InputChat');
    const sp = api.firstTspan(el);
    if (!sp) return;
    if (api.state._inputChatPlaceholder == null) {
      api.state._inputChatPlaceholder = sp.textContent || '';
    }
    sp.textContent = showPlaceholder ? api.state._inputChatPlaceholder : '';
  }
  
  api.ensureChatInput = function ensureChatInput() {
    if (api.chatInput || !api.mount) return;
    api.chatInput = document.createElement('input');
    api.chatInput.type = 'text';
    api.chatInput.className = 'player-ui-chat-input';
    api.chatInput.maxLength = 80;
    api.chatInput.autocomplete = 'off';
    api.chatInput.hidden = true;
    api.chatInput.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        api.submitChat();
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        api.closeChat();
      }
    });
    // Clicks on the HTML field stay in chat; do not bubble to canvas.
    api.chatInput.addEventListener('mousedown', (e) => e.stopPropagation());
    const parent = api.mount.parentElement || api.mount;
    parent.appendChild(api.chatInput);
  }
  
  api.layoutChatInput = function layoutChatInput() {
    if (!api.chatInput || !api.state.chatOpen) return;
    const slot = api.$('InputChat');
    if (!slot || !api.mount) return;
    const r = slot.getBoundingClientRect();
    api.chatInput.style.position = 'fixed';
    api.chatInput.style.left = `${r.left}px`;
    api.chatInput.style.top = `${r.top}px`;
    api.chatInput.style.width = `${Math.max(120, r.width)}px`;
    api.chatInput.style.height = `${Math.max(24, r.height)}px`;
    api.chatInput.style.zIndex = '6';
  }
  
  api.openChat = function openChat() {
    api.ensureChatInput();
    api.state.chatOpen = true;
    api.setInputChatPlaceholderVisible(false);
    api.syncModals();
    api.layoutChatInput();
    if (api.opts.onChatOpen) api.opts.onChatOpen(true);
  }
  
  api.closeChat = function closeChat() {
    api.state.chatOpen = false;
    if (api.chatInput) {
      api.chatInput.value = '';
      api.chatInput.hidden = true;
      api.chatInput.blur();
    }
    api.setInputChatPlaceholderVisible(true);
    api.syncModals();
    if (api.opts.onChatOpen) api.opts.onChatOpen(false);
  }
  
  api.submitChat = function submitChat() {
    const text = api.chatInput ? api.chatInput.value.trim() : '';
    if (text) {
      api.state.chatLines.push(text);
      while (api.state.chatLines.length > CHAT_CAP) api.state.chatLines.shift();
      // Stick to latest lines
      api.state.chatScroll = Math.max(0, api.state.chatLines.length - CHAT_VISIBLE);
      api.renderChatShow();
      if (api.opts.onChatSend) api.opts.onChatSend(text);
    }
    api.closeChat();
  }
  
  api.toggleChat = function toggleChat() {
    if (api.state.chatOpen) api.submitChat();
    else api.openChat();
  }
  
  api.isChatOpen = function isChatOpen() {
    return api.state.chatOpen;
  }
}
