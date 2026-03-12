// Default sample code
const defaultCode = `import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h1>
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Email"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}`;

document.getElementById('codeEditor').value = defaultCode;

// Runtime Bundler - Extracted from ai-editor/services/runtimeBundler.ts
function parseImports(code) {
  const imports = [];
  const importRegex = /import\s+(?:(\w+)|(?:\{([^}]+)\}))\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const specifiers = [];
    if (match[1]) specifiers.push(match[1]);
    if (match[2]) {
      match[2].split(',').forEach((name) => {
        const cleaned = name.trim().split(/\s+as\s+/).pop();
        if (cleaned && cleaned.trim().length > 0) specifiers.push(cleaned.trim());
      });
    }
    imports.push({ source: match[3], specifiers: Array.from(new Set(specifiers)) });
  }
  return imports;
}

function transformCode(code, imports) {
  const lines = code.split('\n');
  const cleanedLines = [];
  let inImportBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ')) {
      inImportBlock = true;
      if (line.includes(';') || (line.includes('from') && line.match(/"/g) && line.match(/"/g).length === 2)) {
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
  
  let transformed = cleanedLines.join('\n');
  const injections = [];
  const injectedNames = new Set();
  
  // Detect lucide-react imports
  const lucideNamed = [];
  const lucideNamespaces = [];
  let m;
  const namedRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
  while ((m = namedRegex.exec(code)) !== null) {
    const names = (m[1] || '').split(',').map(s => s.trim().split(/\s+as\s+/).pop()?.trim()).filter(Boolean);
    lucideNamed.push(...names);
  }
  const namespaceRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]lucide-react['"]/g;
  while ((m = namespaceRegex.exec(code)) !== null) {
    lucideNamespaces.push(m[1]);
  }
  
  imports.forEach(function(imp) {
    imp.specifiers.forEach(function(spec) {
      if (injectedNames.has(spec) || !spec || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(spec)) return;
      injectedNames.add(spec);
      
      if (imp.source.includes('lucide-react') || imp.source.includes('lucide')) {
        // Will be handled separately below
        return;
      } else if (spec === 'Link') {
        injections.push("const Link = ({ to, href, children, ...props }) => React.createElement('a', { href: to || href || '#', ...props }, children);");
      } else if (spec === 'Button') {
        injections.push("const Button = ({ children, className = '', ...props }) => React.createElement('button', { className: 'px-4 py-2 bg-blue-500 text-white rounded ' + className, ...props }, children);");
      } else if (spec === 'motion') {
        injections.push("const motion = new Proxy({}, { get: (_, prop) => (props) => React.createElement('div', props) });");
      } else if (spec === 'AnimatePresence') {
        injections.push("const AnimatePresence = (({ children }) => children);");
      } else if (!['react', 'react-dom'].includes(imp.source)) {
        injections.push("const " + spec + " = ({ children, ...props }) => React.createElement('div', props, children);");
      }
    });
  });
  
  // Inject lucide mappings
  lucideNamespaces.forEach(ns => {
    injections.push("const " + ns + " = window.lucideReact || {};");
  });
  lucideNamed.forEach(name => {
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) return;
    injections.push("const " + name + " = (window.lucideReact && window.lucideReact['" + name + "']) ? window.lucideReact['" + name + "'] : (props => React.createElement('svg', Object.assign({ width: 24, height: 24 }, props)));");
  });
  
  transformed = injections.join('\n') + '\n\n' + transformed;
  transformed = transformed
    .replace(/export\s+default\s+function\s+(\w+)/m, 'const Component = function $1')
    .replace(/export\s+default\s+/m, 'const Component = ');
  return transformed.trim();
}

function isReactComponent(code) {
  return (
    (/(?:function|const|class)\s+\w+/.test(code) && (/<[A-Z]/.test(code) || /jsx/.test(code))) ||
    /export\s+default/.test(code) ||
    /React\.createElement/.test(code)
  );
}

function generateBundledPreview(code, language) {
  const isReact = ['tsx', 'jsx', 'typescript', 'javascript', 'ts', 'js'].includes(language);
  if (!isReact || !isReactComponent(code)) {
    return {
      html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:20px;font-family:monospace}</style></head><body><div style="padding:20px;color:orange;border:2px solid orange"><strong>Not a React Component</strong><br/>Expected: Function with JSX or export default</div></body></html>',
      error: 'Not a React component'
    };
  }

  try {
    let fixedCode = code;
    fixedCode = fixedCode.replace(/\bdefault\s+export\s+/g, 'export default ');
    fixedCode = fixedCode.replace(/\bexport\s+function\s+default\s+/g, 'export default function ');
    
    const imports = parseImports(fixedCode);
    const transformedCode = transformCode(fixedCode, imports);
    const encoded = JSON.stringify(transformedCode);
    
    return {
      html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script><script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script><script src="https://cdn.tailwindcss.com"><\/script><style>body{margin:0;padding:0}#root{min-height:100vh}.error-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.95);color:white;padding:30px;font-family:monospace;font-size:14px;overflow:auto;z-index:9999;line-height:1.6}.error-title{color:#ef4444;font-size:20px;font-weight:bold;margin-bottom:20px}.error-content{background:#1f2937;padding:20px;border-left:4px solid #ef4444;white-space:pre-wrap}<\/style><\/head><body><div id="root"><\/div><script>(function(){let hasError=false;let loadAttempts=0;const maxLoadAttempts=50;function showError(title,message){if(hasError)return;hasError=true;console.error("[Canvas]",title,message);const overlay=document.createElement("div");overlay.className="error-overlay";overlay.innerHTML="<div class=\\"error-title\\">"+title+"<\/div><div class=\\"error-content\\">"+String(message).replace(/</g,"&lt;").replace(/>/g,"&gt;")+"<\/div>";document.body.appendChild(overlay)}function checkLibrariesLoaded(){loadAttempts++;if(window.React&&window.ReactDOM&&window.Babel){console.log("[Canvas] Libraries loaded");initComponent()}else if(loadAttempts>=maxLoadAttempts){showError("Library Loading Timeout","Failed to load React, ReactDOM, or Babel from CDN")}else{setTimeout(checkLibrariesLoaded,100)}}function initComponent(){try{const rootElement=document.getElementById("root");if(!rootElement)throw new Error("Root element not found");const motionScript=document.createElement("script");motionScript.src="https://unpkg.com/framer-motion@11/dist/framer-motion.js";motionScript.onerror=()=>console.warn("[Canvas] Framer Motion not loaded");document.head.appendChild(motionScript);const{useState,useEffect,useRef,useCallback,useMemo,useContext,useReducer,createElement,Fragment}=window.React;const sourceCode=' + encoded + ';const compiled=window.Babel.transform(sourceCode,{presets:["react","typescript"],filename:"component.tsx"});const executeCode=new Function("React","ReactDOM","createElement","Fragment","useState","useEffect","useRef","useCallback","useMemo","useContext","useReducer",compiled.code+"\\nreturn typeof Component!==\\"undefined\\"?Component:null;");const Component=executeCode(window.React,window.ReactDOM,createElement,Fragment,useState,useEffect,useRef,useCallback,useMemo,useContext,useReducer);if(!Component||typeof Component!=="function"){throw new Error("No valid component found")}const root=window.ReactDOM.createRoot(rootElement);root.render(createElement(Component));console.log("[Canvas] Render complete")}catch(error){console.error("[Canvas] Error:",error);showError("Component Error",error.message+"\\n\\n"+(error.stack||""))}}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",checkLibrariesLoaded)}else{checkLibrariesLoaded()}window.addEventListener("error",function(event){if(event.message==="Script error.")return;console.error("[Canvas] Global error:",event.error);if(!hasError){showError("Runtime Error",event.message)}});window.addEventListener("unhandledrejection",function(event){console.error("[Canvas] Unhandled rejection:",event.reason);if(!hasError){showError("Promise Rejection",String(event.reason?.message||event.reason))}})})()<\/script><\/body><\/html>',
      error: null
    };
  } catch (error) {
    return { html: '', error: error.message };
  }
}

function renderComponent() {
  const code = document.getElementById('codeEditor').value;
  const loading = document.getElementById('previewLoading');
  const errorDiv = document.getElementById('previewError');
  const errorMessage = document.getElementById('errorMessage');
  const previewFrame = document.getElementById('previewFrame');
  
  loading.style.display = 'flex';
  errorDiv.style.display = 'none';
  previewFrame.style.display = 'none';
  
  try {
    const result = generateBundledPreview(code, 'tsx');
    
    if (result.error) {
      loading.style.display = 'none';
      errorDiv.style.display = 'flex';
      errorMessage.textContent = result.error;
    } else {
      previewFrame.srcdoc = result.html;
      setTimeout(() => {
        loading.style.display = 'none';
        previewFrame.style.display = 'block';
      }, 500);
    }
  } catch (error) {
    loading.style.display = 'none';
    errorDiv.style.display = 'flex';
    errorMessage.textContent = 'Error: ' + error.message;
  }
}

// Auto-render on load
window.addEventListener('load', function() {
  renderComponent();
});

// Tab key support
document.getElementById('codeEditor').addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;
    this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
    this.selectionStart = this.selectionEnd = start + 2;
  }
});