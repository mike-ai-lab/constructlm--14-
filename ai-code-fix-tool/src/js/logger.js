// Debug logging system
import { state } from './state.js';

export function log(message, level = 'info', data = null) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, message, data };
  state.debugLog.push(entry);
  
  // DEBUG WINDOW - Commented out (not functional)
  /*
  const debugLogContainer = document.getElementById('debug-log');
  if (debugLogContainer) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const time = new Date().toLocaleTimeString();
    let html = `<span class="log-timestamp">[${time}]</span>`;
    html += `<span class="log-level ${level}">${level.toUpperCase()}</span>`;
    html += `<span class="log-message">${escapeHtml(message)}</span>`;
    
    if (data) {
      const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
      html += `<div class="log-data">${escapeHtml(dataStr)}</div>`;
    }
    
    logEntry.innerHTML = html;
    debugLogContainer.appendChild(logEntry);
    debugLogContainer.scrollTop = debugLogContainer.scrollHeight;
  }
  */
  
  console.log(`[${level.toUpperCase()}] ${message}`, data || '');
}

// Console logging (for errors only)
export function logToConsole(message, level = 'info', data = null, lineNumber = null) {
  const consoleContainer = document.getElementById('console-log');
  if (!consoleContainer) return;
  
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  
  // Make error entries clickable if they have a line number
  if (level === 'error' && lineNumber) {
    logEntry.classList.add('clickable-error');
    logEntry.style.cursor = 'pointer';
    logEntry.title = `Click to jump to line ${lineNumber}`;
    logEntry.addEventListener('click', () => {
      jumpToLine(lineNumber);
    });
  }
  
  const time = new Date().toLocaleTimeString();
  let html = `<span class="log-timestamp">[${time}]</span>`;
  html += `<span class="log-level ${level}">${level.toUpperCase()}</span>`;
  html += `<span class="log-message">${escapeHtml(message)}</span>`;
  
  if (data) {
    const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    html += `<div class="log-data">${escapeHtml(dataStr)}</div>`;
  }
  
  logEntry.innerHTML = html;
  consoleContainer.appendChild(logEntry);
  consoleContainer.scrollTop = consoleContainer.scrollHeight;
}

// Jump to a specific line in the editor
function jumpToLine(lineNumber) {
  const editor = document.getElementById('code-editor');
  if (!editor) return;
  
  const lines = editor.value.split('\n');
  if (lineNumber > lines.length || lineNumber < 1) return;
  
  // Calculate character position
  let charPosition = 0;
  for (let i = 0; i < lineNumber - 1; i++) {
    charPosition += lines[i].length + 1; // +1 for newline
  }
  
  // Focus editor and set cursor position
  editor.focus();
  editor.setSelectionRange(charPosition, charPosition + lines[lineNumber - 1].length);
  
  // Scroll to the line
  const lineHeight = 20; // matches CSS line-height
  const scrollPosition = (lineNumber - 1) * lineHeight;
  editor.scrollTop = scrollPosition - (editor.clientHeight / 2);
  
  log(`Jumped to line ${lineNumber}`, 'info');
}

export function clearConsole() {
  document.getElementById('console-log').innerHTML = '';
  logToConsole('Console cleared', 'info');
}

export function clearConsoleErrors() {
  const consoleContainer = document.getElementById('console-log');
  if (!consoleContainer) return;
  
  // Remove all error entries
  const errorEntries = consoleContainer.querySelectorAll('.log-entry .log-level.error');
  errorEntries.forEach(errorLevel => {
    const logEntry = errorLevel.closest('.log-entry');
    if (logEntry) {
      logEntry.remove();
    }
  });
  
  logToConsole('[OK] Errors cleared - fix applied', 'success');
}

export function toggleConsolePanel() {
  const panel = document.getElementById('debug-panel');
  const mainContent = document.querySelector('.main-content');
  
  panel.classList.toggle('collapsed');
  
  if (panel.classList.contains('collapsed')) {
    mainContent.classList.remove('debug-open');
  } else {
    mainContent.classList.add('debug-open');
  }
}

// DEBUG WINDOW FUNCTIONS - COMMENTED OUT (Not functional)
/*
export function toggleDebugWindow() {
  const window = document.getElementById('debug-window');
  window.classList.toggle('active');
  
  // Initialize drag functionality if not already done
  if (!window.dataset.dragInitialized) {
    makeDraggable(window);
    window.dataset.dragInitialized = 'true';
  }
}

// Make debug window draggable
function makeDraggable(element) {
  const header = element.querySelector('.debug-window-header');
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    if (e.target.tagName === 'BUTTON') return; // Don't drag when clicking buttons
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    isDragging = true;
    header.style.cursor = 'grabbing';
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, element);
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;

    isDragging = false;
    header.style.cursor = 'move';
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`;
  }
}
*/
// END DEBUG WINDOW FUNCTIONS

export function clearDebugLog() {
  state.debugLog = [];
  // document.getElementById('debug-log').innerHTML = ''; // DEBUG WINDOW - Commented out
  log('Debug log cleared', 'info');
}

export function copyDebugLog() {
  const logText = state.debugLog.map(entry => {
    let line = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    if (entry.data) {
      const dataStr = typeof entry.data === 'object' ? JSON.stringify(entry.data, null, 2) : String(entry.data);
      line += `\n${dataStr}`;
    }
    return line;
  }).join('\n\n');
  
  navigator.clipboard.writeText(logText).then(() => {
    alert('Debug log copied!');
    log('Debug log copied to clipboard', 'success');
  });
}

export function downloadDebugLog() {
  const logText = state.debugLog.map(entry => {
    let line = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    if (entry.data) {
      const dataStr = typeof entry.data === 'object' ? JSON.stringify(entry.data, null, 2) : String(entry.data);
      line += `\n${dataStr}`;
    }
    return line;
  }).join('\n\n');
  
  const blob = new Blob([logText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debug-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  log('Debug log downloaded', 'success');
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
