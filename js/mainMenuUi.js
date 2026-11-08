/**
 * MainMenu Canvas UI — Bridge from Design/MainMenu.js into the game engine.
 * Displays the artwork and interactive canvas from Design/, wiring hooks for:
 * 1. Alone Mode (FlatLand / Resource maps from alone_list.json)
 * 2. InRoom Play Trigger -> starts game match (startMatch)
 * 3. Real Hash Room System -> Validates hash, follows Host map, targeted player kick
 * 4. Multi-tab/client lobby synchronization via BroadcastChannel & localStorage
 * 5. Link to Editor -> opens editor.html
 * 6. Audio Button -> toggles audio mute
 * 7. Player Name Input -> updates game state
 * 8. Skin Catalog Slot (Skin_Default_1 receiver) -> displays character skin artwork
 * 9. Hash Input scaling -> matches ArtHash bounds exactly
 * 10. Sticky Preview -> keeps selected map preview displayed
 */
import {
  clampPlayableMenuSkinId,
  ensureIdleComposite,
  initUnitVisualFromSvgText,
  isUnitVisualReady,
} from './view/unitVisual.js';

export { BTN_SVG_URL, MAIN_MENU_SVG_URL, ROSTER_SLOTS } from './ui/menu/constants.js';

const ROOM_STORAGE_KEY = 'theddos_active_rooms';

/** Helper to query active hosted rooms from localStorage (pruning expired rooms) */
function getActiveRooms() {
  try {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (!raw) return {};
    const rooms = JSON.parse(raw);
    const now = Date.now();
    const clean = {};
    for (const key in rooms) {
      if (rooms[key] && now - (rooms[key].updatedAt || 0) < 30 * 60 * 1000) {
        clean[key] = rooms[key];
      }
    }
    return clean;
  } catch (_) {
    return {};
  }
}

/** Helper to store an active room */
function saveActiveRoom(room) {
  try {
    const rooms = getActiveRooms();
    room.updatedAt = Date.now();
    rooms[room.cleanHash] = room;
    localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(rooms));
  } catch (_) {}
}

/** Helper to remove an active room */
function removeActiveRoom(cleanHash) {
  try {
    const rooms = getActiveRooms();
    delete rooms[cleanHash];
    localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(rooms));
  } catch (_) {}
}

/** Normalizes room code for flexible matching */
function normalizeHash(raw) {
  return String(raw || '').trim().replace(/^#/, '').toUpperCase();
}

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
    selectedRoom: null,
    exportRoot: null,
    stage: null,
    _onGameStart: null,
    _onAudioChange: null,
    _onNameChange: null,
  };

  // Unique client ID for this session/tab
  const myClientId = 'cli_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

  // Broadcast channel for multi-tab/window real-time lobby communication
  let lobbyChannel = null;
  try {
    lobbyChannel = new BroadcastChannel('theddos_lobby_channel');
  } catch (_) {}

  /** Helper to recursively find a named child or property in the CreateJS display tree */
  function findDisplayNode(node, name, depth = 0) {
    if (!node || depth > 10) return null;
    if (node.name === name) return node;
    if (node[name] && typeof node[name] === 'object') return node[name];
    if (node.children && Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i++) {
        const found = findDisplayNode(node.children[i], name, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Applies the exact bounding box of ArtHash to UIHashInput DOM element.
   * Eliminates the mismatch between the input element and the visual art.
   */
  function applyHashInputPlacement() {
    if (!window.UIHashInput) return;
    window.UIHashInput.place = function () {
      var t = window.UIHashInput.target;
      var inp = window.UIHashInput.el;
      if (!t || !inp || !t.ref) return;

      var cv = window.canvas || document.getElementById("canvas") || document.querySelector("#screen-menu canvas");
      if (!cv || !t.ref.stage) {
        window.UIHashInput.commit(true);
        return;
      }

      var rect = cv.getBoundingClientRect();
      if (!rect.width || !rect.height || !cv.width || !cv.height) return;

      // Project top-left and bottom-right corners of ArtHash bounding box to canvas buffer coordinates
      var ptTL = t.ref.localToGlobal(t.bx, t.by);
      var ptBR = t.ref.localToGlobal(t.bx + t.bw, t.by + t.bh);

      // Map canvas buffer coordinates directly to CSS screen coordinates
      var screenX = rect.left + (ptTL.x / cv.width) * rect.width;
      var screenY = rect.top + (ptTL.y / cv.height) * rect.height;
      var screenW = ((ptBR.x - ptTL.x) / cv.width) * rect.width;
      var screenH = ((ptBR.y - ptTL.y) / cv.height) * rect.height;

      inp.style.left = Math.round(screenX) + "px";
      inp.style.top = Math.round(screenY) + "px";
      inp.style.width = Math.round(screenW) + "px";
      inp.style.height = Math.round(screenH) + "px";
      inp.style.fontSize = Math.max(12, Math.round(screenH * 0.44)) + "px";
      inp.style.lineHeight = Math.round(screenH) + "px";
    };
  }

  /**
   * Populates Skin_Default_1 (and Skin_Default_1_1) receiver slots with idle skin composites.
   */
  async function setupCatalogSkinSlots(exportRoot) {
    if (!exportRoot) return;

    // Ensure Unit_Template SVG is loaded if not already parsed
    if (!isUnitVisualReady()) {
      try {
        const resp = await fetch('Asset/AssetSVG/Unit/Unit_Template.svg');
        if (resp.ok) {
          const text = await resp.text();
          await initUnitVisualFromSvgText(text);
        }
      } catch (err) {
        console.warn('[TheDDOS] Failed to preload Unit_Template.svg for skin catalog:', err);
      }
    }

    const slot1 = findDisplayNode(exportRoot, "Skin_Default_1");
    const slot2 = findDisplayNode(exportRoot, "Skin_Default_1_1");

    async function bindSkinToSlot(slot, skinGroupId, skinId) {
      if (!slot) return;
      try {
        const img = await ensureIdleComposite(skinGroupId);
        if (!img) return;

        // Clean up previous dynamically added artwork in this slot
        for (let i = slot.children.length - 1; i >= 0; i--) {
          const child = slot.children[i];
          if (child && child._isSkinArt) {
            slot.removeChildAt(i);
          }
        }

        const bmp = new window.createjs.Bitmap(img);
        bmp._isSkinArt = true;
        bmp.regX = (img.width || 128) / 2;
        bmp.regY = (img.height || 128) / 2;
        const targetSize = 48;
        bmp.scaleX = targetSize / (img.width || 128);
        bmp.scaleY = targetSize / (img.height || 128);

        // Highlight ring indicating currently equipped skin
        const highlight = new window.createjs.Shape();
        highlight._isSkinArt = true;
        highlight.name = "skin_highlight";

        function refreshHighlight() {
          highlight.graphics.clear();
          if (state.skinId === skinId) {
            highlight.graphics
              .setStrokeStyle(3)
              .beginStroke("#38bdf8")
              .drawRoundRect(-26, -26, 52, 52, 6);
          }
        }

        refreshHighlight();
        slot.addChild(bmp);
        slot.addChild(highlight);

        slot.cursor = "pointer";
        slot.mouseChildren = false;
        slot.removeAllEventListeners("click");
        slot.on("click", function (evt) {
          if (evt) evt.stopPropagation();
          state.skinId = skinId;
          console.log("👗 [TheDDOS] Selected character skin:", skinId);
          if (slot1 && slot1._refreshHighlight) slot1._refreshHighlight();
          if (slot2 && slot2._refreshHighlight) slot2._refreshHighlight();
          if (state.stage) state.stage.update();
        });

        slot._refreshHighlight = refreshHighlight;
      } catch (e) {
        console.warn('[TheDDOS] Error binding skin to slot:', skinId, e);
      }
    }

    if (slot1) await bindSkinToSlot(slot1, "Default_skin_1", "Skin_Default_1");
    if (slot2) await bindSkinToSlot(slot2, "Default_skin_2", "Skin_Default_2");

    if (state.stage) state.stage.update();
  }

  function initGlobals() {
    if (window.AdobeAn) window.AdobeAn.makeResponsive = function () {};
    window.UIBus = window.UIBus || new window.createjs.EventDispatcher();
    window.UIAudio = window.UIAudio || new window.createjs.EventDispatcher();
    window.UILog = window.UILog || new window.createjs.EventDispatcher();
    if (typeof window.UIAudio.muted === "undefined") {
      window.UIAudio.muted = false;
    }

    // UIInput
    window.UIInput = window.UIInput || new window.createjs.EventDispatcher();
    if (typeof window.UIInput.value === "undefined") window.UIInput.value = state.playerName || "Player";
    if (typeof window.UIInput.maxLength === "undefined") window.UIInput.maxLength = 20;
    window.UIInput.set = function (val) {
      window.UIInput.value = val;
      state.playerName = val;
      window.UIInput.dispatchEvent({ type: "INPUT_CHANGE", value: val });
      window.UIInput.dispatchEvent({ type: "INPUT_SUBMIT", value: val });
      if (opts.onNameChange) opts.onNameChange(val);
    };

    // UIPreview (Sticky selected preview: keeps selected map displayed on rollout)
    window.UIPreview = window.UIPreview || new window.createjs.EventDispatcher();
    if (typeof window.UIPreview.selected === "undefined") {
      window.UIPreview.selected = null;
    }
    window.UIPreview.show = function (data) {
      window.UIPreview.dispatchEvent({ type: "PREVIEW_SHOW", data: data });
    };
    window.UIPreview.clear = function () {
      if (window.UIPreview.selected) {
        // Sticky: stay displaying the selected room instead of blanking out
        window.UIPreview.dispatchEvent({ type: "PREVIEW_SHOW", data: window.UIPreview.selected });
        return;
      }
      window.UIPreview.dispatchEvent({ type: "PREVIEW_CLEAR" });
    };
    window.UIPreview.select = function (data) {
      window.UIPreview.selected = data;
      window.UIPreview.show(data);
    };

    // UISort
    window.UISort = window.UISort || (function () {
      var bus = new window.createjs.EventDispatcher();
      bus.field = "index";
      bus.order = "asc";
      bus.set = function (newField) {
        if (bus.field === newField) {
          bus.order = bus.order === "asc" ? "desc" : "asc";
        } else {
          bus.field = newField;
          bus.order = "asc";
        }
        bus.dispatchEvent({
          type: "SORT_CHANGE",
          field: bus.field,
          order: bus.order
        });
      };
      bus.sortArray = function (array, field, order) {
        if (!Array.isArray(array)) return [];
        var f = field || bus.field;
        var o = order || bus.order;
        return array.slice().sort(function (a, b) {
          var valA = a[f], valB = b[f];
          if (typeof valA === "number" && typeof valB === "number") {
            return o === "asc" ? valA - valB : valB - valA;
          } else {
            var strA = (valA || "").toString().toLowerCase();
            var strB = (valB || "").toString().toLowerCase();
            if (strA < strB) return o === "asc" ? -1 : 1;
            if (strA > strB) return o === "asc" ? 1 : -1;
            return 0;
          }
        });
      };
      return bus;
    })();

    // UIRoom — Real Hash Room & Multiplayer State Management
    window.UIRoom = window.UIRoom || (function () {
      var bus = new window.createjs.EventDispatcher();
      bus.status = "IDLE";
      bus.currentRoom = null;
      bus.hashCode = "";
      bus.players = [];
      bus.myClientId = myClientId;
      bus.isHost = false;
      bus.hostClientId = null;
      bus._isKicking = false;

      bus.getCleanHash = function () {
        return normalizeHash(bus.hashCode);
      };

      bus.isCurrentClientHost = function () {
        if (bus.isHost) return true;
        if (bus.players.length > 0 && bus.players[0].id === myClientId) return true;
        var myName = (window.UIInput && window.UIInput.value && window.UIInput.value.trim()) || state.playerName || "Player";
        if (bus.players.length > 0 && bus.players[0].name === myName && bus.players[0].isHost) return true;
        return false;
      };

      bus.generateHash = function () {
        var num = Math.floor(1000 + Math.random() * 9000);
        return "#RM-" + num;
      };

      // Host enters/creates a room with the selected map
      bus.enter = function (roomData) {
        bus.status = "IN_ROOM";
        bus.isHost = true;
        bus.hostClientId = myClientId;
        bus.currentRoom = roomData;
        state.selectedRoom = roomData;
        if (window.UIPreview && window.UIPreview.select) {
          window.UIPreview.select(roomData);
        }
        if (roomData && roomData.type === "RESOURCE") {
          state.worldPick = "loadFile";
        } else {
          state.worldPick = "flat";
        }
        bus.hashCode = bus.generateHash();
        var myName = (window.UIInput && window.UIInput.value && window.UIInput.value.trim()) || state.playerName || "Host Player";
        bus.players = [
          { id: myClientId, index: 1, name: myName, isHost: true }
        ];

        // Store active room in localStorage and broadcast to other tabs
        var clean = bus.getCleanHash();
        var roomRecord = {
          hashCode: bus.hashCode,
          cleanHash: clean,
          hostClientId: myClientId,
          roomData: roomData,
          players: bus.players,
          updatedAt: Date.now()
        };
        saveActiveRoom(roomRecord);

        if (lobbyChannel) {
          lobbyChannel.postMessage({
            type: "LOBBY_ROOM_UPDATE",
            cleanHash: clean,
            room: roomRecord
          });
        }

        console.log("👑 [TheDDOS] Created real room as Host:", bus.hashCode, "Map:", roomData.name);

        bus.dispatchEvent({
          type: "ROOM_ENTER",
          status: bus.status,
          room: roomData,
          hashCode: bus.hashCode,
          players: bus.players
        });
      };

      // Leaving a room (cleans up active room if host, or removes guest)
      bus.leave = function (force) {
        // Protect Host from accidental exit during kick event handling in Design/MainMenu.js
        if (bus._isKicking && bus.isCurrentClientHost() && !force) {
          console.log("🛡️ Protected Host from leaving on player kick");
          return;
        }

        var clean = bus.getCleanHash();
        if (bus.isCurrentClientHost()) {
          removeActiveRoom(clean);
          if (lobbyChannel) {
            lobbyChannel.postMessage({
              type: "LOBBY_ROOM_CLOSED",
              cleanHash: clean
            });
          }
        } else if (clean) {
          var rooms = getActiveRooms();
          var r = rooms[clean];
          if (r) {
            r.players = r.players.filter(function (p) {
              return p.id !== myClientId && p.name !== state.playerName;
            });
            r.players.forEach(function (p, idx) { p.index = idx + 1; });
            saveActiveRoom(r);
            if (lobbyChannel) {
              lobbyChannel.postMessage({
                type: "LOBBY_PLAYER_LEFT",
                cleanHash: clean,
                players: r.players
              });
            }
          }
        }

        bus.status = "IDLE";
        bus.isHost = false;
        bus.hostClientId = null;
        bus.currentRoom = null;
        state.selectedRoom = null;
        bus.players = [];
        bus.hashCode = "";
        if (window.UIHashInput && window.UIHashInput.clear) {
          window.UIHashInput.clear();
        } else if (window.UIHashInput) {
          window.UIHashInput.value = "";
          if (window.UIHashInput.el) window.UIHashInput.el.value = "";
          if (window.UIHashInput.refresh) window.UIHashInput.refresh();
        }
        bus.dispatchEvent({ type: "ROOM_LEAVE", status: bus.status });
      };

      // Real Join by Hash: validates against existing active rooms (no mockups)
      bus.joinByHash = function (inputHash, joinerName) {
        if (!inputHash) return false;
        var cleanInput = normalizeHash(inputHash);
        var rooms = getActiveRooms();

        // Search for active room by exact clean code, or with/without "RM-" prefix
        var targetRoom = rooms[cleanInput] ||
                         rooms["RM-" + cleanInput] ||
                         (cleanInput.startsWith("RM-") ? rooms[cleanInput.replace("RM-", "")] : null);

        // If room is NOT found: reject and flash error visual feedback
        if (!targetRoom) {
          console.warn("❌ [TheDDOS] Join rejected: Room Hash not found for", inputHash);
          if (window.UIHashInput && window.UIHashInput.el) {
            var el = window.UIHashInput.el;
            var origBorder = el.style.borderColor;
            var origColor = el.style.color;
            el.value = "NOT FOUND";
            el.style.borderColor = "#ef4444";
            el.style.color = "#f87171";
            setTimeout(function () {
              if (window.UIHashInput && window.UIHashInput.clear) {
                window.UIHashInput.clear();
              } else if (el) {
                el.value = "";
                if (window.UIHashInput) window.UIHashInput.value = "";
                if (window.UIHashInput && window.UIHashInput.refresh) window.UIHashInput.refresh();
              }
              if (el) {
                el.style.borderColor = origBorder || "#818cf8";
                el.style.color = origColor || "#38bdf8";
              }
            }, 1300);
          }
          if (window.UILog && window.UILog.dispatchEvent) {
            window.UILog.dispatchEvent({ type: "LOG", message: "❌ Room not found: " + inputHash });
          }
          return false;
        }

        // Room is valid: follow the Host's room and map!
        bus.status = "IN_ROOM";
        bus.isHost = false;
        bus.hostClientId = targetRoom.hostClientId;
        bus.currentRoom = targetRoom.roomData; // Inherit Host's exact map!
        bus.hashCode = targetRoom.hashCode;
        state.selectedRoom = targetRoom.roomData;
        state.worldPick = targetRoom.roomData.worldPick || (targetRoom.roomData.type === "RESOURCE" ? "loadFile" : "flat");

        // Determine player name, preventing collision with Host name
        var pName = joinerName || (window.UIInput && window.UIInput.value && window.UIInput.value.trim()) || state.playerName || "Guest";
        var count = 1;
        var finalName = pName;
        while (targetRoom.players.some(function (p) { return p.name.toLowerCase() === finalName.toLowerCase(); })) {
          count++;
          finalName = pName + " (" + count + ")";
        }
        if (window.UIInput && window.UIInput.set) window.UIInput.set(finalName);
        state.playerName = finalName;

        var newGuest = {
          id: myClientId,
          index: targetRoom.players.length + 1,
          name: finalName,
          isHost: false
        };

        targetRoom.players.push(newGuest);
        bus.players = targetRoom.players;
        saveActiveRoom(targetRoom);

        console.log("🎮 [TheDDOS] Successfully joined Host room via Hash:", targetRoom.hashCode, "Map:", targetRoom.roomData.name);

        // Notify other tabs via BroadcastChannel
        if (lobbyChannel) {
          lobbyChannel.postMessage({
            type: "LOBBY_PLAYER_JOINED",
            cleanHash: targetRoom.cleanHash,
            player: newGuest,
            players: targetRoom.players
          });
        }

        // Enter InRoom view with Host's room and player list
        bus.dispatchEvent({
          type: "ROOM_ENTER",
          status: bus.status,
          room: targetRoom.roomData,
          hashCode: targetRoom.hashCode,
          players: targetRoom.players
        });
        return true;
      };

      // Kicking a specific chosen player (only Host can kick, kicks ONLY the selected player)
      bus.kickPlayer = function (targetIndexOrId) {
        if (bus.status !== "IN_ROOM" || !bus.players || bus.players.length === 0) return;
        if (!bus.isCurrentClientHost()) {
          console.warn("⚠️ Only the room Host can kick players");
          return;
        }

        // Find the specific chosen player
        var target = null;
        var targetIndex = -1;
        for (var i = 0; i < bus.players.length; i++) {
          var p = bus.players[i];
          if ((p.index === targetIndexOrId || p.id === targetIndexOrId) && !p.isHost) {
            target = p;
            targetIndex = i;
            break;
          }
        }

        if (!target) {
          console.warn("⚠️ Target player to kick not found or is Host:", targetIndexOrId);
          return;
        }

        console.log("👢 Host kicking specific player:", target.name, "ID/Index:", targetIndexOrId);

        // Remove ONLY this specific player
        bus.players.splice(targetIndex, 1);

        // Re-index remaining players cleanly
        for (var j = 0; j < bus.players.length; j++) {
          bus.players[j].index = j + 1;
        }

        // Update active room record
        var clean = bus.getCleanHash();
        var rooms = getActiveRooms();
        if (rooms[clean]) {
          rooms[clean].players = bus.players;
          saveActiveRoom(rooms[clean]);
        }

        // Dispatch locally while protecting Host from accidental leave
        bus._isKicking = true;
        try {
          bus.dispatchEvent({
            type: "PLAYER_KICKED",
            status: bus.status,
            kickedPlayer: target,
            players: bus.players,
            hashCode: bus.hashCode
          });
        } finally {
          bus._isKicking = false;
        }

        // Notify over BroadcastChannel so the specific kicked client leaves
        if (lobbyChannel) {
          lobbyChannel.postMessage({
            type: "LOBBY_PLAYER_KICKED",
            cleanHash: clean,
            kickedPlayer: target,
            players: bus.players
          });
        }
      };

      // Broadcast game start trigger to all connected guests
      bus.broadcastGameStart = function (roomData) {
        if (!lobbyChannel) return;
        lobbyChannel.postMessage({
          type: "LOBBY_GAME_START",
          cleanHash: bus.getCleanHash(),
          room: roomData || bus.currentRoom,
          players: bus.players
        });
      };

      // Listen for remote events on the lobby broadcast channel
      if (lobbyChannel) {
        lobbyChannel.onmessage = function (evt) {
          var data = evt && evt.data;
          if (!data || !data.type) return;

          // Check if message applies to this room
          var myClean = bus.getCleanHash();
          if (data.cleanHash && myClean && data.cleanHash !== myClean) return;

          switch (data.type) {
            case "LOBBY_PLAYER_JOINED":
              if (bus.status === "IN_ROOM") {
                bus.players = data.players || bus.players;
                bus.dispatchEvent({
                  type: "PLAYER_JOINED",
                  status: bus.status,
                  player: data.player,
                  players: bus.players,
                  hashCode: bus.hashCode
                });
              }
              break;

            case "LOBBY_PLAYER_LEFT":
              if (bus.status === "IN_ROOM") {
                bus.players = data.players || bus.players;
                bus.dispatchEvent({
                  type: "ROOM_ENTER",
                  status: bus.status,
                  room: bus.currentRoom,
                  hashCode: bus.hashCode,
                  players: bus.players
                });
              }
              break;

            case "LOBBY_PLAYER_KICKED":
              if (bus.status === "IN_ROOM") {
                var kicked = data.kickedPlayer;
                var myName = (window.UIInput && window.UIInput.value && window.UIInput.value.trim()) || state.playerName;
                // If THIS client was the targeted kicked player, leave the room
                if (kicked && (kicked.id === myClientId || (kicked.name === myName && !bus.isCurrentClientHost()))) {
                  console.log("👢 You have been kicked from the room by Host");
                  bus.leave(true);
                  return;
                }
                // Otherwise, update player list and re-render
                bus.players = data.players || bus.players;
                bus.dispatchEvent({
                  type: "PLAYER_KICKED",
                  status: bus.status,
                  kickedPlayer: kicked,
                  players: bus.players,
                  hashCode: bus.hashCode
                });
              }
              break;

            case "LOBBY_ROOM_CLOSED":
              if (bus.status === "IN_ROOM" && !bus.isCurrentClientHost()) {
                console.log("🚪 Host closed the room");
                bus.leave(true);
              }
              break;

            case "LOBBY_GAME_START":
              // Guest follows Host into the game match!
              if (bus.status === "IN_ROOM" && !bus.isCurrentClientHost()) {
                console.log("🎮 Host started the game! Following Host with map:", data.room && data.room.name);
                if (data.room) {
                  state.selectedRoom = data.room;
                  state.worldPick = data.room.worldPick || (data.room.type === "RESOURCE" ? "loadFile" : "flat");
                }
                if (opts.onPlay) opts.onPlay();
              }
              break;
          }
        };
      }

      return bus;
    })();

    // UIScreen — uniform scale; canvas fills mount; logical base expands for UIAnchor
    if (!window.UIScreen) {
      window.UIScreen = (function () {
        var bus = new window.createjs.EventDispatcher();
        bus.w = 1280;
        bus.h = 720;
        bus.dpr = window.devicePixelRatio || 1;
        bus.sRatio = 1;
        bus.apply = function () {
          var cv = bus.cv || document.getElementById("canvas") || document.querySelector("#screen-menu canvas");
          var st = bus.st || window.stage || (cv && cv.__stage) || (window.exportRoot && window.exportRoot.stage);
          if (!cv || !st) return false;
          if (!bus.cv) bus.cv = cv;
          if (!bus.st) bus.st = st;

          var mountNode = document.getElementById("main-menu-mount") || document.getElementById("screen-menu") || document.body;
          var rect = mountNode.getBoundingClientRect();
          var w = rect.width || window.innerWidth || 1280;
          var h = rect.height || window.innerHeight || 720;
          var dpr = window.devicePixelRatio || 1;

          var designW = 1280;
          var designH = 720;
          if (window.UIAnchor && window.UIAnchor.design) {
            designW = window.UIAnchor.design.width || designW;
            designH = window.UIAnchor.design.height || designH;
          } else if (window.UIAnchor && window.UIAnchor.base && !window.UIAnchor._logicalBase) {
            designW = window.UIAnchor.base.width || designW;
            designH = window.UIAnchor.base.height || designH;
          }

          var sRatio = Math.min(w / designW, h / designH);
          if (!sRatio || sRatio <= 0) sRatio = 1;

          // Full-bleed canvas; extra space is logical margin for anchors (not letterbox crop).
          var renderW = Math.round(w);
          var renderH = Math.round(h);
          var bw = Math.round(renderW * dpr);
          var bh = Math.round(renderH * dpr);
          var logicalW = renderW / sRatio;
          var logicalH = renderH / sRatio;

          cv.width = bw;
          cv.height = bh;
          cv.style.width = renderW + "px";
          cv.style.height = renderH + "px";

          var anim_container = document.getElementById("animation_container");
          var dom_overlay_container = document.getElementById("dom_overlay_container");
          if (anim_container) {
            anim_container.style.width = renderW + "px";
            anim_container.style.height = renderH + "px";
          }
          if (dom_overlay_container) {
            dom_overlay_container.style.width = renderW + "px";
            dom_overlay_container.style.height = renderH + "px";
          }

          st.scaleX = sRatio * dpr;
          st.scaleY = sRatio * dpr;
          bus.w = logicalW;
          bus.h = logicalH;
          bus.dpr = dpr;
          bus.sRatio = sRatio;

          if (window.UIAnchor) {
            if (!window.UIAnchor.design) {
              var src = window.UIAnchor.base || { width: designW, height: designH };
              window.UIAnchor.design = { width: src.width || designW, height: src.height || designH };
            }
            window.UIAnchor.base = { width: logicalW, height: logicalH };
            window.UIAnchor._logicalBase = true;
          }

          bus.dispatchEvent({ type: "SCREEN_RESIZE", w: logicalW, h: logicalH, dpr: dpr, sRatio: sRatio });
          var t = st.tickOnUpdate;
          st.tickOnUpdate = false;
          st.update();
          st.tickOnUpdate = t;

          // Keep hash input properly placed whenever screen resizes
          if (window.UIHashInput && window.UIHashInput.place) {
            window.UIHashInput.place();
          }
          return true;
        };
        window.addEventListener("resize", function () { bus.apply(); });
        return bus;
      })();
    }

    // UIAnchor — snap to edges; size stays design-scale; only fill layers stretch
    if (!window.UIAnchor) {
      window.UIAnchor = (function () {
        var items = [];
        var api = { base: null, design: null };
        function getBase(it) {
          return it.base || api.base || api.design || { width: 1280, height: 720 };
        }
        function getDesign() {
          return api.design || { width: 1280, height: 720 };
        }
        function snap(it) {
          var o = it.obj;
          if (!o || !o.parent) return;
          var b = getBase(it);
          var w = b.width || 1280;
          var h = b.height || 720;
          var design = getDesign();
          var dw = design.width || 1280;
          var dh = design.height || 720;
          if (!o._origOffset) {
            // Capture offsets against Animate design size (1280x720), not expanded logical.
            o._origOffset = {
              initialX: o.x,
              initialY: o.y,
              offsetRight: dw - o.x,
              offsetBottom: dh - o.y,
              offsetCenterX: o.x - (dw / 2),
              offsetCenterY: o.y - (dh / 2)
            };
          }
          var orig = o._origOffset;
          switch (it.anchor) {
            case "TOP_LEFT":
              o.x = orig.initialX;
              o.y = orig.initialY;
              break;
            case "TOP_CENTER":
              o.x = (w / 2) + orig.offsetCenterX;
              o.y = orig.initialY;
              break;
            case "TOP_RIGHT":
              o.x = w - orig.offsetRight;
              o.y = orig.initialY;
              break;
            case "MIDDLE_LEFT":
              o.x = orig.initialX;
              o.y = (h / 2) + orig.offsetCenterY;
              break;
            case "CENTER":
              o.x = (w / 2) + orig.offsetCenterX;
              o.y = (h / 2) + orig.offsetCenterY;
              break;
            case "MIDDLE_RIGHT":
              o.x = w - orig.offsetRight;
              o.y = (h / 2) + orig.offsetCenterY;
              break;
            case "BOTTOM_LEFT":
              o.x = orig.initialX;
              o.y = h - orig.offsetBottom;
              break;
            case "BOTTOM_CENTER":
              o.x = (w / 2) + orig.offsetCenterX;
              o.y = h - orig.offsetBottom;
              break;
            case "BOTTOM_RIGHT":
              o.x = w - orig.offsetRight;
              o.y = h - orig.offsetBottom;
              break;
          }
          if (it.fill) {
            if (o._origScaleX === undefined) {
              o._origScaleX = o.scaleX;
              o._origScaleY = o.scaleY;
            }
            o.x = w / 2;
            o.y = h / 2;
            o.scaleX = o._origScaleX * (w / dw);
            o.scaleY = o._origScaleY * (h / dh);
          }
        }
        function snapAll() {
          for (var i = 0; i < items.length; i++) {
            snap(items[i]);
          }
        }
        api.attach = function (obj, anchor, base, optsAnchor) {
          if (!obj) return function () {};
          api.detach(obj);
          var it = { obj: obj, anchor: anchor, base: base || null, fill: !!(optsAnchor && optsAnchor.fill) };
          items.push(it);
          snap(it);
          return function () { api.detach(obj); };
        };
        api.detach = function (obj) {
          items = items.filter(function (it) { return it.obj !== obj; });
        };
        api.fill = function (obj, base) {
          return api.attach(obj, "CENTER", base, { fill: true });
        };
        api.updateAll = snapAll;
        window.UIScreen.on("SCREEN_RESIZE", snapAll);
        return api;
      })();
    }
  }

  async function mountSvg() {
    if (!mount) throw new Error('mainMenuUi: missing mount');

    // Wait until createjs and AdobeAn composition are loaded
    let attempts = 0;
    while ((!window.createjs || !window.AdobeAn || !window.AdobeAn.getComposition) && attempts < 50) {
      await new Promise(r => setTimeout(r, 50));
      attempts++;
    }

    initGlobals();

    mount.innerHTML = `
      <div id="animation_container" style="background-color: transparent; width:100%; height:100%; position: absolute; inset: 0;">
        <canvas id="canvas" width="1280" height="720" style="position: absolute; display: block; width: 100%; height: 100%;"></canvas>
        <div id="dom_overlay_container" style="pointer-events: none; overflow: hidden; width: 100%; height: 100%; position: absolute; left: 0px; top: 0px; display: block;"></div>
      </div>
    `;

    const canvas = document.getElementById("canvas");
    const anim_container = document.getElementById("animation_container");
    const dom_overlay_container = document.getElementById("dom_overlay_container");

    const comp = window.AdobeAn.getComposition("7E65D3D82A70B04BBA1E8CA78976B597");
    if (!comp) {
      console.warn("Design MainMenu composition not found on first check");
      return;
    }
    const lib = comp.getLibrary();
    const exportRoot = new lib.MainMenu();
    const stage = new lib.Stage(canvas);
    stage.enableMouseOver();
    stage.addChild(exportRoot);
    window.createjs.Ticker.framerate = (lib.properties && lib.properties.fps) || 30;
    window.createjs.Ticker.addEventListener("tick", stage);

    window.AdobeAn.makeResponsive(false, 'both', false, 1, [canvas, anim_container, dom_overlay_container]);
    window.AdobeAn.compositionLoaded(lib.properties.id);

    window.exportRoot = exportRoot;
    window.stage = stage;
    window.canvas = canvas;
    state.exportRoot = exportRoot;
    state.stage = stage;

    // Apply strict 16:9 responsive scaling
    if (window.UIScreen && window.UIScreen.apply) {
      window.UIScreen.cv = canvas;
      window.UIScreen.st = stage;
      window.UIScreen.apply(true);
    }

    // Apply exact bounding box placement for InputHash
    applyHashInputPlacement();

    // Setup Skin_Default_1 and Skin_Default_1_1 artwork slots
    setupCatalogSkinSlots(exportRoot);

    // Refresh skin slots if catalog toggles
    window.UIBus.on("CATALOG_TOGGLE_REQUESTED", () => {
      setupCatalogSkinSlots(exportRoot);
    });

    // Automatically preselect the first map from alone_list.json so the preview is sticky
    fetch('data/folder1/alone_list.json')
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list) && list.length > 0) {
          if (!window.UIPreview.selected) {
            window.UIPreview.select(list[0]);
          }
        }
      })
      .catch(err => console.warn('Could not load alone_list for pre-selection:', err));

    // Wire Hooks:
    // 1. Game Start Trigger (when Play button is pressed in InRoom)
    if (state._onGameStart) window.UIBus.off("GAME_START_TRIGGER", state._onGameStart);
    state._onGameStart = function (evt) {
      console.log("🎮 [TheDDOS] Start game match from Design menu:", evt);
      if (evt && evt.room) {
        state.selectedRoom = evt.room;
        if (evt.room.type === "RESOURCE") {
          state.worldPick = "loadFile";
        } else {
          state.worldPick = "flat";
        }
      }

      // If Host, notify guests over BroadcastChannel to start game simultaneously
      if (window.UIRoom && window.UIRoom.isCurrentClientHost && window.UIRoom.isCurrentClientHost()) {
        window.UIRoom.broadcastGameStart(state.selectedRoom);
      }

      if (opts.onPlay) opts.onPlay();
    };
    window.UIBus.on("GAME_START_TRIGGER", state._onGameStart);

    // 2. Link to editor.html (Btn_link)
    if (exportRoot.Btn_link) {
      exportRoot.Btn_link.cursor = "pointer";
      exportRoot.Btn_link.removeAllEventListeners("click");
      exportRoot.Btn_link.on("click", function (evt) {
        if (evt) evt.stopPropagation();
        if (opts.onLink) opts.onLink();
        else window.location.href = "editor.html";
      });
    }

    // 3. Audio Toggle
    if (state._onAudioChange) window.UIAudio.off("AUDIO_CHANGE", state._onAudioChange);
    state._onAudioChange = function (evt) {
      state.audioMuted = evt.muted;
      try {
        localStorage.setItem("theddos_mute", evt.muted ? "1" : "0");
      } catch (_) {}
      if (opts.onAudioToggle) opts.onAudioToggle(evt.muted);
    };
    window.UIAudio.on("AUDIO_CHANGE", state._onAudioChange);

    // 4. Player Name Input
    if (state._onNameChange) window.UIInput.off("INPUT_CHANGE", state._onNameChange);
    state._onNameChange = function (evt) {
      state.playerName = evt.value;
      if (opts.nameInput) opts.nameInput.value = evt.value;
      if (opts.onNameChange) opts.onNameChange(evt.value);
    };
    window.UIInput.on("INPUT_CHANGE", state._onNameChange);

    // 5. Hide legacy overlay inputs so they don't block canvas clicks
    const overlays = document.querySelector(".main-menu-overlays");
    if (overlays) {
      overlays.style.display = "none";
    }

    state.ready = true;
  }

  return {
    state,
    mountSvg,
    applyAll() {
      if (window.UIScreen && window.UIScreen.apply) {
        window.UIScreen.apply();
      }
      if (window.UIHashInput && window.UIHashInput.place) {
        window.UIHashInput.place();
      }
    },
    layoutInputs() {},
    syncRoster() {},
    playEnterTween() {
      if (window.UIScreen && window.UIScreen.apply) {
        window.UIScreen.apply(true);
      }
      if (window.UIHashInput && window.UIHashInput.place) {
        window.UIHashInput.place();
      }
      if (state.stage) {
        state.stage.update();
      }
    },
    gameModeFromPick() {
      if (state.selectedRoom && state.selectedRoom.type === "RESOURCE") {
        return "WORLD_TYPE";
      }
      return "FLAT_SURVIVAL";
    },
    getPlayerName() {
      return (window.UIInput && window.UIInput.value) || state.playerName || 'Player';
    },
    getPlaySession() {
      return 'alone';
    },
    getWorldPick() {
      if (state.selectedRoom && state.selectedRoom.worldPick) {
        return state.selectedRoom.worldPick;
      }
      return state.worldPick;
    },
    getSkinId() {
      return clampPlayableMenuSkinId(state.skinId);
    },
    getJoinText() {
      return state.joinText;
    },
    setRoomCode(code) {
      state.roomCode = String(code || '');
    },
    setPlayerName(name) {
      state.playerName = String(name || 'Player').slice(0, 24);
      if (window.UIInput && window.UIInput.set) window.UIInput.set(state.playerName);
      if (opts.nameInput) opts.nameInput.value = state.playerName;
    },
    isReady() {
      return state.ready;
    },
  };
}
