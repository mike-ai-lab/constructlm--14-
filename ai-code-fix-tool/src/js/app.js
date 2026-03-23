// Main application entry point
import { state, loadAPIKey } from './state.js';
import { log, toggleDebugPanel, clearDebugLog, copyDebugLog, downloadDebugLog } from './logger.js';
import { 
  updateLineNumbers, 
  syncLineNumbersScroll, 
  saveToHistory, 
  undo, 
  redo, 
  copyCode, 
  clearCode,
  initializeEditor 
} from './editor.js';
import { detectAllErrors, displayErrors } from './errorDetector.js';
import { addChatMessage, toggleChatPanel, clearChat } from './chat.js';
import { startAIFix, updateStatus } from './aiService.js';
import { acceptFix, rejectFix } from './diff.js';

// Main error detection function
function detectErrors() {
  log('=== DETECT ERRORS STARTED ===', 'info');
  
  const code = document.getElementById('code-editor').value;
  state.originalCode = code;
  
  log('Code analysis', 'debug', { 
    chars: code.length, 
    lines: code.split('\n').length 
  });
  
  // Log the actual code being analyzed
  log('Code being analyzed:', 'info', code);
  
  updateStatus('Analyzing...', 'processing');
  addChatMessage('Analyzing your code...', true);
  
  const errors = detectAllErrors(code);
  state.errors = errors;
  
  log('Analysis complete', 'success', { errorsFound: errors.length });
  
  if (errors.length === 0) {
    updateStatus('Valid', 'success');
    addChatMessage('✓ No errors! Code is valid.');
    displayErrors([]);
    document.getElementById('fix-btn').disabled = true;
    log('Code is valid', 'success');
  } else {
    updateStatus(`${errors.length} Error(s)`, 'error');
    
    log('Errors detected', 'error', errors.map(e => ({
      line: e.line,
      column: e.column,
      message: e.message.split('\n')[0]
    })));
    
    displayErrors(errors);
    
    const errorList = errors.map((err, i) => 
      `Error ${i + 1} (Line ${err.line}): ${err.message.split('\n')[0]}`
    ).join('\n');
    
    addChatMessage(`Found ${errors.length} error(s):\n\n${errorList}`);
    document.getElementById('fix-btn').disabled = false;
  }
  
  log('=== DETECT ERRORS COMPLETED ===', 'info');
}

// Main AI fix function
async function handleAIFix() {
  const fixBtn = document.getElementById('fix-btn');
  fixBtn.disabled = true;
  
  // Ensure API key is loaded
  if (!state.apiKey) {
    await loadAPIKey();
  }
  
  await startAIFix(state.errors, state.originalCode);
  
  fixBtn.disabled = false;
}

// Attach event listeners
function attachEventListeners() {
  // Header buttons
  document.getElementById('detect-errors-btn').addEventListener('click', detectErrors);
  document.getElementById('fix-btn').addEventListener('click', handleAIFix);
  document.getElementById('toggle-chat').addEventListener('click', toggleChatPanel);
  
  // Editor toolbar
  document.getElementById('undo-btn').addEventListener('click', undo);
  document.getElementById('redo-btn').addEventListener('click', redo);
  document.getElementById('copy-code-btn').addEventListener('click', copyCode);
  document.getElementById('clear-code-btn').addEventListener('click', clearCode);
  
  // Code editor events
  const codeEditor = document.getElementById('code-editor');
  codeEditor.addEventListener('input', () => {
    updateLineNumbers();
    saveToHistory();
  });
  codeEditor.addEventListener('scroll', syncLineNumbersScroll);
  
  // Diff overlay buttons
  document.getElementById('accept-fix-btn').addEventListener('click', acceptFix);
  document.getElementById('reject-fix-btn').addEventListener('click', rejectFix);
  
  // Chat panel
  document.getElementById('clear-chat-btn').addEventListener('click', clearChat);
  
  // Debug panel
  document.getElementById('debug-header').addEventListener('click', toggleDebugPanel);
  document.getElementById('copy-debug-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    copyDebugLog();
  });
  document.getElementById('clear-debug-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    clearDebugLog();
  });
  document.getElementById('download-debug-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    downloadDebugLog();
  });
}

// Initialize application
window.addEventListener('DOMContentLoaded', async () => {
  log('=== AI Code Fix Pro V3 Initialized ===', 'info');
  
  // Load API key from server
  await loadAPIKey();
  
  // Initialize editor with default code
  initializeEditor();
  
  // Attach all event listeners
  attachEventListeners();
  
  log('Application ready', 'success');
});
