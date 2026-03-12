/**
 * Runtime Bundler V2 - Universal Module Resolution
 * 
 * Features:
 * - Three-tier module resolution (Core → CDN → Proxy)
 * - Automatic import parsing and injection
 * - Local/hosted module support
 * - Module caching
 * - Production-grade error handling
 */

import { parseImports, resolveModules, generateModuleInjectionCode } from './moduleResolver';

interface BundleResult {
  html: string;
  error?: string;
}

interface BundleOptions {
  localModules?: Record<string, { localPath?: string; hostedUrl?: string }>;
  isProduction?: boolean;
}

/**
 * Remove import statements from code
 */
function removeImports(code: string): string {
  const lines = code.split('\n');
  const cleanLines: string[] = [];
  let inImportBlock = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('import ')) {
      inImportBlock = true;
      if (trimmed.includes(';') || (trimmed.includes('from') && trimmed.includes('"'))) {
        inImportBlock = false;
      }
      continue;
    }
    
    if (inImportBlock) {
      if (trimmed.includes(';') || trimmed.includes('from')) {
        inImportBlock = false;
      }
      continue;
    }
    
    cleanLines.push(line);
  }
  
  return cleanLines.join('\n');
}

/**
 * Process exports and find component name
 */
function processExports(code: string): { cleanCode: string; componentName: string | null } {
  let cleanCode = code;
  let componentName: string | null = null;
  
  // Find export default
  const exportMatch = cleanCode.match(/export\s+default\s+(?:function\s+)?([A-Z][a-zA-Z0-9]*)/);
  if (exportMatch) {
    componentName = exportMatch[1];
  }
  
  // Remove export keywords
  cleanCode = cleanCode.replace(/export\s+default\s+function\s+/g, 'function ');
  cleanCode = cleanCode.replace(/export\s+default\s+/g, '');
  cleanCode = cleanCode.replace(/export\s+/g, '');
  
  // Fallback: find first component
  if (!componentName) {
    const lines = cleanCode.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
      if (match) {
        componentName = match[1];
        break;
      }
    }
  }
  
  // Add return statement
  if (componentName) {
    cleanCode = cleanCode.replace(new RegExp(`return\\s+${componentName};?`, 'g'), '');
    cleanCode += `\nreturn ${componentName};`;
  }
  
  return { cleanCode: cleanCode.trim(), componentName };
}

/**
 * Generate bundled preview HTML with universal module resolution
 */
export async function generateBundledPreviewV2(
  code: string, 
  language: string,
  options: BundleOptions = {}
): Promise<BundleResult> {
  const isReact = ['tsx', 'jsx', 'typescript', 'javascript', 'ts', 'js'].includes(language);
  
  if (!isReact) {
    return {
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><div style="padding:20px;color:orange">Not a React component</div></body></html>`
    };
  }
  
  try {
    // Step 1: Parse imports
    const imports = parseImports(code);
    console.log('[Runtime Bundler V2] Parsed imports:', imports);
    
    // Step 2: Resolve all modules
    const modulesToResolve = imports.map(imp => ({
      name: imp.source,
      config: {
        localModulePath: options.localModules?.[imp.source]?.localPath,
        hostedModuleUrl: options.localModules?.[imp.source]?.hostedUrl,
        isProduction: options.isProduction
      }
    }));
    
    const resolvedModules = await resolveModules(modulesToResolve);
    console.log('[Runtime Bundler V2] Resolved modules:', Object.keys(resolvedModules));
    
    // Step 3: Remove imports and process exports
    const codeWithoutImports = removeImports(code);
    const { cleanCode, componentName } = processExports(codeWithoutImports);
    
    if (!componentName) {
      throw new Error('No valid React component found');
    }
    
    // Step 4: Generate module injection code
    const moduleInjectionCode = generateModuleInjectionCode(resolvedModules, imports);
    
    // Step 5: Wrap code with module injection
    const wrappedCode = `
(function() {
  const React = window.React;
  const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, createContext } = React;
  
  // Inject resolved modules
  const modules = ${JSON.stringify(Object.keys(resolvedModules).reduce((acc, key) => {
    acc[key] = '__MODULE_PLACEHOLDER__';
    return acc;
  }, {} as Record<string, string>))};
  
  ${moduleInjectionCode}
  
  // User code
  ${cleanCode}
})()
    `.trim();
    
    const encoded = encodeURIComponent(wrappedCode);
    
    return {
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
  <script src="https://unpkg.com/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; }
    #root { min-height: 100vh; }
    .error-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.95); color: white;
      padding: 30px; font-family: monospace; font-size: 14px; overflow: auto; z-index: 9999;
    }
    .error-title { color: #ef4444; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
    .error-content { background: #1f2937; padding: 20px; border-left: 4px solid #ef4444; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      let hasError = false;
      let loadAttempts = 0;
      
      function showError(title, message) {
        if (hasError) return;
        hasError = true;
        const overlay = document.createElement('div');
        overlay.className = 'error-overlay';
        overlay.innerHTML = '<div class="error-title">' + title + '</div><div class="error-content">' + String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
        document.body.appendChild(overlay);
      }
      
      function checkLibrariesLoaded() {
        loadAttempts++;
        if (window.React && window.ReactDOM && window.Babel && window.Motion && window.axios) {
          initComponent();
        } else if (loadAttempts >= 50) {
          showError('Library Loading Timeout', 'Failed to load required libraries from CDN. Libraries loaded: ' + 
            'React=' + !!window.React + ', ReactDOM=' + !!window.ReactDOM + ', Babel=' + !!window.Babel + 
            ', Motion=' + !!window.Motion + ', axios=' + !!window.axios);
        } else {
          setTimeout(checkLibrariesLoaded, 100);
        }
      }
      
      function initComponent() {
        try {
          const rootElement = document.getElementById('root');
          const sourceCode = decodeURIComponent("${encoded}");
          
          const compiled = window.Babel.transform(sourceCode, {
            presets: ['react', 'typescript'],
            filename: 'component.tsx'
          });
          
          const Component = eval(compiled.code);
          
          if (typeof Component !== 'function') {
            throw new Error('No valid component found. Expected a function, got: ' + typeof Component);
          }
          
          const root = window.ReactDOM.createRoot(rootElement);
          root.render(React.createElement(Component));
        } catch (error) {
          showError('Component Error', error.message + '\\n\\nStack: ' + error.stack);
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkLibrariesLoaded);
      } else {
        checkLibrariesLoaded();
      }
      
      window.addEventListener('error', function(event) {
        if (!hasError && event.message !== 'Script error.') {
          showError('Runtime Error', event.message + '\\n\\nFile: ' + event.filename + '\\nLine: ' + event.lineno);
        }
      });
      
      window.addEventListener('unhandledrejection', function(event) {
        if (!hasError) {
          showError('Unhandled Promise Rejection', event.reason);
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

// Export original function for backward compatibility
export { generateBundledPreview } from './runtimeBundler';
