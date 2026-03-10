import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import { applyPatch } from "diff"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

// Load from parent directory .env.local
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env.local') })
}

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))

const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

if (!GROQ_API_KEY) {
  console.error("ERROR: VITE_GROQ_API_KEY not found in .env.local")
  console.error("Checked path:", envPath)
  console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('GROQ')))
  process.exit(1)
}

console.log("✓ Groq API Key loaded successfully")

let fileCode = `function hello(){
console.log("hello")
}`

app.post("/edit", async (req, res) => {
  try {
    const { instruction, files, currentFile } = req.body

    if (!instruction) {
      return res.status(400).json({ error: "Missing instruction" })
    }

    // Build working set context from all files
    let filesContext = ''
    if (files && Object.keys(files).length > 0) {
      filesContext = '\n\nWorking Set Files:\n'
      Object.entries(files).forEach(([filename, content]) => {
        filesContext += `\n--- ${filename} ---\n${content}\n`
      })
    }

    const prompt = `You are a code generator that creates multiple files at once.

Instruction: ${instruction}
${filesContext}

Generate complete, working code for all required files. Return your response in this format:

FILE: filename1.ext
<code content>

FILE: filename2.ext
<code content>

FILE: filename3.ext
<code content>

Important:
- Include FILE: header for each file
- Return ONLY the code, no explanations
- Create all necessary files in one response`

    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8192
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Groq API error:", response.status, error)
      return res.status(response.status).json({ error: "Groq API error", status: response.status })
    }

    const data = await response.json()
    let responseText = data.choices[0].message.content.trim()
    
    // Parse multi-file response
    const fileRegex = /FILE:\s*([^\n]+)\n([\s\S]*?)(?=FILE:|$)/g
    const parsedFiles = {}
    let match
    
    while ((match = fileRegex.exec(responseText)) !== null) {
      const filename = match[1].trim()
      let content = match[2].trim()
      
      // Remove markdown code blocks if present
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:javascript|jsx|typescript|tsx|html|css|json)?\n?/, '').replace(/\n?```$/, '')
      }
      
      parsedFiles[filename] = content.trim()
    }
    
    // If no multi-file format detected, treat as single file
    if (Object.keys(parsedFiles).length === 0) {
      let code = responseText
      if (code.startsWith('```')) {
        code = code.replace(/^```(?:javascript|jsx|typescript|tsx|html|css|json)?\n?/, '').replace(/\n?```$/, '')
      }
      
      res.json({ 
        code: code.trim(),
        message: `✓ Generated code`
      })
    } else {
      console.log(`Generated ${Object.keys(parsedFiles).length} files`)
      res.json({ 
        files: parsedFiles,
        message: `✓ Generated ${Object.keys(parsedFiles).length} files`
      })
    }
  } catch (error) {
    console.error("Server error:", error)
    res.status(500).json({ error: error.message })
  }
})

app.get("/health", (req, res) => {
  res.json({ status: "ok", groqConfigured: !!GROQ_API_KEY })
})

// ============================================================================
// ENHANCED RUNTIME BUNDLER - Multi-file component support
// ============================================================================

/**
 * Parse imports from code
 */
function parseImports(code) {
  const imports = []
  const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/gm
  
  let match
  while ((match = importRegex.exec(code)) !== null) {
    imports.push({
      path: match[1],
      statement: match[0]
    })
  }
  
  return imports
}

/**
 * Resolve relative import to actual file path
 */
function resolveImportPath(importPath, fromFile, files) {
  if (!importPath.startsWith('.')) return null
  
  const fromParts = fromFile.split('/')
  fromParts.pop()
  const fromDir = fromParts
  
  const importParts = importPath.split('/')
  const resolved = [...fromDir]
  
  for (const part of importParts) {
    if (part === '..') {
      resolved.pop()
    } else if (part !== '.') {
      resolved.push(part)
    }
  }
  
  let resolvedPath = resolved.join('/')
  
  const extensions = ['', '.tsx', '.ts', '.jsx', '.js']
  for (const ext of extensions) {
    const testPath = resolvedPath + ext
    if (files[testPath]) return testPath
  }
  
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const testPath = resolvedPath + '/index' + ext
    if (files[testPath]) return testPath
  }
  
  return null
}

/**
 * Build dependency graph
 */
function buildDependencyGraph(files, entryFile) {
  const graph = {}
  const visited = new Set()
  
  function traverse(filePath) {
    if (visited.has(filePath)) return
    visited.add(filePath)
    
    const code = files[filePath]
    if (!code) return
    
    const imports = parseImports(code)
    graph[filePath] = {
      code,
      imports: [],
      dependencies: []
    }
    
    for (const imp of imports) {
      const resolvedPath = resolveImportPath(imp.path, filePath, files)
      
      if (resolvedPath) {
        graph[filePath].imports.push({
          original: imp.path,
          resolved: resolvedPath,
          statement: imp.statement
        })
        graph[filePath].dependencies.push(resolvedPath)
        traverse(resolvedPath)
      } else {
        graph[filePath].imports.push({
          original: imp.path,
          resolved: null,
          statement: imp.statement,
          external: true
        })
      }
    }
  }
  
  traverse(entryFile)
  return graph
}

/**
 * Generate bundled HTML with virtual module system
 */
function generateBundledHTML(files, entryFile) {
  const graph = buildDependencyGraph(files, entryFile)
  
  // Encode all files as base64 for Babel transpilation
  const fileDefinitions = []
  
  for (const [filePath, info] of Object.entries(graph)) {
    let transformedCode = info.code
    
    // Remove CSS imports
    transformedCode = transformedCode.replace(/import\s+['"][^'"]+\.css['"];?/gm, '')
    
    // Replace relative imports with require calls
    for (const imp of info.imports) {
      if (!imp.external && imp.resolved) {
        const importMatch = imp.statement.match(/import\s+(.*?)\s+from/)
        if (importMatch) {
          const importClause = importMatch[1].trim()
          
          if (importClause.startsWith('{')) {
            const replacement = `const ${importClause} = __require('${imp.resolved}');`
            transformedCode = transformedCode.replace(imp.statement, replacement)
          } else if (importClause.includes('* as')) {
            const nsMatch = importClause.match(/\*\s+as\s+(\w+)/)
            if (nsMatch) {
              const replacement = `const ${nsMatch[1]} = __require('${imp.resolved}');`
              transformedCode = transformedCode.replace(imp.statement, replacement)
            }
          } else {
            const replacement = `const ${importClause} = __require('${imp.resolved}').default || __require('${imp.resolved}');`
            transformedCode = transformedCode.replace(imp.statement, replacement)
          }
        }
      }
    }
    
    // Encode for safe embedding
    const encoded = Buffer.from(transformedCode, 'utf8').toString('base64')
    fileDefinitions.push(`  '${filePath}': '${encoded}'`)
  }
  
  const filesObject = '{\n' + fileDefinitions.join(',\n') + '\n  }'
  
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
        // Decode base64 to UTF-8
        function b64ToUtf8(b64) {
          return decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
        }
        
        // Encoded files
        const encodedFiles = ${filesObject};
        
        // Virtual module system
        const __modules = {};
        
        // Custom require function
        function __require(path) {
          if (__modules[path]) {
            return __modules[path];
          }
          
          if (!encodedFiles[path]) {
            throw new Error('Module not found: ' + path);
          }
          
          try {
            const sourceCode = b64ToUtf8(encodedFiles[path]);
            
            // Transform with Babel using env preset for module transformation
            const result = Babel.transform(sourceCode, { 
              presets: [
                ['env', { modules: 'commonjs' }],
                'react',
                'typescript'
              ],
              filename: path 
            });
            
            let compiled = result.code;
            
            // If Babel didn't convert exports, do it manually
            if (compiled.includes('export default')) {
              // Replace export default with module.exports
              compiled = compiled.replace(/export\s+default\s+/g, 'module.exports = ');
            }
            
            if (compiled.includes('export ')) {
              // Replace other exports
              compiled = compiled.replace(/export\s+\{([^}]+)\}/g, function(match, exports) {
                const items = exports.split(',').map(e => e.trim());
                return items.map(item => {
                  const parts = item.split(' as ');
                  const name = parts[0].trim();
                  const alias = parts[1] ? parts[1].trim() : name;
                  return 'exports.' + alias + ' = ' + name + ';';
                }).join(' ');
              });
              
              compiled = compiled.replace(/export\s+(const|let|var|function|class)\s+(\w+)/g, '$1 $2; exports.$2 = $2;');
            }
            
            // Execute in module context
            const exports = {};
            const module = { exports };
            
            // Provide React with named exports for destructuring
            const React = window.React;
            React.useState = window.React.useState;
            React.useEffect = window.React.useEffect;
            React.useContext = window.React.useContext;
            React.useReducer = window.React.useReducer;
            React.useCallback = window.React.useCallback;
            React.useMemo = window.React.useMemo;
            React.useRef = window.React.useRef;
            React.useImperativeHandle = window.React.useImperativeHandle;
            React.useLayoutEffect = window.React.useLayoutEffect;
            React.useDebugValue = window.React.useDebugValue;
            
            // Create a custom require function for this module
            const moduleRequire = function(moduleName) {
              if (moduleName === 'react') {
                return React;
              }
              if (moduleName === 'react-dom') {
                return window.ReactDOM;
              }
              if (moduleName === 'lucide-react') {
                // Mock lucide-react icons with simple SVG components
                const mockIcon = (name) => function MockIcon({ size = 24, className = '', ...props }) {
                  return React.createElement('svg', {
                    width: size,
                    height: size,
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    className: className,
                    ...props
                  }, React.createElement('title', null, name));
                };
                
                return {
                  Heart: mockIcon('Heart'),
                  Star: mockIcon('Star'),
                  Zap: mockIcon('Zap'),
                  Mail: mockIcon('Mail'),
                  Lock: mockIcon('Lock'),
                  User: mockIcon('User'),
                  Menu: mockIcon('Menu'),
                  X: mockIcon('X'),
                  ChevronRight: mockIcon('ChevronRight'),
                  ChevronLeft: mockIcon('ChevronLeft'),
                  Check: mockIcon('Check'),
                  AlertCircle: mockIcon('AlertCircle')
                };
              }
              if (moduleName === 'wouter') {
                // Mock wouter with simple components
                return {
                  Link: function Link({ to, children, className, ...props }) {
                    return React.createElement('a', {
                      href: to,
                      className: className,
                      onClick: (e) => { e.preventDefault(); console.log('Navigate to:', to); },
                      ...props
                    }, children);
                  },
                  Route: function Route({ path, children }) {
                    return React.createElement('div', null, children);
                  },
                  useLocation: function useLocation() {
                    return ['/', () => {}];
                  }
                };
              }
              if (moduleName === 'framer-motion') {
                // Mock framer-motion with basic components
                const motionProxy = new Proxy({}, {
                  get: (target, prop) => {
                    // Return a component for any HTML element (motion.div, motion.img, etc.)
                    return React.forwardRef(function MotionComponent({ 
                      children, 
                      initial, 
                      animate, 
                      exit, 
                      transition, 
                      variants,
                      custom,
                      whileHover,
                      whileTap,
                      ...props 
                    }, ref) {
                      // Filter out animation props that aren't valid HTML attributes
                      const htmlProps = { ...props, ref };
                      
                      // Remove animation-specific props
                      delete htmlProps.initial;
                      delete htmlProps.animate;
                      delete htmlProps.exit;
                      delete htmlProps.transition;
                      delete htmlProps.variants;
                      delete htmlProps.custom;
                      delete htmlProps.whileHover;
                      delete htmlProps.whileTap;
                      
                      // Render as regular HTML element, ignoring animations
                      try {
                        return React.createElement(String(prop), htmlProps, children);
                      } catch (e) {
                        console.error('Error rendering motion.' + prop, e);
                        return React.createElement('div', htmlProps, children);
                      }
                    });
                  }
                });
                
                return {
                  motion: motionProxy,
                  AnimatePresence: function AnimatePresence({ children, initial, custom, mode }) {
                    // Just render children without animation
                    // AnimatePresence is a wrapper that doesn't render anything itself
                    return children;
                  },
                  useAnimation: function useAnimation() {
                    return { 
                      start: () => Promise.resolve(), 
                      stop: () => {} 
                    };
                  },
                  useMotionValue: function useMotionValue(initial) {
                    return { 
                      get: () => initial, 
                      set: () => {},
                      on: () => () => {}
                    };
                  },
                  useTransform: function useTransform(value, input, output) {
                    return value;
                  },
                  useViewportScroll: function useViewportScroll() {
                    return { scrollX: { get: () => 0 }, scrollY: { get: () => 0 } };
                  }
                };
              }
              // For relative imports, use __require
              return __require(moduleName);
            };
            
            const moduleFunc = new Function('module', 'exports', 'require', '__require', 'React', 'ReactDOM', compiled);
            moduleFunc(module, exports, moduleRequire, __require, React, window.ReactDOM);
            
            // Cache the module
            const moduleResult = module.exports || exports.default || exports;
            
            // Debug: log what we're returning
            console.log('Module loaded:', path, 'Type:', typeof moduleResult, 'Keys:', Object.keys(moduleResult || {}));
            
            __modules[path] = moduleResult;
            return __modules[path];
            
          } catch (err) {
            console.error('Error in ' + path + ':', err);
            console.error('Source:', b64ToUtf8(encodedFiles[path]));
            throw new Error('Runtime error in ' + path + ': ' + err.message);
          }
        }
        
        // Load entry module
        let Component = __require('${entryFile}');
        
        // Handle different export patterns
        if (Component && typeof Component === 'object' && Component.default) {
          Component = Component.default;
        }
        
        console.log('Final component:', typeof Component, Component);
        
        if (!Component) {
          document.getElementById('root').innerHTML = '<div class="error-display">⚠ No component found to render.<br><br>Make sure your file exports a default component.</div>';
        } else if (typeof Component !== 'function') {
          document.getElementById('root').innerHTML = '<div class="error-display">⚠ Invalid component.<br><br>Expected a function or class component, got: ' + typeof Component + '<br><br>Value: ' + JSON.stringify(Object.keys(Component || {})) + '</div>';
        } else {
          try {
            const root = window.ReactDOM.createRoot(document.getElementById('root'));
            const element = window.React.createElement(Component);
            console.log('Created element:', element);
            root.render(element);
          } catch (renderErr) {
            console.error('Render error:', renderErr);
            document.getElementById('root').innerHTML = '<div class="error-display">⚠ Render Error<br><br>' + String(renderErr.message || renderErr) + '<br><br>' + String(renderErr.stack || '') + '</div>';
          }
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
</html>`
  
  return html
}

// Enhanced runtime bundler endpoint
app.post('/runtime-bundle', (req, res) => {
  try {
    const { files: postedFiles, entry, code } = req.body || {}
    
    // Single file mode (backwards compatible)
    if (code && typeof code === 'string' && !postedFiles) {
      const tempFiles = { 'component.tsx': code }
      const html = generateBundledHTML(tempFiles, 'component.tsx')
      return res.json({ html })
    }
    
    // Multi-file mode
    if (!postedFiles || typeof postedFiles !== 'object') {
      return res.status(400).json({ error: 'No files provided' })
    }
    
    let entryFile = entry
    
    if (!entryFile) {
      const fileKeys = Object.keys(postedFiles)
      if (fileKeys.length === 0) {
        return res.status(400).json({ error: 'No files provided' })
      }
      
      entryFile = fileKeys.find(key => {
        const content = postedFiles[key]
        return /export\s+default\s+/m.test(content)
      })
      
      if (!entryFile) {
        entryFile = fileKeys[0]
      }
    }
    
    if (!postedFiles[entryFile]) {
      return res.status(400).json({ error: `Entry file not found: ${entryFile}` })
    }
    
    const html = generateBundledHTML(postedFiles, entryFile)
    
    return res.json({ html })
    
  } catch (error) {
    console.error('runtime-bundle error:', error)
    return res.status(500).json({ 
      error: error.message || String(error),
      stack: error.stack
    })
  }
})

// Backwards-compatible alias
app.post('/bundle', (req, res) => {
  try {
    const { files: postedFiles, entry, code } = req.body || {}
    let entryCode = ''

    if (code && typeof code === 'string') {
      entryCode = code
    } else if (postedFiles && entry && postedFiles[entry]) {
      entryCode = postedFiles[entry]
    } else if (postedFiles && Object.keys(postedFiles).length > 0) {
      const firstKey = Object.keys(postedFiles)[0]
      entryCode = postedFiles[firstKey]
    } else {
      return res.status(400).json({ error: 'No code or files provided' })
    }

    const safeCode = String(entryCode).replace(/<\/script>/gi, '<\\/script>')
    const encoded = Buffer.from(safeCode, 'utf8').toString('base64')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script><style>body{margin:0;font-family:Inter,system-ui,Arial,sans-serif}#root{padding:20px}</style></head><body><div id="root"></div><script>(function(){try;function b64ToUtf8(b64){return decodeURIComponent(Array.prototype.map.call(atob(b64),function(c){return'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)}).join(''))}const sourceCode=b64ToUtf8('${encoded}');const compiled=Babel.transform(sourceCode,{presets:['react','typescript'],filename:'component.tsx'}).code;const execute=new Function('React','ReactDOM',compiled+'\nreturn typeof Component !== "undefined" ? Component : null;');const Component=execute(window.React,window.ReactDOM);if(!Component){document.getElementById('root').innerHTML='<div style="color:orange">No component found to render</div>'}else{const root=window.ReactDOM.createRoot(document.getElementById('root'));root.render(React.createElement(Component))}}catch(err){document.getElementById('root').innerHTML='<pre style="color:red">'+String(err.message||err)+'\n'+String(err.stack||'')+'</pre>';console.error('Bundler exec error',err)}})();</script></body></html>`
    return res.json({ html })
  } catch (error) {
    console.error('bundle alias error', error)
    return res.status(500).json({ error: error.message || String(error) })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✓ AI Code Editor running on http://localhost:${PORT}`)
  console.log(`✓ Groq API configured: ${GROQ_API_KEY ? 'Yes' : 'No'}`)
})
