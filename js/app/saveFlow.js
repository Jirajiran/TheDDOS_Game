/**
 * Snapshot autosave, manual export, and file import.
 * Match rules are not decided here — this only writes and reads the snapshot.
 */
import { AppState, AUTOSAVE_INTERVAL_SEC, FEATURE_SNAPSHOT } from '../config.js';
import {
  exportMatchSnapshotFile,
  importSnapshotIntoAutosave,
  parseSnapshotFileText,
  writeAutosave,
} from '../session/memento.js';

export function createSaveFlow(hub) {
  const { state } = hub;

  function tryAutosave(force) {
    if (!FEATURE_SNAPSHOT) return false;
    if (state.appState !== AppState.PLAYING || !state.match) return false;
    if (!force && state.autosaveAcc < AUTOSAVE_INTERVAL_SEC) return false;
    const ok = writeAutosave(state.match);
    if (ok) state.autosaveAcc = 0;
    return ok;
  }

  function manualExportSave() {
    if (!FEATURE_SNAPSHOT) return;
    if (state.appState !== AppState.PLAYING || !state.match) return;
    exportMatchSnapshotFile(state.match);
  }

  function applyImportedSaveFile(file) {
    if (!FEATURE_SNAPSHOT || !file) return;
    const { saveFileStatus } = hub.dom;
    const reader = new FileReader();
    reader.onload = () => {
      const snap = parseSnapshotFileText(String(reader.result || ''));
      if (!snap) {
        if (saveFileStatus) {
          saveFileStatus.hidden = false;
          saveFileStatus.textContent = 'Invalid save file.';
        }
        return;
      }
      importSnapshotIntoAutosave(snap);
      hub.refreshLobbyUi();
      if (saveFileStatus) {
        saveFileStatus.hidden = false;
        saveFileStatus.textContent = 'Loaded — starting…';
      }
      const mainMenuUi = hub.mainMenuUi;
      if (mainMenuUi && mainMenuUi.getWorldPick() === 'loadFile') {
        hub.startMatch({ restore: true });
      }
    };
    reader.onerror = () => {
      if (saveFileStatus) {
        saveFileStatus.hidden = false;
        saveFileStatus.textContent = 'Could not read file.';
      }
    };
    reader.readAsText(file);
  }

  function bind() {
    const { btnManualSave, saveFileInput, saveDropZone } = hub.dom;
    if (btnManualSave) {
      btnManualSave.addEventListener('click', () => manualExportSave());
    }
    if (saveFileInput) {
      saveFileInput.addEventListener('change', () => {
        const f = saveFileInput.files && saveFileInput.files[0];
        applyImportedSaveFile(f);
        saveFileInput.value = '';
      });
    }
    if (saveDropZone) {
      const stop = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      saveDropZone.addEventListener('dragenter', (e) => {
        stop(e);
        saveDropZone.classList.add('is-dragover');
      });
      saveDropZone.addEventListener('dragover', (e) => {
        stop(e);
        saveDropZone.classList.add('is-dragover');
      });
      saveDropZone.addEventListener('dragleave', (e) => {
        stop(e);
        saveDropZone.classList.remove('is-dragover');
      });
      saveDropZone.addEventListener('drop', (e) => {
        stop(e);
        saveDropZone.classList.remove('is-dragover');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        applyImportedSaveFile(f);
      });
    }
    const onPageLifecycleSave = () => {
      tryAutosave(true);
    };
    window.addEventListener('pagehide', onPageLifecycleSave);
    window.addEventListener('beforeunload', onPageLifecycleSave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onPageLifecycleSave();
    });
  }

  return { tryAutosave, bind };
}
