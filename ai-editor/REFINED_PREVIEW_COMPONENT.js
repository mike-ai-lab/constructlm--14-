/**
 * REFINED PREVIEW SYSTEM - Complete Implementation
 * 
 * This file contains all the logic needed for the preview system:
 * 1. File detection utilities
 * 2. PreviewModal component (to be converted to HTML)
 * 3. Preview manager functions
 * 4. Context menu integration
 */

// ============================================================================
// PART 1: FILE DETECTION UTILITIES
// ============================================================================

/**
 * Check if a file is renderable (has React component with export default)
 */
function isRenderableFile(filename, content) {
  if (!filename || !content) return false;
  
  // Must be JS/TS file
  if (!/\.(tsx?|jsx?)$/i.test(filename)) return false;
  
  // Must have export default
  if (!/export\s+default\s+/m.test(content)) return false;
  
  // Must have JSX syntax or React usage
  const hasJSX = /<[A-Z][a-zA-Z0-9]*/.test(content) || // <Component>
                 /<>/.test(content) || // Fragment
                 /React\.createElement/.test(content); // React.createElement
  
  const hasReactImport = /import\s+.*\s+from\s+['"]react['"]/m.test(content);
  
  return hasJSX || hasReactImport;
}

/**
 * Find the entry file to render (the main component)
 */
function findEntryFile(files, currentFile) {
  // If current file is renderable, use it
  if (files[currentFile] && isRenderableFile(currentFile, files[currentFile])) {
    return currentFile;
  }
  
  // Otherwise, find first renderable file in same folder
  const folderParts = currentFile.split('/');
  folderParts.pop(); // Remove filename
  const folder = folderParts.join('/');
  
  for (const [path, content] of Object.entries(files)) {
    const pathFolder = path.split('/').slice(0, -1).join('/');
    if (pathFolder === folder && isRenderableFile(path, content)) {
      return path;
    }
  }
  
  return null;
}

/**
 * Get all related files from the same folder as the entry file
 */
function getRelatedFiles(files, entryFile) {
  const folderParts = entryFile.split('/');
  folderParts.pop(); // Remove filename
  const folder = folderParts.join('/');
  
  const related = {};
  
  for (const [path, content] of Object.entries(files)) {
    const pathFolder = path.split('/').slice(0, -1).join('/');
    
    // Include files from same folder
    if (pathFolder === folder || path === entryFile) {
      related[path] = content;
    }
  }
  
  return related;
}

/**
 * Extract all import statements from code
 */
function extractImports(code) {
  const imports = [];
  
  // Match: import X from 'path'
  // Match: import { X } from 'path'
  // Match: import * as X from 'path'
  const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/gm;
  
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

/**
 * Resolve relative import path to actual file path
 */
function resolveImport(importPath, fromFile, files) {
  // External imports (not relative)
  if (!importPath.startsWith('.')) {
    return null; // Will be handled by CDN
  }
  
  // Get directory of the importing file
  const fromDir = fromFile.split('/').slice(0, -1);
  
  // Split import path
  const importParts = importPath.split('/');
  
  // Resolve relative path
  const resolved = [...fromDir];
  for (const part of importParts) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.') {
      resolved.push(part);
    }
  }
  
  let resolvedPath = resolved.join('/');
  
  // Try different extensions
  const extensions = ['', '.tsx', '.ts', '.jsx', '.js'];
  for (const ext of extensions) {
    const testPath = resolvedPath + ext;
    if (files[testPath]) {
      return testPath;
    }
  }
  
  // Try index files
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const testPath = resolvedPath + '/index' + ext;
    if (files[testPath]) {
      return testPath;
    }
  }
  
  return null;
}

// ============================================================================
// PART 2: PREVIEW MANAGER
// ============================================================================

const PreviewManager = {
  modal: null,
  iframe: null,
  isOpen: false,
  currentEntry: null,
  
  /**
   * Initialize the preview system
   */
  init() {
    // Modal will be created dynamically when needed
    this.createModal();
  },
  
  /**
   * Create the modal HTML structure
   */
  createModal() {
    if (this.modal) return; // Already created
    
    const modal = document.createElement('div');
    modal.id = 'previewModal';
    modal.className = 'preview-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="preview-modal-content">
        <div class="preview-modal-header">
          <span class="preview-modal-title">Component Preview</span>
          <button class="preview-modal-close" onclick="PreviewManager.close()">×</button>
        </div>
        <div class="preview-modal-body">
          <div class="preview-loading">
            <div class="preview-spinner"></div>
            <span>Loading preview...</span>
          </div>
          <div class="preview-error" style="display: none;">
            <div class="preview-error-icon">⚠</div>
            <div class="preview-error-message"></div>
          </div>
          <iframe class="preview-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.modal = modal;
    this.iframe = modal.querySelector('.preview-iframe');
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },
  
  /**
   * Open preview for a file
   */
  async open(filename) {
    if (!files[filename]) {
      this.showError('File not found');
      return;
    }
    
    // Find entry file
    const entryFile = findEntryFile(files, filename);
    if (!entryFile) {
      this.showError('No renderable component found. Make sure the file exports a React component.');
      return;
    }
    
    this.currentEntry = entryFile;
    
    // Get related files
    const relatedFiles = getRelatedFiles(files, entryFile);
    
    // Show modal
    this.modal.style.display = 'flex';
    this.isOpen = true;
    this.showLoading();
    
    try {
      // Send to server for bundling
      const response = await fetch('http://localhost:3000/runtime-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: relatedFiles,
          entry: entryFile
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to bundle component');
      }
      
      const data = await response.json();
      
      // Load HTML into iframe
      this.iframe.srcdoc = data.html;
      this.hideLoading();
      
      logActivity(`Preview opened: ${entryFile}`, 'success');
      
    } catch (error) {
      console.error('Preview error:', error);
      this.showError(error.message);
      logActivity(`Preview failed: ${error.message}`, 'error');
    }
  },
  
  /**
   * Close the preview modal
   */
  close() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
    this.isOpen = false;
    this.currentEntry = null;
    
    // Clear iframe
    if (this.iframe) {
      this.iframe.srcdoc = '';
    }
  },
  
  /**
   * Show loading state
   */
  showLoading() {
    const loading = this.modal.querySelector('.preview-loading');
    const error = this.modal.querySelector('.preview-error');
    const iframe = this.modal.querySelector('.preview-iframe');
    
    if (loading) loading.style.display = 'flex';
    if (error) error.style.display = 'none';
    if (iframe) iframe.style.display = 'none';
  },
  
  /**
   * Hide loading state
   */
  hideLoading() {
    const loading = this.modal.querySelector('.preview-loading');
    const iframe = this.modal.querySelector('.preview-iframe');
    
    if (loading) loading.style.display = 'none';
    if (iframe) iframe.style.display = 'block';
  },
  
  /**
   * Show error message
   */
  showError(message) {
    const loading = this.modal.querySelector('.preview-loading');
    const error = this.modal.querySelector('.preview-error');
    const errorMessage = this.modal.querySelector('.preview-error-message');
    const iframe = this.modal.querySelector('.preview-iframe');
    
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = message;
    if (iframe) iframe.style.display = 'none';
    
    // Auto-show modal if not open
    if (!this.isOpen) {
      this.modal.style.display = 'flex';
      this.isOpen = true;
    }
  }
};

// ============================================================================
// PART 3: CONTEXT MENU INTEGRATION
// ============================================================================

/**
 * Enhanced context menu with preview option
 * This should be integrated into the existing showContextMenu function
 */
function showContextMenuWithPreview(e, filePath, isFolder) {
  // Remove existing context menu
  const existingMenu = document.querySelector('.context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  const menu = document.createElement('div');
  menu.className = 'context-menu show';
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  
  // Check if file is renderable
  const canPreview = !isFolder && 
                     files[filePath] && 
                     isRenderableFile(filePath, files[filePath]);
  
  menu.innerHTML = `
    ${canPreview ? `
      <div class="context-menu-item" onclick="PreviewManager.open('${filePath}'); hideContextMenu();">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Preview Component
      </div>
      <div class="context-menu-separator"></div>
    ` : ''}
    <div class="context-menu-item" onclick="renameItem('${filePath}', ${isFolder}); hideContextMenu();">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      Rename
    </div>
    <div class="context-menu-item" onclick="duplicateItem('${filePath}', ${isFolder}); hideContextMenu();">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      Duplicate
    </div>
    <div class="context-menu-separator"></div>
    <div class="context-menu-item" onclick="${isFolder ? `deleteFolder('${filePath}', event)` : `closeFile('${filePath}', event)`}; hideContextMenu();">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
      Delete
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true });
  }, 0);
}

function hideContextMenu() {
  const menu = document.querySelector('.context-menu');
  if (menu) {
    menu.remove();
  }
}

// ============================================================================
// PART 4: INITIALIZATION
// ============================================================================

/**
 * Initialize preview system when app loads
 * Add this to the initializeApp() function
 */
function initPreviewSystem() {
  PreviewManager.init();
  console.log('Preview system initialized');
}

// ============================================================================
// EXPORT FOR TESTING
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isRenderableFile,
    findEntryFile,
    getRelatedFiles,
    extractImports,
    resolveImport,
    PreviewManager
  };
}
