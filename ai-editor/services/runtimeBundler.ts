/**
 * Runtime Bundler Service - Production Ready (copied into ai-editor/services)
 * Handles TSX/JSX compilation with proper error handling
 */

interface BundleResult {
  html: string;
  error?: string;
}

function parseImports(code: string): Array<{source: string; specifiers: string[]}> {
  const imports: Array<{source: string; specifiers: string[]}> = [];
  const importRegex = /import\s+(?:(\w+)|(?:\{([^}]+)\}))\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(code)) !== null) {
    const [, defaultImport, namedImports, source] = match as any;
    const specifiers: string[] = [];
    if (defaultImport) specifiers.push(defaultImport);
    if (namedImports) {
      namedImports.split(',').forEach(name => {
        const cleaned = name.trim().split(/\s+as\s+/).pop()?.trim();
        if (cleaned && cleaned.length > 0) specifiers.push(cleaned);
      });
    }
    const uniqueSpecifiers = [...new Set(specifiers)];
    imports.push({ source, specifiers: uniqueSpecifiers });
  }
  return imports;
}

function transformCode(code: string, imports: Array<{source: string; specifiers: string[]}>): string {
  let transformed = code;
  const lines = transformed.split('\n');
  const cleanedLines: string[] = [];
  let inImportBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ')) {
      inImportBlock = true;
      if (line.includes(';') || (line.includes('from') && line.includes('"') && (line.match(/"/g) || []).length === 2)) {
        inImportBlock = false;
        continue;
      }
      continue;
    }
    if (inImportBlock) {
      if (line.includes(';') || line.includes('from')) inImportBlock = false;
      continue;
    }
    cleanedLines.push(lines[i]);
  }
  transformed = cleanedLines.join('\n');

  const injections: string[] = [];
  const injectedNames = new Set<string>();
  imports.forEach(imp => {
    imp.specifiers.forEach(spec => {
      if (injectedNames.has(spec) || !spec || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(spec)) return;
      injectedNames.add(spec);
      if (spec === 'Link') {
        injections.push(`const Link = ({ to, href, children, ...props }) => React.createElement('a', { href: to || href || '#', className: 'text-blue-600 hover:underline', ...props }, children);`);
      } else if (spec === 'Button') {
        injections.push(`const Button = ({ children, className = '', ...props }) => React.createElement('button', { className: 'px-4 py-2 bg-blue-500 text-white rounded ' + className, ...props }, children);`);
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
  transformed = transformed
    .replace(/export\s+default\s+function\s+(\w+)/m, 'const Component = function $1')
    .replace(/export\s+default\s+/m, 'const Component = ');
  return transformed.trim();
}

function isReactComponent(code: string): boolean {
  return (
    (/(?:function|const|class)\s+\w+/.test(code) && (/<[A-Z]/.test(code) || /jsx/.test(code))) ||
    /export\s+default/.test(code) ||
    /React\.createElement/.test(code)
  );
}

export function generateBundledPreview(code: string, language: string): BundleResult {
  const isReact = ['tsx', 'jsx', 'typescript', 'javascript', 'ts', 'js'].includes(language);
  if (!isReact || !isReactComponent(code)) {
    return {
      html: `<!DOCTYPE html>\n<html><head><meta charset=\"UTF-8\"><style>body{margin:20px;font-family:monospace}</style></head><body><div style=\"padding:20px;color:orange;border:2px solid orange\"><strong>Not a React Component</strong><br/>Expected: Function with JSX or export default</div></body></html>`
    };
  }

  try {
    let fixedCode = code;
    fixedCode = fixedCode.replace(/\bdefault\s+export\s+/g, 'export default ');
    fixedCode = fixedCode.replace(/\bexport\s+function\s+default\s+/g, 'export default function ');
      const imports = parseImports(fixedCode);

      // Detect lucide-react imports (named and namespace) so we can map them to UMD global
      const lucideNamed: string[] = []
      const lucideNamespaces: string[] = []
      let m: RegExpExecArray | null
      const namedRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g
      while ((m = namedRegex.exec(fixedCode)) !== null) {
        const names = (m[1] || '').split(',').map(s => s.trim().split(/\s+as\s+/).pop()?.trim()).filter(Boolean) as string[]
        lucideNamed.push(...names)
      }
      const namespaceRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]lucide-react['"]/g
      while ((m = namespaceRegex.exec(fixedCode)) !== null) {
        lucideNamespaces.push(m[1])
      }

      // Transform code (this will remove import lines and inject placeholders)
      let transformedCode = transformCode(fixedCode, imports)

      // Inject lucide mappings: prefer real UMD global when available, otherwise fall back to noop placeholders
      const lucideInjections: string[] = []
      lucideNamespaces.forEach(ns => {
        lucideInjections.push(`const ${ns} = window.lucideReact || {};`)
      })
      lucideNamed.forEach(name => {
        // ensure valid identifier
        if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) return
        lucideInjections.push(`const ${name} = (window.lucideReact && window.lucideReact['${name}']) ? window.lucideReact['${name}'] : (props => React.createElement('svg', Object.assign({ width: 24, height: 24 }, props)));`)
      })

      if (lucideInjections.length > 0) {
        transformedCode = lucideInjections.join('\n') + '\n' + transformedCode
      }

    return {
      html: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <script crossorigin src=\"https://unpkg.com/react@18/umd/react.production.min.js\"></script>\n  <script crossorigin src=\"https://unpkg.com/react-dom@18/umd/react-dom.production.min.js\"></script>\n  <script src=\"https://unpkg.com/@babel/standalone/babel.min.js\"></script>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n  <style>body { margin: 0; padding: 0; } #root { min-height: 100vh; } .error-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); color: white; padding: 30px; font-family: 'Courier New', monospace; font-size: 14px; overflow: auto; z-index: 9999; line-height: 1.6; } .error-title { color: #ef4444; font-size: 20px; font-weight: bold; margin-bottom: 20px; } .error-content { background: #1f2937; padding: 20px; border-left: 4px solid #ef4444; margin-bottom: 20px; white-space: pre-wrap; } .error-tip { color: #9ca3af; margin-top: 20px; font-size: 13px; }</style>\n</head>\n<body>\n  <div id=\"root\"></div>\n  <script>\n    (function() {\n      let hasError = false;\n      let loadAttempts = 0;\n      const maxLoadAttempts = 50;\n      function showError(title, message) {\n        if (hasError) return; hasError = true; console.error('[Canvas]', title, message); const overlay = document.createElement('div'); overlay.className = 'error-overlay'; overlay.innerHTML = '<div class=\"error-title\">' + title + '</div>' + '<div class=\"error-content\">' + String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>' + '<div class=\"error-tip\">💡 Open browser console (F12) for more details</div>'; document.body.appendChild(overlay); }\n      function checkLibrariesLoaded() {\n        loadAttempts++;\n        if (window.React && window.ReactDOM && window.Babel) {\n          initComponent();\n        } else if (loadAttempts >= maxLoadAttempts) {\n          showError('Library Loading Timeout', 'Failed to load React, ReactDOM, or Babel from CDN.\\n\\nPossible causes:\\n• Ad blocker blocking unpkg.com\\n• Slow internet connection\\n• Corporate firewall\\\\nTry:\\n1. Disable ad blocker\\n2. Check internet connection\\n3. Try a different browser');\n        } else {\n          setTimeout(checkLibrariesLoaded, 100);\n        }\n      }\n      function initComponent() {\n        try {\n          const rootElement = document.getElementById('root'); if (!rootElement) throw new Error('Root element not found'); const motionScript = document.createElement('script'); motionScript.src = 'https://unpkg.com/framer-motion@11/dist/framer-motion.js'; motionScript.onerror = () => console.warn('[Canvas] Framer Motion not loaded'); document.head.appendChild(motionScript); const { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, createElement, Fragment } = window.React; const sourceCode = ${JSON.stringify(transformedCode)}; const compiled = window.Babel.transform(sourceCode, { presets: ['react', 'typescript'], filename: 'component.tsx' }); const executeCode = new Function('React', 'ReactDOM', 'createElement', 'Fragment', 'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext', 'useReducer', compiled.code + '\\nreturn typeof Component !== "undefined" ? Component : null;'); const Component = executeCode(window.React, window.ReactDOM, createElement, Fragment, useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer); if (!Component || typeof Component !== 'function') { throw new Error('No valid component found. Ensure code has "export default" or "const Component".'); } const root = window.ReactDOM.createRoot(rootElement); root.render(createElement(Component)); } catch (error) { console.error('[Canvas] Error:', error); showError('Component Error', error.message + '\\n\\n' + (error.stack || '')); } }\n      if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', checkLibrariesLoaded); } else { checkLibrariesLoaded(); }\n      window.addEventListener('error', function(event) { if (event.message === 'Script error.') return; console.error('[Canvas] Global error:', event.error); if (!hasError) { showError('Runtime Error', event.message + '\\n\\nLine: ' + event.lineno + ', Column: ' + event.colno); } });\n      window.addEventListener('unhandledrejection', function(event) { console.error('[Canvas] Unhandled rejection:', event.reason); if (!hasError) { showError('Promise Rejection', String(event.reason?.message || event.reason)); } });\n    })();\n  </script>\n</body>\n</html>`
    };
  } catch (error) {
    return { html: '', error: error instanceof Error ? error.message : String(error) };
  }
}
