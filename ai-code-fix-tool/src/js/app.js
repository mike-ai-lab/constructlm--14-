// Main application entry point - MODERN INTERFACE WITH MONACO
import { state, loadAPIKeys } from './state.js';
// import { log, toggleDebugWindow, clearDebugLog, copyDebugLog } from './logger.js'; // DEBUG WINDOW - Commented out
import { log } from './logger.js';
import { initializeMonaco, getEditorValue, setEditorValue, setEditorTheme, goToLine, setAutoRun, getAutoRun, setAutoRunCallback, setEditorMarkers } from './monacoEditor.js';
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
import { openSettings, closeSettings, initializeProviderBadge } from './settings.js';
import { initializeModelSelector, updateModelBadge } from './modelSelector.js';

// Debug history storage
let debugHistory = [];
let currentConsoleTab = 'problems'; // 'problems' or 'debug'
let currentWorkflowId = null; // Track current workflow for grouping

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
    consoleLog.innerHTML = '<div style="opacity: 0.6; color: #34d399;">[OK] No problems found</div>';
    return;
  }
  
  // Add header with count
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 8px;
    margin-bottom: 8px;
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid #ef4444;
    font-weight: 700;
    font-size: 11px;
    color: #f87171;
  `;
  header.textContent = `[ERR] Found ${errors.length} problem${errors.length > 1 ? 's' : ''}`;
  consoleLog.appendChild(header);
  
  errors.forEach((err, index) => {
    const errorEntry = document.createElement('div');
    errorEntry.style.cssText = `
      padding: 6px 8px 6px 20px;
      margin-bottom: 2px;
      cursor: pointer;
      border-left: 3px solid #ef4444;
      background: rgba(239, 68, 68, 0.05);
      font-size: 11px;
      line-height: 1.4;
      transition: background 0.2s;
      position: relative;
    `;
    
    // Add tree connector
    errorEntry.innerHTML = `
      <div style="
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 20px;
        display: flex;
        align-items: center;
      ">
        <div style="
          width: 12px;
          height: 1px;
          background: rgba(239, 68, 68, 0.3);
          margin-left: 3px;
        "></div>
      </div>
      <div style="display: flex; align-items: start; gap: 8px;">
        <span style="color: #ef4444; font-weight: bold; flex-shrink: 0; font-family: monospace;">[${index + 1}]</span>
        <div style="flex: 1;">
          <div style="color: #f87171; font-weight: 500; margin-bottom: 2px;">Line ${err.line}:${err.column}</div>
          <div style="color: #d1d5db; font-size: 10px;">${err.message.split('\n')[0]}</div>
        </div>
      </div>
    `;
    
    // Click to navigate to error line and column
    errorEntry.addEventListener('click', () => {
      goToLine(err.line, err.column);
      errorEntry.style.background = 'rgba(239, 68, 68, 0.2)';
      setTimeout(() => {
        errorEntry.style.background = 'rgba(239, 68, 68, 0.05)';
      }, 300);
    });
    
    errorEntry.addEventListener('mouseenter', () => {
      errorEntry.style.background = 'rgba(239, 68, 68, 0.15)';
    });
    
    errorEntry.addEventListener('mouseleave', () => {
      errorEntry.style.background = 'rgba(239, 68, 68, 0.05)';
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

// Add debug log entry
function addDebugLog(action, details, status = 'info', level = 0) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = {
    time: timestamp,
    action: action,
    details: details,
    status: status, // 'info', 'success', 'error', 'warning'
    level: level, // 0 = root, 1 = child, 2 = grandchild
    workflowId: currentWorkflowId
  };
  
  debugHistory.push(entry);
  
  // Update debug log display if it's the active tab
  if (currentConsoleTab === 'debug') {
    displayDebugLogs();
  }
}

// Start a new workflow (creates a visual break)
function startWorkflow(workflowName) {
  currentWorkflowId = Date.now();
  addDebugLog(workflowName, 'Workflow started', 'info', 0);
}

// End current workflow
function endWorkflow(workflowName, success = true) {
  if (currentWorkflowId) {
    addDebugLog(workflowName, 'Workflow completed', success ? 'success' : 'error', 0);
    currentWorkflowId = null;
  }
}

// Display debug logs
function displayDebugLogs() {
  const debugLog = document.getElementById('debug-log');
  if (!debugLog) return;
  
  if (debugHistory.length === 0) {
    debugLog.innerHTML = '<div style="opacity: 0.6; color: #9ca3af;">No debug logs yet</div>';
    return;
  }
  
  debugLog.innerHTML = '';
  
  let lastWorkflowId = null;
  
  debugHistory.forEach((entry, index) => {
    // Add visual break between workflows
    if (entry.workflowId !== lastWorkflowId && lastWorkflowId !== null) {
      const separator = document.createElement('div');
      separator.style.cssText = `
        height: 1px;
        background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
        margin: 12px 0;
      `;
      debugLog.appendChild(separator);
    }
    lastWorkflowId = entry.workflowId;
    
    const logEntry = document.createElement('div');
    const indent = entry.level * 20;
    const isRoot = entry.level === 0;
    
    logEntry.style.cssText = `
      margin-bottom: ${isRoot ? '8px' : '4px'};
      margin-left: ${indent}px;
      padding: ${isRoot ? '10px' : '6px'} 10px;
      background: ${isRoot ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'};
      border-radius: 4px;
      border-left: 3px solid ${getStatusColor(entry.status)};
      position: relative;
    `;
    
    // Add tree connector for child items
    let treeConnector = '';
    if (entry.level > 0) {
      treeConnector = `
        <div style="
          position: absolute;
          left: -${indent}px;
          top: 0;
          bottom: 0;
          width: ${indent}px;
          display: flex;
          align-items: center;
        ">
          <div style="
            width: 100%;
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
            margin-left: 10px;
          "></div>
        </div>
      `;
    }
    
    const statusSymbol = getStatusSymbol(entry.status);
    const statusColor = getStatusColor(entry.status);
    
    logEntry.innerHTML = `
      ${treeConnector}
      <div style="display: flex; align-items: start; gap: 8px;">
        <span style="color: ${statusColor}; font-weight: bold; flex-shrink: 0; font-family: monospace;">${statusSymbol}</span>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: #e5e7eb; font-weight: ${isRoot ? '700' : '500'}; font-size: ${isRoot ? '12px' : '11px'};">${entry.action}</span>
            <span style="color: #6b7280; font-size: 9px; font-family: monospace;">${entry.time}</span>
          </div>
          ${entry.details ? `
            <div style="color: #9ca3af; font-size: 10px; line-height: 1.5; font-family: 'JetBrains Mono', monospace;">
              ${formatDetails(entry.details)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    debugLog.appendChild(logEntry);
  });
  
  debugLog.scrollTop = debugLog.scrollHeight;
}

function formatDetails(details) {
  if (typeof details === 'object') {
    return '<pre style="margin: 4px 0 0 0; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; overflow-x: auto;">' + 
           JSON.stringify(details, null, 2) + 
           '</pre>';
  }
  return details;
}

function getStatusSymbol(status) {
  switch(status) {
    case 'success': return '[OK]';
    case 'error': return '[ERR]';
    case 'warning': return '[WARN]';
    default: return '[INFO]';
  }
}

function getStatusColor(status) {
  switch(status) {
    case 'success': return '#34d399';
    case 'error': return '#ef4444';
    case 'warning': return '#fbbf24';
    default: return '#60a5fa';
  }
}

// Clear debug logs
function clearDebugLogs() {
  debugHistory = [];
  currentWorkflowId = null;
  displayDebugLogs();
}

// Copy debug logs to clipboard
function copyDebugLogs() {
  if (debugHistory.length === 0) {
    return;
  }
  
  let text = '========================================\n';
  text += 'DEBUG LOG HISTORY\n';
  text += '========================================\n\n';
  
  let lastWorkflowId = null;
  
  debugHistory.forEach((entry, index) => {
    if (entry.workflowId !== lastWorkflowId && lastWorkflowId !== null) {
      text += '\n' + '='.repeat(50) + '\n\n';
    }
    lastWorkflowId = entry.workflowId;
    
    const indent = '  '.repeat(entry.level);
    text += `${indent}[${entry.time}] ${entry.status.toUpperCase()}: ${entry.action}\n`;
    if (entry.details) {
      const detailsStr = typeof entry.details === 'object' ? 
        JSON.stringify(entry.details, null, 2) : 
        entry.details;
      text += `${indent}  ${detailsStr}\n`;
    }
    text += '\n';
  });
  
  navigator.clipboard.writeText(text);
}

// Switch console tabs
function switchConsoleTab(tab) {
  currentConsoleTab = tab;
  
  const problemsTab = document.getElementById('problems-tab');
  const debugTab = document.getElementById('debug-tab');
  const consoleLog = document.getElementById('console-log');
  const debugLog = document.getElementById('debug-log');
  const copyDebugBtn = document.getElementById('copy-debug-btn');
  
  if (tab === 'problems') {
    problemsTab?.classList.add('active');
    debugTab?.classList.remove('active');
    if (consoleLog) consoleLog.style.display = 'block';
    if (debugLog) debugLog.style.display = 'none';
    if (copyDebugBtn) copyDebugBtn.style.display = 'none';
  } else {
    problemsTab?.classList.remove('active');
    debugTab?.classList.add('active');
    if (consoleLog) consoleLog.style.display = 'none';
    if (debugLog) debugLog.style.display = 'block';
    if (copyDebugBtn) copyDebugBtn.style.display = 'flex';
    displayDebugLogs();
  }
}

// Main error detection function
function detectErrors() {
  startWorkflow('ERROR DETECTION');
  log('=== DETECT ERRORS STARTED ===', 'info');
  
  const code = getEditorValue();
  state.originalCode = code;
  
  addDebugLog('Code Analysis', `${code.length} chars, ${code.split('\n').length} lines`, 'info', 1);
  
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
    setEditorMarkers([]);
    const panelFixBtn = document.getElementById('panel-fix-btn');
    if (panelFixBtn) panelFixBtn.style.display = 'none';
    log('Code is valid', 'success');
    addDebugLog('Validation Result', 'Code is valid - no errors found', 'success', 1);
    endWorkflow('ERROR DETECTION', true);
  } else {
    updateStatus(`${errors.length} Error(s)`, 'error');
    
    log('Errors detected', 'error', errors.map(e => ({
      line: e.line,
      column: e.column,
      message: e.message.split('\n')[0]
    })));
    
    addDebugLog('Validation Result', `Found ${errors.length} error(s)`, 'error', 1);
    
    // Log each error as a child
    errors.slice(0, 3).forEach((err, idx) => {
      addDebugLog(`Error ${idx + 1}`, `Line ${err.line}:${err.column} - ${err.message.split('\n')[0].substring(0, 60)}...`, 'error', 2);
    });
    
    if (errors.length > 3) {
      addDebugLog('Additional Errors', `${errors.length - 3} more error(s) not shown`, 'warning', 2);
    }
    
    // Display in VS Code style console
    displayErrorsInConsole(errors);
    displayErrors(errors);
    setEditorMarkers(errors);
    const panelFixBtn = document.getElementById('panel-fix-btn');
    if (panelFixBtn) panelFixBtn.style.display = 'flex';
    endWorkflow('ERROR DETECTION', false);
  }
  
  log('=== DETECT ERRORS COMPLETED ===', 'info');
}

// Auto-detect errors (called from Monaco editor)
window.autoDetectErrorsCallback = function() {
  detectErrors();
};

// Main AI fix function
async function handleAIFix() {
  const fixBtn = document.getElementById('panel-fix-btn');
  
  // If no errors detected yet, detect them first
  if (state.errors.length === 0) {
    detectErrors();
    // Wait a bit for detection to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // If still no errors, show message
    if (state.errors.length === 0) {
      alert('No errors detected! Your code is valid.');
      return;
    }
  }
  
  if (fixBtn) fixBtn.disabled = true;
  
  startWorkflow('AI FIX');
  addDebugLog('AI Fix Request', `Attempting to fix ${state.errors.length} error(s)`, 'info', 1);
  
  // Ensure API keys are loaded
  const currentApiKey = state.apiKeys[state.selectedProvider];
  if (!currentApiKey && state.selectedProvider !== 'ollama') {
    addDebugLog('API Key Check', 'Loading API keys...', 'info', 2);
    await loadAPIKeys();
  } else {
    addDebugLog('API Key Check', 'API key already loaded', 'success', 2);
  }
  
  try {
    await startAIFix(state.errors, state.originalCode);
    addDebugLog('AI Response', 'Successfully received AI suggestions', 'success', 1);
    endWorkflow('AI FIX', true);
  } catch (error) {
    addDebugLog('AI Response', error.message, 'error', 1);
    endWorkflow('AI FIX', false);
  }
  
  if (fixBtn) fixBtn.disabled = false;
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

// Auto-run preview update (called from Monaco editor)
function autoUpdatePreview() {
  const previewTab = document.getElementById('previewTab');
  const isPreviewActive = previewTab && previewTab.classList.contains('active');
  
  // Only auto-update if preview tab is active
  if (isPreviewActive) {
    renderReactPreview();
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
  const app = document.getElementById('app');
  
  if (!chatPanel) return;
  
  chatPanel.classList.toggle('collapsed');
  state.chatPanelVisible = !chatPanel.classList.contains('collapsed');
  
  if (app) {
    if (state.chatPanelVisible) {
      app.classList.add('sidebar-active');
    } else {
      app.classList.remove('sidebar-active');
    }
  }
  
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
  // Header and Global buttons
  const panelFixBtn = document.getElementById('panel-fix-btn');
  const toggleChatBtn = document.getElementById('toggle-chat');
  const settingsBtn = document.getElementById('settings-btn');
  const themeBtn = document.getElementById('themeToggle');
  const autoRunToggle = document.getElementById('auto-run-toggle');
  
  if (panelFixBtn) panelFixBtn.addEventListener('click', handleAIFix);
  if (toggleChatBtn) toggleChatBtn.addEventListener('click', toggleChatPanel);
  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  if (toggleChatBtn) toggleChatBtn.addEventListener('click', toggleChatPanel);
  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  // if (debugBtn) debugBtn.addEventListener('click', toggleDebugWindow); // DEBUG WINDOW - Commented out
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  
  // Auto-run toggle
  if (autoRunToggle) {
    autoRunToggle.addEventListener('change', (e) => {
      setAutoRun(e.target.checked);
      addDebugLog('Auto-Run', e.target.checked ? 'Enabled' : 'Disabled', 'info', 1);
    });
  }
  
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
  const copyDebugBtn = document.getElementById('copy-debug-btn');
  const problemsTab = document.getElementById('problems-tab');
  const debugTab = document.getElementById('debug-tab');
  
  if (consoleHeader) consoleHeader.addEventListener('click', toggleConsolePanel);
  if (clearConsoleBtn) {
    clearConsoleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentConsoleTab === 'problems') {
        clearConsole();
      } else {
        clearDebugLogs();
      }
    });
  }
  if (copyDebugBtn) {
    copyDebugBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyDebugLogs();
    });
  }
  if (problemsTab) {
    problemsTab.addEventListener('click', (e) => {
      e.stopPropagation();
      switchConsoleTab('problems');
    });
  }
  if (debugTab) {
    debugTab.addEventListener('click', (e) => {
      e.stopPropagation();
      switchConsoleTab('debug');
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
  startWorkflow('APPLICATION INITIALIZATION');
  
  // Initialize Monaco Editor first
  addDebugLog('Monaco Editor', 'Loading editor...', 'info', 1);
  await initializeMonaco();
  log('Monaco Editor loaded', 'success');
  addDebugLog('Monaco Editor', 'Editor loaded successfully', 'success', 1);
  
  // Set up auto-run callback for preview updates
  setAutoRunCallback(autoUpdatePreview);
  addDebugLog('Auto-Run', 'Preview auto-update configured', 'success', 1);
  
  // Initialize React renderer
  addDebugLog('React Renderer', 'Initializing preview system...', 'info', 1);
  await initializePreview();
  log('=== AI Code Fix Pro V3 Initialized ===', 'info');
  addDebugLog('React Renderer', 'Preview system ready', 'success', 1);
  
  // Load API key from server
  addDebugLog('API Configuration', 'Loading API keys...', 'info', 1);
  await loadAPIKeys();
  const hasAnyKey = Object.values(state.apiKeys).some(key => key);
  addDebugLog('API Configuration', hasAnyKey ? 'API keys loaded' : 'No API keys found', hasAnyKey ? 'success' : 'warning', 1);
  
  // Initialize provider badge
  initializeProviderBadge();
  
  // Initialize model selector dropdown
  initializeModelSelector();
  
  // Initialize editor with default code (Monaco already has content)
  addDebugLog('Editor Setup', 'Initializing editor state...', 'info', 1);
  initializeEditor();
  addDebugLog('Editor Setup', 'Editor ready', 'success', 1);
  
  // Attach all event listeners
  addDebugLog('Event Listeners', 'Attaching event handlers...', 'info', 1);
  attachEventListeners();
  addDebugLog('Event Listeners', 'All handlers attached', 'success', 1);
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Expose for Monaco hover commands
  window.autoAIContextFix = handleAIFix;
  
  log('Application ready', 'success');
  endWorkflow('APPLICATION INITIALIZATION', true);
  logToConsole('[OK] Application initialized successfully', 'success');
});
