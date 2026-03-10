/**
 * Runtime Bundler Service - Production Ready
 * Handles TSX/JSX compilation with proper error handling
 */

interface BundleResult {
  html: string;
  error?: string;
}

/**
 * Parse import statements
 */
function parseImports(code: string): Array<{source: string; specifiers: string[]}> {
  const imports: Array<{source: string; specifiers: string[]}> = [];
  const importRegex = /import\s+(?:(\w+)|(?:\{([^}]+)\}))\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(code)) !== null) {
    const [, defaultImport, namedImports, source] = match;
    const specifiers: string[] = [];
    
    if (defaultImport) specifiers.push(defaultImport);
    if (namedImports) {
      namedImports.split(',').forEach(name => {
        const cleaned = name.trim().split(/\s+as\s+/).pop()?.trim();
        // Filter out empty strings from malformed imports (e.g., double commas)
        if (cleaned && cleaned.length > 0) specifiers.push(cleaned);
      });
    }
    
    // Remove duplicates
    const uniqueSpecifiers = [...new Set(specifiers)];
    
    imports.push({ source, specifiers: uniqueSpecifiers });
  }
  
  return imports;
}

/**
 * Transform code
 */
function transformCode(code: string, imports: Array<{source: string; specifiers: string[]}>): string {
  let transformed = code;
  
  // AGGRESSIVE IMPORT REMOVAL - Remove entire import blocks line by line
  const lines = transformed.split('\n');
  const cleanedLines: string[] = [];
  let inImportBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Start of import statement
    if (line.startsWith('import ')) {
      inImportBlock = true;
      // Check if it's a single-line import
      if (line.includes(';') || (line.includes('from') && line.includes('"') && line.match(/"/g)?.length === 2)) {
        inImportBlock = false;
        continue; // Skip this line
      }
      continue; // Skip this line
    }
    
    // Inside multi-line import
    if (inImportBlock) {
      if (line.includes(';') || line.includes('from')) {
        inImportBlock = false;
      }
      continue; // Skip this line
    }
    
    // Keep non-import lines
    cleanedLines.push(lines[i]);
  }
  
  transformed = cleanedLines.join('\n');
  
  // Build injections with deduplication
  const injections: string[] = [];
  const injectedNames = new Set<string>();
  
  imports.forEach(imp => {
    imp.specifiers.forEach(spec => {
      // Skip if already injected or invalid identifier
      if (injectedNames.has(spec) || !spec || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(spec)) return;
      injectedNames.add(spec);
      
      if (spec === 'Link') {
        injections.push(`const Link = ({ to, href, children, ...props }) => React.createElement('a', { href: to || href || '#', className: 'text-blue-600 hover:underline', ...props }, children);`);
      } else if (spec === 'Button') {
        injections.push(`const Button = ({ children, className = '', ...props }) => React.createElement('button', { className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ' + className, ...props }, children);`);
      } else if (spec === 'Card') {
        injections.push(`const Card = ({ children, className = '', ...props }) => React.createElement('div', { className: 'border rounded-lg p-6 shadow-sm bg-white ' + className, ...props }, children);`);
      } else if (spec === 'Input') {
        injections.push(`const Input = ({ className = '', ...props }) => React.createElement('input', { className: 'border rounded px-3 py-2 w-full ' + className, ...props });`);
      } else if (spec.includes('Icon')) {
        injections.push(`const ${spec} = ({ size = 24, className = '', fill, ...props }) => React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: fill || 'none', stroke: 'currentColor', strokeWidth: 2, className, ...props }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }));`);
      } else if (spec === 'Route' || spec === 'Switch') {
        injections.push(`const ${spec} = ({ children }) => children;`);
      } else if (spec === 'motion') {
        injections.push(`const motion = window.Motion?.motion || new Proxy({}, { get: (_, prop) => prop });`);
      } else if (spec === 'AnimatePresence') {
        injections.push(`const AnimatePresence = window.Motion?.AnimatePresence || (({ children }) => children);`);
      } else if (imp.source.includes('framer-motion')) {
        injections.push(`const ${spec} = window.Motion?.${spec} || (() => {});`);
      } else if (!['react', 'react-dom'].includes(imp.source)) {
        injections.push(`const ${spec} = ({ children, ...props }) => React.createElement('div', props, children);`);
      }
    });
  });
  
  transformed = injections.join('\n') + '\n\n' + transformed;
  
  // Transform export
    transformed = transformed
      .replace(/export\s+default\s+function\s+(\w+)/, 'function $1')
      .replace(/export\s+default\s+/, 'const Component = ');
  
  return transformed.trim();
}

/**
 * Check if code is React component
 */
function isReactComponent(code: string): boolean {
  return (
    (/(?:function|const|class)\s+\w+/.test(code) && (/<[A-Z]/.test(code) || /jsx/.test(code))) ||
    /export\s+default/.test(code) ||
    /React\.createElement/.test(code)
  );
}

/**
 * Generate preview HTML
 */
export function generateBundledPreview(code: string, language: string): BundleResult {
  const isReact = ['tsx', 'jsx', 'typescript', 'javascript', 'ts', 'js'].includes(language);
  
  if (!isReact || !isReactComponent(code)) {
    return {
      html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>body{margin:20px;font-family:monospace}</style></head>
<body><div style="padding:20px;color:orange;border:2px solid orange">
<strong>Not a React Component</strong><br/>Expected: Function with JSX or export default
</div></body></html>`
    };
  }
  
  try {
    // Fix common syntax errors before processing
    let fixedCode = code;
    
    // Fix "default export" -> "export default"
    fixedCode = fixedCode.replace(/\bdefault\s+export\s+/g, 'export default ');
    
    // Fix "export function default" -> "export default function"
    fixedCode = fixedCode.replace(/\bexport\s+function\s+default\s+/g, 'export default function ');
    
    const imports = parseImports(fixedCode);
    const transformedCode = transformCode(fixedCode, imports);
    
    return {
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; }
    #root { min-height: 100vh; }
    .error-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.95); color: white;
      padding: 30px; font-family: 'Courier New', monospace; font-size: 14px;
      overflow: auto; z-index: 9999; line-height: 1.6;
    }
    .error-title { color: #ef4444; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
    .error-content { background: #1f2937; padding: 20px; border-left: 4px solid #ef4444; margin-bottom: 20px; white-space: pre-wrap; }
    .error-tip { color: #9ca3af; margin-top: 20px; font-size: 13px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      let hasError = false;
      let loadAttempts = 0;
      const maxLoadAttempts = 50; // 5 seconds
      
      function showError(title, message) {
        if (hasError) return;
        hasError = true;
        
        console.error('[Canvas]', title, message);
        
        const overlay = document.createElement('div');
        overlay.className = 'error-overlay';
        overlay.innerHTML = 
          '<div class="error-title">' + title + '</div>' +
          '<div class="error-content">' + String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>' +
          '<div class="error-tip">💡 Open browser console (F12) for more details</div>';
        document.body.appendChild(overlay);
      }
      
      function checkLibrariesLoaded() {
        loadAttempts++;
        
        if (window.React && window.ReactDOM && window.Babel) {
          console.log('[Canvas] Libraries loaded successfully');
          initComponent();
        } else if (loadAttempts >= maxLoadAttempts) {
          showError(
            'Library Loading Timeout',
            'Failed to load React, ReactDOM, or Babel from CDN.\\n\\n' +
            'Possible causes:\\n' +
            '• Ad blocker blocking unpkg.com\\n' +
            '• Slow internet connection\\n' +
            '• Corporate firewall\\n\\n' +
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
          
          // Load Framer Motion (optional)
          const motionScript = document.createElement('script');
          motionScript.src = 'https://unpkg.com/framer-motion@11/dist/framer-motion.js';
          motionScript.onerror = () => console.warn('[Canvas] Framer Motion not loaded');
          document.head.appendChild(motionScript);
          
          const { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, createElement, Fragment } = window.React;
          
          const sourceCode = decodeURIComponent("${encodeURIComponent(transformedCode)}");
          
          console.log('[Canvas] Compiling component...');
          
          const compiled = window.Babel.transform(sourceCode, {
            presets: ['react', 'typescript'],
            filename: 'component.tsx'
          });
          
          console.log('[Canvas] Executing component...');
          
          const executeCode = new Function(
            'React', 'ReactDOM', 'createElement', 'Fragment',
            'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext', 'useReducer',
            compiled.code + '\\nreturn typeof Component !== "undefined" ? Component : null;'
          );
          
          const Component = executeCode(
            window.React, window.ReactDOM, createElement, Fragment,
            useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer
          );
          
          if (!Component || typeof Component !== 'function') {
            throw new Error('No valid component found. Ensure code has "export default" or "const Component".');
          }
          
          console.log('[Canvas] Rendering component...');
          
          const root = window.ReactDOM.createRoot(rootElement);
          root.render(createElement(Component));
          
          console.log('[Canvas] ✅ Render complete');
          
        } catch (error) {
          console.error('[Canvas] Error:', error);
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
          // Cross-origin script error - ignore
          return;
        }
        console.error('[Canvas] Global error:', event.error);
        if (!hasError) {
          showError('Runtime Error', event.message + '\\n\\nLine: ' + event.lineno + ', Column: ' + event.colno);
        }
      });
      
      window.addEventListener('unhandledrejection', function(event) {
        console.error('[Canvas] Unhandled rejection:', event.reason);
        if (!hasError) {
          showError('Promise Rejection', String(event.reason?.message || event.reason));
        }
      });
    })();
  </script>
</body>
</html>`
    };
    
  } catch (error) {
    return {
      html: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
