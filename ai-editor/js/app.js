// @ts-nocheck
// Global state
let editor
let diffEditor
let isEditing = false
let pendingCode = null
let originalCode = null
let files = {}
let currentFile = 'index.js'
let previewTimer = null

// Storage keys
const STORAGE_KEY = 'aiEditorFiles'
const CURRENT_FILE_KEY = 'aiEditorCurrentFile'
const CHAT_HISTORY_KEY = 'aiEditorChatHistory'
const PREVIEW_VISIBLE_KEY = 'aiEditorPreviewVisible'

// localStorage functions
function saveFilesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
    localStorage.setItem(CURRENT_FILE_KEY, currentFile)
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

function loadFilesFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedCurrentFile = localStorage.getItem(CURRENT_FILE_KEY)
    
    if (stored) {
      files = JSON.parse(stored)
    }
    
    if (storedCurrentFile && files[storedCurrentFile]) {
      currentFile = storedCurrentFile
    }
    
    return Object.keys(files).length > 0
  } catch (error) {
    console.warn('Failed to load from localStorage:', error)
    return false
  }
}

function saveChatHistory() {
  try {
    const messagesDiv = document.getElementById('chatMessages')
    if (messagesDiv) {
      const messages = []
      messagesDiv.querySelectorAll('.message').forEach(msg => {
        const type = msg.classList.contains('user') ? 'user' : 'ai'
        const text = msg.querySelector('.message-bubble').textContent
        messages.push({ type, text })
      })
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages))
    }
  } catch (error) {
    console.warn('Failed to save chat history:', error)
  }
}

function loadChatHistory() {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY)
    if (stored) {
      const messages = JSON.parse(stored)
      return messages
    }
  } catch (error) {
    console.warn('Failed to load chat history:', error)
  }
  return null
}

function newChat() {
  try {
    const messagesDiv = document.getElementById('chatMessages')
    if (messagesDiv) {
      messagesDiv.innerHTML = ''
    }
    // Remove saved chat history
    localStorage.removeItem(CHAT_HISTORY_KEY)
    addChatMessage('New chat started. Describe what you want!', 'ai')
  } catch (error) {
    console.warn('Failed to start new chat:', error)
  }
}

// Initialize app
async function initializeApp() {
  try {
    // Load and render all components
    const app = document.getElementById('app')
    
    // Get the base path for component loading
    const basePath = window.location.pathname.includes('/ai-editor') ? '/ai-editor/' : '/'
    
    const headerHTML = await fetch(basePath + 'components/header.html').then(r => {
      if (!r.ok) throw new Error(`Failed to load header: ${r.status}`)
      return r.text()
    })
    const explorerHTML = await fetch(basePath + 'components/explorer.html').then(r => {
      if (!r.ok) throw new Error(`Failed to load explorer: ${r.status}`)
      return r.text()
    })
    const editorHTML = await fetch(basePath + 'components/editor.html').then(r => {
      if (!r.ok) throw new Error(`Failed to load editor: ${r.status}`)
      return r.text()
    })
    const previewHTML = await fetch(basePath + 'components/preview.html').then(r => {
      if (!r.ok) throw new Error(`Failed to load preview: ${r.status}`)
      return r.text()
    })
    const chatHTML = await fetch(basePath + 'components/chat.html').then(r => {
      if (!r.ok) throw new Error(`Failed to load chat: ${r.status}`)
      return r.text()
    })
    
    app.innerHTML = `
      ${headerHTML}
      <div class="container">
        ${explorerHTML}
        ${editorHTML}
        ${previewHTML}
        ${chatHTML}
      </div>
    `
    
    // Load saved files and chat history
    const hasStoredFiles = loadFilesFromStorage()

    // If no files are stored, seed with a ready-to-use React canvas component
    if (!hasStoredFiles) {
      const gradientCanvas = `export default function GradientCanvas() {
  const canvasRef = React.useRef(null)
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width = 400
    const h = canvas.height = 400
    const gradient = ctx.createLinearGradient(0, 0, w, h)
    gradient.addColorStop(0, '#1e3a8a')
    gradient.addColorStop(1, '#9333ea')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
    ctx.beginPath()
    ctx.arc(w/2, h/2, 60, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.shadowBlur = 20
    ctx.shadowColor = 'rgba(255,255,255,0.6)'
    ctx.fill()
  }, [])

  return React.createElement('canvas', { ref: canvasRef, width: 400, height: 400, style: { borderRadius: 8, display: 'block' } })
}`

      files['GradientCanvas.tsx'] = gradientCanvas
      currentFile = 'GradientCanvas.tsx'
      saveFilesToStorage()
    }
    const chatHistory = loadChatHistory()
    
    // Restore preview visibility state
    restorePreviewVisibility()
    
    // Initialize Monaco editors after DOM is ready
    initializeMonacoEditors()
    
    // Update file explorer with any loaded files
    updateExplorer()
    
    // Setup event listeners
    setupEventListeners()
    
    // Restore chat history if available
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        addChatMessage(msg.text, msg.type)
      })
    } else {
      // Show welcome message only if no chat history
      addChatMessage('Hi! You can edit existing code OR write new code from scratch. Just describe what you want!', 'ai')
    }
  } catch (error) {
    console.error('Failed to initialize app:', error)
    document.getElementById('app').innerHTML = `<div style="color: red; padding: 20px;">Error loading app: ${error.message}</div>`
  }
}

// Initialize Monaco editors
function initializeMonacoEditors() {
  require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' }})
  
  require(['vs/editor/editor.main'], function(){
    try {
      // Main editor
      const editorContainer = document.getElementById('editor')
      if (!editorContainer) {
        console.error('Editor container not found')
        return
      }
      
      // Load initial content from storage or use default
      let initialContent = `function hello() {
  console.log("hello")
}`
      let initialLanguage = 'javascript'
      
      if (files[currentFile]) {
        initialContent = files[currentFile]
        initialLanguage = getLanguage(currentFile)
      } else if (Object.keys(files).length > 0) {
        currentFile = Object.keys(files)[0]
        initialContent = files[currentFile]
        initialLanguage = getLanguage(currentFile)
      } else {
        files[currentFile] = initialContent
      }
      
      editor = monaco.editor.create(editorContainer, {
        value: initialContent,
        language: initialLanguage,
        theme: 'vs-dark',
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'Monaco', 'Menlo', monospace"
      })

      // Ensure TypeScript/React settings for TSX/JSX files
      try {
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          jsx: monaco.languages.typescript.JsxEmit.React,
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          allowNonTsExtensions: true
        })
      } catch (e) {
        console.warn('Could not set TypeScript compiler options:', e)
      }
      // Diff editor
      const diffContainer = document.getElementById('diffEditor')
      if (!diffContainer) {
        console.error('Diff editor container not found')
        return
      }
      
      diffEditor = monaco.editor.createDiffEditor(diffContainer, {
        theme: 'vs-dark',
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'Monaco', 'Menlo', monospace",
        renderSideBySide: false,
        readOnly: true
      })

      editor.onDidChangeCursorPosition(e => {
        const pos = e.position
        const lineInfo = document.getElementById('lineInfo')
        if (lineInfo) {
          lineInfo.textContent = `Line ${pos.lineNumber}, Col ${pos.column}`
        }
      })
      
      // Auto-save to localStorage on content change (debounced)
      let autoSaveTimeout
      editor.onDidChangeModelContent(() => {
        clearTimeout(autoSaveTimeout)
        autoSaveTimeout = setTimeout(() => {
          saveCurrentFile()
          saveFilesToStorage()
        }, 500)
      })
      
      // Setup preview auto-refresh
      setupPreviewAutoRefresh()
      
      // Ensure explorer reflects loaded files and open current file
      updateExplorer()
      if (files[currentFile]) {
        openFile(currentFile)
      }
      
      // If preview is visible, render initial content
      const previewSection = document.querySelector('.preview-section')
      if (previewSection && !previewSection.classList.contains('hidden')) {
        refreshPreview()
      }
      
      console.log('Monaco editors initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Monaco editors:', error)
    }
  }, function(err) {
    console.error('Failed to load Monaco editor:', err)
  })
}

// Setup event listeners
function setupEventListeners() {
  const chatInput = document.getElementById('chatInput')
  const sendBtn = document.getElementById('sendBtn')
  
  chatInput.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  })
  
  sendBtn.addEventListener('click', sendMessage)
}

// Chat message functions
function addChatMessage(text, type = 'ai', isLoading = false) {
  const messagesDiv = document.getElementById('chatMessages')
  const messageDiv = document.createElement('div')
  messageDiv.className = `message ${type} ${isLoading ? 'loading' : ''}`
  
  const bubble = document.createElement('div')
  bubble.className = 'message-bubble'
  
  if (isLoading) {
    bubble.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>'
  } else {
    bubble.textContent = text
    // Save chat history when message is added (but not loading messages)
    setTimeout(() => saveChatHistory(), 100)
  }
  
  messageDiv.appendChild(bubble)
  messagesDiv.appendChild(messageDiv)
  messagesDiv.scrollTop = messagesDiv.scrollHeight
  
  return messageDiv
}

function updateChatMessage(messageDiv, text, type = 'success') {
  messageDiv.className = `message ai ${type}`
  const bubble = messageDiv.querySelector('.message-bubble')
  bubble.textContent = text
}

// Diff functions
function showDiff(oldCode, newCode, isSelection = false, startLine = 0, endLine = 0) {
  originalCode = oldCode
  pendingCode = { 
    code: newCode,
    isSelection,
    startLine,
    endLine
  }
  
  const originalModel = monaco.editor.createModel(oldCode, 'javascript')
  const modifiedModel = monaco.editor.createModel(newCode, 'javascript')
  
  diffEditor.setModel({
    original: originalModel,
    modified: modifiedModel
  })
  
  // Force layout update
  setTimeout(() => {
    diffEditor.layout()
  }, 100)
  
  document.getElementById('editor').classList.add('hide')
  document.getElementById('diffEditor').classList.add('show')
  document.getElementById('diffActions').classList.add('show')
  document.getElementById('status').textContent = 'Reviewing Changes'
  document.getElementById('status').className = 'status reviewing'
}

function acceptChanges() {
  if (pendingCode) {
    // If it was a selection edit, merge back into full file
    if (pendingCode.isSelection) {
      const fullCode = editor.getValue()
      const lines = fullCode.split('\n')
      const newLines = pendingCode.code.split('\n')
      
      // Replace only the selected lines
      lines.splice(pendingCode.startLine - 1, pendingCode.endLine - pendingCode.startLine + 1, ...newLines)
      editor.setValue(lines.join('\n'))
    } else {
      editor.setValue(pendingCode.code)
    }
    hideDiff()
    addChatMessage('✓ Changes applied', 'ai')
  }
}

function rejectChanges() {
  hideDiff()
  addChatMessage('✗ Changes rejected', 'ai')
}

function hideDiff() {
  document.getElementById('editor').classList.remove('hide')
  document.getElementById('diffEditor').classList.remove('show')
  document.getElementById('diffActions').classList.remove('show')
  document.getElementById('status').textContent = 'Ready'
  document.getElementById('status').className = 'status ready'
  pendingCode = null
  originalCode = null
}

// Message sending
async function sendMessage() {
  const input = document.getElementById('chatInput')
  const instruction = input.value.trim()
  
  if (!instruction) return
  
  saveCurrentFile()
  
  const sendBtn = document.getElementById('sendBtn')
  const status = document.getElementById('status')
  
  addChatMessage(instruction, 'user')
  input.value = ''
  
  const loadingMsg = addChatMessage('', 'ai', true)
  
  isEditing = true
  sendBtn.disabled = true
  status.textContent = 'Generating...'
  status.className = 'status editing'
  
  try {
    // Send ALL files as working set context
    const payload = {
      instruction,
      files: files,
      currentFile: currentFile
    }
    
    const res = await fetch('http://localhost:3000/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Request failed')
    }
    
    const data = await res.json()
    
    loadingMsg.remove()
    
    if (data.files) {
      // Multi-file response - update all files
      Object.entries(data.files).forEach(([filename, content]) => {
        files[filename] = content
      })
      
      saveFilesToStorage()
      updateExplorer()
      
      // Open first modified file
      const firstFile = Object.keys(data.files)[0]
      if (firstFile) {
        openFile(firstFile)
      }
      
      addChatMessage(`✓ Generated ${Object.keys(data.files).length} file(s)`, 'ai')
    } else if (data.code) {
      // Single file response (backward compat)
      files[currentFile] = data.code
      editor.setValue(data.code)
      saveFilesToStorage()
      addChatMessage('✓ Code generated', 'ai')
    } else {
      addChatMessage('No code generated', 'ai')
    }
  } catch (error) {
    updateChatMessage(loadingMsg, '✗ Error: ' + error.message, 'error')
    console.error(error)
  } finally {
    isEditing = false
    sendBtn.disabled = false
    status.textContent = 'Ready'
    status.className = 'status ready'
  }
}

// Context building
function buildContext(code, position, selection) {
  const lines = code.split('\n')
  const totalLines = lines.length
  
  // Extract imports and exports (symbols)
  const symbols = extractSymbols(code)
  
  // If user has selection, use only that
  if (selection && !selection.isEmpty()) {
    const selectedCode = editor.getModel().getValueInRange(selection)
    return {
      mode: 'selection',
      selectedCode,
      symbols,
      startLine: selection.startLineNumber,
      endLine: selection.endLineNumber,
      totalLines
    }
  }
  
  // Otherwise use cursor window (100 lines above/below)
  const cursorLine = position.lineNumber
  const windowSize = 100
  const startLine = Math.max(1, cursorLine - windowSize)
  const endLine = Math.min(totalLines, cursorLine + windowSize)
  
  const contextLines = lines.slice(startLine - 1, endLine)
  const contextCode = contextLines.join('\n')
  
  return {
    mode: 'window',
    contextCode,
    symbols,
    cursorLine,
    startLine,
    endLine,
    totalLines
  }
}

function extractSymbols(code) {
  const symbols = {
    imports: [],
    exports: [],
    functions: [],
    classes: []
  }
  
  const lines = code.split('\n')
  
  lines.forEach(line => {
    const trimmed = line.trim()
    
    // Extract imports
    if (trimmed.startsWith('import ')) {
      symbols.imports.push(trimmed)
    }
    
    // Extract exports
    if (trimmed.startsWith('export ')) {
      const match = trimmed.match(/export (?:default |const |function |class )?(\w+)/)
      if (match) symbols.exports.push(match[1])
    }
    
    // Extract function names
    const funcMatch = trimmed.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/)
    if (funcMatch) symbols.functions.push(funcMatch[1])
    
    // Extract class names
    const classMatch = trimmed.match(/class\s+(\w+)/)
    if (classMatch) symbols.classes.push(classMatch[1])
  })
  
  return symbols
}

function newFile() {
  saveCurrentFile()
  const filename = prompt('Enter filename (e.g., index.js, style.css, index.html):')
  if (filename) {
    files[filename] = ''
    currentFile = filename
    editor.setValue('')
    const model = editor.getModel()
    const language = getLanguage(filename)
    monaco.editor.setModelLanguage(model, language)
    updateExplorer()
    saveFilesToStorage()
    addChatMessage(`Created ${filename}. Describe what you want!`, 'ai')
  }
}

function getLanguage(filename) {
  const ext = filename.split('.').pop()
  const langs = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescriptreact',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown'
  }
  return langs[ext] || 'plaintext'
}

function saveCurrentFile() {
  if (currentFile && editor) {
    files[currentFile] = editor.getValue()
  }
}

function openFile(filename) {
  if (!editor) {
    console.warn('Editor is not initialized.');
    return;
  }
  saveCurrentFile();
  currentFile = filename;

  if (!files[filename]) {
    files[filename] = '';
  }

  editor.setValue(files[filename]);
  saveFilesToStorage();

  // Set language correctly
  const model = editor.getModel();
  const language = getLanguage(filename);
  monaco.editor.setModelLanguage(model, language);

  document.querySelectorAll('.file-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-file="${filename}"]`)?.classList.add('active');

  // Always show editor when opening a file
  const editorDiv = document.getElementById('editor');
  if (editorDiv) {
    editorDiv.classList.remove('hide');
    if (editor) editor.layout();
  }

  // Refresh preview for new file if visible
  const previewSection = document.querySelector('.preview-section');
  if (previewSection && !previewSection.classList.contains('hidden')) {
    refreshPreview();
  }
}

function closeFile(filename, e) {
  e.stopPropagation()
  delete files[filename]
  
  if (currentFile === filename) {
    const remaining = Object.keys(files)
    currentFile = remaining.length > 0 ? remaining[0] : 'index.js'
    if (remaining.length > 0) {
      openFile(currentFile)
    } else {
      editor.setValue('')
    }
  }
  
  saveFilesToStorage()
  updateExplorer()
}

function updateExplorer() {
  const explorer = document.getElementById('explorerFiles')
  explorer.innerHTML = ''
  
  Object.keys(files).forEach(filename => {
    const item = document.createElement('div')
    item.className = `file-item ${filename === currentFile ? 'active' : ''}`
    item.setAttribute('data-file', filename)
    item.innerHTML = `
      <span class="file-name">${filename}</span>
      <span class="file-close" onclick="closeFile('${filename}', event)">×</span>
    `
    item.onclick = () => openFile(filename)
    explorer.appendChild(item)
  })
}

function copyCode() {
  const code = editor.getValue()
  navigator.clipboard.writeText(code).then(() => {
    addChatMessage('✓ Code copied to clipboard', 'ai')
  }).catch(() => {
    addChatMessage('✗ Failed to copy', 'ai')
  })
}

// Preview functions
function refreshPreview() {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => {
    if (!editor) {
      console.warn('Editor is not initialized.');
      return;
    }
    const code = editor.getValue();
    const filename = currentFile;
    const ext = filename.split('.').pop().toLowerCase();

    try {
      if (!isPreviewableFile(filename, code)) {
        showPreviewError('Preview unavailable for this file. Supported: .html, .jsx, .tsx, .js, .ts (React/JSX files only)');
        return;
      }

      if (ext === 'html') {
        renderHTMLPreview(code);
      } else {
        renderReactPreview(code);
      }
    } catch (error) {
      showPreviewError(error.message);
    }
  }, 200)
}

function isPreviewableFile(filename, code = '') {
  const ext = filename.split('.').pop().toLowerCase();
  const previewable = ['html', 'jsx', 'tsx', 'js', 'ts'];
  if (!previewable.includes(ext)) return false;
  if (ext === 'html') return true;
  // For plain js/ts, require JSX/react hints
  const reactHint = /\bReact\b/.test(code) || /from ['\"]react['\"]/.test(code) || /<\s*[A-Z]/.test(code) || /ReactDOM/.test(code) || /createRoot\(/.test(code);
  return ext === 'jsx' || ext === 'tsx' || reactHint;
}

function renderHTMLPreview(html) {
  const frame = document.getElementById('previewFrame')
  if (!frame) return
  
  try {
    clearPreviewError()
    frame.srcdoc = html
    console.log('HTML preview rendered')
  } catch (error) {
    showPreviewError('Failed to render HTML: ' + error.message)
  }
}

async function renderReactPreview(code) {
  const frame = document.getElementById('previewFrame')
  if (!frame) return
  
  try {
    // Check if the code is empty or just whitespace
    if (!code || !code.trim()) {
      const emptyHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>React Preview</title>
        </head>
        <body style="margin: 0; padding: 20px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="text-align: center; color: #999; padding: 40px 20px;">
            <p>Empty file. Start typing to see preview...</p>
          </div>
        </body>
        </html>
      `
      clearPreviewError()
      frame.srcdoc = emptyHtml
      console.log('Empty file preview rendered')
      return
    }

    // First try server-side bundler endpoints (fastest and most robust for multi-file apps)
    const bundlerEndpoints = ['/bundle', '/api/bundle', '/runtime-bundle', '/api/runtime-bundle']
    const payload = { files: files, entry: currentFile }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    for (const ep of bundlerEndpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        })
        if (!res.ok) continue
        // Accept JSON { html } or raw text
        const ct = res.headers.get('content-type') || ''
        clearTimeout(timeout)
        if (ct.includes('application/json')) {
          const json = await res.json()
          if (json && json.html) {
            clearPreviewError()
            frame.srcdoc = json.html
            console.log('React preview rendered via bundler', ep)
            return
          }
        } else {
          const text = await res.text()
          if (text && text.trim().startsWith('<!DOCTYPE')) {
            clearPreviewError()
            frame.srcdoc = text
            console.log('React preview rendered via bundler (text)', ep)
            return
          }
        }
      } catch (err) {
        // try next endpoint
        console.warn('Bundler endpoint failed:', ep, err)
      }
    }
    clearTimeout(timeout)

    // Process code to extract and handle imports properly
    // if multiple JS/JSX files present, include their contents so components are available
    let combined = ''
    Object.entries(files).forEach(([fname, fcontent]) => {
      const fext = fname.split('.').pop().toLowerCase()
      if (['js','jsx','ts','tsx'].includes(fext)) {
        if (fname !== currentFile) {
          combined += '\n' + fcontent
        }
      }
    })
    combined += '\n' + code
    
    let processedCode = combined
      // strip import/export lines - Babel standalone doesn't support modules
      .replace(/^\s*import\s+.*$/gm, '')
      .replace(/^\s*export\s+default\s+/gm, '')
      .replace(/^\s*export\s+/gm, '')

    // Escape any closing script tags to avoid breaking the template
    const safeCode = processedCode.replace(/<\/script>/gi, '<\\/script>')

    // Create a complete HTML document with React and a resilient Babel loader
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>React Preview</title>
        <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          #root { padding: 20px; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          (function(){
            const babelUrls = [
              'https://unpkg.com/@babel/standalone/babel.min.js',
              'https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js',
              'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.26.0/babel.min.js'
            ];

            function loadScript(url){
              return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = url;
                s.onload = () => resolve(url);
                s.onerror = () => reject(new Error('Failed to load ' + url));
                document.head.appendChild(s);
              });
            }

            const userCode = window.__USER_CODE__ || '';
            const cleanCode = userCode.replace(/import\s+['"][^'\"]*\.css['"];?/g, '');

            (async function(){
              let loaded = false;
              for (const u of babelUrls) {
                try {
                  await loadScript(u);
                  loaded = true;
                  break;
                } catch (e) {
                  console.warn('Babel load failed:', u);
                }
              }

              const root = document.getElementById('root');
              if (!loaded) {
                root.innerHTML = '<p style="color: #f48771;">Failed to load Babel. React preview unavailable.</p>';
                return;
              }

              try {
                // Parse imports and inject lightweight fallbacks for common libs (icons, UI, framer-motion)
                function parseImports(code) {
                  const imports = [];
                  const regex = /import\s+(?:(\w+)|\{([^}]+)\})\s+from\s+['"]([^'"]+)['"]/g;
                  let m;
                  while ((m = regex.exec(code)) !== null) {
                    const def = m[1];
                    const named = m[2];
                    const src = m[3];
                    const specs = [];
                    if (def) specs.push(def);
                    if (named) {
                      named.split(',').forEach(n => {
                        const cleaned = n.trim().split(/\s+as\s+/).pop()?.trim();
                        if (cleaned) specs.push(cleaned);
                      })
                    }
                    imports.push({ source: src, specifiers: specs });
                  }
                  return imports;
                }

                const imports = parseImports(cleanCode);
                const injections = [];
                const injected = new Set();
                imports.forEach(imp => {
                  imp.specifiers.forEach(spec => {
                    if (!spec || injected.has(spec) || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(spec)) return;
                    injected.add(spec);
                    if (spec === 'Link') {
                      injections.push('const Link = ({ to, href, children, ...props }) => React.createElement(\'a\', { href: to || href || \"#\", ...props }, children);');
                    } else if (spec === 'Button') {
                      injections.push('const Button = ({ children, ...props }) => React.createElement(\'button\', props, children);');
                    } else if (spec === 'Card') {
                      injections.push('const Card = ({ children, ...props }) => React.createElement(\'div\', props, children);');
                    } else if (spec === 'Input') {
                      injections.push('const Input = (props) => React.createElement(\'input\', props);');
                    } else if (spec.includes('Icon') || /^(Chevron|Circle|Arrow|X|Check)/.test(spec)) {
                      injections.push('const ' + spec + ' = (props) => React.createElement(\'svg\', Object.assign({ width: 24, height: 24, viewBox: \"0 0 24 24\", fill: \"none\", stroke: \"currentColor\" }, props), React.createElement(\'circle\', { cx: 12, cy: 12, r: 10 }));');
                    } else if (spec === 'motion') {
                      injections.push('const motion = window.Motion?.motion || new Proxy({}, { get: ()=>()=>()=>null });');
                    } else if (spec === 'AnimatePresence') {
                      injections.push('const AnimatePresence = window.Motion?.AnimatePresence || (({ children }) => children);');
                    } else if (imp.source && imp.source.includes('framer-motion')) {
                      injections.push('const ' + spec + ' = window.Motion?.' + spec + ' || (()=>null);');
                    } else if (!['react','react-dom'].includes(imp.source)) {
                      injections.push('const ' + spec + ' = (props) => React.createElement(\'div\', props, props.children || null);');
                    }
                  })
                })

                const finalCode = injections.join('\n') + '\n\n' + cleanCode;
                const transformed = Babel.transform(finalCode, { filename: 'file.tsx', presets: ['react', 'typescript', 'env'] }).code;
                // Evaluate transformed code in global scope
                (0, eval)(transformed);

                // Attempt to render common component names
                if (typeof App !== 'undefined') {
                  ReactDOM.createRoot(root).render(React.createElement(App));
                  return;
                }
                if (typeof Component !== 'undefined') {
                  ReactDOM.createRoot(root).render(React.createElement(Component));
                  return;
                }
                for (const k in window) {
                  if (/^[A-Z][A-Za-z0-9_]*$/.test(k) && typeof window[k] === 'function') {
                    ReactDOM.createRoot(root).render(React.createElement(window[k]));
                    return;
                  }
                }

                root.innerHTML = '<p style="color: #f48771;">No App or Component found to render</p>';
              } catch (err) {
                root.innerHTML = '<pre style="color: red; padding: 20px; white-space: pre-wrap; font-size: 12px;">' +
                  'Preview error: ' + err.message + '\\n\\n' + err.stack + '</pre>';
                console.error('Preview render error:', err);
              }
            })();
          })();
        </script>
      </body>
      </html>
    `
    frame.srcdoc = html
    // Inject user code into iframe after it loads
    frame.onload = () => {
      try {
        if (frame.contentWindow) {
          frame.contentWindow.__USER_CODE__ = safeCode
        }
      } catch (e) {
        console.warn('Could not inject user code:', e)
      }
    }
    console.log('React preview rendered')
  } catch (error) {
    showPreviewError('Failed to render React: ' + error.message)
  }
}

function renderJSPreview(code) {
  // if code seems React/JSX, hand off to React renderer
  const reactLike = /\bReact\b/.test(code) || /from ['\"]react['\"]/.test(code) || /<[^>]+>/.test(code)
  if (reactLike) {
    renderReactPreview(code)
    return
  }

  const frame = document.getElementById('previewFrame')
  if (!frame) return
  
  try {
    // Remove imports and exports before putting in iframe
    let cleanCode = code
      .replace(/^\s*import\s+.*?from\s+['"].*?['"];?$/gm, '')
      .replace(/^\s*export\s+default\s+/gm, '')
      .replace(/^\s*export\s+/gm, '')
    
    // Create a complete HTML document with JS
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JavaScript Preview</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
          #output { white-space: pre-wrap; font-family: monospace; }
        </style>
      </head>
      <body>
        <div id="output"></div>
        <script>
          (function() {
            try {
              const output = document.getElementById('output')
              const originalLog = console.log
              const logs = []
              
              console.log = function(...args) {
                logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '))
                originalLog.apply(console, args)
              }
              
              ${cleanCode}
              
              if (logs.length > 0) {
                output.textContent = logs.join('\\n')
              } else {
                output.textContent = 'Code executed. Check console for output.'
              }
            } catch (error) {
              document.getElementById('output').innerHTML = '<span style="color: red;">Error: ' + error.message + '</span>'
              console.error('Preview error:', error)
            }
          })()
        </script>
      </body>
      </html>
    `
    clearPreviewError()
    frame.srcdoc = html
    console.log('JavaScript preview rendered')
  } catch (error) {
    showPreviewError('Failed to render JavaScript: ' + error.message)
  }
}

function showPreviewError(message) {
  const container = document.getElementById('previewContainer')
  if (!container) return
  
  const frame = document.getElementById('previewFrame')
  if (frame) {
    frame.style.display = 'none'
  }
  
  let errorDiv = container.querySelector('.preview-error')
  if (errorDiv) {
    errorDiv.textContent = message
  } else {
    const newErrorDiv = document.createElement('div')
    newErrorDiv.className = 'preview-error'
    newErrorDiv.style.cssText = 'padding: 16px; color: #f48771; font-family: monospace; font-size: 12px; overflow: auto;'
    newErrorDiv.textContent = message
    container.appendChild(newErrorDiv)
  }
}

function clearPreviewError() {
  const container = document.getElementById('previewContainer')
  if (!container) return
  
  const errorDiv = container.querySelector('.preview-error')
  if (errorDiv) {
    errorDiv.remove()
  }
  
  const frame = document.getElementById('previewFrame')
  if (frame) {
    frame.style.display = 'block'
  }
}

function togglePreview() {
  const previewSection = document.querySelector('.preview-section')
  if (!previewSection) return
  
  const isHidden = previewSection.classList.toggle('hidden')
  const isVisible = !isHidden
  
  // Save preference to localStorage
  localStorage.setItem(PREVIEW_VISIBLE_KEY, isVisible ? 'true' : 'false')
  
  // Show editor if preview is hidden
  const editorDiv = document.getElementById('editor');
  if (editorDiv) {
    if (isVisible) {
      // Preview visible, just relayout editor
      setTimeout(() => {
        if (editor) editor.layout();
      }, 300);
    } else {
      // Preview hidden, ensure editor is visible
      editorDiv.classList.remove('hide');
      setTimeout(() => {
        if (editor) editor.layout();
      }, 300);
    }
  }

  // Refresh preview if becoming visible
  if (isVisible) {
    setTimeout(() => refreshPreview(), 100);
  }
}

function restorePreviewVisibility() {
  const previewVisible = localStorage.getItem(PREVIEW_VISIBLE_KEY)
  const previewSection = document.querySelector('.preview-section')
  
  if (previewSection) {
    // Default to visible if not set
    if (previewVisible === 'false') {
      previewSection.classList.add('hidden')
    } else {
      previewSection.classList.remove('hidden')
    }
  }
}

// Auto-refresh preview when code changes (debounced)
let previewTimeout
function setupPreviewAutoRefresh() {
  if (!editor) return
  
  editor.onDidChangeModelContent(() => {
    clearTimeout(previewTimeout)
    previewTimeout = setTimeout(() => {
      const filename = currentFile
      const ext = filename.split('.').pop().toLowerCase()
      
      // Only auto-refresh for previewable files
      const code = editor.getValue()
      if (isPreviewableFile(filename, code)) {
        refreshPreview()
      }
    }, 1000) // Debounce for 1 second
  })
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  initializeApp()
}
