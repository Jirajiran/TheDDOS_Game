/**
 * PlayerUIGamePlay.svg — play HUD.
 * Layout is the core. Panels, chat, and buttons attach to it.
 */
import { createMobileController } from './ui/mobileController.js';
import { parseMatrix, setMatrix, setVisible, svgById } from './ui/svgDom.js';
import { installPlayButtons } from './ui/play/buttons.js';
import { installPlayChat } from './ui/play/chat.js';
import { installPlayLayout } from './ui/play/layout.js';
import { installPlayPanels } from './ui/play/panels.js';
import {
  ART_H,
  ART_W,
  EFFECT_IDS,
  EMPTY_SLOT_PAD,
  FIST_ICON_COLOR,
  HOTBAR_MAIN,
  PLAYER_UI_SVG_URL,
  SKILL_IDS,
  SLOT_ICON,
} from './ui/play/constants.js';

export { CATALOG_TO_CATEGORY, PLAYER_UI_SVG_URL } from './ui/play/constants.js';

export function createPlayerUiGamePlay(opts) {
  const mount = opts.mount;
  const state = {
    ready: false,
    svgRoot: null,
    stage: null,
    stick: null,
    layoutBound: false,
    anchorBase: null,
    craftOpen: false,
    settingOpen: false,
    genOpen: false,
    endOpen: false,
    objectiveOpen: true,
    chatOpen: false,
    audioMuted: false,
    backpackTier: 0,
    catalogCategory: 'Gun',
    selectedCraftIndex: -1,
    hpFillBase: null,
    hpBgBase: null,
    hpDisplayRatio: 1,
    hpTargetRatio: 1,
    hpShakeT: 0,
    craftRecipes: [],
    chatLines: [],
    chatScroll: 0,
    dayBarsReady: false,
    interactiveVisible: false,
    genCtx: null,
  };


  const api = {
    state,
    opts,
    mount,
    chatInput: null,
    $(id) {
      return svgById(state.svgRoot, id);
    },
    setVisible,
    parseMatrix,
    setMatrix,
  };
  installPlayLayout(api);
  installPlayPanels(api);
  installPlayChat(api);
  installPlayButtons(api);

api.mountSvg = async function mountSvg() {
  if (!api.mount) return false;
  const stage = api.ensureStage();
  const res = await fetch(`${PLAYER_UI_SVG_URL}?v=20261021b`);
  if (!res.ok) throw new Error(`PlayerUI SVG ${res.status}`);
  stage.innerHTML = await res.text();
  api.state.svgRoot =
    stage.querySelector('svg') ||
    (stage.firstElementChild && stage.firstElementChild.tagName === 'svg'
      ? stage.firstElementChild
      : null);
  if (!api.state.svgRoot) throw new Error('PlayerUI svg root missing');
  api.state.svgRoot.setAttribute('width', '100%');
  api.state.svgRoot.setAttribute('height', '100%');
  api.state.svgRoot.setAttribute('viewBox', `0 0 ${ART_W} ${ART_H}`);
  api.state.svgRoot.style.display = 'block';
  api.state.svgRoot.style.width = '100%';
  api.state.svgRoot.style.height = '100%';
  api.state.svgRoot.style.pointerEvents = 'none';

  // Hide modal anchors immediately so inject never flashes open panels.
  const earlyHide = [
    'Anchor_Center_1',
    'Anchor_Center_2',
    'Anchor_Center_3',
    'Anchor_Top_Left_2',
    'btn_interactive',
    'Icon_Current_slot',
  ];
  for (let i = 0; i < earlyHide.length; i++) {
    api.setVisible(api.$(earlyHide[i]), false);
  }
  for (let i = 0; i < EFFECT_IDS.length; i++) api.setVisible(api.$(EFFECT_IDS[i]), false);
  for (let i = 1; i < SKILL_IDS.length; i++) api.setVisible(api.$(SKILL_IDS[i]), false);

  const hitRoots = [
    'Anchor_Right_Top',
    'Anchor_Center_1',
    'Anchor_Center_2',
    'Anchor_Center_3',
    'Anchor_Center_Bottom',
    'Anchor_Left_Bottom',
    'Anchor_Left_Bottom_FL',
    'Anchor_Left_Bottom_2',
    'Anchor_Top_Left_2',
    'btn_Craft',
    'Btn_Setting',
    'Btn_Audio',
    'btn_interactive',
  ];
  for (let i = 0; i < hitRoots.length; i++) {
    const el = api.$(hitRoots[i]);
    if (el) el.style.pointerEvents = 'auto';
  }

  try {
    api.state.audioMuted = localStorage.getItem('theddos_mute') === '1';
  } catch (_) {
    api.state.audioMuted = false;
  }

  api.state.ready = true;
  api.state._btnArtReady = false;
  api.state.pressOnTpl = null;
  api.state.iconAudioCloseTpl = null;
  api.state.anchorBase = null;
  api.state.hpFillBase = null;
  api.state.hpBgBase = null;
  api.state.hpDisplayRatio = 1;
  api.state.hpTargetRatio = 1;
  api.state.craftOpen = false;
  api.state.settingOpen = false;
  api.state.genOpen = false;
  api.state.endOpen = false;
  api.state.chatOpen = false;
  api.state.objectiveOpen = true;
  api.state.catalogCategory = 'Gun';
  api.state.selectedCraftIndex = -1;
  await api.ensureBtnCatalogArt();
  api.setBackpackTier(0);
  api.setInteractiveVisible(false);
  for (let i = 0; i < EFFECT_IDS.length; i++) api.setVisible(api.$(EFFECT_IDS[i]), false);
  for (let i = 1; i < SKILL_IDS.length; i++) api.setVisible(api.$(SKILL_IDS[i]), false);
  api.setVisible(api.$('Skill_Show_1'), true);
  api.ensureIconOverlay(api.$('Skill_Show_1'), FIST_ICON_COLOR, true);
  api.setVisible(api.$('Icon_Current_slot'), false);
  api.syncRequestItems(null);
  api.syncIconCurrentSlot();
  // Hotbar frames 1–6 visible with empty hit pads at start
  for (let i = 1; i <= HOTBAR_MAIN; i++) {
    const el = api.$(`Panel_item_${i}`);
    if (el) {
      api.setVisible(el, true);
      api.setCountOnHost(api.findNumberHost(el), 0, false);
      api.ensureIconOverlay(el, EMPTY_SLOT_PAD, true, SLOT_ICON, true);
    }
  }
  api.ensureChatInput();
  api.state.dayBarsReady = false;
  api.ensureDayBars();
  api.bindChatScroll();
  api.clearChat();
  api.styleChatShowText(api.$('ChatShow'));
  api.setInputChatPlaceholderVisible(true);
  api.applyAllTextColumns();
  api.syncModals();
  api.syncAudioIcon();
  api.syncCatalogVisual('Gun');
  api.wireClicks();
  api.bindExitPressArt(api.$('Btn_Press_false_Exit'));
  api.bindLayoutListeners();
  api.layout();
  await api.mountController();
  return true;
}

api.mountController = async function mountController() {
  const coarse = window.matchMedia('(pointer: coarse)');
  const apply = async () => {
    if (!coarse.matches) {
      if (api.state.stick) api.state.stick.setShown(false);
      return;
    }
    if (!api.state.stick && api.state.stage) {
      api.state.stick = await createMobileController(api.state.stage);
    }
    if (api.state.stick) api.state.stick.setShown(true);
    api.layout();
  };
  if (coarse.addEventListener) coarse.addEventListener('change', () => { apply(); });
  else if (coarse.addListener) coarse.addListener(() => { apply(); });
  await apply();
}

  return {
    state,
    mountSvg: api.mountSvg,
    layout: api.layout,
    syncHud: api.syncHud,
    syncInventoryBar: api.syncInventoryBar,
    syncCraftSlots: api.syncCraftSlots,
    syncCatalogVisual: api.syncCatalogVisual,
    syncGenPanel: api.syncGenPanel,
    setCraftOpen: api.setCraftOpen,
    setSettingOpen: api.setSettingOpen,
    setGenOpen: api.setGenOpen,
    setEndOpen: api.setEndOpen,
    setBackpackTier: api.setBackpackTier,
    setInteractiveVisible: api.setInteractiveVisible,
    getSelectedCraftIndex: api.getSelectedCraftIndex,
    toggleChat: api.toggleChat,
    openChat: api.openChat,
    closeChat: api.closeChat,
    clearChat: api.clearChat,
    isChatOpen: api.isChatOpen,
    isReady: () => state.ready,
    isCraftOpen: () => state.craftOpen,
    isSettingOpen: () => state.settingOpen,
    isGenOpen: () => state.genOpen,
    isEndOpen: () => state.endOpen,
    getStickPose: () => (state.stick ? state.stick.pose : null),
  };
}
