// Clean Monaco Editor Implementation - No Flickering
let editor = null
let diffEditor = null

function initMonacoEditor() {
  return new Promise((resolve, reject) => {
    require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' }})
    
    require(['vs/editor/editor.main'], function() {
      try {
        const container = document.getElementById('editor')
        if (!container) {
          reject(new Error('Editor container not found'))
          return
        }

        // Create editor with automatic layout
        editor = monaco.editor.create(container, {
          value: 'function hello() {\n  console.log("Hello World")\n}',
          language: 'javascript',
          theme: 'vs-dark',
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'Monaco', 'Menlo', monospace",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          wordWrap: 'on',
          wrappingIndent: 'indent'
        })

        // Setup TypeScript defaults
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          jsx: monaco.languages.typescript.JsxEmit.React,
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          allowNonTsExtensions: true
        })

        // Create diff editor
        const diffContainer = document.getElementById('diffEditor')
        if (diffContainer) {
          diffEditor = monaco.editor.createDiffEditor(diffContainer, {
            theme: 'vs-dark',
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'Monaco', 'Menlo', monospace",
            renderSideBySide: false,
            readOnly: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true
          })
        }

        // Handle window resize properly
        let resizeTimer
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimer)
          resizeTimer = setTimeout(() => {
            if (editor) editor.layout()
            if (diffEditor) diffEditor.layout()
          }, 150)
        })

        console.log('✓ Monaco editor initialized')
        resolve()
      } catch (error) {
        console.error('Monaco init error:', error)
        reject(error)
      }
    }, reject)
  })
}

function getEditorValue() {
  return editor ? editor.getValue() : ''
}

function setEditorValue(value, language = 'javascript') {
  if (!editor) return
  editor.setValue(value)
  const model = editor.getModel()
  if (model) {
    monaco.editor.setModelLanguage(model, language)
  }
}

function getEditorLanguage(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const langs = {
    'js': 'javascript', 'jsx': 'javascript',
    'ts': 'typescript', 'tsx': 'typescriptreact',
    'html': 'html', 'css': 'css',
    'json': 'json', 'md': 'markdown'
  }
  return langs[ext] || 'plaintext'
}
