import { GameMode } from './config.js';

/**
 * Host authority surface — Local Host now; Host Hashing (room code) later.
 *
 * Authority model (AskKeep §7 Menu + Hashing join):
 * - Host runs Game Loop, AI General, Wave, collision.
 * - Clients send Action payloads; Host broadcasts snapshots.
 * - Hashing join = people who know the room code connect to Host
 *   (not a public online lobby / matchmaking).
 * - V1: Local Host + roster UI; same-machine mock join when code matches.
 */

export function createHostSession(options = {}) {
  const mode = options.gameMode || GameMode.FLAT_SURVIVAL;
  const roomCode = options.roomCode || generateRoomCode();
  return {
    /** true = this machine is authoritative sim */
    isHost: true,
    /**
     * LOCAL = single machine.
     * HASHING = future Peer/WebRTC to Host by room code (nearby who know the code).
     */
    netTransport: 'LOCAL',
    roomCode,
    gameMode: mode,
    maxPlayers: 7,
    players: [
      {
        slot: 0,
        name: options.hostName || 'Player',
        isLocal: true,
        isHost: true,
        connected: true,
      },
    ],
    friendlyFire: false,
    pathGridN: options.pathGridN || 2,
    /**
     * Code-gated join (Hashing). Not public matchmaking.
     * LOCAL: mock guest when typed code matches roomCode (roster UI / prep).
     */
    joinEnabled: true,
    joinStubMessage:
      'Host Hashing — share room code with people nearby. Not a public online lobby.',
  };
}

/** Short shareable Host Hashing code (art placeholder was 1234567). */
export function generateRoomCode() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  const t = Date.now();
  for (let i = 0; i < 7; i++) {
    const idx = (t * (i + 5) + i * 31) % alphabet.length;
    code += alphabet[idx];
  }
  return code;
}

export function normalizeRoomCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export function hostSetLocalName(session, name) {
  if (!session || !session.players || !session.players[0]) return;
  const n = String(name || 'Player').trim().slice(0, 24) || 'Player';
  session.players[0].name = n;
}

export function hostAddPlayer(session, opts = {}) {
  if (!session || !session.players) {
    return { ok: false, message: 'No host session' };
  }
  if (session.players.length >= (session.maxPlayers || 7)) {
    return { ok: false, message: 'Room full (max 7)' };
  }
  const slot = session.players.length;
  const player = {
    slot,
    name: String(opts.name || `Guest ${slot}`).trim().slice(0, 24) || `Guest ${slot}`,
    isLocal: !!opts.isLocal,
    isHost: false,
    connected: true,
  };
  session.players.push(player);
  return { ok: true, player, message: `${player.name} joined` };
}

/** Host kicks a non-host slot. Slot 0 (Host) cannot be kicked. */
export function hostKickPlayer(session, slot) {
  if (!session || !session.isHost || !session.players) {
    return { ok: false, message: 'Only Host can kick' };
  }
  const i = Number(slot);
  if (!Number.isFinite(i) || i <= 0) {
    return { ok: false, message: 'Cannot kick Host' };
  }
  if (i >= session.players.length) {
    return { ok: false, message: 'Player not found' };
  }
  const removed = session.players.splice(i, 1)[0];
  for (let s = 0; s < session.players.length; s++) {
    session.players[s].slot = s;
  }
  return {
    ok: true,
    message: `${removed.name} kicked`,
    player: removed,
  };
}

/**
 * Future: ingest remote Action list into Host queue.
 * V1: identity — returns local actions unchanged.
 */
export function hostIngestActions(session, localActions, _remoteActions) {
  if (!session || !session.isHost) return localActions || [];
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

/**
 * Join via Host Hashing code.
 * @param {object} session host session (authoritative)
 * @param {string} code typed from Input placeholder slot
 * @param {string} [joinerName] from YOUR NAME
 */
export function tryJoinRoom(session, code, joinerName) {
  if (!session) {
    return { ok: false, message: 'No host session' };
  }
  if (!session.joinEnabled) {
    return {
      ok: false,
      message: session.joinStubMessage || 'Join disabled',
    };
  }
  const want = normalizeRoomCode(code);
  const have = normalizeRoomCode(session.roomCode);
  if (!want) {
    return { ok: false, message: 'Type room code in Input, then Join' };
  }
  if (want !== have) {
    return {
      ok: false,
      message: 'Wrong code — ask the Host for their Hashing code',
    };
  }

  // LOCAL transport: mock guest for roster UI until Peer Hashing is wired.
  if (session.netTransport === 'LOCAL') {
    const guestName =
      String(joinerName || '').trim() &&
      String(joinerName).trim() !== session.players[0].name
        ? String(joinerName).trim()
        : `Guest ${session.players.length}`;
    return hostAddPlayer(session, {
      name: guestName,
      isLocal: false,
      isHost: false,
    });
  }

  return {
    ok: false,
    message: 'Hashing transport not ready — Local Host only',
  };
}
