// Inline diff display using Monaco Editor - GitHub Style (matching mockup.tsx)
import { state } from './state.js';
import { log, clearConsoleErrors } from './logger.js';
import { saveToHistory } from './editor.js';
import { getMonacoEditor, setEditorValue } from './monacoEditor.js';
import { addChatMessage } from './chat.js';
import { updateStatus } from './aiService.js';

// Track diff state
let diffDecorations = [];
let diffWidgets = [];
let diffZones = [];
let diffChanges = [];
let originalCodeBackup = '';

/**
 * Show inline diff directly in Monaco editor (GitHub style with both old and new lines)
 */
export function showDiff(originalCode, fixedCode) {
  log('=== INLINE DIFF STARTED ===', 'info');
  
  const editor = getMonacoEditor();
  if (!editor) {
    log('Monaco editor not available', 'error');
    return;
  }
  
  // Check if auto-accept is enabled
  const autoAcceptToggle = document.getElementById('auto-accept-toggle');
  if (autoAcceptToggle && autoAcceptToggle.checked) {
    log('Auto-accept enabled - applying fixes immediately', 'info');
    setEditorValue(fixedCode);
    state.originalCode = fixedCode;
    state.suggestedCode = '';
    saveToHistory();
    clearConsoleErrors();
    updateStatus('Auto-Applied', 'success');
    addChatMessage('[OK] Fixes auto-accepted and applied!');
    state.errors = [];
    return;
  }
  
  // Clear previous diff
  clearDiff();
  
  // Backup original code
  originalCodeBackup = originalCode;
  
  // Replace editor content with a merged view showing both old and new lines
  const mergedContent = createMergedDiffView(originalCode, fixedCode);
  
  // Set the merged content
  editor.setValue(mergedContent.text);
  
  // Store diff changes for later
  diffChanges = mergedContent.changes;
  
  log('Diff changes calculated', 'info', { changes: diffChanges.length });
  
  // Show batch action buttons
  showBatchActions(diffChanges.length);
  
  // Apply decorations for visual styling
  const decorations = [];
  
  diffChanges.forEach((change, index) => {
    // Red background for removed lines (old code)
    if (change.oldLine) {
      decorations.push({
        range: new monaco.Range(change.oldLine, 1, change.oldLine, 1),
        options: {
          isWholeLine: true,
          className: 'diff-line-removed',
          glyphMarginClassName: 'diff-glyph-removed'
        }
      });
    }
    
    // Green background for added lines (new code)
    if (change.newLine) {
      decorations.push({
        range: new monaco.Range(change.newLine, 1, change.newLine, 1),
        options: {
          isWholeLine: true,
          className: 'diff-line-added',
          glyphMarginClassName: 'diff-glyph-added'
        }
      });
      
      // Add action buttons widget on the green line
      const widget = createDiffActionWidget(editor, change.newLine, index);
      diffWidgets.push(widget);
    }
  });
  
  diffDecorations = editor.deltaDecorations([], decorations);
  
  // Make editor read-only during diff
  editor.updateOptions({ readOnly: true });
  
  log('Inline diff displayed', 'success', { 
    decorations: decorations.length, 
    widgets: diffWidgets.length,
    changes: diffChanges.length 
  });
}

/**
 * Create merged view with both old (red) and new (green) lines
 */
function createMergedDiffView(originalCode, fixedCode) {
  const originalLines = originalCode.split('\n');
  const fixedLines = fixedCode.split('\n');
  
  const mergedLines = [];
  const changes = [];
  let currentLine = 1;
  
  const maxLines = Math.max(originalLines.length, fixedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i];
    const fixedLine = fixedLines[i];
    
    if (origLine === fixedLine) {
      // Unchanged line
      mergedLines.push(origLine || '');
      currentLine++;
    } else {
      // Changed line - show BOTH old and new
      const oldLineNum = currentLine;
      const newLineNum = currentLine + 1;
      
      // Add old line (red)
      mergedLines.push(origLine || '');
      currentLine++;
      
      // Add new line (green)
      mergedLines.push(fixedLine || '');
      currentLine++;
      
      // Track this change
      changes.push({
        index: changes.length,
        oldLine: oldLineNum,
        newLine: newLineNum,
        oldContent: origLine || '',
        newContent: fixedLine || '',
        originalIndex: i
      });
    }
  }
  
  return {
    text: mergedLines.join('\n'),
    changes
  };
}


/**
 * Create inline action widget with Accept/Reject buttons (positioned on right side)
 */
function createDiffActionWidget(editor, lineNumber, changeIndex) {
  const domNode = document.createElement('div');
  domNode.className = 'diff-action-widget';
  domNode.innerHTML = `
    <div class="diff-actions-inline">
      <button class="diff-btn diff-btn-accept" data-index="${changeIndex}" title="Accept change">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
      <button class="diff-btn diff-btn-reject" data-index="${changeIndex}" title="Reject change">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;
  
  // Attach event listeners
  domNode.querySelector('.diff-btn-accept').addEventListener('click', () => acceptChange(changeIndex));
  domNode.querySelector('.diff-btn-reject').addEventListener('click', () => rejectChange(changeIndex));
  
  const widget = {
    domNode,
    getId: () => `diff.action.${lineNumber}.${changeIndex}`,
    getDomNode: () => domNode,
    getPosition: () => {
      // Position at the end of the line content, within visible viewport
      const model = editor.getModel();
      const lineContent = model.getLineContent(lineNumber);
      const column = lineContent.length + 1;
      
      return {
        position: { lineNumber, column },
        preference: [
          monaco.editor.ContentWidgetPositionPreference.EXACT
        ]
      };
    }
  };
  
  editor.addContentWidget(widget);
  return widget;
}

/**
 * Accept a specific change (remove old line, keep new line)
 */
function acceptChange(changeIndex) {
  log(`Accepting change ${changeIndex}`, 'info');
  
  const change = diffChanges[changeIndex];
  if (!change) return;
  
  const editor = getMonacoEditor();
  const model = editor.getModel();
  
  // Remove the old (red) line
  if (change.oldLine) {
    const range = new monaco.Range(change.oldLine, 1, change.oldLine + 1, 1);
    model.pushEditOperations([], [{
      range,
      text: ''
    }], () => null);
  }
  
  // Update line numbers for remaining changes
  diffChanges = diffChanges.filter((c, i) => i !== changeIndex).map(c => {
    if (c.oldLine > change.oldLine) {
      return { ...c, oldLine: c.oldLine - 1, newLine: c.newLine - 1 };
    }
    return c;
  });
  
  // Refresh diff display
  if (diffChanges.length === 0) {
    clearDiff();
    updateStatus('All Applied', 'success');
    addChatMessage('[OK] All changes accepted!');
    clearConsoleErrors();
    
    // Re-enable editor
    editor.updateOptions({ readOnly: false });
  } else {
    // Re-render remaining diffs
    refreshDiffDisplay();
  }
  
  saveToHistory();
}

/**
 * Reject a specific change (remove new line, keep old line)
 */
function rejectChange(changeIndex) {
  log(`Rejecting change ${changeIndex}`, 'info');
  
  const change = diffChanges[changeIndex];
  if (!change) return;
  
  const editor = getMonacoEditor();
  const model = editor.getModel();
  
  // Remove the new (green) line
  if (change.newLine) {
    const range = new monaco.Range(change.newLine, 1, change.newLine + 1, 1);
    model.pushEditOperations([], [{
      range,
      text: ''
    }], () => null);
  }
  
  // Update line numbers for remaining changes
  diffChanges = diffChanges.filter((c, i) => i !== changeIndex).map(c => {
    if (c.newLine > change.newLine) {
      return { ...c, oldLine: c.oldLine - 1, newLine: c.newLine - 1 };
    }
    return c;
  });
  
  // Refresh diff display
  if (diffChanges.length === 0) {
    clearDiff();
    updateStatus('Changes Rejected', 'error');
    addChatMessage('All changes rejected.');
    
    // Re-enable editor
    editor.updateOptions({ readOnly: false });
  } else {
    // Re-render remaining diffs
    refreshDiffDisplay();
  }
}

/**
 * Refresh diff display after accepting/rejecting a change
 */
function refreshDiffDisplay() {
  const editor = getMonacoEditor();
  
  // Clear old decorations and widgets
  if (diffDecorations.length > 0) {
    editor.deltaDecorations(diffDecorations, []);
    diffDecorations = [];
  }
  
  diffWidgets.forEach(widget => {
    editor.removeContentWidget(widget);
  });
  diffWidgets = [];
  
  // Re-apply decorations
  const decorations = [];
  
  diffChanges.forEach((change, index) => {
    // Red background for removed lines
    if (change.oldLine) {
      decorations.push({
        range: new monaco.Range(change.oldLine, 1, change.oldLine, 1),
        options: {
          isWholeLine: true,
          className: 'diff-line-removed',
          glyphMarginClassName: 'diff-glyph-removed'
        }
      });
    }
    
    // Green background for added lines
    if (change.newLine) {
      decorations.push({
        range: new monaco.Range(change.newLine, 1, change.newLine, 1),
        options: {
          isWholeLine: true,
          className: 'diff-line-added',
          glyphMarginClassName: 'diff-glyph-added'
        }
      });
      
      // Re-add action buttons
      const widget = createDiffActionWidget(editor, change.newLine, index);
      diffWidgets.push(widget);
    }
  });
  
  diffDecorations = editor.deltaDecorations([], decorations);
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
 * Hide batch action buttons
 */
function hideBatchActions() {
  const batchActions = document.getElementById('diff-batch-actions');
  if (batchActions) {
    batchActions.style.display = 'none';
  }
}

/**
 * Accept all changes at once
 */
export function acceptAllChanges() {
  log('=== ACCEPT ALL CHANGES ===', 'info');
  
  const editor = getMonacoEditor();
  
  // Get current content and remove all red lines
  let finalCode = editor.getValue();
  const lines = finalCode.split('\n');
  const linesToRemove = new Set();
  
  diffChanges.forEach(change => {
    if (change.oldLine) {
      linesToRemove.add(change.oldLine - 1); // 0-indexed
    }
  });
  
  // Filter out red lines
  const cleanedLines = lines.filter((_, index) => !linesToRemove.has(index));
  finalCode = cleanedLines.join('\n');
  
  setEditorValue(finalCode);
  state.originalCode = finalCode;
  state.suggestedCode = '';
  
  clearDiff();
  clearConsoleErrors();
  hideBatchActions();
  
  // Re-enable editor
  editor.updateOptions({ readOnly: false });
  
  updateStatus('All Applied', 'success');
  addChatMessage('[OK] All fixes accepted and applied!');
  
  state.errors = [];
  
  saveToHistory();
  log('All fixes accepted', 'success');
}

/**
 * Reject all changes at once
 */
export function rejectAllChanges() {
  log('=== REJECT ALL CHANGES ===', 'info');
  
  const editor = getMonacoEditor();
  
  // Restore original code
  setEditorValue(originalCodeBackup);
  
  clearDiff();
  hideBatchActions();
  
  // Re-enable editor
  editor.updateOptions({ readOnly: false });
  
  updateStatus('All Rejected', 'error');
  addChatMessage('All changes rejected. Original code unchanged.');
  
  state.suggestedCode = '';
  
  log('All fixes rejected', 'info');
}

/**
 * Accept all changes at once (alias for backward compatibility)
 */
export function acceptFix() {
  log('=== ACCEPT ALL CHANGES ===', 'info');
  
  const editor = getMonacoEditor();
  
  // Get current content and remove all red lines
  let finalCode = editor.getValue();
  const lines = finalCode.split('\n');
  const linesToRemove = new Set();
  
  diffChanges.forEach(change => {
    if (change.oldLine) {
      linesToRemove.add(change.oldLine - 1); // 0-indexed
    }
  });
  
  // Filter out red lines
  const cleanedLines = lines.filter((_, index) => !linesToRemove.has(index));
  finalCode = cleanedLines.join('\n');
  
  setEditorValue(finalCode);
  state.originalCode = finalCode;
  state.suggestedCode = '';
  
  clearDiff();
  clearConsoleErrors();
  
  // Re-enable editor
  editor.updateOptions({ readOnly: false });
  
  updateStatus('Applied', 'success');
  addChatMessage('[OK] All fixes accepted and applied!');
  
  state.errors = [];
  
  saveToHistory();
  log('All fixes accepted', 'success');
}

/**
 * Reject all changes at once
 */
export function rejectFix() {
  log('=== REJECT ALL CHANGES ===', 'info');
  
  const editor = getMonacoEditor();
  
  // Restore original code
  setEditorValue(originalCodeBackup);
  
  clearDiff();
  
  // Re-enable editor
  editor.updateOptions({ readOnly: false });
  
  updateStatus('Rejected', 'error');
  addChatMessage('All changes rejected. Original code unchanged.');
  
  state.suggestedCode = '';
  
  log('All fixes rejected', 'info');
}

/**
 * Clear all diff decorations and widgets
 */
function clearDiff() {
  const editor = getMonacoEditor();
  if (!editor) return;
  
  // Remove decorations
  if (diffDecorations.length > 0) {
    editor.deltaDecorations(diffDecorations, []);
    diffDecorations = [];
  }
  
  // Remove widgets
  diffWidgets.forEach(widget => {
    editor.removeContentWidget(widget);
  });
  diffWidgets = [];
  
  // Clear changes
  diffChanges = [];
  diffZones = [];
  originalCodeBackup = '';
  
  // Hide batch actions
  hideBatchActions();
  
  log('Diff cleared', 'info');
}
