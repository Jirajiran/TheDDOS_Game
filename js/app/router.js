/**
 * URL Hash & State Router for TheDDOS Game.
 * Enables SPA screen navigation, shareable room links, and dynamic Address Bar URLs
 * without full-page reloads (preserving RAM, AudioContext, Canvas, and Object Pools).
 *
 * Route Schemas:
 * - Menu:     #/menu#room=1234567
 * - Loading:  #/loading#room=1234567
 * - Gameplay: #/game/:nameMap#room=1234567
 * - Result:   #/result#room=1234567
 */

import { AppState, GameMode } from '../config.js';

/**
 * Parse current URL (hash + search) for route, map name, and room code.
 * @returns {{ screen: string, mapName: string, roomCode: string | null }}
 */
export function parseRouteFromUrl() {
  const hash = window.location.hash || '';
  const search = window.location.search || '';

  // Extract room code from hash or query: room=1234567
  let roomCode = null;
  const roomMatch = (hash + '&' + search).match(/room=([A-Za-z0-9_-]{4,16})/);
  if (roomMatch && roomMatch[1]) {
    roomCode = roomMatch[1];
  }

  // Parse path component before secondary hashes: e.g. "#/game/FlatSurvival"
  let screen = 'menu';
  let mapName = 'FlatSurvival';

  const cleanHash = hash.replace(/^#\/?/, '');
  const segments = cleanHash.split('#')[0].split('?')[0].split('/');

  const firstSeg = (segments[0] || '').toLowerCase();
  if (firstSeg === 'game' || firstSeg === 'play') {
    screen = 'game';
    if (segments[1]) {
      mapName = decodeURIComponent(segments[1]);
    }
  } else if (firstSeg === 'loading') {
    screen = 'loading';
  } else if (firstSeg === 'result') {
    screen = 'result';
  } else if (firstSeg === 'boot') {
    screen = 'boot';
  } else if (firstSeg === 'menu') {
    screen = 'menu';
  }

  return { screen, mapName, roomCode };
}

/**
 * Builds the URL hash for a given AppState and match/host context.
 * @param {string} appState
 * @param {any} host
 * @param {any} match
 * @returns {string}
 */
export function buildRouteHash(appState, host, match) {
  const code = (host && host.roomCode) ? host.roomCode : '';
  const roomSuffix = code ? `#room=${encodeURIComponent(code)}` : '';

  switch (appState) {
    case AppState.BOOT:
      return `#/boot`;

    case AppState.MENU:
      return `#/menu${roomSuffix}`;

    case AppState.LOADING:
      return `#/loading${roomSuffix}`;

    case AppState.PLAYING: {
      const mode = (match && match.gameMode) || (host && host.gameMode) || GameMode.FLAT_SURVIVAL;
      const mapName = mode === GameMode.WORLD_TYPE ? 'WorldType' : 'FlatSurvival';
      return `#/game/${mapName}${roomSuffix}`;
    }

    case AppState.RESULT:
      return `#/result${roomSuffix}`;

    default:
      return `#/menu${roomSuffix}`;
  }
}

/**
 * Synchronize the browser's address bar to match current appState without reloading.
 * Uses history.replaceState for smooth URL transitions.
 * @param {any} hub
 */
export function syncUrlRoute(hub) {
  if (!hub || !hub.state) return;
  const { appState, host, match } = hub.state;
  const targetHash = buildRouteHash(appState, host, match);

  if (window.location.hash !== targetHash) {
    try {
      window.history.replaceState(null, '', targetHash);
    } catch (_e) {
      // Fallback for restricted iframe environments
      window.location.hash = targetHash;
    }
  }
}

/**
 * Listen for browser URL / hash changes (e.g. user sharing or editing room code).
 * @param {any} hub
 */
export function initRouteListener(hub) {
  window.addEventListener('hashchange', () => {
    const parsed = parseRouteFromUrl();
    if (parsed.roomCode && hub.state && hub.state.host) {
      if (hub.state.host.roomCode !== parsed.roomCode) {
        hub.state.host.roomCode = parsed.roomCode;
        if (typeof hub.refreshLobbyUi === 'function') {
          hub.refreshLobbyUi();
        }
      }
    }
  });
}
