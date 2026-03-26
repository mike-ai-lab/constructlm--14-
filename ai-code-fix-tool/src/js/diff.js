/**
 * Diff & Review management for Monaco Editor
 * Simplified, robust implementation centered around immediate code application
 * to ensure regular validation and preview pipelines work naturally.
 */
import { state } from './state.js';
import { log, clearConsoleErrors } from './logger.js';
import { saveToHistory } from './editor.js';
import { getMonacoEditor, setEditorValue } from './monacoEditor.js';
import { addChatMessage } from './chat.js';
import { updateStatus } from './aiService.js';

// Track diff state
let diffDecorations = [];
let originalCodeBackup = '';
let currentDiffResult = null;

/**
 * Show visual changes directly in the Monaco editor.
 * THE EDITOR VALUE IS UPDATED IMMEDIATELY to 'fixedCode' so that the validation 
 * pipeline (errors/preview) runs on the FINAL state naturally.
 */
export function showDiff(originalCode, fixedCode) {
  log('=== APPLYING AI SUGGESTION ===', 'info');
  
  const editor = getMonacoEditor();
  if (!editor) {
    log('Monaco editor not available', 'error');
    return;
  }
  
  // Backup original code for potential restoration (Discard)
  originalCodeBackup = originalCode;
  
  // 1. UPDATE VALUE IMMEDIATELY (Satisfies the user's re-evaluation requirement)
  setEditorValue(fixedCode);
  
  // 2. CHECK AUTO-ACCEPT
  const autoAcceptToggle = document.getElementById('auto-accept-toggle');
  if (autoAcceptToggle && autoAcceptToggle.checked) {
    log('Auto-accept enabled - finalized immediately', 'info');
    finalizeAppliedFix(fixedCode);
    return;
  }
  
  // 3. START REVIEW MODE (Non-auto-accept)
  clearDiff();
  
  // Use DiffMatchPatch to identify changed lines
  try {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(originalCode, fixedCode);
    dmp.diff_cleanupSemantic(diffs);
    
    const decorations = [];
    const fixedLines = fixedCode.split('\n');
    const originalLines = originalCode.split('\n');
    let changeCount = 0;
    
    // Simple line-based highlighting of new/modified content
    for (let i = 0; i < fixedLines.length; i++) {
        const line = fixedLines[i].trim();
        if (line && originalLines.indexOf(fixedLines[i]) === -1) {
            decorations.push({
                range: new monaco.Range(i + 1, 1, i + 1, 1),
                options: {
                    isWholeLine: true,
                    className: 'diff-line-added',
                    glyphMarginClassName: 'diff-glyph-added',
                    hoverMessage: { value: 'AI Suggested addition/change' }
                }
            });
            changeCount++;
        }
    }
    
    diffDecorations = editor.deltaDecorations([], decorations);
    showBatchActions(changeCount);
    
    log('AI suggestion highlights applied', 'success', { changes: changeCount });
    updateStatus('Fix Applied (Review)', 'processing');

  } catch (err) {
    log('Error highlighting diffs', 'error', err.message);
    // Even if highlighting fails, we kept the code in the editor as requested
  }
}

/**
 * Internal helper to finalize the applied state
 */
function finalizeAppliedFix(fixedCode) {
    state.originalCode = fixedCode;
    state.suggestedCode = '';
    saveToHistory();
    clearConsoleErrors();
    updateStatus('Applied', 'success');
    addChatMessage('[OK] Fix applied and finalized!');
    state.errors = [];
    clearDiff();
}

/**
 * Hide batch action buttons
 */
function hideBatchActions() {
  const batchActions = document.getElementById('diff-batch-actions');
  if (batchActions) batchActions.style.display = 'none';
}

/**
 * Show batch action buttons
 */
function showBatchActions(changeCount) {
  const batchActions = document.getElementById('diff-batch-actions');
  const diffCount = document.getElementById('diff-count');
  
  if (batchActions && diffCount) {
    diffCount.textContent = `${changeCount} change${changeCount !== 1 ? 's' : ''}`;
    batchActions.style.display = 'flex';
  }
}

/**
 * Accept the fix permanently (Clear highlights)
 */
export function acceptAllChanges() {
    log('=== ACCEPT FIX ===', 'info');
    const editor = getMonacoEditor();
    if (!editor) return;
    
    finalizeAppliedFix(editor.getValue());
    hideBatchActions();
}

/**
 * Discard the fix and go back to original
 */
export function rejectAllChanges() {
    log('=== REJECT FIX ===', 'info');
    setEditorValue(originalCodeBackup);
    
    clearDiff();
    hideBatchActions();
    
    updateStatus('Discarded', 'error');
    addChatMessage('AI changes discarded. Reverted to original code.');
    state.suggestedCode = '';
}

/**
 * Clear all diff markers and decorations
 */
export function clearDiff() {
    const editor = getMonacoEditor();
    if (!editor) return;
    
    if (diffDecorations.length > 0) {
        editor.deltaDecorations(diffDecorations, []);
        diffDecorations = [];
    }
}

// Aliases for backward compatibility
export const acceptFix = acceptAllChanges;
export const rejectFix = rejectAllChanges;
