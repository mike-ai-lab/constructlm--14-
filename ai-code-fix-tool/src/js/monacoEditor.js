// Monaco Editor integration
import { state } from './state.js';
import { log } from './logger.js';
import { saveToHistory } from './editor.js';

let monacoEditor = null;
let isInitialized = false;

export async function initializeMonaco() {
  if (isInitialized) return monacoEditor;
  
  return new Promise((resolve) => {
    require.config({ 
      paths: { 
        vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' 
      } 
    });
    
    require(['vs/editor/editor.main'], function() {
      // Completely disable TypeScript/JavaScript validation and diagnostics
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true
      });
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true
      });
      
      // Disable compiler options that cause validation
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        noLib: true,
        allowNonTsExtensions: true
      });
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        noLib: true,
        allowNonTsExtensions: true
      });
      
      const container = document.getElementById('monaco-editor');
      
      if (!container) {
        log('Monaco container not found', 'error');
        resolve(null);
        return;
      }
      
      // Define custom dark theme
      monaco.editor.defineTheme('custom-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0a0a0a',
          'editor.selectionBackground': '#264f78',
          'editor.lineHighlightBackground': '#141414',
          'editorLineNumber.foreground': '#6b7280',
          'editorLineNumber.activeForeground': '#9ca3af'
        }
      });
      
      // Define custom light theme
      monaco.editor.defineTheme('custom-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#ffffff',
          'editor.selectionBackground': '#add6ff',
          'editor.lineHighlightBackground': '#f8f8f8',
          'editorLineNumber.foreground': '#9ca3af',
          'editorLineNumber.activeForeground': '#6b7280'
        }
      });
      
      // Create editor
      monacoEditor = monaco.editor.create(container, {
        value: `import React, { useState } from 'react';
import { Heart, Star, Mail } from 'lucide-react';

function IconDemo() {
  const [liked, setLiked] = useState(false);
  const [rating, setRating] = useState(0);
  
  return (
    <div className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Icons Work!</h1>
      <p className="text-gray-600 mb-6">Lucide imports are mocked automatically</p>
      
      <button 
        onClick={() => setLiked(!liked)} 
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
      >
        <Heart fill={liked ? 'currentColor' : 'none'} />
        {liked ? 'Liked!' : 'Like'}
      </button>
      
      <div className="flex gap-2 mt-4">
        {[1, 2, 3, 4, 5].map(n => (
          <Star 
            key={n}
            onClick={() => setRating(n)} 
            fill={n <= rating ? 'gold' : 'none'}
            className="cursor-pointer"
          />
        ))}
      </div>
      
      <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded">
        <Mail size={20} />
        Contact
      </button>
    </div>
  );
}

export default IconDemo;`,
        language: 'typescript',
        theme: document.getElementById('app').classList.contains('dark-theme') ? 'custom-dark' : 'custom-light',
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
          useShadows: false
        },
        wordWrap: 'on',
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        glyphMargin: false,
        folding: true,
        renderLineHighlight: 'line',
        hover: { enabled: true },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnCommitCharacter: false,
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true
      });
      
      // Listen for content changes
      monacoEditor.onDidChangeModelContent(() => {
        saveToHistory();
        // Auto-detect errors after typing (debounced)
        autoDetectErrors();
      });
      
      isInitialized = true;
      log('Monaco Editor initialized', 'success');
      resolve(monacoEditor);
    });
  });
}

// Auto-detect errors with debouncing
let autoDetectTimeout = null;
function autoDetectErrors() {
  clearTimeout(autoDetectTimeout);
  autoDetectTimeout = setTimeout(() => {
    // Trigger error detection from app.js
    if (window.autoDetectErrorsCallback) {
      window.autoDetectErrorsCallback();
    }
  }, 1000); // Wait 1 second after typing stops
}

export function getMonacoEditor() {
  return monacoEditor;
}

export function getEditorValue() {
  return monacoEditor ? monacoEditor.getValue() : '';
}

export function setEditorValue(value) {
  if (monacoEditor) {
    monacoEditor.setValue(value);
  }
}

export function setEditorTheme(isDark) {
  if (monacoEditor) {
    monaco.editor.setTheme(isDark ? 'custom-dark' : 'custom-light');
  }
}

export function focusEditor() {
  if (monacoEditor) {
    monacoEditor.focus();
  }
}

// Navigate to specific line in Monaco
export function goToLine(lineNumber) {
  if (monacoEditor) {
    monacoEditor.revealLineInCenter(lineNumber);
    monacoEditor.setPosition({ lineNumber, column: 1 });
    monacoEditor.focus();
  }
}
