// Main application entry point - MODERN INTERFACE WITH MONACO
import { state, loadAPIKey } from './state.js';
// import { log, toggleDebugWindow, clearDebugLog, copyDebugLog } from './logger.js'; // DEBUG WINDOW - Commented out
import { log } from './logger.js';
import { initializeMonaco, getEditorValue, setEditorValue, setEditorTheme, goToLine } from './monacoEditor.js';
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
import { addChatMessage, clearChat } from './chat.js';
import { startAIFix, updateStatus } from './aiService.js';
import { acceptFix, rejectFix, acceptAllChanges, rejectAllChanges } from './diff.js';
import { renderPreview, clearPreview, initializePreview } from './preview.js';

// Console log function - VS Code style Problems panel
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

// Display errors in VS Code style Problems panel
function displayErrorsInConsole(errors) {
  const consoleLog = document.getElementById('console-log');
  if (!consoleLog) return;
  
  consoleLog.innerHTML = '';
  
  if (errors.length === 0) {
    consoleLog.innerHTML = '<div style="opacity: 0.6; color: #34d399;">[✓] No problems found</div>';
    return;
  }
  
  errors.forEach((err, index) => {
    const errorEntry = document.createElement('div');
    errorEntry.style.cssText = `
      padding: 6px 8px;
      margin-bottom: 2px;
      cursor: pointer;
      border-left: 3px solid #ef4444;
      background: rgba(239, 68, 68, 0.1);
      font-size: 11px;
      line-height: 1.4;
      transition: background 0.2s;
    `;
    
    errorEntry.innerHTML = `
      <div style="display: flex; align-items: start; gap: 8px;">
        <span style="color: #ef4444; font-weight: bold; flex-shrink: 0;">✗</span>
        <div style="flex: 1;">
          <div style="color: #f87171; font-weight: 500;">Line ${err.line}:${err.column}</div>
          <div style="color: #d1d5db; margin-top: 2px;">${err.message.split('\n')[0]}</div>
        </div>
      </div>
    `;
    
    // Click to navigate to error line
    errorEntry.addEventListener('click', () => {
      goToLine(err.line);
      errorEntry.style.background = 'rgba(239, 68, 68, 0.2)';
      setTimeout(() => {
        errorEntry.style.background = 'rgba(239, 68, 68, 0.1)';
      }, 300);
    });
    
    errorEntry.addEventListener('mouseenter', () => {
      errorEntry.style.background = 'rgba(239, 68, 68, 0.15)';
    });
    
    errorEntry.addEventListener('mouseleave', () => {
      errorEntry.style.background = 'rgba(239, 68, 68, 0.1)';
    });
    
    consoleLog.appendChild(errorEntry);
  });
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
  
  const code = getEditorValue();
  state.originalCode = code;
  
  log('Code analysis', 'debug', { 
    chars: code.length, 
    lines: code.split('\n').length 
  });
  
  updateStatus('Analyzing...', 'processing');
  
  const errors = detectAllErrors(code);
  state.errors = errors;
  
  log('Analysis complete', 'success', { errorsFound: errors.length });
  
  if (errors.length === 0) {
    updateStatus('Valid', 'success');
    displayErrorsInConsole([]);
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
    
    // Display in VS Code style console
    displayErrorsInConsole(errors);
    displayErrors(errors);
    document.getElementById('fix-btn').disabled = false;
  }
  
  log('=== DETECT ERRORS COMPLETED ===', 'info');
}

// Auto-detect errors (called from Monaco editor)
window.autoDetectErrorsCallback = function() {
  detectErrors();
};

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

// Render React component preview
async function renderReactPreview() {
  const code = getEditorValue();
  const previewIframe = document.getElementById('preview-iframe');
  
  if (!code.trim()) {
    logToConsole('[Preview] No code to render', 'warning');
    return;
  }
  
  try {
    logToConsole('[Preview] Compiling React component...', 'info');
    
    // Initialize renderer if needed
    await initializePreview();
    
    // Get the renderer instance from preview module
    const { getRenderer } = await import('./preview.js');
    const renderer = getRenderer();
    
    if (!renderer) {
      throw new Error('React renderer not initialized');
    }
    
    // Render to iframe
    await renderer.renderToIframe(previewIframe, code);
    
    logToConsole('[Preview] React component rendered successfully', 'success');
    log('React component rendered', 'success');
  } catch (error) {
    logToConsole('[Preview] Error: ' + error.message, 'error');
    log('Preview render failed', 'error', error.message);
    
    // Show error in iframe
    previewIframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: monospace;
            background: #1f2937;
            color: white;
          }
          .error-title {
            color: #ef4444;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .error-content {
            background: #111827;
            padding: 15px;
            border-left: 4px solid #ef4444;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="error-title">Preview Error</div>
        <div class="error-content">${error.message}</div>
      </body>
      </html>
    `;
  }
}

function switchToPreview() {
  const editorTab = document.getElementById('editorTab');
  const previewTab = document.getElementById('previewTab');
  const codeViewport = document.getElementById('codeViewport');
  const previewIframe = document.getElementById('preview-iframe');
  
  if (editorTab) editorTab.classList.remove('active');
  if (previewTab) previewTab.classList.add('active');
  if (codeViewport) codeViewport.style.display = 'none';
  if (previewIframe) previewIframe.style.display = 'block';
  
  // Render preview - use React renderer for React components
  const code = getEditorValue();
  if (code.trim()) {
    // Check if it's a React component (contains import React or JSX)
    const isReactComponent = code.includes('import React') || 
                            code.includes('from "react"') || 
                            code.includes('from \'react\'') ||
                            code.includes('useState') ||
                            code.includes('useEffect') ||
                            code.includes('className=') ||
                            code.includes('<div') ||
                            code.includes('export default');
    
    if (isReactComponent) {
      // Use React renderer
      renderReactPreview();
    } else {
      // Plain HTML - use srcdoc
      try {
        previewIframe.srcdoc = code;
        logToConsole('[Preview] HTML rendered successfully', 'success');
      } catch (error) {
        logToConsole('[Preview] Error: ' + error.message, 'error');
      }
    }
  } else {
    previewIframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 40px;
            font-family: system-ui, sans-serif;
            background: #f8fafc;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div>Paste your code in the editor and click Preview</div>
      </body>
      </html>
    `;
  }
  
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
  
  // Update Monaco theme
  setEditorTheme(isDark);
  
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
  // const debugBtn = document.getElementById('debug-log-btn'); // DEBUG WINDOW - Commented out
  const themeBtn = document.getElementById('themeToggle');
  
  if (detectBtn) detectBtn.addEventListener('click', detectErrors);
  if (fixBtn) fixBtn.addEventListener('click', handleAIFix);
  if (toggleChatBtn) toggleChatBtn.addEventListener('click', toggleChatPanel);
  // if (debugBtn) debugBtn.addEventListener('click', toggleDebugWindow); // DEBUG WINDOW - Commented out
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
  
  // Batch diff actions
  const acceptAllBtn = document.getElementById('accept-all-btn');
  const rejectAllBtn = document.getElementById('reject-all-btn');
  
  if (acceptAllBtn) acceptAllBtn.addEventListener('click', acceptAllChanges);
  if (rejectAllBtn) rejectAllBtn.addEventListener('click', rejectAllChanges);
  
  // Monaco handles its own input events - no need to attach here
  
  // Chat panel
  const clearChatBtn = document.getElementById('clear-chat-btn');
  if (clearChatBtn) clearChatBtn.addEventListener('click', clearChat);
  
  // DEBUG WINDOW - Commented out (not functional)
  /*
  const copyDebugBtn = document.getElementById('copy-debug-btn');
  const clearDebugBtn = document.getElementById('clear-debug-btn');
  const closeDebugBtn = document.getElementById('close-debug-btn');
  
  if (copyDebugBtn) copyDebugBtn.addEventListener('click', copyDebugLog);
  if (clearDebugBtn) clearDebugBtn.addEventListener('click', clearDebugLog);
  if (closeDebugBtn) closeDebugBtn.addEventListener('click', toggleDebugWindow);
  */
  
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
  // Initialize Monaco Editor first
  await initializeMonaco();
  log('Monaco Editor loaded', 'success');
  
  // Initialize React renderer
  await initializePreview();
  log('=== AI Code Fix Pro V3 Initialized ===', 'info');
  
  // Load API key from server
  await loadAPIKey();
  
  // Initialize editor with default code (Monaco already has content)
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
