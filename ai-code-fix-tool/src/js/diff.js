// Diff display and management
import { state } from './state.js';
import { log, escapeHtml } from './logger.js';
import { updateLineNumbers, saveToHistory } from './editor.js';
import { addChatMessage } from './chat.js';
import { updateStatus } from './aiService.js';

export function showDiff(originalCode, suggestedCode) {
  log('Showing diff overlay', 'info');
  
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(originalCode, suggestedCode);
  dmp.diff_cleanupSemantic(diffs);
  
  const originalLines = originalCode.split('\n');
  const fixedLines = suggestedCode.split('\n');
  const maxLines = Math.max(originalLines.length, fixedLines.length);
  
  let html = '';
  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i] || '';
    const fixedLine = fixedLines[i] || '';
    
    if (origLine === fixedLine) {
      html += `<div class="diff-line unchanged">  ${escapeHtml(origLine) || ' '}</div>`;
    } else {
      if (origLine) {
        html += `<div class="diff-line removed">- ${escapeHtml(origLine)}</div>`;
      }
      if (fixedLine) {
        html += `<div class="diff-line added">+ ${escapeHtml(fixedLine)}</div>`;
      }
    }
  }
  
  document.getElementById('diff-content').innerHTML = html;
  document.getElementById('diff-overlay').classList.add('active');
  
  log('Diff displayed', 'success', { 
    originalLines: originalLines.length,
    fixedLines: fixedLines.length
  });
}

export function acceptFix() {
  log('=== ACCEPT FIX ===', 'info');
  log('Applying fixed code:', 'info', state.suggestedCode);
  
  document.getElementById('code-editor').value = state.suggestedCode;
  state.originalCode = state.suggestedCode;
  updateLineNumbers();
  saveToHistory();
  
  document.getElementById('diff-overlay').classList.remove('active');
  document.getElementById('error-display').innerHTML = '';
  
  updateStatus('Applied', 'success');
  addChatMessage('✓ Fix accepted and applied!');
  
  state.errors = [];
  state.suggestedCode = '';
  
  log('Fix accepted and applied successfully', 'success');
}

export function rejectFix() {
  log('=== REJECT FIX ===', 'info');
  
  document.getElementById('diff-overlay').classList.remove('active');
  updateStatus('Rejected', 'error');
  addChatMessage('Fix rejected. Original code unchanged.');
  
  state.suggestedCode = '';
  
  log('Fix rejected', 'info');
}
