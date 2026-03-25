// React component preview functionality - SIMPLIFIED TAB SWITCH
import { log } from './logger.js';
import { getEditorValue } from './monacoEditor.js';

let renderer = null;

// Initialize the React renderer
export async function initializePreview() {
  if (!renderer) {
    // Dynamically import the renderer
    const module = await import('./ReactComponentRenderer.js');
    const ReactComponentRenderer = module.default || module.ReactComponentRenderer || window.ReactComponentRenderer;
    renderer = new ReactComponentRenderer();
    await renderer.initialize();
    log('React renderer initialized', 'success');
  }
  return renderer;
}

// Get the renderer instance
export function getRenderer() {
  return renderer;
}

// Switch to preview tab and render
export async function renderPreview() {
  try {
    log('=== RENDER PREVIEW STARTED ===', 'info');
    
    const code = getEditorValue();
    
    // Switch to preview tab
    const editorTab = document.getElementById('editorTab');
    const previewTab = document.getElementById('previewTab');
    const codeViewport = document.getElementById('codeViewport');
    const previewIframe = document.getElementById('preview-iframe');
    
    if (editorTab) editorTab.classList.remove('active');
    if (previewTab) previewTab.classList.add('active');
    if (codeViewport) codeViewport.style.display = 'none';
    if (previewIframe) previewIframe.style.display = 'block';
    
    if (!code.trim()) {
      log('No code to render', 'warning');
      // Show placeholder
      if (previewIframe) {
        previewIframe.srcdoc = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 40px;
                font-family: system-ui, -apple-system, sans-serif;
                background: #f8fafc;
                color: #64748b;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                text-align: center;
              }
              .placeholder {
                font-size: 18px;
              }
            </style>
          </head>
          <body>
            <div class="placeholder">
              Paste your React component code in the editor and click "Preview"
            </div>
          </body>
          </html>
        `;
      }
      return;
    }
    
    // Initialize renderer if needed
    await initializePreview();
    
    log('Compiling React component...', 'info');
    
    // Render to iframe
    await renderer.renderToIframe(previewIframe, code);
    
    log('=== RENDER PREVIEW COMPLETED ===', 'success');
  } catch (error) {
    log('Preview render failed', 'error', error.message);
    
    // Show error in iframe
    const previewIframe = document.getElementById('preview-iframe');
    if (previewIframe) {
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
}

// Clear preview (switch back to editor)
export function clearPreview() {
  const previewIframe = document.getElementById('preview-iframe');
  if (previewIframe) {
    previewIframe.srcdoc = '';
  }
  
  // Switch back to editor tab
  const editorTab = document.getElementById('editorTab');
  const previewTab = document.getElementById('previewTab');
  const codeViewport = document.getElementById('codeViewport');
  
  if (previewTab) previewTab.classList.remove('active');
  if (editorTab) editorTab.classList.add('active');
  if (codeViewport) codeViewport.style.display = 'flex';
  if (previewIframe) previewIframe.style.display = 'none';
  
  log('Preview cleared', 'info');
}

// Legacy function stubs for compatibility
export function togglePreviewPanel() {
  // No-op: We don't use modals anymore
}

export function closePreviewModal() {
  // No-op: We don't use modals anymore
}
