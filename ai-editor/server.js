import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import archiver from "archiver"

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

const LOG_DIR = path.join(__dirname, 'logs')
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

function logProjectGeneration(projectName, projectType, filesCount, instruction, success = true) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    projectName,
    projectType,
    filesCount,
    instruction,
    success,
    status: success ? '✅ SUCCESS' : '❌ FAILED'
  }
  
  const logFile = path.join(LOG_DIR, `projects-${new Date().toISOString().split('T')[0]}.json`)
  
  try {
    let logs = []
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8')
      logs = JSON.parse(content)
    }
    logs.push(logEntry)
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2))
    console.log(`📝 Logged: ${projectName} (${filesCount} files)`)
  } catch (error) {
    console.error('Failed to write log:', error.message)
  }
}

const SYSTEM_PROMPT = `You are a React component and project code generator. CRITICAL: Follow these rules EXACTLY or components will crash.

⚠️ RULE 1: EXPORT FORMAT
MUST be: export default function ComponentName() { return <div>...</div>; }

⚠️ RULE 2: RETURN VALUE - MUST ALWAYS BE JSX
✅ return <div>Content</div>;
❌ return "string";
❌ return null;

⚠️ RULE 3: IMPORTS - ONLY React
✅ import React, { useState } from 'react';
❌ import './styles.css';

⚠️ RULE 4: STATE - ALWAYS initialize
✅ const [count, setCount] = useState(0);
❌ const [count, setCount] = useState();

⚠️ RULE 5: STYLES - ONLY inline
✅ const styles = { button: { padding: '10px', color: 'blue' } };
❌ import './Button.css';

⚠️ RULE 6: IMAGES - ONLY Unsplash (CORS-enabled)
✅ https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop

⚠️ RULE 7: ASYNC - NEVER in render
✅ useEffect(() => { fetch(...).then(...) }, [])
❌ async function Component() { ... }

⚠️ RULE 8: PROJECT STRUCTURE
FOLDER STRUCTURE:
- components/ - React components (PascalCase)
- pages/ - Page components (PascalCase)
- utils/ - Utility functions (camelCase)
- hooks/ - Custom React hooks (camelCase)
- styles/ - CSS/styling files (kebab-case)
- services/ - API/business logic (camelCase)

GENERATE ONLY VALID, WORKING CODE. EVERY COMPONENT MUST RENDER WITHOUT ERRORS.`;

function sanitizeCode(code) {
  let sanitized = code;
  sanitized = sanitized.replace(/default\s+export\s+function/g, 'export default function');
  sanitized = sanitized.replace(/default\s+export\s+class/g, 'export default class');
  
  const reactImports = sanitized.match(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"]\s*;?\n?/gm) || [];
  if (reactImports.length > 1) {
    sanitized = sanitized.replace(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"]\s*;?\n?/gm, '');
    sanitized = "import React, { useState, useEffect } from 'react';\n\n" + sanitized;
  }
  
  if (!sanitized.includes('import React') && sanitized.includes('export default function')) {
    sanitized = "import React, { useState, useEffect } from 'react';\n\n" + sanitized;
  }
  
  return sanitized;
}

function validateCode(code, filePath = '') {
  const errors = [];
  const isComponent = filePath.includes('/components/');
  const isPage = filePath.includes('/pages/');
  
  if ((isComponent || isPage) && !code.includes('export default function') && !code.includes('export default class')) {
    errors.push('Missing "export default function"');
  }
  
  if (code.includes('default export function')) {
    errors.push('Invalid: use "export default function" not "default export function"');
  }
  
  if (/import\s+['"][^'"]*\.css['"]/m.test(code)) {
    errors.push('CSS imports not allowed - use inline styles');
  }
  
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/gm;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const moduleName = match[1];
    if (!moduleName.startsWith('.') && moduleName !== 'react' && moduleName !== 'react-dom') {
      errors.push(`External library not allowed: "${moduleName}"`);
    }
  }
  
  if (/useState\(\s*\)/gm.test(code)) {
    errors.push('State must be initialized - useState() is invalid');
  }
  
  return { valid: errors.length === 0, errors };
}

function analyzeProjectStructure(instruction) {
  const projectTypes = {
    dashboard: ['components', 'pages', 'utils', 'hooks', 'styles'],
    ecommerce: ['components', 'pages', 'utils', 'hooks', 'styles', 'services'],
    blog: ['components', 'pages', 'utils', 'hooks', 'styles', 'posts'],
    portfolio: ['components', 'pages', 'utils', 'styles'],
    app: ['components', 'pages', 'utils', 'hooks', 'styles', 'services']
  };
  
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

function writeFilesToDisk(files) {
  try {
    console.log(`📁 Writing ${Object.keys(files).length} files to disk...`);
    console.log(`📍 Base directory: ${__dirname}`);
    
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(__dirname, filePath);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`  ✓ Created: ${filePath}`);
    }
    
    console.log(`✅ All files written successfully!`);
  } catch (error) {
    console.error(`❌ Error writing files to disk:`, error);
    throw error;
  }
}

app.post("/create-project", async (req, res) => {
  try {
    const { projectName, instruction } = req.body;
    
    if (!projectName || !instruction) {
      return res.status(400).json({ error: "Missing projectName or instruction" });
    }
    
    if (!/^[a-z0-9-]+$/.test(projectName)) {
      return res.status(400).json({ error: "Project name must be lowercase alphanumeric with hyphens" });
    }
    
    const projectStructure = generateProjectStructure(projectName, instruction);
    
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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
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
    
    const files = {};
    const fileRegex = /FILE:\s*([^\n]+)\n([\s\S]*?)(?=FILE:|$)/g;
    let match;
    
    console.log(`\n📝 Parsing AI response for files...`);
    while ((match = fileRegex.exec(aiResponse)) !== null) {
      const filePath = match[1].trim();
      let content = match[2].trim();
      
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:javascript|jsx|typescript|tsx)?\n?/, '').replace(/\n?```$/, '');
      }
      
      content = sanitizeCode(content);
      const validation = validateCode(content, filePath);
      
      if (!validation.valid) {
        console.warn(`Validation errors in ${filePath}:`, validation.errors);
      }
      
      files[filePath] = content.trim();
    }
    
    console.log(`✅ Parsed ${Object.keys(files).length} files from AI response\n`);
    
    try {
      writeFilesToDisk(files);
    } catch (writeError) {
      console.error('Failed to write files to disk:', writeError);
    }
    
    logProjectGeneration(projectName, projectStructure.projectType, Object.keys(files).length, instruction, true);
    
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

app.post("/download-project", async (req, res) => {
  try {
    const { projectName, files } = req.body;
    
    if (!projectName || !files || Object.keys(files).length === 0) {
      return res.status(400).json({ error: "Missing projectName or files" });
    }
    
    console.log(`\n📦 Creating ZIP for project: ${projectName}`);
    console.log(`   Files to include: ${Object.keys(files).length}`);
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${projectName}.zip"`);
    
    archive.pipe(res);
    
    for (const [filePath, content] of Object.entries(files)) {
      console.log(`   Adding: ${filePath}`);
      archive.append(content, { name: filePath });
    }
    
    await archive.finalize();
    
    console.log(`✅ ZIP created successfully: ${projectName}.zip`);
    console.log(`   Total files: ${Object.keys(files).length}\n`);
    
  } catch (error) {
    console.error('Download error:', error);
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
    
    const fileRegex = /FILE:\s*([^\n]+)\n([\s\S]*?)(?=FILE:|$)/g;
    const parsedFiles = {};
    let match;
    
    while ((match = fileRegex.exec(responseText)) !== null) {
      const filename = match[1].trim();
      let content = match[2].trim();
      
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:javascript|jsx|typescript|tsx)?\n?/, '').replace(/\n?```$/, '');
      }
      
      content = sanitizeCode(content);
      const validation = validateCode(content, filename);
      
      if (!validation.valid) {
        console.warn(`Validation errors in ${filename}:`, validation.errors);
      }
      
      parsedFiles[filename] = content.trim();
    }
    
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

app.post('/runtime-bundle', (req, res) => {
  try {
    const { files: postedFiles, entry, code } = req.body || {};
    
    if (code && typeof code === 'string' && !postedFiles) {
      const tempFiles = { 'component.tsx': code };
      const html = generateSimpleBundledHTML(tempFiles, 'component.tsx');
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
    
    const html = Object.keys(postedFiles).length > 1 ? generateMultiFileBundledHTML(postedFiles, entryFile) : generateSimpleBundledHTML(postedFiles, entryFile);
    return res.json({ html });
    
  } catch (error) {
    console.error('runtime-bundle error:', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
});

function generateMultiFileBundledHTML(files, entryFile) {
  const transformedFiles = {};
  
  for (const [filePath, code] of Object.entries(files)) {
    let transformed = code;
    
    // Replace relative imports with require calls (but NOT react/react-dom)
    transformed = transformed.replace(/import\s+([\w{},\s*]+)\s+from\s+['"]([^'"]+)['"];?/g, (match, imports, path) => {
      // Skip non-relative imports (react, react-dom, etc)
      if (!path.startsWith('.')) {
        return '';
      }
      
      // Resolve relative path
      const currentDir = filePath.split('/').slice(0, -1).join('/');
      let resolvedPath = path;
      
      if (path.startsWith('./')) {
        resolvedPath = currentDir ? currentDir + '/' + path.substring(2) : path.substring(2);
      } else if (path.startsWith('../')) {
        const parts = currentDir.split('/');
        let upCount = 0;
        let cleanPath = path;
        while (cleanPath.startsWith('../')) {
          upCount++;
          cleanPath = cleanPath.substring(3);
        }
        parts.splice(parts.length - upCount, upCount);
        resolvedPath = parts.join('/') + '/' + cleanPath;
      }
      
      // Add .js if no extension
      if (!resolvedPath.includes('.')) {
        resolvedPath += '.js';
      }
      
      return `const ${imports} = require('${resolvedPath}');`;
    });
    
    // Remove other imports (react, etc)
    transformed = transformed.replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/gm, '');
    
    // Convert export default to module.exports
    transformed = transformed.replace(/export\s+default\s+/g, 'module.exports = ');
    transformed = transformed.replace(/export\s+/g, '');
    
    transformedFiles[filePath] = transformed;
  }
  
  // Encode each file's code as base64
  const encodedFiles = {};
  for (const [filePath, code] of Object.entries(transformedFiles)) {
    encodedFiles[filePath] = Buffer.from(code, 'utf8').toString('base64');
  }
  
  const moduleCode = `
    let Component = null;
    const __modules = {};
    const __cache = {};
    
    function b64ToUtf8(b64) {
      return decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    }
    
    function __require(path) {
      if (__cache[path]) return __cache[path];
      if (!__modules[path]) throw new Error('Module not found: ' + path);
      
      const module = { exports: {} };
      const exports = module.exports;
      
      try {
        let code = b64ToUtf8(__modules[path]);
        
        // Transpile JSX with Babel if available
        try {
          if (typeof Babel !== 'undefined' && Babel.transform) {
            const result = Babel.transform(code, { 
              presets: ['react', 'es2015'],
              compact: true
            });
            code = result.code;
          }
        } catch (babelErr) {
          console.warn('Babel transpilation failed for ' + path + ', using original code');
        }
        
        // Inject React and hooks into the module scope
        const moduleFunc = new Function('module', 'exports', 'require', 'React', 'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo', 'useRef', code);
        moduleFunc(module, exports, __require, React, React.useState, React.useEffect, React.useContext, React.useReducer, React.useCallback, React.useMemo, React.useRef);
        __cache[path] = module.exports;
        return module.exports;
      } catch (e) {
        console.error('Error loading module ' + path + ':', e);
        throw e;
      }
    }
    
    ${Object.entries(encodedFiles).map(([filePath, encodedCode]) => {
      return `__modules['${filePath}'] = '${encodedCode}';`;
    }).join('\n    ')}
    
    Component = __require('${entryFile}');
    if (Component && typeof Component === 'object' && Component.default) {
      Component = Component.default;
    }
  `;
  
  const encodedCode = Buffer.from(moduleCode, 'utf8').toString('base64');
  
  return `<!DOCTYPE html>
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
        
        const sourceCode = b64ToUtf8('${encodedCode}');
        
        try {
          const moduleFunc = new Function('React', 'ReactDOM', sourceCode + '; return Component;');
          const Component = moduleFunc(window.React, window.ReactDOM);
          
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
        } catch (e) {
          console.error('Module execution error:', e);
          document.getElementById('root').innerHTML = '<div class="error-display">⚠ Module Error<br><br>' + String(e.message || e) + '</div>';
        }
        
      } catch (err) {
        console.error('Preview error:', err);
        document.getElementById('root').innerHTML = '<div class="error-display"><strong>⚠ Preview Error</strong><br><br>' + String(err.message || err) + '</div>';
      }
    })();
  </script>
</body>
</html>`;
}

function generateSimpleBundledHTML(files, entryFile) {
  const entryCode = files[entryFile] || '';
  let transformedCode = entryCode;
  
  const lines = transformedCode.split('\n');
  const filteredLines = lines.filter(line => !line.trim().startsWith('import '));
  transformedCode = filteredLines.join('\n');
  
  transformedCode = transformedCode.replace(/export\s+default\s+/g, 'const Component = ');
  
  if (!transformedCode.includes('module.exports') && !transformedCode.includes('exports.')) {
    transformedCode += '\n\nmodule.exports = Component;';
  }
  
  const encodedCode = Buffer.from(transformedCode, 'utf8').toString('base64');
  
  return `<!DOCTYPE html>
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
        
        const sourceCode = b64ToUtf8('${encodedCode}');
        
        let Component = null;
        const exports = {};
        const module = { exports };
        
        try {
          let transpiledCode = sourceCode;
          try {
            const result = Babel.transform(sourceCode, { 
              presets: ['react', 'es2015'],
              compact: true
            });
            transpiledCode = result.code;
          } catch (babelErr) {
            console.warn('Babel transpilation failed, using original code:', babelErr.message);
          }
          
          const moduleFunc = new Function('React', 'ReactDOM', 'module', 'exports', transpiledCode);
          moduleFunc(window.React, window.ReactDOM, module, exports);
          
          if (typeof module.exports === 'function') {
            Component = module.exports;
          } else if (module.exports && typeof module.exports.default === 'function') {
            Component = module.exports.default;
          } else if (exports && typeof exports.default === 'function') {
            Component = exports.default;
          } else if (exports && typeof exports.Component === 'function') {
            Component = exports.Component;
          } else if (typeof exports === 'function') {
            Component = exports;
          } else {
            for (const key in exports) {
              if (typeof exports[key] === 'function') {
                Component = exports[key];
                break;
              }
            }
          }
        } catch (e) {
          console.error('Module execution error:', e);
          throw e;
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
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ AI Code Editor running on http://localhost:${PORT}`);
  console.log(`✓ Groq API configured: ${GROQ_API_KEY ? 'Yes' : 'No'}`);
});
