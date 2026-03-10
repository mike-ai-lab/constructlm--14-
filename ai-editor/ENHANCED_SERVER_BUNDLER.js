/**
 * ENHANCED SERVER BUNDLER
 * 
 * This replaces the existing /runtime-bundle endpoint in server.js
 * Handles multi-file components with proper import resolution
 */

/**
 * Parse imports from code
 */
function parseImports(code) {
  const imports = [];
  const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/gm;
  
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push({
      path: match[1],
      statement: match[0]
    });
  }
  
  return imports;
}

/**
 * Resolve relative import to actual file path
 */
function resolveImportPath(importPath, fromFile, files) {
  // External imports (not relative)
  if (!importPath.startsWith('.')) {
    return null;
  }
  
  // Get directory of importing file
  const fromParts = fromFile.split('/');
  fromParts.pop(); // Remove filename
  const fromDir = fromParts;
  
  // Resolve relative path
  const importParts = importPath.split('/');
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

/**
 * Build dependency graph
 */
function buildDependencyGraph(files, entryFile) {
  const graph = {};
  const visited = new Set();
  
  function traverse(filePath) {
    if (visited.has(filePath)) return;
    visited.add(filePath);
    
    const code = files[filePath];
    if (!code) return;
    
    const imports = parseImports(code);
    graph[filePath] = {
      code,
      imports: [],
      dependencies: []
    };
    
    for (const imp of imports) {
      const resolvedPath = resolveImportPath(imp.path, filePath, files);
      
      if (resolvedPath) {
        graph[filePath].imports.push({
          original: imp.path,
          resolved: resolvedPath,
          statement: imp.statement
        });
        graph[filePath].dependencies.push(resolvedPath);
        traverse(resolvedPath);
      } else {
        // External import
        graph[filePath].imports.push({
          original: imp.path,
          resolved: null,
          statement: imp.statement,
          external: true
        });
      }
    }
  }
  
  traverse(entryFile);
  return graph;
}

/**
 * Generate bundled HTML with virtual module system
 */
function generateBundledHTML(files, entryFile) {
  const graph = buildDependencyGraph(files, entryFile);
  
  // Build module definitions
  const moduleDefinitions = [];
  
  for (const [filePath, info] of Object.entries(graph)) {
    // Transform code to replace imports with require calls
    let transformedCode = info.code;
    
    // Remove CSS imports
    transformedCode = transformedCode.replace(/import\s+['"][^'"]+\.css['"];?/gm, '');
    
    // Replace relative imports with require calls
    for (const imp of info.imports) {
      if (!imp.external && imp.resolved) {
        // Extract what's being imported
        const importMatch = imp.statement.match(/import\s+(.*?)\s+from/);
        if (importMatch) {
          const importClause = importMatch[1].trim();
          
          // Handle different import styles
          if (importClause.startsWith('{')) {
            // Named imports: import { X, Y } from './file'
            const replacement = `const ${importClause} = __require('${imp.resolved}');`;
            transformedCode = transformedCode.replace(imp.statement, replacement);
          } else if (importClause.includes('* as')) {
            // Namespace import: import * as X from './file'
            const nsMatch = importClause.match(/\*\s+as\s+(\w+)/);
            if (nsMatch) {
              const replacement = `const ${nsMatch[1]} = __require('${imp.resolved}');`;
              transformedCode = transformedCode.replace(imp.statement, replacement);
            }
          } else {
            // Default import: import X from './file'
            const replacement = `const ${importClause} = __require('${imp.resolved}').default || __require('${imp.resolved}');`;
            transformedCode = transformedCode.replace(imp.statement, replacement);
          }
        }
      }
    }
    
    // Wrap in module definition
    const moduleCode = `
__modules['${filePath}'] = (function() {
  const exports = {};
  const module = { exports };
  
  ${transformedCode}
  
  // Handle export default
  if (typeof Component !== 'undefined') {
    exports.default = Component;
  }
  
  return exports;
})();
`;
    
    moduleDefinitions.push(moduleCode);
  }
  
  // Get entry code
  const entryCode = graph[entryFile].code;
  
  // Escape for embedding
  const safeModules = moduleDefinitions.join('\n').replace(/<\/script>/gi, '<\\/script>');
  const safeEntry = entryCode.replace(/<\/script>/gi, '<\\/script>');
  
  // Generate HTML
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { 
      margin: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #000000;
    }
    #root { 
      min-height: 100vh;
      padding: 20px;
    }
    .error-display {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: 16px;
      margin: 20px;
      color: #856404;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      try {
        // Virtual module system
        const __modules = {};
        
        // Custom require function
        function __require(path) {
          if (!__modules[path]) {
            throw new Error('Module not found: ' + path);
          }
          return __modules[path];
        }
        
        // Define all modules
        ${safeModules}
        
        // Execute entry module
        const entryModule = __require('${entryFile}');
        const Component = entryModule.default || entryModule.Component;
        
        if (!Component) {
          document.getElementById('root').innerHTML = '<div class="error-display">⚠ No component found to render.<br><br>Make sure your file exports a default component.</div>';
        } else {
          // Render component
          const root = window.ReactDOM.createRoot(document.getElementById('root'));
          root.render(window.React.createElement(Component));
        }
        
      } catch (err) {
        console.error('Preview error:', err);
        document.getElementById('root').innerHTML = 
          '<div class="error-display">' +
          '<strong>⚠ Preview Error</strong><br><br>' +
          String(err.message || err) + 
          (err.stack ? '<br><br>' + String(err.stack) : '') +
          '</div>';
      }
    })();
  </script>
</body>
</html>`;
  
  return html;
}

/**
 * Enhanced /runtime-bundle endpoint
 * Replace the existing endpoint in server.js with this
 */
function handleRuntimeBundle(req, res) {
  try {
    const { files: postedFiles, entry, code } = req.body || {};
    
    // Single file mode (backwards compatible)
    if (code && typeof code === 'string' && !postedFiles) {
      const tempFiles = { 'component.tsx': code };
      const html = generateBundledHTML(tempFiles, 'component.tsx');
      return res.json({ html });
    }
    
    // Multi-file mode
    if (!postedFiles || typeof postedFiles !== 'object') {
      return res.status(400).json({ error: 'No files provided' });
    }
    
    // Determine entry file
    let entryFile = entry;
    
    if (!entryFile) {
      // Auto-detect entry file
      const fileKeys = Object.keys(postedFiles);
      if (fileKeys.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }
      
      // Find first file with export default
      entryFile = fileKeys.find(key => {
        const content = postedFiles[key];
        return /export\s+default\s+/m.test(content);
      });
      
      if (!entryFile) {
        entryFile = fileKeys[0]; // Fallback to first file
      }
    }
    
    if (!postedFiles[entryFile]) {
      return res.status(400).json({ error: `Entry file not found: ${entryFile}` });
    }
    
    // Generate bundled HTML
    const html = generateBundledHTML(postedFiles, entryFile);
    
    return res.json({ html });
    
  } catch (error) {
    console.error('runtime-bundle error:', error);
    return res.status(500).json({ 
      error: error.message || String(error),
      stack: error.stack
    });
  }
}

// Export for use in server.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleRuntimeBundle,
    parseImports,
    resolveImportPath,
    buildDependencyGraph,
    generateBundledHTML
  };
}
