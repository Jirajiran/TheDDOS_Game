export const ART_W = 1280;
export const BTN_SVG_URL = 'Asset/AssetSVG/Ui/Btn.svg';
export const SVG_NS = 'http://www.w3.org/2000/svg';

export const RESOURCE_COLORS = Object.freeze({
  WOOD: '#8b6914',
  STONE: '#8a8a8a',
  IRON: '#5a6a8a',
});
export const FIST_ICON_COLOR = '#e8c070';
export const HEAL_ICON_COLOR = '#5ecf8a';
/** Art slot body is ~72×72 centered at 0 (Ui_Ui_1_5); number sits outside. */
export const SLOT_BODY = 72;
export const SLOT_ICON = 60;
/** Faint inner pad so empty hotbar frames stay easy to click. */
export const EMPTY_SLOT_PAD = 'rgba(80, 96, 112, 0.55)';
export const CURRENT_SLOT_ICON = 56;
export const REQUEST_SLOT_IDS = Object.freeze([
  'Request_item_Wood',
  'Request_item_Stone',
  'Request_item_Iron',
]);
export const REQUEST_PACK_ORDER = Object.freeze(['WOOD', 'STONE', 'IRON']);
export const ART_H = 720;

/** Load_Day dual bars (art bbox of Ui_Ui_1_12). */
export const LOAD_DAY_X = -181.45;
export const LOAD_DAY_Y = -18.35;
export const LOAD_DAY_W = 361.5;
export const LOAD_DAY_H = 35.9;
export const DAY_CYAN = '#B6F7FF';
export const DAY_PURPLE = '#55008C';

export const CHAT_CAP = 12;
export const CHAT_LINE_H = 36;
export const CHAT_VISIBLE = 9;

export const TEXT_COL_MIDDLE = Object.freeze([
  'Referee_Text',
  'Objective_Text',
  'Detail_Item',
  'Name_Item',
  'notification_AlignCenter',
  'NameGen',
  'HpGen',
  'NameGen_FL',
  'HpUpgrate',
]);
export const TEXT_COL_END = Object.freeze([
  'Number_Wave',
  'SceTime',
  'SceTime_FL',
  'SceTime_FL_FL',
  'SceTime_FL_FL_FL',
]);
export const TEXT_COL_START = Object.freeze([
  'GunDetail',
  'ChatShow',
  'ObjectiveDetail',
  'Detail_Text',
]);
export const ART_CX = ART_W / 2;
export const ART_CY = ART_H / 2;

export const ANCHOR_PRESETS = Object.freeze({
  Anchor_Right_Top: Object.freeze({
    kind: 'corner',
    artE: -ART_CX,
    artF: -ART_CY,
  }),
  Anchor_Center_Top: Object.freeze({ kind: 'center', artE: 0, artF: -ART_CY }),
  Anchor_Top_Left: Object.freeze({
    kind: 'corner',
    artE: ART_CX,
    artF: -ART_CY,
  }),
  Anchor_Top_Left_2: Object.freeze({
    kind: 'corner',
    artE: ART_CX,
    artF: -ART_CY,
  }),
  Anchor_Center_1: Object.freeze({ kind: 'center', artE: 0, artF: 0 }),
  Anchor_Center_2: Object.freeze({ kind: 'center', artE: 0, artF: 0 }),
  Anchor_Center_3: Object.freeze({ kind: 'center', artE: 0, artF: 0 }),
  Anchor_Center_Bottom: Object.freeze({
    kind: 'center',
    artE: 0,
    artF: ART_CY,
  }),
  Anchor_Left_Bottom: Object.freeze({
    kind: 'corner',
    artE: -ART_CX,
    artF: ART_CY,
  }),
  Anchor_Left_Bottom_FL: Object.freeze({
    kind: 'corner',
    artE: ART_CX,
    artF: ART_CY,
  }),
  Anchor_Left_Bottom_2: Object.freeze({
    kind: 'corner',
    artE: ART_CX,
    artF: ART_CY,
  }),
});

export const CATALOG_TO_CATEGORY = Object.freeze({
  Btn_Catalog_weapon: 'Gun',
  Btn_Catalog_Block: 'Block',
  Btn_Catalog_Turrent: 'Turret',
  Btn_Catalog_Ammo: 'Ammo',
  Btn_Catalog_Gen: 'Gen',
  Btn_Catalog_Other: 'Other',
});

export const CATEGORY_TO_CATALOG = Object.freeze({
  Gun: 'Btn_Catalog_weapon',
  Block: 'Btn_Catalog_Block',
  Turret: 'Btn_Catalog_Turrent',
  Ammo: 'Btn_Catalog_Ammo',
  Gen: 'Btn_Catalog_Gen',
  Other: 'Btn_Catalog_Other',
});

export const PLAYER_UI_SVG_URL = 'Asset/AssetSVG/Ui/PlayerUIGamePlay.svg';

export const CRAFT_SLOT_COUNT = 20;
export const HOTBAR_MAIN = 6;
export const GRAY_FILL = 'Ui_Btn_Color_0_Layer1_0_FILL';
export const YELLOW_FILL = 'Ui_Btn_Color_6_Layer1_0_FILL';
export const EFFECT_IDS = ['Effect_Show_1', 'Effect_Show_2', 'Effect_Show_3', 'Effect_Show_4'];
export const SKILL_IDS = ['Skill_Show_1', 'Skill_Show_2', 'Skill_Show_3'];
