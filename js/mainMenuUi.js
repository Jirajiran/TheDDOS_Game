/**
 * MainMenu.svg — menu HUD.
 * Layout is the core. Panels, buttons, and text fields attach to it.
 */
import { clampPlayableMenuSkinId } from './view/unitVisual.js';
import { parseMatrix, setMatrix, setVisible, stripIds, svgById } from './ui/svgDom.js';
import { installMenuButtons } from './ui/menu/buttons.js';
import { installMenuFields } from './ui/menu/fields.js';
import { installMenuLayout } from './ui/menu/layout.js';
import { installMenuPanels } from './ui/menu/panels.js';
import { MAIN_MENU_SVG_URL, MENU_ART_H, MENU_ART_W } from './ui/menu/constants.js';

export { BTN_SVG_URL, MAIN_MENU_SVG_URL, ROSTER_SLOTS } from './ui/menu/constants.js';

export function createMainMenuUi(opts) {
  const mount = opts.mount;
  const state = {
    ready: false,
    svgRoot: null,
    playSession: /** @type {PlaySessionMode} */ ('alone'),
    worldPick: /** @type {WorldPick} */ ('flat'),
    playerName: 'Player',
    roomCode: '',
    joinText: '',
    skinId: 'Skin_Default_1',
    audioMuted: false,
    /** @type {Map<string, { trueEl: Element, falseEl: Element }>} */
    pressPairs: new Map(),
    /** @type {Element | null} */
    pressTrueTpl: null,
    /** @type {Element | null} */
    pressFalseTpl: null,
    layoutBound: false,
    kicksWired: false,
    /** First MENU visit this session — rise-up tween once. */
    enterTweenPlayed: false,
    /** How-to panel — off until Btn_Red_LabelShow_on. */
    labelShowOpen: false,
    /** @type {Map<string, { a: number, b: number, c: number, d: number, e: number, f: number }>|null} */
    anchorBase: null,
  };

  /**
   * @type {Array<{
   *   input: HTMLInputElement,
   *   placeholderText: string,
   *   hideWhenAlone?: boolean,
   *   readOnlyInJoin?: boolean,
   *   slotEl?: Element | null,
   * }>}
   */
  const inputBindings = [];

  const api = {
    state,
    opts,
    mount,
    inputBindings,
    $(id) {
      return svgById(state.svgRoot, id);
    },
    setVisible,
    parseMatrix,
    setMatrix,
    stripIds,
  };
  installMenuLayout(api);
  installMenuPanels(api);
  installMenuButtons(api);
  installMenuFields(api);

api.mountSvg = async function mountSvg() {
  if (!api.mount) throw new Error('mainMenuUi: missing mount');
  const res = await fetch(MAIN_MENU_SVG_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`MainMenu.svg ${res.status}`);
  const text = await res.text();
  api.mount.innerHTML = text;
  const svg = api.mount.querySelector('svg');
  if (!svg) throw new Error('MainMenu.svg: no <svg> root');

  // Fill api.mount; viewBox expands on layoutAnchors so corners track real edges.
  // Color is CSS full-bleed on api.mount (not this SVG).
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute(
    'viewBox',
    `0 0 ${MENU_ART_W} ${MENU_ART_H}`
  );
  svg.style.display = 'block';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.maxWidth = '100%';
  svg.style.maxHeight = '100%';
  svg.style.background = 'transparent';

  // Hide SVG #Color — api.mount CSS paints full-web background independently.
  const colorLayer = svg.getElementById
    ? svg.getElementById('Color')
    : svg.querySelector('#Color');
  if (colorLayer) {
    colorLayer.style.display = 'none';
    colorLayer.setAttribute('aria-hidden', 'true');
  }
  if (api.mount) api.mount.classList.add('has-menu-color');

  api.state.svgRoot = svg;
  api.state.ready = true;
  api.state.anchorBase = null;

  api.state.playSession = 'alone';
  api.state.worldPick = 'flat';
  api.state.skinId = 'Skin_Default_1';
  try {
    api.state.audioMuted = localStorage.getItem('theddos_mute') === '1';
  } catch (_) {
    api.state.audioMuted = false;
  }

  // Snapshot Btn_Press True/False templates before cloning mutates groups.
  api.state.pressTrueTpl = api.$('Btn_Press_True') || api.$('Btn_Press_True_FL');
  api.state.pressFalseTpl =
    api.$('Btn_Press_false') ||
    api.$('Btn_Press_false_FL') ||
    api.$('Btn_Press_False');
  api.ensurePressPair('Select_Alone_player');
  api.ensurePressPair('Select_JoinRoom_player');
  api.ensurePressPair('Select_FlatLand_Mode');
  api.ensurePressPair('Select_Resource');
  api.ensurePressPair('Select_Resource_FL');

  await api.injectMuteIconFromBtn();
  api.wireInputFields();
  api.wireClicks();
  api.wireKickButtons();
  api.wireAllScrollbars();
  api.bindLayoutListeners();
  api.applyAll();

  // Layout after paint (letterbox + fonts + clip CTM).
  requestAnimationFrame(() => {
    api.layoutInputs();
    requestAnimationFrame(() => {
      api.layoutInputs();
      api.syncRoster();
    });
  });
}

  return {
    state,
    mountSvg: api.mountSvg,
    applyAll: api.applyAll,
    layoutInputs: api.layoutInputs,
    syncRoster: api.syncRoster,
    playEnterTween: api.playEnterTween,
    gameModeFromPick: api.gameModeFromPick,
    getPlayerName: () => state.playerName,
    getPlaySession: () => state.playSession,
    getWorldPick: () => state.worldPick,
    getSkinId: () => clampPlayableMenuSkinId(state.skinId),
    getJoinText: () => state.joinText,
    setRoomCode(code) {
      state.roomCode = String(code || '');
      if (opts.roomInput) opts.roomInput.value = state.roomCode;
      api.layoutInputs();
    },
    setPlayerName(name) {
      state.playerName = String(name || 'Player').slice(0, 24);
      if (opts.nameInput) opts.nameInput.value = state.playerName;
      api.syncRoster();
    },
    isReady: () => state.ready,
  };
}
