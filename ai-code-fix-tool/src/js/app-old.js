// Main application entry point - MODERN INTERFACE
import { state, loadAPIKey } from './state.js';
import { log, toggleDebugWindow, clearDebugLog, copyDebugLog } from './logger.js';
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
import { addChatMessage, clearChat } from './chat-new.js';
import { startAIFix, updateStatus } from './aiService.js';
import { acceptFix, rejectFix } from './diff.js';
import { renderPreview, clearPreview, initializePreview } from './preview-new.js';

// Console log function
function logToConsole(message, type = 'info') {
  const consoleLog = document.getElementById('console-log');
  if (!consoleLog) return;
  
  const entry = document.createElement('div');
  entry.style.marginBottom = '4px';
  entry.style.opacity = type === 'error' ? '1' : '0.8';
  entry.style.color = type === 'error' ? '#f87171' : type === 'success' ? '#34d399' : 'inherit';
  entry.textContent = message;
  
  consoleLog.appendChild(entry);
  consoleLog.scrollTop = consoleLog.scrollHeight;
}

// Clear console
function clearConsole() {
  const consoleLog = document.getElementById('console-log');
  if (consoleLog) {
    consoleLog.innerHTML = '<div style="opacity: 0.6;">[Log] Console cleared.</div>';
  }
}

// Main error detection function
function detectErrors() {
  log('=== DETECT ERRORS STARTED ===', 'info');
  
  const code = document.getElementById('code-editor').value;
  state.originalCode = code;
  
  log('Code analysis', 'debug', { 
    chars: code.length, 
    lines: code.split('\n').length 
  });
  
  updateStatus('Analyzing...', 'processing');
  
  // Clear console
  clearConsole();
  
  const errors = detectAllErrors(code);
  state.errors = errors;
  
  log('Analysis complete', 'success', { errorsFound: errors.length });
  
  if (errors.length === 0) {
    updateStatus('Valid', 'success');
    logToConsole('[OK] No syntax errors found', 'success');
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
    
    // Log errors to console
    errors.forEach((err, i) => {
      logToConsole(`Error ${i + 1} (Line ${err.line}:${err.column}): ${err.message.split('\n')[0]}`, 'error');
    });
    
    displayErrors(errors);
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

// Tab switching (Editor/Preview)
function switchToEditor() {
  const editorTab = document.getElementById('editorTab');
  const previewTab = document.getElementById('previewTab');
  const codeViewport = document.getElementById('codeViewport');
  const previewIframe = document.getElementById('preview-iframe');
  
  if (previewTab) previewTab.classList.remove('active');
  if (editorTab) editorTab.classList.add('active');
  if (codeViewport) codeViewport.style.display = 'flex';
  if (previewIframe) previewIframe.style.display = 'none';
  
  log('Switched to editor mode', 'info');
}

function switchToPreview() {
  renderPreview();
  log('Switched to preview mode', 'info');
}

// Toggle chat panel (desktop)
function toggleChatPanel() {
  const chatPanel = document.getElementById('chat-panel');
  const toggleText = document.getElementById('chat-toggle-text');
  
  if (!chatPanel) return;
  
  chatPanel.classList.toggle('collapsed');
  state.chatPanelVisible = !chatPanel.classList.contains('collapsed');
  
  if (toggleText) {
    toggleText.textContent = state.chatPanelVisible ? 'Hide Chat' : 'Show Chat';
  }
  
  log(`Chat panel ${state.chatPanelVisible ? 'shown' : 'hidden'}`, 'info');
}

// Toggle chat sidebar (mobile)
function toggleSidebar() {
  const sidebar = document.getElementById('chat-panel');
  const overlay = document.getElementById('overlay');
  
  if (sidebar) sidebar.classList.toggle('active');
  if (overlay) overlay.classList.toggle('active');
}

// Console panel toggle
function toggleConsolePanel() {
  const consolePanel = document.getElementById('consolePanel');
  if (consolePanel) {
    consolePanel.classList.toggle('expanded');
  }
}

// Theme toggle
function toggleTheme() {
  const app = document.getElementById('app');
  const themeIcon = document.getElementById('themeIcon');
  
  if (!app) return;
  
  app.classList.toggle('dark-theme');
  const isDark = app.classList.contains('dark-theme');
  
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
  
  log(`Theme switched to ${isDark ? 'dark' : 'light'}`, 'info');
}

// Chat input handling
function setupChatInput() {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  
  if (!chatInput || !sendBtn) return;
  
  // Auto-resize
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
  
  // Send message
  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(message, true);
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Simulate AI response (in real app, this would call AI service)
    setTimeout(() => {
      addChatMessage('I understand your request. Let me analyze the code and provide suggestions...');
    }, 800);
  }
  
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Attach event listeners
function attachEventListeners() {
  // Header buttons
  const detectBtn = document.getElementById('detect-errors-btn');
  const fixBtn = document.getElementById('fix-btn');
  const toggleChatBtn = document.getElementById('toggle-chat');
  const debugBtn = document.getElementById('debug-log-btn');
  const themeBtn = document.getElementById('themeToggle');
  
  if (detectBtn) detectBtn.addEventListener('click', detectErrors);
  if (fixBtn) fixBtn.addEventListener('click', handleAIFix);
  if (toggleChatBtn) toggleChatBtn.addEventListener('click', toggleChatPanel);
  if (debugBtn) debugBtn.addEventListener('click', toggleDebugWindow);
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  
  // Tab buttons
  const editorTab = document.getElementById('editorTab');
  const previewTab = document.getElementById('previewTab');
  
  if (editorTab) editorTab.addEventListener('click', switchToEditor);
  if (previewTab) previewTab.addEventListener('click', switchToPreview);
  
  // Editor toolbar
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const copyBtn = document.getElementById('copy-code-btn');
  const clearBtn = document.getElementById('clear-code-btn');
  
  if (undoBtn) undoBtn.addEventListener('click', undo);
  if (redoBtn) redoBtn.addEventListener('click', redo);
  if (copyBtn) copyBtn.addEventListener('click', copyCode);
  if (clearBtn) clearBtn.addEventListener('click', clearCode);
  
  // Code editor events
  const codeEditor = document.getElementById('code-editor');
  if (codeEditor) {
    codeEditor.addEventListener('input', () => {
      updateLineNumbers();
      saveToHistory();
    });
    codeEditor.addEventListener('scroll', syncLineNumbersScroll);
  }
  
  // Diff overlay buttons
  const acceptBtn = document.getElementById('accept-fix-btn');
  const rejectBtn = document.getElementById('reject-fix-btn');
  
  if (acceptBtn) acceptBtn.addEventListener('click', acceptFix);
  if (rejectBtn) rejectBtn.addEventListener('click', rejectFix);
  
  // Chat panel
  const clearChatBtn = document.getElementById('clear-chat-btn');
  if (clearChatBtn) clearChatBtn.addEventListener('click', clearChat);
  
  // Debug window
  const copyDebugBtn = document.getElementById('copy-debug-btn');
  const clearDebugBtn = document.getElementById('clear-debug-btn');
  const closeDebugBtn = document.getElementById('close-debug-btn');
  
  if (copyDebugBtn) copyDebugBtn.addEventListener('click', copyDebugLog);
  if (clearDebugBtn) clearDebugBtn.addEventListener('click', clearDebugLog);
  if (closeDebugBtn) closeDebugBtn.addEventListener('click', toggleDebugWindow);
  
  // Console panel
  const consoleHeader = document.getElementById('consoleHeader');
  const clearConsoleBtn = document.getElementById('clear-console-btn');
  
  if (consoleHeader) consoleHeader.addEventListener('click', toggleConsolePanel);
  if (clearConsoleBtn) {
    clearConsoleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearConsole();
    });
  }
  
  // Mobile sidebar
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const overlay = document.getElementById('overlay');
  
  if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);
  
  // Setup chat input
  setupChatInput();
  
  // Show mobile menu button on small screens
  function updateMobileUI() {
    const width = window.innerWidth;
    if (menuBtn) menuBtn.style.display = width <= 1024 ? 'flex' : 'none';
    if (closeSidebarBtn) closeSidebarBtn.style.display = width <= 1024 ? 'flex' : 'none';
  }
  
  updateMobileUI();
  window.addEventListener('resize', updateMobileUI);
}

// Initialize application
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize React renderer
  await initializePreview();
  log('=== AI Code Fix Pro V3 Initialized ===', 'info');
  
  // Load API key from server
  await loadAPIKey();
  
  // Initialize editor with default code
  initializeEditor();
  
  // Attach all event listeners
  attachEventListeners();
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  log('Application ready', 'success');
  logToConsole('[OK] Application initialized successfully', 'success');
});
