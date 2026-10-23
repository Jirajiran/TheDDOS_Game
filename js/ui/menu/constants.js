export const MENU_ART_W = 1280;
export const MENU_ART_H = 720;
export const MENU_ART_CX = MENU_ART_W / 2;
export const MENU_ART_CY = MENU_ART_H / 2;

/** Preset id → art-corner in MainMeun local (design 1280×720, origin = center). */
export const ANCHOR_PRESETS = Object.freeze({
  Anchor_Center: Object.freeze({ kind: 'center', artE: 0, artF: 0 }),
  Anchor_Top_Left: Object.freeze({
    kind: 'corner',
    artE: -MENU_ART_CX,
    artF: -MENU_ART_CY,
  }),
  Anchor_Top_Right: Object.freeze({
    kind: 'corner',
    artE: MENU_ART_CX,
    artF: -MENU_ART_CY,
  }),
  Anchor_Bottom_Right: Object.freeze({
    kind: 'corner',
    artE: MENU_ART_CX,
    artF: MENU_ART_CY,
  }),
  Anchor_Bottom_Left: Object.freeze({
    kind: 'corner',
    artE: -MENU_ART_CX,
    artF: MENU_ART_CY,
  }),
});

export const MAIN_MENU_SVG_URL = 'Asset/AssetSVG/Ui/MainMenu.svg';
export const BTN_SVG_URL = 'Asset/AssetSVG/Ui/Btn.svg';
export const SVG_NS = 'http://www.w3.org/2000/svg';

/** @typedef {'alone'|'join'} PlaySessionMode */
/** @typedef {'flat'|'resource'|'loadFile'} WorldPick */

/** Roster row ids in GroupJoinRoom (7 slots). Placeholder text was "n# PLAYER NAME". */
export const ROSTER_SLOTS = Object.freeze([
  { row: 'Player_n', kick: 'KickPlayer_n' },
  { row: 'Player_n_FL', kick: 'KickPlayer_n_FL' },
  { row: 'Player_n_FL_FL', kick: 'KickPlayer_n_FL_FL' },
  { row: 'Player_n_FL_FL_FL', kick: 'KickPlayer_n_FL_FL_FL' },
  { row: 'Player_n_FL_FL_FL_FL', kick: 'KickPlayer_n_FL_FL_FL_FL' },
  { row: 'Player_n_FL_FL_FL_FL_FL', kick: 'KickPlayer_n_FL_FL_FL_FL_FL' },
  { row: 'Player_n_FL_FL_FL_FL_FL_FL', kick: 'KickPlayer_n_FL_FL_FL_FL_FL_FL' },
]);
