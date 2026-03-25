# Mockup Integration Plan - UI-MOCKUP-FUTURISTIC.html → src/

## Overview
This document outlines the complete integration plan to replace the current basic interface with the modern futuristic mockup design while maintaining all existing functionality.

## Current App Architecture Analysis

### Module Structure (ES6)
- **app.js** - Main entry point, event listeners, orchestration
- **state.js** - Centralized state management, API key loading
- **editor.js** - Code editor, line numbers, undo/redo, history
- **errorDetector.js** - Babel parser, cascade prevention
- **chat.js** - Chat UI, message formatting, AI response parsing
- **aiService.js** - Groq API integration, streaming responses
- **diff.js** - Diff overlay, accept/reject fixes
- **preview.js** - React component rendering in iframe
- **logger.js** - Debug logging system
- **ReactComponentRenderer.js** - React rendering utilities

### CSS Structure (Modular)
- **main.css** - Core layout, imports all other CSS
- **chat.css** - Chat interface styles
- **diff.css** - Diff overlay styles
- **debug.css** - Debug panel styles
- **errors.css** - Error display styles
- **preview.css** - Preview panel styles

## Key Features to Preserve

### 1. Editor Features
- ✅ Line numbers with synchronized scrolling
- ✅ Undo/Redo with history tracking (debounced 1s)
- ✅ Copy/Clear code buttons
- ✅ Auto-save to history on input
- ✅ Monospace font (JetBrains Mono preferred)

### 2. Error Detection
- ✅ Babel parser integration (@babel/standalone)
- ✅ Cascade prevention (max 2 errors per line)
- ✅ TypeScript/TSX support
- ✅ Real-time error display in console
- ✅ Error count badge in header

### 3. AI Integration
- ✅ Groq API streaming responses
- ✅ API key loading from .env.local via /api/config
- ✅ Chat message history
- ✅ AI response parsing (Summary/Explanation/Code)
- ✅ Status updates (Ready/Processing/Error)

### 4. Diff System
- ✅ Visual diff overlay (original vs suggested)
- ✅ Accept/Reject fix buttons
- ✅ Line-by-line comparison using diff_match_patch

### 5. Preview System
- ✅ React component rendering in iframe
- ✅ Modal backdrop with click-to-close
- ✅ Error display in preview
- ✅ Loading states

### 6. Debug System
- ✅ Floating debug window
- ✅ Log levels (info, success, warning, error, debug)
- ✅ Copy/Clear/Export logs
- ✅ Collapsible console panel

### 7. Responsive Design
- ✅ Mobile sidebar toggle
- ✅ Overlay backdrop for mobile
- ✅ Flexible layout

## Mockup Modifications Needed

### 1. Add Missing Elements
```html
<!-- Status Badge -->
<span id="status-badge" class="status-badge success">Ready</span>

<!-- Detect Errors Button -->
<button id="detect-errors-btn">Detect Errors</button>

<!-- AI Fix Button -->
<button id="fix-btn" disabled>AI Fix</button>

<!-- Auto-fix Toggle -->
<label>
  <input type="checkbox" id="auto-fix-toggle" checked>
  Auto-fix common issues
</label>

<!-- History Controls -->
<button id="undo-btn" disabled>Undo</button>
<button id="redo-btn" disabled>Redo</button>
<span id="history-info">No history</span>

<!-- Clear Chat Button -->
<button id="clear-chat-btn">Clear</button>

<!-- Diff Overlay -->
<div id="diff-overlay" class="diff-overlay">
  <div class="diff-header">
    <h3>AI Suggested Changes</h3>
    <div class="diff-actions">
      <button id="reject-fix-btn">Reject</button>
      <button id="accept-fix-btn">Accept</button>
    </div>
  </div>
  <div id="diff-content" class="diff-content"></div>
</div>

<!-- Debug Window -->
<div id="debug-window" class="debug-window">
  <div class="debug-window-header">
    <h3>Debug Log</h3>
    <button id="copy-debug-btn">Copy</button>
    <button id="clear-debug-btn">Clear</button>
    <button id="close-debug-btn">X</button>
  </div>
  <div id="debug-log" class="debug-window-content"></div>
</div>

<!-- Preview Modal -->
<div id="preview-modal-backdrop" class="preview-modal-backdrop">
  <div id="preview-panel" class="preview-panel">
    <div class="panel-header">
      React Component Preview
      <button id="clear-preview-btn">Clear</button>
    </div>
    <div id="preview-container" class="preview-container">
      <iframe id="preview-iframe" sandbox="allow-scripts"></iframe>
    </div>
  </div>
</div>
```

### 2. Add Required External Libraries
```html
<!-- Babel for error detection -->
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<!-- React for preview -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Diff library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js"></script>
```

### 3. Update CSS Variables
Add these to match existing functionality:
```css
--error-color: #dc3545;
--success-color: #28a745;
--processing-color: #ffc107;
--diff-add: #d4edda;
--diff-remove: #f8d7da;
```

### 4. Console Panel Enhancement
Current mockup has basic console - needs:
- Log level indicators (color-coded)
- Timestamp display
- Clickable line numbers (jump to code)
- Export/download functionality

### 5. Chat Panel Enhancement
Current mockup has basic chat - needs:
- Structured AI response formatting (Summary/Explanation sections)
- Code block rendering with syntax highlighting
- Streaming indicator during AI responses
- Message timestamps

## Integration Steps (Safe Approach)

### Phase 1: Preparation (No Risk)
1. ✅ Create this integration plan document
2. ✅ Update mockup with all required IDs and elements
3. ✅ Add all external library dependencies
4. ✅ Add missing CSS for diff, debug, preview modals
5. ✅ Test mockup standalone to ensure no regressions

### Phase 2: CSS Migration (Low Risk)
1. Extract mockup CSS into modular structure:
   - `main-new.css` - Core layout from mockup
   - `chat-new.css` - Enhanced chat styles
   - Keep existing: diff.css, debug.css, errors.css, preview.css
2. Create CSS variable mapping between old and new
3. Test with old HTML to ensure compatibility

### Phase 3: HTML Migration (Medium Risk)
1. Create `src/index-new.html` (don't touch old one yet)
2. Copy mockup structure
3. Add all missing functional elements
4. Update app.js to work with both old and new HTML
5. Test thoroughly with new HTML

### Phase 4: JavaScript Updates (Low Risk)
1. Update editor.js for new line number sync
2. Update chat.js for new message structure
3. Update logger.js for new console panel
4. No changes needed to: state.js, errorDetector.js, aiService.js, diff.js, preview.js

### Phase 5: Final Cutover (Controlled Risk)
1. Backup old files: `index-old.html`, `main-old.css`
2. Rename: `index-new.html` → `index.html`
3. Update CSS imports in main.css
4. Test all features end-to-end
5. Keep old files for 1 week as rollback option

## Testing Checklist

### Editor Tests
- [ ] Line numbers sync with scrolling
- [ ] Undo/Redo works correctly
- [ ] History tracking (1s debounce)
- [ ] Copy/Clear buttons work
- [ ] Code persists in textarea

### Error Detection Tests
- [ ] Babel parser detects errors
- [ ] Cascade prevention works
- [ ] TypeScript syntax supported
- [ ] Errors display in console
- [ ] Status badge updates

### AI Integration Tests
- [ ] API key loads from server
- [ ] Detect Errors button triggers analysis
- [ ] AI Fix button sends to Groq API
- [ ] Streaming responses display
- [ ] Chat messages format correctly

### Diff System Tests
- [ ] Diff overlay shows on AI response
- [ ] Accept button applies changes
- [ ] Reject button dismisses overlay
- [ ] Visual diff renders correctly

### Preview Tests
- [ ] Preview modal opens/closes
- [ ] React components render
- [ ] Errors display in preview
- [ ] Clear preview works
- [ ] Backdrop click closes modal

### Debug Tests
- [ ] Debug window toggles
- [ ] Logs display with correct levels
- [ ] Copy/Clear/Export work
- [ ] Console panel expands/collapses

### Responsive Tests
- [ ] Mobile sidebar toggles
- [ ] Overlay backdrop works
- [ ] Layout adapts to screen size
- [ ] Touch interactions work

## Risk Mitigation

### Backup Strategy
```bash
# Before starting Phase 3
cp src/index.html src/index-backup-$(date +%Y%m%d).html
cp src/styles/main.css src/styles/main-backup-$(date +%Y%m%d).css
```

### Rollback Plan
If issues occur:
1. Stop immediately
2. Restore from backup files
3. Document the issue
4. Fix in mockup first
5. Retry integration

### Testing Environment
- Test in Chrome, Firefox, Safari, Edge
- Test on mobile devices (iOS/Android)
- Test with real API key
- Test with various code samples
- Test error scenarios

## Success Criteria

✅ All existing features work identically
✅ New UI is visually consistent
✅ No console errors
✅ Performance is same or better
✅ Mobile experience is improved
✅ Theme toggle works smoothly
✅ All buttons have correct IDs
✅ All event listeners attach correctly

## Timeline Estimate

- Phase 1: 1 hour (Preparation)
- Phase 2: 2 hours (CSS Migration)
- Phase 3: 3 hours (HTML Migration)
- Phase 4: 2 hours (JS Updates)
- Phase 5: 2 hours (Testing & Cutover)

**Total: ~10 hours of focused work**

## Next Steps

1. Review this plan with user
2. Get approval to proceed
3. Start with Phase 1 (safe preparation)
4. Proceed phase by phase with testing
5. Keep user informed of progress

---

**Status**: Ready for Phase 1 execution
**Last Updated**: 2026-03-24
**Owner**: Kiro AI Assistant
