// Code editor functionality - Monaco Edition
import { state } from './state.js';
import { log } from './logger.js';
import { getMonacoEditor, getEditorValue, setEditorValue } from './monacoEditor.js';

export function updateLineNumbers() {
  // Monaco handles line numbers automatically
}

export function syncLineNumbersScroll() {
  // Monaco handles scrolling automatically
}

export function saveToHistory() {
  const now = Date.now();
  if (now - state.lastSaveTime < 1000) return; // Debounce 1 second
  state.lastSaveTime = now;
  
  const code = getEditorValue();
  if (state.history.length === 0 || code !== state.history[state.historyIndex]) {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(code);
    state.historyIndex = state.history.length - 1;
    updateHistoryButtons();
    log('Code saved to history', 'debug', { historyLength: state.history.length });
  }
}

export function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    setEditorValue(state.history[state.historyIndex]);
    updateHistoryButtons();
    log('Undo performed', 'info', { historyIndex: state.historyIndex });
  }
}

export function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    setEditorValue(state.history[state.historyIndex]);
    updateHistoryButtons();
    log('Redo performed', 'info', { historyIndex: state.historyIndex });
  }
}

export function updateHistoryButtons() {
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const historyInfo = document.getElementById('history-info');
  
  if (undoBtn) undoBtn.disabled = state.historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = state.historyIndex >= state.history.length - 1;
  if (historyInfo) {
    historyInfo.textContent = state.history.length > 0 ? `${state.historyIndex + 1}/${state.history.length}` : 'No history';
  }
}

export function copyCode() {
  const code = getEditorValue();
  navigator.clipboard.writeText(code).then(() => {
    alert('Code copied!');
    log('Code copied to clipboard', 'success');
  });
}

export function clearCode() {
  setEditorValue('');
  saveToHistory();
  log('Code cleared', 'info');
}

export function initializeEditor() {
  // Monaco is initialized in monacoEditor.js
  // Just save initial state to history
  setTimeout(() => {
    saveToHistory();
    log('Editor initialized with default code', 'success');
  }, 500);
}
