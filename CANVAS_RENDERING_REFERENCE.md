# Canvas & Frame Rendering Reference

This document contains the extracted code related to canvas and iframe rendering for HTML and TypeScript/React code preview in the ConstructLM application.

## Overview

The canvas feature allows users to:
- Preview HTML and React/TypeScript code in an isolated iframe
- Edit code with live preview updates
- Toggle between code editor and rendered preview
- Manage version history with undo/redo
- Open code blocks from chat in a side panel

---

## State Management

```typescript
// Canvas-related state
const [canvasOpen, setCanvasOpen] = useState(false);
const [canvasContent, setCanvasContent] = useState<{
  html: string, 
  code: string, 
  language: string, 
  blockId: string
} | null>(null);
const [canvasShowCode, setCanvasShowCode] = useState(false);
const [canvasEditedCode, setCanvasEditedCode] = useState('');
const [editedCodeBlocks, setEditedCodeBlocks] = useState<{[blockId: string]: string}>({});
const [iframeKey, setIframeKey] = useState(0);
const [codeVersionHistory, setCodeVersionHistory] = useState<{
  [blockId: string]: {
    versions: string[], 
    currentIndex: number
  }
}>({});
const [codeBlockStates, setCodeBlockStates] = useState<{
  [key: string]: {showRendered: boolean}
}>({});
```

---

## HTML Generation Functions

### React/TypeScript Preview HTML Generator (Refactored)

```typescript
const generateReactPreviewHtml = (code: string) => {
  // Robust multiline-safe import removal regex
  // Matches: import ... from '...'; or import ... from "..."; (with optional semicolon)
  // Handles multiline imports with proper grouping
  const cleanedCode = code
    .replace(/import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*\s+from\s+)?['"][^'"]+['"];?/gm, '')
    .replace(/import\s+['"][^'"]+['"];?/gm, '') // Side-effect imports
    .trim();
  
  // Improved React component detection
  // Check for: function/const/class component patterns, JSX syntax, or export default
  const isLikelyReactComponent = 
    /(?:function|const|class)\s+\w+.*(?:=>|{)[\s\S]*(?:<[A-Z]|jsx|tsx)/m.test(cleanedCode) ||
    /export\s+default\s+(?:function|class|\w+)/m.test(cleanedCode) ||
    /<[A-Z]\w*[\s>]/m.test(cleanedCode); // JSX with capital letter (component)
  
  if (!isLikelyReactComponent) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 20px; font-family: monospace; }
  </style>
</head>
<body>
  <div style="padding:20px;color:orange;border:2px solid orange;">
    <strong>Not a React Component</strong><br/>
    This code doesn't appear to be a React component. Expected patterns:<br/>
    - Function/const/class component with JSX<br/>
    - export default statement<br/>
    - JSX elements (e.g., &lt;Component /&gt;)
  </div>
</body>
</html>`;
  }
  
  // Transform export default to const Component
  const transformedCode = cleanedCode
    .replace(/export\s+default\s+function\s+(\w+)/m, 'const Component = function $1')
    .replace(/export\s+default\s+/m, 'const Component = ');
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/framer-motion@11/dist/framer-motion.js"></script>
  <script src="https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      try {
        // Make libraries available globally
        const { motion } = window.Motion || {};
        const lucide = window.lucideReact || {};
        
        // Source code to compile
        const sourceCode = ${JSON.stringify(transformedCode)};
        
        // Compile with Babel
        const compiled = Babel.transform(sourceCode, {
          presets: ['react', 'typescript'],
          filename: 'component.tsx'
        });
        
        // Create a function from compiled code
        const componentModule = {};
        const componentFunc = new Function('React', 'ReactDOM', 'motion', 'lucide', 'exports', 'module', compiled.code);
        componentFunc(React, ReactDOM, motion, lucide, componentModule, { exports: componentModule });
        
        // Get the component (either from exports or Component variable)
        const Component = componentModule.Component || componentModule.default || window.Component;
        
        if (!Component) {
          throw new Error('No component found. Make sure to export a component or define "const Component".');
        }
        
        // Render the component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Component));
        
      } catch (err) {
        console.error('Compilation/Runtime Error:', err);
        document.body.innerHTML = 
          '<div style="padding:20px;color:red;font-family:monospace;white-space:pre-wrap;border:2px solid red;margin:20px;">' +
          '<strong>Error:</strong><br/><br/>' +
          (err.message || String(err)) +
          (err.stack ? '<br/><br/><strong>Stack:</strong><br/>' + err.stack : '') +
          '</div>';
      }
    })();
  </script>
  <script>
    // Global error handler for runtime errors after initial load
    window.onerror = function(msg, url, line, col, error) {
      console.error('Runtime Error:', msg, error);
      document.body.innerHTML = 
        '<div style="padding:20px;color:red;font-family:monospace;white-space:pre-wrap;border:2px solid red;margin:20px;">' +
        '<strong>Runtime Error:</strong><br/><br/>' +
        msg + '<br/><br/>' +
        'Line: ' + line + ', Column: ' + col +
        (error && error.stack ? '<br/><br/><strong>Stack:</strong><br/>' + error.stack : '') +
        '</div>';
      return true;
    };
    
    // Unhandled promise rejection handler
    window.onunhandledrejection = function(event) {
      console.error('Unhandled Promise Rejection:', event.reason);
      document.body.innerHTML = 
        '<div style="padding:20px;color:red;font-family:monospace;white-space:pre-wrap;border:2px solid red;margin:20px;">' +
        '<strong>Unhandled Promise Rejection:</strong><br/><br/>' +
        (event.reason?.message || String(event.reason)) +
        (event.reason?.stack ? '<br/><br/><strong>Stack:</strong><br/>' + event.reason.stack : '') +
        '</div>';
      return true;
    };
  </script>
</body>
</html>`;
};
```

#### Key Improvements:

1. **Robust Import Removal**: Multiline-safe regex that handles:
   - Named imports: `import { foo, bar } from 'module'`
   - Default imports: `import React from 'react'`
   - Namespace imports: `import * as Utils from 'utils'`
   - Side-effect imports: `import 'styles.css'`
   - Mixed imports with/without semicolons

2. **Better Component Detection**: Checks for:
   - Function/const/class declarations with JSX
   - Export default statements
   - JSX elements with capital letters (React components)
   - Avoids false positives on non-component code

3. **Babel.transform() Compilation**: 
   - Replaces inline `type="text/babel"` execution
   - Uses `Babel.transform()` API for proper compilation
   - Injects compiled code via `new Function()` for better error surfacing

4. **Enhanced Error Handling**:
   - Compilation errors show full stack traces
   - Runtime errors display line/column information
   - Unhandled promise rejections are caught
   - All errors logged to console for debugging

5. **Sandbox Architecture**: Unchanged - still uses iframe with `sandbox="allow-scripts"`

### Preview HTML Generator (Generic)

```typescript
const generatePreviewHtml = () => {
  if (isHtml) return code;
  if (isReactComponent) return generateReactPreviewHtml(code);
  return code;
};
```

---

## Version History Handlers

### Undo Handler

```typescript
const handleVersionUndo = () => {
  if (!canvasContent) return;
  const history = codeVersionHistory[canvasContent.blockId];
  if (!history || history.currentIndex <= 0) return;
  
  const newIndex = history.currentIndex - 1;
  const previousCode = history.versions[newIndex];
  
  // Regenerate HTML for preview
  let newHtml = previousCode;
  const isTsx = canvasContent.language === 'tsx' || canvasContent.language === 'jsx' || 
                canvasContent.language === 'typescript' || canvasContent.language === 'javascript' || canvasContent.language === 'ts';
  const isReactComponent = isTsx && (previousCode.includes('export default') || previousCode.includes('function'));
  
  if (isReactComponent) {
    newHtml = generateReactPreviewHtml(previousCode);
  } else if (canvasContent.language !== 'html' && canvasContent.language !== 'htm') {
    newHtml = previousCode;
  }
  
  setCodeVersionHistory(prev => ({
    ...prev,
    [canvasContent.blockId]: {...history, currentIndex: newIndex}
  }));
  setCanvasEditedCode(previousCode);
  setEditedCodeBlocks(prev => ({...prev, [canvasContent.blockId]: previousCode}));
  setCanvasContent({html: newHtml, code: previousCode, language: canvasContent.language, blockId: canvasContent.blockId});
  setIframeKey(prev => prev + 1);
};
```

### Redo Handler

```typescript
const handleVersionRedo = () => {
  if (!canvasContent) return;
  const history = codeVersionHistory[canvasContent.blockId];
  if (!history || history.currentIndex >= history.versions.length - 1) return;
  
  const newIndex = history.currentIndex + 1;
  const nextCode = history.versions[newIndex];
  
  // Regenerate HTML for preview
  let newHtml = nextCode;
  const isTsx = canvasContent.language === 'tsx' || canvasContent.language === 'jsx' || 
                canvasContent.language === 'typescript' || canvasContent.language === 'javascript' || canvasContent.language === 'ts';
  const isReactComponent = isTsx && (nextCode.includes('export default') || nextCode.includes('function'));
  
  if (isReactComponent) {
    newHtml = generateReactPreviewHtml(nextCode);
  } else if (canvasContent.language !== 'html' && canvasContent.language !== 'htm') {
    newHtml = nextCode;
  }
  
  setCodeVersionHistory(prev => ({
    ...prev,
    [canvasContent.blockId]: {...history, currentIndex: newIndex}
  }));
  setCanvasEditedCode(nextCode);
  setEditedCodeBlocks(prev => ({...prev, [canvasContent.blockId]: nextCode}));
  setCanvasContent({html: newHtml, code: nextCode, language: canvasContent.language, blockId: canvasContent.blockId});
  setIframeKey(prev => prev + 1);
};
```

---

## Code Block Rendering (Inline Preview)

```typescript
// Inside ReactMarkdown components.code
code: ({node, inline, className, children, ...props}: any) => {
  if (inline) {
    return <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
  }
  
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const codeRaw = String(children).replace(/\n$/, '');
  const blockId = `${msg.id}-${codeRaw.substring(0, 20)}`;
  const code = editedCodeBlocks[blockId] || codeRaw;
  const isHtml = language === 'html' || language === 'htm';
  const isTsx = language === 'tsx' || language === 'typescript' || language === 'ts' || language === 'jsx' || language === 'javascript';
  const isReactComponent = isTsx && (code.includes('export default') || code.includes('function'));
  const isPreviewable = isHtml || isReactComponent;
  const blockState = codeBlockStates[blockId] || {showRendered: false};
  
  const generatePreviewHtml = () => {
    if (isHtml) return code;
    if (isReactComponent) return generateReactPreviewHtml(code);
    return code;
  };
  
  return (
    <div className="relative my-2">
      {/* Language badge */}
      <div className="absolute left-2 top-2 z-10">
        <span className="text-[9px] font-bold uppercase bg-black text-white px-2 py-1">
          {language}
        </span>
      </div>
      
      {/* Action buttons */}
      <div className="absolute right-2 top-2 flex gap-1 z-10">
        {/* Copy, Download buttons... */}
        
        {isPreviewable && (
          <>
            {/* Open in Canvas button */}
            <button
              onClick={() => {
                setCanvasContent({html: generatePreviewHtml(), code, language, blockId});
                setCanvasEditedCode(code);
                setCanvasOpen(true);
                setCanvasShowCode(false);
                
                // Initialize version history if not exists
                if (!codeVersionHistory[blockId]) {
                  setCodeVersionHistory(prev => ({
                    ...prev,
                    [blockId]: {versions: [code], currentIndex: 0}
                  }));
                }
              }}
              className="p-1 bg-white border border-black hover:bg-gray-100 text-[10px] font-mono flex items-center gap-1"
              title="Open in Canvas"
            >
              <Maximize2 size={12} />
            </button>
            
            {/* Toggle Preview button */}
            <button
              onClick={() => setCodeBlockStates(prev => ({
                ...prev,
                [blockId]: {showRendered: !blockState.showRendered}
              }))}
              className="p-1 bg-white border border-black hover:bg-gray-100 text-[10px] font-mono flex items-center gap-1"
              title="Toggle View"
            >
              <Code size={12} />
              {blockState.showRendered ? 'CODE' : 'PREVIEW'}
            </button>
          </>
        )}
      </div>
      
      {/* Rendered preview or code */}
      {blockState.showRendered ? (
        <div className="border border-gray-300 bg-white mt-8">
          <iframe
            srcDoc={generatePreviewHtml()}
            className="w-full border-0"
            style={{ minHeight: '400px', height: 'auto' }}
            sandbox="allow-scripts"
            title="Preview"
            onLoad={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              if (iframe.contentWindow) {
                try {
                  const height = iframe.contentWindow.document.body.scrollHeight;
                  iframe.style.height = height + 'px';
                } catch (err) {
                  // Cross-origin or error, keep min height
                }
              }
            }}
          />
        </div>
      ) : (
        <code className="block bg-gray-100 p-3 pt-10 rounded text-xs font-mono overflow-x-auto border border-gray-300" {...props}>
          {children}
        </code>
      )}
    </div>
  );
}
```

---

## Canvas Side Panel JSX

```tsx
{/* Canvas Side Panel */}
{canvasOpen && canvasContent && (
  <div className="w-1/2 border-l-2 border-black bg-white flex flex-col">
    {/* Canvas Header */}
    <div className="h-14 border-b-2 border-black flex items-center justify-between px-4 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase bg-black text-white px-2 py-1">
          {canvasContent.language}
        </span>
        <span className="text-xs font-mono">CANVAS</span>
        {codeVersionHistory[canvasContent.blockId] && (
          <span className="text-[9px] font-mono text-gray-500">
            v{codeVersionHistory[canvasContent.blockId].currentIndex + 1}/{codeVersionHistory[canvasContent.blockId].versions.length}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleVersionUndo}
          disabled={!codeVersionHistory[canvasContent.blockId] || codeVersionHistory[canvasContent.blockId].currentIndex <= 0}
          className="p-1 border border-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-mono flex items-center gap-1"
          title="Undo (Previous Version)"
        >
          <Undo size={14} />
        </button>
        <button
          onClick={handleVersionRedo}
          disabled={!codeVersionHistory[canvasContent.blockId] || codeVersionHistory[canvasContent.blockId].currentIndex >= codeVersionHistory[canvasContent.blockId].versions.length - 1}
          className="p-1 border border-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-mono flex items-center gap-1"
          title="Redo (Next Version)"
        >
          <Redo size={14} />
        </button>
        <button
          onClick={() => {
            const newCode = canvasEditedCode;
            let newHtml = newCode;
            
            // Generate preview HTML based on language
            const isTsx = canvasContent.language === 'tsx' || canvasContent.language === 'jsx' || 
                          canvasContent.language === 'typescript' || canvasContent.language === 'javascript' || canvasContent.language === 'ts';
            const isReactComponent = isTsx && (newCode.includes('export default') || newCode.includes('function'));
            
            if (isReactComponent) {
              newHtml = generateReactPreviewHtml(newCode);
            } else if (canvasContent.language !== 'html' && canvasContent.language !== 'htm') {
              newHtml = newCode;
            }
            
            // Save to version history
            const history = codeVersionHistory[canvasContent.blockId] || {versions: [canvasContent.code], currentIndex: 0};
            const newVersions = [...history.versions.slice(0, history.currentIndex + 1), newCode];
            setCodeVersionHistory(prev => ({
              ...prev,
              [canvasContent.blockId]: {versions: newVersions, currentIndex: newVersions.length - 1}
            }));
            
            // Save edited code to state so chat preview updates
            setEditedCodeBlocks(prev => ({...prev, [canvasContent.blockId]: newCode}));
            setCanvasContent({html: newHtml, code: newCode, language: canvasContent.language, blockId: canvasContent.blockId});
            setIframeKey(prev => prev + 1);
            setCanvasShowCode(false);
          }}
          className="px-2 py-1 border border-black hover:bg-gray-100 text-[10px] font-mono font-bold"
        >
          UPDATE
        </button>
        <button
          onClick={() => setCanvasShowCode(!canvasShowCode)}
          className="p-1 border border-black hover:bg-gray-100 text-[10px] font-mono flex items-center gap-1"
        >
          <Code size={14} />
          {canvasShowCode ? 'PREVIEW' : 'CODE'}
        </button>
        <button
          onClick={() => setCanvasOpen(false)}
          className="p-1 border border-black hover:bg-gray-100"
          title="Close Canvas"
        >
          <X size={14} />
        </button>
      </div>
    </div>
    
    {/* Canvas Content */}
    <div className="flex-1 overflow-auto">
      {canvasShowCode ? (
        <textarea
          value={canvasEditedCode}
          onChange={(e) => setCanvasEditedCode(e.target.value)}
          className="w-full h-full p-4 text-xs font-mono bg-gray-50 border-0 resize-none focus:outline-none"
          spellCheck={false}
        />
      ) : (
        <iframe
          key={iframeKey}
          srcDoc={canvasContent.html}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          title="Canvas Preview"
        />
      )}
    </div>
  </div>
)}
```

---

## Key Features

1. **Language Detection**: Automatically detects HTML, TypeScript, JSX, TSX for preview
2. **React Component Support**: Transforms React components into standalone HTML with CDN libraries
3. **Version History**: Tracks code changes with undo/redo functionality
4. **Live Preview**: Toggle between code editor and rendered preview
5. **Error Handling**: Displays compilation and runtime errors in iframe
6. **Iframe Isolation**: Uses `sandbox="allow-scripts"` for security
7. **Auto-height**: Inline previews auto-adjust height based on content
8. **CDN Libraries**: Includes React, Tailwind, Framer Motion, Lucide icons

---

## Supported Libraries (in iframe)

- React 18 (UMD)
- ReactDOM 18 (UMD)
- Babel Standalone (for JSX/TSX transpilation)
- Tailwind CSS (CDN)
- Framer Motion 11
- Lucide React Icons

---

## Notes

- Import statements are stripped from React code (CDN libraries used instead)
- Cross-origin errors are caught and displayed with helpful messages
- Version history is maintained per code block ID
- Iframe key is incremented to force re-render on updates
