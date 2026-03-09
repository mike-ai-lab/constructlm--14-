// Global state
let editor
let diffEditor
let isEditing = false
let pendingCode = null
let originalCode = null
let files = {}
let currentFile = 'index.js'

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
    const chatHTML = await fetch(basePath + 'components/chat.html').then(r => {
      if (!r.ok) throw new Error(`Failed to load chat: ${r.status}`)
      return r.text()
    })
    
    app.innerHTML = `
      ${headerHTML}
      <div class="container">
        ${explorerHTML}
        ${editorHTML}
        ${chatHTML}
      </div>
    `
    
    // Initialize Monaco editors after DOM is ready
    initializeMonacoEditors()
    
    // Setup event listeners
    setupEventListeners()
    
    // Show welcome message
    addChatMessage('Hi! You can edit existing code OR write new code from scratch. Just describe what you want!', 'ai')
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
      
      editor = monaco.editor.create(editorContainer, {
        value: `function hello() {
  console.log("hello")
}`,
        language: 'javascript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'Monaco', 'Menlo', monospace"
      })

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

// File management
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
    addChatMessage(`Created ${filename}. Describe what you want!`, 'ai')
  }
}

function getLanguage(filename) {
  const ext = filename.split('.').pop()
  const langs = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
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
  saveCurrentFile()
  currentFile = filename
  
  if (!files[filename]) {
    files[filename] = ''
  }
  
  editor.setValue(files[filename])
  
  // Set language correctly
  const model = editor.getModel()
  const language = getLanguage(filename)
  monaco.editor.setModelLanguage(model, language)
  
  document.querySelectorAll('.file-item').forEach(item => {
    item.classList.remove('active')
  })
  document.querySelector(`[data-file="${filename}"]`)?.classList.add('active')
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

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  initializeApp()
}
