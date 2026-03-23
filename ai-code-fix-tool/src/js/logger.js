// Debug logging system
import { state } from './state.js';

export function log(message, level = 'info', data = null) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, message, data };
  state.debugLog.push(entry);
  
  const logContainer = document.getElementById('debug-log');
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
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
  
  console.log(`[${level.toUpperCase()}] ${message}`, data || '');
}

export function toggleDebugPanel() {
  const panel = document.getElementById('debug-panel');
  const mainContent = document.querySelector('.main-content');
  
  panel.classList.toggle('collapsed');
  
  if (panel.classList.contains('collapsed')) {
    mainContent.classList.remove('debug-open');
    log('Debug panel collapsed', 'info');
  } else {
    mainContent.classList.add('debug-open');
    log('Debug panel expanded', 'info');
  }
}

export function clearDebugLog() {
  state.debugLog = [];
  document.getElementById('debug-log').innerHTML = '';
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
