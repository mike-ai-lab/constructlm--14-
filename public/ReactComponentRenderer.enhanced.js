/**
 * Enhanced React Component Renderer
 * 
 * Combines the best features from both implementations:
 * - Comprehensive icon mocking with SVG paths (from standalone)
 * - Multi-line import parsing with state machine (from standalone)
 * - Production-grade error handling (from ConstructLM)
 * - Library loading timeout detection (from ConstructLM)
 * - Global error handlers (from ConstructLM)
 * 
 * Features:
 * - Multi-line import parsing
 * - 50+ icon mocks with actual SVG paths
 * - Framer Motion support
 * - TypeScript syntax support
 * - Export handling (default exports, named exports)
 * - Production-ready error handling with user-friendly overlays
 * - Library loading timeout detection
 * - Validation without rendering
 * 
 * Usage:
 * ```javascript
 * const renderer = new ReactComponentRenderer();
 * await renderer.initialize();
 * const result = await renderer.compile(sourceCode);
 * renderer.renderToIframe(iframeElement, sourceCode);
 * const html = renderer.generateHTML(sourceCode);
 * ```
 */

class ReactComponentRenderer {
  constructor(options = {}) {
    this.options = {
      babelCDN: 'https://unpkg.com/@babel/standalone/babel.min.js',
      reactCDN: 'https://unpkg.com/react@18/umd/react.production.min.js',
      reactDOMCDN: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
      tailwindCDN: 'https://cdn.tailwindcss.com',
      loadTimeout: 5000,
      ...options
    };
    this.babelLoaded = false;
    this.babelLoadPromise = null;
  }

  /**
   * Initialize the renderer by loading Babel
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.babelLoaded) return;
    if (this.babelLoadPromise) return this.babelLoadPromise;

    this.babelLoadPromise = new Promise((resolve, reject) => {
      if (window.Babel) {
        this.babelLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.options.babelCDN;
      script.async = true;
      script.onload = () => {
        this.babelLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Babel compiler'));
      document.head.appendChild(script);
    });

    return this.babelLoadPromise;
  }

  /**
   * Parse imports from source code with multi-line support
   * @param {string} code - Source code
   * @returns {Object} - { cleanCode, mocks }
   */
  parseImports(code) {
    const lines = code.split('\n');
    const cleanLines = [];
    const imports = [];
    let inImportBlock = false;
    let currentImport = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('import ')) {
        inImportBlock = true;
        currentImport = line;
        
        // Check if import is complete on this line
        if (line.includes(';') || (line.includes('from') && line.match(/['"]/) && line.match(/['"]/).length >= 2)) {
          inImportBlock = false;
          this._parseImportLine(currentImport, imports);
          currentImport = '';
        }
        continue;
      }
      
      if (inImportBlock) {
        currentImport += ' ' + line;
        if (line.includes(';') || line.includes('from')) {
          inImportBlock = false;
          this._parseImportLine(currentImport, imports);
          currentImport = '';
        }
        continue;
      }
      
      cleanLines.push(lines[i]);
    }

    const mocks = this._generateMocks(imports);
    return { cleanCode: cleanLines.join('\n'), mocks };
  }

  /**
   * Parse a single import line
   * @private
   */
  _parseImportLine(importStr, importsArray) {
    const match = importStr.match(/import\s+(?:(\w+)|(?:\{([^}]+)\}))\s+from\s+['"]([^'"]+)['"]/);
    if (match) {
      const defaultImport = match[1];
      const namedImports = match[2];
      const source = match[3];
      
      if (defaultImport) importsArray.push({ name: defaultImport, source });
      if (namedImports) {
        namedImports.split(',').forEach(spec => {
          const cleaned = spec.trim().split(/\s+as\s+/).pop().trim();
          if (cleaned) importsArray.push({ name: cleaned, source });
        });
      }
    }
  }

  /**
   * Generate mocks for imported modules
   * @private
   */
  _generateMocks(imports) {
    const mockSet = new Set();
    const mocks = imports.map(imp => {
      if (mockSet.has(imp.name)) return '';
      mockSet.add(imp.name);
      
      // Framer Motion - use real library from CDN
      if (imp.source.includes('framer-motion')) {
        if (imp.name === 'motion') {
          return `const motion = window.Motion?.motion || { div: (props) => React.createElement('div', props) };`;
        }
        if (imp.name === 'AnimatePresence') {
          return `const AnimatePresence = window.Motion?.AnimatePresence || (({ children }) => children);`;
        }
        if (imp.name === 'useAnimation') {
          return `const useAnimation = window.Motion?.useAnimation || (() => ({}));`;
        }
        if (imp.name === 'useMotionValue') {
          return `const useMotionValue = window.Motion?.useMotionValue || ((val) => ({ get: () => val, set: () => {} }));`;
        }
        if (imp.name === 'useTransform') {
          return `const useTransform = window.Motion?.useTransform || ((val) => val);`;
        }
        // Generic framer-motion export
        return `const ${imp.name} = window.Motion?.${imp.name} || ((props) => React.createElement('div', props));`;
      }
      
      // Icon libraries
      if (imp.source.includes('lucide') || imp.source.includes('react-icons') || 
          imp.source.includes('fi') || imp.source.includes('fa') || imp.source.includes('md') || 
          imp.source.includes('ai') || imp.source.includes('bi') || imp.source.includes('bs') || 
          imp.source.includes('cg') || imp.source.includes('di') || imp.source.includes('gi') || 
          imp.source.includes('go') || imp.source.includes('gr') || imp.source.includes('hi') || 
          imp.source.includes('im') || imp.source.includes('io') || imp.source.includes('ri') || 
          imp.source.includes('si') || imp.source.includes('tb') || imp.source.includes('ti') || 
          imp.source.includes('vsc') || imp.source.includes('wi')) {
        return this._generateIconMock(imp.name);
      }
      
      return '';
    }).filter(Boolean).join('\n        ');

    return mocks;
  }

  /**
   * Generate icon mock with proper SVG paths
   * @private
   */
  _generateIconMock(iconName) {
    const iconPaths = {
      ChevronLeft: '<polyline points="15 18 9 12 15 6"></polyline>',
      ChevronRight: '<polyline points="9 18 15 12 9 6"></polyline>',
      ChevronUp: '<polyline points="18 15 12 9 6 15"></polyline>',
      ChevronDown: '<polyline points="6 9 12 15 18 9"></polyline>',
      FiChevronLeft: '<polyline points="15 18 9 12 15 6"></polyline>',
      FiChevronRight: '<polyline points="9 18 15 12 9 6"></polyline>',
      ArrowLeft: '<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>',
      ArrowRight: '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
      ArrowUp: '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>',
      ArrowDown: '<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>',
      ArrowUpRight: '<line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline>',
      Star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
      Heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>',
      Menu: '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>',
      X: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
      Check: '<polyline points="20 6 9 17 4 12"></polyline>',
      Plus: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
      Minus: '<line x1="5" y1="12" x2="19" y2="12"></line>',
      Home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
      Compass: '<circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>',
      Mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>',
      MessageCircle: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>',
      Play: '<polygon points="5 3 19 12 5 21 5 3"></polygon>',
      Pause: '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>',
      Settings: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-2 2l-4.2 4.2m13.2-5.2l-4.2-4.2m-2 2l-4.2-4.2"></path>',
      File: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline>',
      Folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
      Circle: '<circle cx="12" cy="12" r="10"></circle>',
      Square: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>',
      Maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>',
      Maximize2: '<polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>',
      Minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>',
      Layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>',
      User: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
      Users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
      Search: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
      ShoppingCart: '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>',
      Download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
      Upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>',
      Copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
      Trash: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
      Edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
      Save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>',
      Bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>',
      Calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
      Clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
      Eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
      EyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>',
      Lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
      Unlock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>'
    };
    
    const path = iconPaths[iconName] || '<circle cx="12" cy="12" r="10"></circle>';
    const escapedPath = path.replace(/"/g, '\\"');
    return `const ${iconName} = (props) => React.createElement('svg', { width: props.size || 24, height: props.size || 24, viewBox: '0 0 24 24', fill: props.fill || 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className, style: props.style, ...props }, React.createElement('g', { dangerouslySetInnerHTML: { __html: "${escapedPath}" } }));`;
  }

  /**
   * Process export statements
   * @param {string} code - Source code
   * @returns {string} - Processed code
   */
  processExports(code) {
    let processed = code;
    
    // Find component name in "export default Name"
    let exportDefaultMatch = processed.match(/export\s+default\s+([A-Z][a-zA-Z0-9]*)/);
    let componentName = exportDefaultMatch ? exportDefaultMatch[1] : null;
    
    // Remove export keywords
    processed = processed.replace(/export\s+default\s+/g, '');
    processed = processed.replace(/export\s+/g, '');
    
    // If no component name found from export, try to find the FIRST top-level component declaration
    if (!componentName) {
      const lines = processed.split('\n');
      for (let line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(/^(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
        if (match) {
          componentName = match[1];
          break;
        }
      }
    }
    
    // Ensure IIFE returns the component
    if (componentName) {
      processed = processed.replace(new RegExp(`return\\s+${componentName};?`, 'g'), '');
      processed += `\nreturn ${componentName};`;
    }
    
    return processed.trim();
  }

  /**
   * Compile source code to transpiled JavaScript
   * @param {string} sourceCode - React component source code
   * @returns {Object} - { success, transpiledCode, error }
   */
  async compile(sourceCode) {
    if (!this.babelLoaded) {
      await this.initialize();
    }

    try {
      const { cleanCode, mocks } = this.parseImports(sourceCode);
      const processedCode = this.processExports(cleanCode);
      
      // Wrap code with React and mocks INSIDE the IIFE
      const wrappedCode = `(function() { 
        const React = window.React;
        const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, createContext } = React;
        ${mocks}
        ${processedCode}
      })()`;
      
      // Transpile
      const transpiledCode = window.Babel.transform(wrappedCode, {
        presets: ['react', 'typescript'],
        filename: 'component.tsx'
      }).code;

      return {
        success: true,
        transpiledCode,
        error: null
      };
    } catch (err) {
      return {
        success: false,
        transpiledCode: null,
        error: err.message
      };
    }
  }

  /**
   * Validate source code without rendering
   * @param {string} sourceCode - React component source code
   * @returns {Object} - { valid, error }
   */
  async validate(sourceCode) {
    const result = await this.compile(sourceCode);
    return {
      valid: result.success,
      error: result.error
    };
  }

  /**
   * Generate complete HTML for embedding with production-grade error handling
   * @param {string} sourceCode - React component source code
   * @returns {Promise<string>} - Complete HTML document
   */
  async generateHTML(sourceCode) {
    const compileResult = await this.compile(sourceCode);
    
    if (!compileResult.success) {
      // Throw compilation error so it can be caught by Canvas
      throw new Error(compileResult.error);
    }

    const encoded = encodeURIComponent(compileResult.transpiledCode);
    const maxLoadAttempts = this.options.loadTimeout / 100; // Convert timeout to attempts
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="${this.options.reactCDN}"></script>
  <script crossorigin src="${this.options.reactDOMCDN}"></script>
  <script src="${this.options.babelCDN}"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
  <script src="${this.options.tailwindCDN}"></script>
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; }
    #root { min-height: 100vh; }
    .error-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.95);
      color: white;
      padding: 30px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      overflow: auto;
      z-index: 9999;
      line-height: 1.6;
    }
    .error-title {
      color: #ef4444;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .error-content {
      background: #1f2937;
      padding: 20px;
      border-left: 4px solid #ef4444;
      white-space: pre-wrap;
      margin-bottom: 20px;
    }
    .error-tip {
      color: #9ca3af;
      margin-top: 20px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      let hasError = false;
      let loadAttempts = 0;
      const maxLoadAttempts = ${maxLoadAttempts};
      
      function showError(title, message) {
        if (hasError) return;
        hasError = true;
        
        console.error('[ReactRenderer]', title, message);
        
        // Send error to parent window
        try {
          window.parent.postMessage({
            type: 'renderer-error',
            title: title,
            message: message
          }, '*');
        } catch (e) {
          console.error('[ReactRenderer] Could not post message to parent');
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'error-overlay';
        overlay.innerHTML = 
          '<div class="error-title">' + title + '</div>' +
          '<div class="error-content">' + String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>' +
          '<div class="error-tip">Open browser console (F12) for more details</div>';
        document.body.appendChild(overlay);
      }
      
      function checkLibrariesLoaded() {
        loadAttempts++;
        
        if (window.React && window.ReactDOM && window.Motion) {
          console.log('[ReactRenderer] Libraries loaded successfully');
          initComponent();
        } else if (loadAttempts >= maxLoadAttempts) {
          showError(
            'Library Loading Timeout',
            'Failed to load React, ReactDOM, or Framer Motion from CDN.\\n\\n' +
            'Possible causes:\\n' +
            '- Ad blocker blocking unpkg.com\\n' +
            '- Slow internet connection\\n' +
            '- Corporate firewall\\n\\n' +
            'Try:\\n' +
            '1. Disable ad blocker\\n' +
            '2. Check internet connection\\n' +
            '3. Try a different browser'
          );
        } else {
          setTimeout(checkLibrariesLoaded, 100);
        }
      }
      
      function initComponent() {
        try {
          const rootElement = document.getElementById('root');
          if (!rootElement) throw new Error('Root element not found');
          
          const source = decodeURIComponent("${encoded}");
          
          console.log('[ReactRenderer] Executing component...');
          
          // Execute the transpiled IIFE which returns the Component
          const Component = eval(source);
          
          if (typeof Component !== 'function') {
            throw new Error('Code evaluation did not return a component function. Ensure code has "export default" or proper component declaration.');
          }

          console.log('[ReactRenderer] Rendering component...');
          
          const root = window.ReactDOM.createRoot(rootElement);
          root.render(React.createElement(Component));
          
          console.log('[ReactRenderer] Render complete');
          
        } catch (error) {
          console.error('[ReactRenderer] Error:', error);
          showError('Component Error', error.message + '\\n\\n' + (error.stack || ''));
        }
      }
      
      // Wait for DOM and libraries
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkLibrariesLoaded);
      } else {
        checkLibrariesLoaded();
      }
      
      // Global error handler
      window.addEventListener('error', function(event) {
        if (event.message === 'Script error.') {
          return; // Cross-origin script error - ignore
        }
        console.error('[ReactRenderer] Global error:', event.error);
        if (!hasError) {
          showError('Runtime Error', event.message + '\\n\\nLine: ' + event.lineno + ', Column: ' + event.colno);
        }
      });
      
      window.addEventListener('unhandledrejection', function(event) {
        console.error('[ReactRenderer] Unhandled rejection:', event.reason);
        if (!hasError) {
          showError('Promise Rejection', String(event.reason?.message || event.reason));
        }
      });
    })();
  </script>
</body>
</html>`;
  }

  /**
   * Generate error HTML
   * @private
   */
  _generateErrorHTML(errorMessage) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Courier New', monospace;
      background: #1f2937;
      color: white;
    }
    .error-title {
      color: #ef4444;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .error-content {
      background: #111827;
      padding: 20px;
      border-left: 4px solid #ef4444;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="error-title">Compilation Error</div>
  <div class="error-content">${errorMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body>
</html>`;
  }

  /**
   * Render component to an iframe element
   * @param {HTMLIFrameElement} iframe - Target iframe element
   * @param {string} sourceCode - React component source code
   * @returns {Promise<void>}
   */
  async renderToIframe(iframe, sourceCode) {
    const html = await this.generateHTML(sourceCode);
    iframe.srcdoc = html;
  }

  /**
   * Render component to a container element
   * Creates an iframe inside the container
   * @param {HTMLElement} container - Target container element
   * @param {string} sourceCode - React component source code
   * @param {Object} iframeOptions - Optional iframe styling
   * @returns {Promise<HTMLIFrameElement>}
   */
  async renderToContainer(container, sourceCode, iframeOptions = {}) {
    const iframe = document.createElement('iframe');
    iframe.style.width = iframeOptions.width || '100%';
    iframe.style.height = iframeOptions.height || '100%';
    iframe.style.border = iframeOptions.border || 'none';
    iframe.sandbox = 'allow-scripts';
    
    container.innerHTML = '';
    container.appendChild(iframe);
    
    await this.renderToIframe(iframe, sourceCode);
    return iframe;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReactComponentRenderer;
}
if (typeof window !== 'undefined') {
  window.ReactComponentRenderer = ReactComponentRenderer;
}
