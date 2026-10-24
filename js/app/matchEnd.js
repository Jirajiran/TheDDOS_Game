import { AppState, getBalancePack } from '../config.js';
import { stopAmbience } from '../audio/sfx.js';
import { clearLocalSnapshot } from '../session/memento.js';

/**
 * Finished match: clear the autosave and open the end panel.
 * The hub still owns the loop and the screen change it is asked to make.
 */
export function createMatchEnd(hub) {
  function endMatch(outcome) {
    const { state, playerUi } = hub;
    if (state.appState !== AppState.PLAYING) return;
    stopAmbience();
    if (state.panels) state.panels.close();
    hub.stopLoop();
    const match = state.match;
    clearLocalSnapshot();
    const waveReached = match ? match.waveIndex : 0;
    const stats = match && match.stats ? match.stats : {};
    state.result = {
      outcome,
      waveReached,
      mode: match ? match.gameMode : state.host.gameMode,
      stats,
    };
    const title = outcome === 'win' ? 'Victory' : 'Defeat';
    const detailLine =
      outcome === 'win'
        ? `Cleared wave ${getBalancePack().targetWaveToWin}. Reached wave ${waveReached}.`
        : `Base destroyed. Reached wave ${waveReached}.`;
    const rows = [
      `Mode: ${state.result.mode}`,
      `Kills: ${stats.kills || 0}`,
      `Shots: ${stats.shotsFired || 0}`,
      `Blocks placed: ${stats.blocksPlaced || 0}`,
      `Resources: ${stats.resourcesGathered || 0}`,
      `Damage dealt: ${Math.round(stats.damageDealt || 0)}`,
      `Room: ${state.host.roomCode}`,
    ];

    if (playerUi && playerUi.isReady()) {
      playerUi.setEndOpen(true, title, {
        detail: detailLine,
        lines: rows,
      });
    }
    hub.setAppState(AppState.RESULT);
  }

  function forceResult(outcome) {
    const { state } = hub;
    if (state.appState !== AppState.PLAYING) return;
    if (state.match) state.match.outcome = outcome;
    endMatch(outcome);
  }

  return { endMatch, forceResult };
}
