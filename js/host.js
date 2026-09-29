import { GameMode } from './config.js';

/**
 * Host authority surface — Local Host works now; net plugs later.
 *
 * Authority model (plan §7):
 * - Host runs Game Loop, AI General, Wave, collision.
 * - Clients would send Action payloads; Host broadcasts snapshots.
 * - V1: single Local Host, optional fake room code for lobby UI.
 */

export function createHostSession(options = {}) {
  const mode = options.gameMode || GameMode.FLAT_SURVIVAL;
  const roomCode = options.roomCode || generateRoomCode();
  return {
    /** true = this machine is authoritative sim */
    isHost: true,
    /** Local-only until PeerJS/WebRTC wired */
    netTransport: 'LOCAL',
    roomCode,
    gameMode: mode,
    maxPlayers: 7,
    players: [
      {
        slot: 0,
        name: options.hostName || 'Host',
        isLocal: true,
        isHost: true,
        connected: true,
      },
    ],
    friendlyFire: false,
    pathGridN: options.pathGridN || 2,
    /** Join over network — disabled stub */
    joinEnabled: false,
    joinStubMessage:
      'Network join (PeerJS/WebRTC) not enabled in V1 — Local Host only.',
  };
}

export function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const t = Date.now();
  for (let i = 0; i < 6; i++) {
    const idx = (t * (i + 3) + i * 17) % alphabet.length;
    code += alphabet[idx];
  }
  return code;
}

/**
 * Future: ingest remote Action list into Host queue.
 * V1: identity — returns local actions unchanged.
 */
export function hostIngestActions(session, localActions, _remoteActions) {
  if (!session || !session.isHost) return localActions || [];
  // When net exists: merge/validate remote Actions here.
  return localActions || [];
}

/**
 * Future: serialize snapshot for clients.
 * V1: returns lightweight debug summary.
 */
export function hostBuildSnapshot(match) {
  if (!match) return null;
  return {
    waveIndex: match.waveIndex,
    phase: match.phase,
    baseHp: match.base && match.base.alive ? match.base.hp : 0,
    enemiesAlive: match.enemiesAlive,
    outcome: match.outcome,
  };
}

export function tryJoinRoom(_code) {
  return {
    ok: false,
    message:
      'Join disabled — use Local Host. Room codes are display-only until net lands.',
  };
}
