import express from "express"
import cors from "cors"
import fetch from "node-fetch"
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
  process.exit(1)
}

console.log("✓ Groq API Key loaded successfully")

// ============================================================================
// STRICT SYSTEM PROMPT - Prevents all common React errors
// ============================================================================

const SYSTEM_PROMPT = `You are a React component and project code generator. CRITICAL: Follow these rules EXACTLY or components will crash.

⚠️ RULE 1: EXPORT FORMAT
MUST be: export default function ComponentName() { return <div>...</div>; }
NEVER: export default { render: () => ... }
NEVER: default export function ComponentName() { ... }
NEVER: export { ComponentName as default }

⚠️ RULE 2: RETURN VALUE - MUST ALWAYS BE JSX
✅ return <div>Content</div>;
✅ return <Component />;
✅ return (<div><span>1</span><span>2</span></div>);
❌ return "string"; (CAUSES ERROR #130)
❌ return { content: "..." }; (CAUSES ERROR #130)
❌ return null; (CAUSES ERROR #130)
❌ return undefined; (CAUSES ERROR #130)
❌ return [<div/>, <div/>]; (CAUSES ERROR #130)

⚠️ RULE 3: IMPORTS - ONLY React
✅ import React, { useState } from 'react';
❌ import './styles.css';
❌ import { motion } from 'framer-motion';
❌ import styled from 'styled-components';

⚠️ RULE 4: STATE - ALWAYS initialize
✅ const [count, setCount] = useState(0);
✅ const [text, setText] = useState('');
❌ const [count, setCount] = useState();
❌ const [data, setData] = useState(undefined);

⚠️ RULE 5: STYLES - ONLY inline
✅ const styles = { button: { padding: '10px', color: 'blue' } };
✅ <div style={{ padding: '10px' }}>Content</div>
❌ import './Button.css';
❌ className="btn-primary"

⚠️ RULE 6: IMAGES - ONLY Unsplash (CORS-enabled)
✅ https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop
✅ https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800&h=400&fit=crop
❌ https://via.placeholder.com/300x600?text=Image (FAILS)
❌ https://picsum.photos/1200/600 (FAILS)

⚠️ RULE 7: ASYNC - NEVER in render
✅ useEffect(() => { fetch(...).then(...) }, [])
❌ async function Component() { ... }
❌ const data = await fetch(...);

⚠️ RULE 8: PROJECT STRUCTURE (when creating projects)
FOLDER STRUCTURE:
- components/ - React components (PascalCase)
- pages/ - Page components (PascalCase)
- utils/ - Utility functions (camelCase)
- hooks/ - Custom React hooks (camelCase)
- styles/ - CSS/styling files (kebab-case)
- services/ - API/business logic (camelCase)

FILE NAMING:
- Components: PascalCase (Button.js, Sidebar.js)
- Utilities: camelCase (helpers.js, api.js)
- Hooks: camelCase (useAuth.js, useFetch.js)
- Styles: kebab-case (button-styles.css)

EXAMPLE STRUCTURE:
my-dashboard/
├── components/
│   ├── Sidebar.js
│   ├── Header.js
│   └── Card.js
├── pages/
│   ├── Dashboard.js
│   └── Profile.js
├── utils/
│   ├── helpers.js
│   └── api.js
├── hooks/
│   └── useAuth.js
└── services/
    └── api.js

When generating project files, include full path in comments:
// File: my-dashboard/components/Sidebar.js

TEMPLATE:
\`\`\`javascript
import React, { useState } from 'react';

export default function ComponentName() {
  const [state, setState] = useState(0);
  
  const styles = {
    container: { padding: '20px', backgroundColor: '#f5f5f5' },
    title: { fontSize: '24px', fontWeight: 'bold' }
  };
  
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Content</h1>
    </div>
  );
}
\`\`\`

GENERATE ONLY VALID, WORKING CODE. EVERY COMPONENT MUST RENDER WITHOUT ERRORS.`;

// ============================================================================
// SANITIZATION & VALIDATION
// ============================================================================

function sanitizeCode(code) {
  let sanitized = code;
  
  // Fix: "default export function" -> "export default function"
  sanitized = sanitized.replace(/default\s+export\s+function/g, 'export default function');
  sanitized = sanitized.replace(/default\s+export\s+class/g, 'export default class');
  
  // Remove duplicate React imports
  const reactImports = sanitized.match(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"]\s*;?\n?/gm) || [];
  if (reactImports.length > 1) {
    sanitized = sanitized.replace(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"]\s*;?\n?/gm, '');
    sanitized = "import React, { useState, useEffect } from 'react';\n\n" + sanitized;
  }
  
  // Ensure React import exists
  if (!sanitized.includes('import React') && sanitized.includes('export default function')) {
    sanitized = "import React, { useState, useEffect } from 'react';\n\n" + sanitized;
  }
  
  return sanitized;
}

function validateCode(code, filePath = '') {
  const errors = [];
  
  // Determine file type from path
  const isComponent = filePath.includes('/components/');
  const isPage = filePath.includes('/pages/');
  const isUtil = filePath.includes('/utils/');
  const isService = filePath.includes('/services/');
  const isHook = filePath.includes('/hooks/');
  
  // Check 1: Components and pages MUST have export default function
  if ((isComponent || isPage) && !code.includes('export default function') && !code.includes('export default class')) {
    errors.push('Missing "export default function"');
  }
  
  // Check 2: Must NOT have "default export function"
  if (code.includes('default export function')) {
    errors.push('Invalid: use "export default function" not "default export function"');
  }
  
  // Check 3: Must NOT have CSS imports
  if (/import\s+['"][^'"]*\.css['"]/m.test(code)) {
    errors.push('CSS imports not allowed - use inline styles');
  }
  
  // Check 4: Must NOT have external library imports (except React and react-dom for index files)
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/gm;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const moduleName = match[1];
    if (!moduleName.startsWith('.') && moduleName !== 'react' && moduleName !== 'react-dom') {
      errors.push(`External library not allowed: "${moduleName}"`);
    }
  }
  
  // Check 5: Components must return JSX (not string, object, null)
  if (isComponent || isPage) {
    const returnRegex = /return\s+([^;]+);/gm;
    while ((match = returnRegex.exec(code)) !== null) {
      const returnValue = match[1].trim();
      if (returnValue.startsWith('"') || returnValue.startsWith("'") || returnValue.startsWith('`')) {
        errors.push('Cannot return string - must return JSX');
      }
      if (returnValue === 'null' || returnValue === 'undefined') {
        errors.push('Cannot return null/undefined - must return JSX');
      }
    }
  }
  
  // Check 6: State must be initialized
  if (/useState\(\s*\)/gm.test(code)) {
    errors.push('State must be initialized - useState() is invalid');
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// PROJECT STRUCTURE ANALYZER
// ============================================================================

/**
 * Analyze instruction to determine project structure
 */
function analyzeProjectStructure(instruction) {
  const projectTypes = {
    dashboard: ['components', 'pages', 'utils', 'hooks', 'styles'],
    ecommerce: ['components', 'pages', 'utils', 'hooks', 'styles', 'services'],
    blog: ['components', 'pages', 'utils', 'hooks', 'styles', 'posts'],
    portfolio: ['components', 'pages', 'utils', 'styles'],
    app: ['components', 'pages', 'utils', 'hooks', 'styles', 'services']
  };
  
  // Detect project type from keywords
  let detectedType = 'app';
  const keywords = {
    dashboard: ['dashboard', 'analytics', 'metrics', 'charts', 'graph'],
    ecommerce: ['shop', 'store', 'product', 'cart', 'checkout', 'ecommerce'],
    blog: ['blog', 'post', 'article', 'news', 'content'],
    portfolio: ['portfolio', 'project', 'showcase', 'work']
  };
  
  for (const [type, typeKeywords] of Object.entries(keywords)) {
    if (typeKeywords.some(k => instruction.toLowerCase().includes(k))) {
      detectedType = type;
      break;
    }
  }
  
  return {
    projectType: detectedType,
    folders: projectTypes[detectedType]
  };
}

/**
 * Generate project structure
 */
function generateProjectStructure(projectName, instruction) {
  const { projectType, folders } = analyzeProjectStructure(instruction);
  
  const structure = {};
  folders.forEach(folder => {
    structure[folder] = [];
  });
  
  return {
    projectName,
    projectType,
    structure,
    folders
  };
}

// ============================================================================
// FILE SYSTEM OPERATIONS
// ============================================================================

function writeFilesToDisk(files) {
  try {
    console.log(`📁 Writing ${Object.keys(files).length} files to disk...`);
    console.log(`📍 Base directory: ${__dirname}`);
    
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(__dirname, filePath);
      const dir = path.dirname(fullPath);
      
      console.log(`  Creating directory: ${dir}`);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      console.log(`  Writing file: ${fullPath}`);
      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`  ✓ Created: ${filePath}`);
    }
    
    console.log(`✅ All files written successfully!`);
  } catch (error) {
    console.error(`❌ Error writing files to disk:`, error);
    throw error;
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

app.post("/create-project", async (req, res) => {
  try {
    const { projectName, instruction } = req.body;
    
    if (!projectName || !instruction) {
      return res.status(400).json({ 
        error: "Missing projectName or instruction" 
      });
    }
    
    // Validate project name
    if (!/^[a-z0-9-]+$/.test(projectName)) {
      return res.status(400).json({ 
        error: "Project name must be lowercase alphanumeric with hyphens" 
      });
    }
    
    // Generate structure
    const projectStructure = generateProjectStructure(projectName, instruction);
    
    // Request AI to generate files
    const prompt = `Create a new project called "${projectName}".

Project Type: ${projectStructure.projectType}
Instruction: ${instruction}

Generate all necessary files for this project. Use this folder structure:
${projectStructure.folders.join(', ')}

Return in this format:
FILE: ${projectName}/components/Example.js
<code>

FILE: ${projectName}/pages/Example.js
<code>

Important:
- Create at least 3-5 files
- Use the folder structure provided
- Follow the naming conventions
- Each file must be a valid, working React component
- Use inline styles only
- No CSS imports`;

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8192
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse files from response
    const files = {};
    const fileRegex = /FILE:\s*([^\n]+)\n([\s\S]*?)(?=FILE:|$)/g;
    let match;
    
    console.log(`\n📝 Parsing AI response for files...`);
    while ((match = fileRegex.exec(aiResponse)) !== null) {
      const filePath = match[1].trim();
      let content = match[2].trim();
      
      console.log(`  Found file: ${filePath}`);
      
      // Remove markdown code blocks
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:javascript|jsx|typescript|tsx)?\n?/, '')
                        .replace(/\n?```$/, '');
      }
      
      // Sanitize and validate
      content = sanitizeCode(content);
      const validation = validateCode(content, filePath);
      
      if (!validation.valid) {
        console.warn(`Validation errors in ${filePath}:`, validation.errors);
      }
      
      files[filePath] = content.trim();
    }
    
    console.log(`✅ Parsed ${Object.keys(files).length} files from AI response\n`);
    
    // Save files to disk
    try {
      writeFilesToDisk(files);
    } catch (writeError) {
      console.error('Failed to write files to disk:', writeError);
    }
    
    res.json({
      success: true,
      projectName,
      projectType: projectStructure.projectType,
      structure: projectStructure.structure,
      filesCreated: Object.keys(files).length,
      files: files,
      summary: `✅ Created project "${projectName}" with ${Object.keys(files).length} files in organized structure`
    });
    
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/edit", async (req, res) => {
  try {
    const { instruction, files } = req.body;

    if (!instruction) {
      return res.status(400).json({ error: "Missing instruction" });
    }

    let filesContext = '';
    if (files && Object.keys(files).length > 0) {
      filesContext = '\n\nExisting Files:\n';
      Object.entries(files).forEach(([filename, content]) => {
        filesContext += `\n--- ${filename} ---\n${content}\n`;
      });
    }

    const prompt = `Instruction: ${instruction}
${filesContext}

Generate complete, working React components. Return in this format:

FILE: filename1.tsx
<code>

FILE: filename2.tsx
<code>`;

    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 8192
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", response.status, error);
      return res.status(response.status).json({ error: "Groq API error" });
    }

    const data = await response.json();
    let responseText = data.choices[0].message.content.trim();
    
    // Parse multi-file response
    const fileRegex = /FILE:\s*([^\n]+)\n([\s\S]*?)(?=FILE:|$)/g;
    const parsedFiles = {};
    let match;
    
    while ((match = fileRegex.exec(responseText)) !== null) {
      const filename = match[1].trim();
      let content = match[2].trim();
      
      // Remove markdown code blocks
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:javascript|jsx|typescript|tsx)?\n?/, '').replace(/\n?```$/, '');
      }
      
      // Sanitize and validate
      content = sanitizeCode(content);
      const validation = validateCode(content, filename);
      
      if (!validation.valid) {
        console.warn(`Validation errors in ${filename}:`, validation.errors);
      }
      
      parsedFiles[filename] = content.trim();
    }
    
    // If no multi-file format, treat as single file
    if (Object.keys(parsedFiles).length === 0) {
      let code = responseText;
      if (code.startsWith('```')) {
        code = code.replace(/^```(?:javascript|jsx|typescript|tsx)?\n?/, '').replace(/\n?```$/, '');
      }
      code = sanitizeCode(code);
      
      res.json({ 
        code: code.trim(),
        message: `✓ Generated code`
      });
    } else {
      res.json({ 
        files: parsedFiles,
        message: `✓ Generated ${Object.keys(parsedFiles).length} files`
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", groqConfigured: !!GROQ_API_KEY });
});

// ============================================================================
// RUNTIME BUNDLER
// ============================================================================

function parseImports(code) {
  const imports = [];
  const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/gm;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push({ path: match[1], statement: match[0] });
  }
  return imports;
}

function resolveImportPath(importPath, fromFile, files) {
  if (!importPath.startsWith('.')) return null;
  
  const fromParts = fromFile.split('/');
  fromParts.pop();
  const importParts = importPath.split('/');
  const resolved = [...fromParts];
  
  for (const part of importParts) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.') {
      resolved.push(part);
    }
  }
  
  let resolvedPath = resolved.join('/');
  const extensions = ['', '.tsx', '.ts', '.jsx', '.js'];
  
  for (const ext of extensions) {
    const testPath = resolvedPath + ext;
    if (files[testPath]) return testPath;
  }
  
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const testPath = resolvedPath + '/index' + ext;
    if (files[testPath]) return testPath;
  }
  
  return null;
}

function buildDependencyGraph(files, entryFile) {
  const graph = {};
  const visited = new Set();
  
  function traverse(filePath) {
    if (visited.has(filePath)) return;
    visited.add(filePath);
    
    const code = files[filePath];
    if (!code) return;
    
    const imports = parseImports(code);
    graph[filePath] = { code, imports: [], dependencies: [] };
    
    for (const imp of imports) {
      const resolvedPath = resolveImportPath(imp.path, filePath, files);
      if (resolvedPath) {
        graph[filePath].imports.push({ original: imp.path, resolved: resolvedPath, statement: imp.statement });
        graph[filePath].dependencies.push(resolvedPath);
        traverse(resolvedPath);
      } else {
        graph[filePath].imports.push({ original: imp.path, resolved: null, statement: imp.statement, external: true });
      }
    }
  }
  
  traverse(entryFile);
  return graph;
}

function generateBundledHTML(files, entryFile) {
  const graph = buildDependencyGraph(files, entryFile);
  
  // Encode all files as base64
  const fileDefinitions = [];
  for (const [filePath, info] of Object.entries(graph)) {
    let transformedCode = info.code;
    transformedCode = transformedCode.replace(/import\s+['"][^'"]+\.css['"];?\n?/gm, '');
    const encoded = Buffer.from(transformedCode, 'utf8').toString('base64');
    fileDefinitions.push(`  '${filePath}': '${encoded}'`);
  }
  
  const filesObject = '{\n' + fileDefinitions.join(',\n') + '\n  }';
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #000; }
    #root { min-height: 100vh; padding: 20px; }
    .error-display { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 16px; margin: 20px; color: #856404; font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      try {
        function b64ToUtf8(b64) {
          return decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
        }
        
        const encodedFiles = ${filesObject};
        const __modules = {};
        
        function __require(path) {
          if (__modules[path]) return __modules[path];
          if (!encodedFiles[path]) throw new Error('Module not found: ' + path);
          
          try {
            let sourceCode = b64ToUtf8(encodedFiles[path]);
            
            // Remove React imports - we provide React globally
            sourceCode = sourceCode.replace(/import\\s+React(?:\\s*,\\s*\\{[^}]*\\})?\\s+from\\s+['"]react['"]\\s*;?\\n?/gm, '');
            sourceCode = sourceCode.replace(/import\\s+\\{[^}]*React[^}]*\\}\\s+from\\s+['"]react['"]\\s*;?\\n?/gm, '');
            
            // Remove duplicate imports
            const importedModules = new Set();
            sourceCode = sourceCode.replace(/^import\\s+.*?from\\s+['"]([^'"]+)['"]\\s*;?$/gm, (match, moduleName) => {
              if (importedModules.has(moduleName)) return '';
              importedModules.add(moduleName);
              return match;
            });
            
            const result = Babel.transform(sourceCode, { 
              presets: [['env', { modules: 'commonjs' }], 'react', 'typescript'],
              filename: path 
            });
            
            let compiled = result.code;
            compiled = compiled.replace(/require\\(['"]([./][^'"]*)['"]\)/g, function(match, importPath) {
              if (importPath.startsWith('.')) return "__require('" + importPath + "')";
              return match;
            });
            
            if (compiled.includes('export default')) {
              compiled = compiled.replace(/export\\s+default\\s+/g, 'module.exports = ');
            }
            
            const exports = {};
            const module = { exports };
            const React = window.React;
            
            const moduleRequire = function(moduleName) {
              if (moduleName === 'react') return React;
              if (moduleName === 'react-dom') return window.ReactDOM;
              return __require(moduleName);
            };
            
            const moduleFunc = new Function('module', 'exports', 'require', '__require', 'React', 'ReactDOM', compiled);
            moduleFunc(module, exports, moduleRequire, __require, React, window.ReactDOM);
            
            const moduleResult = module.exports || exports.default || exports;
            __modules[path] = moduleResult;
            return __modules[path];
            
          } catch (err) {
            console.error('Error in ' + path + ':', err);
            throw new Error('Runtime error in ' + path + ': ' + err.message);
          }
        }
        
        let Component = __require('${entryFile}');
        if (Component && typeof Component === 'object' && Component.default) {
          Component = Component.default;
        }
        
        if (!Component) {
          document.getElementById('root').innerHTML = '<div class="error-display">⚠ No component found to render.</div>';
        } else if (typeof Component !== 'function') {
          document.getElementById('root').innerHTML = '<div class="error-display">⚠ Invalid component. Expected function, got: ' + typeof Component + '</div>';
        } else {
          try {
            const root = window.ReactDOM.createRoot(document.getElementById('root'));
            root.render(window.React.createElement(Component));
          } catch (renderErr) {
            document.getElementById('root').innerHTML = '<div class="error-display">⚠ Render Error<br><br>' + String(renderErr.message || renderErr) + '</div>';
          }
        }
        
      } catch (err) {
        console.error('Preview error:', err);
        document.getElementById('root').innerHTML = '<div class="error-display"><strong>⚠ Preview Error</strong><br><br>' + String(err.message || err) + '</div>';
      }
    })();
  </script>
</body>
</html>`;
  
  return html;
}

app.post('/runtime-bundle', (req, res) => {
  try {
    const { files: postedFiles, entry, code } = req.body || {};
    
    if (code && typeof code === 'string' && !postedFiles) {
      const tempFiles = { 'component.tsx': code };
      const html = generateBundledHTML(tempFiles, 'component.tsx');
      return res.json({ html });
    }
    
    if (!postedFiles || typeof postedFiles !== 'object') {
      return res.status(400).json({ error: 'No files provided' });
    }
    
    let entryFile = entry;
    if (!entryFile) {
      const fileKeys = Object.keys(postedFiles);
      if (fileKeys.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }
      entryFile = fileKeys.find(key => /export\s+default\s+/m.test(postedFiles[key])) || fileKeys[0];
    }
    
    if (!postedFiles[entryFile]) {
      return res.status(400).json({ error: `Entry file not found: ${entryFile}` });
    }
    
    const html = generateBundledHTML(postedFiles, entryFile);
    return res.json({ html });
    
  } catch (error) {
    console.error('runtime-bundle error:', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ AI Code Editor running on http://localhost:${PORT}`);
  console.log(`✓ Groq API configured: ${GROQ_API_KEY ? 'Yes' : 'No'}`);
});
