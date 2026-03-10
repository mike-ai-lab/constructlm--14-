// TEMPORARY: This is the fixed handleFullGeneration function
// Copy this to replace the existing one in app.js

/**
 * Handle full code generation requests
 */
async function handleFullGeneration(instruction) {
  const loadingMsg = addChatMessage('', 'ai', true)
  const sendBtn = document.getElementById('sendBtn')
  const status = document.getElementById('status')
  
  isEditing = true
  sendBtn.disabled = true
  status.textContent = 'Generating...'
  status.className = 'status editing'
  
  try {
    // Detect if this is a project creation request
    const isProjectCreation = /^(create|build|generate|make|setup|scaffold|init|start|new)\s+/i.test(instruction) && 
                             (instruction.toLowerCase().includes('project') || 
                              instruction.toLowerCase().includes('app') ||
                              instruction.toLowerCase().includes('dashboard') ||
                              instruction.toLowerCase().includes('website') ||
                              instruction.toLowerCase().includes('site') ||
                              instruction.toLowerCase().includes('application'))
    
    let endpoint = 'http://localhost:5000/edit'
    let payload = {
      instruction,
      files: {},
      currentFile: currentFile
    }
    
    // If creating a new project, use /create-project endpoint
    if (isProjectCreation) {
      endpoint = 'http://localhost:5000/create-project'
      // Extract project name from instruction if possible
      const nameMatch = instruction.match(/(?:create|build|generate|make)\s+(?:a\s+)?(?:new\s+)?(?:project|app|dashboard|website|site|application)?\s+(?:called|named|for)?\s+['\"]?([a-zA-Z0-9-_]+)['\"]?/i)
      const projectName = nameMatch ? nameMatch[1] : 'my-project'
      
      payload = {
        projectName,
        instruction
      }
      
      updateChatMessage(loadingMsg, '🏗️ Creating new project structure...', 'ai')
    }
    
    const res = await fetch(endpoint, {
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
      // Multi-file response - preserve folder structure
      Object.entries(data.files).forEach(([filePath, content]) => {
        // Keep the full path with folders
        files[filePath] = content
        
        // Auto-expand parent folders
        const parts = filePath.split('/')
        if (parts.length > 1) {
          let path = ''
          for (let i = 0; i < parts.length - 1; i++) {
            path += (path ? '/' : '') + parts[i]
            expandedFolders.add(path)
          }
        }
      })
      
      saveFilesToStorage()
      updateExplorer()
      
      // Open first file
      const firstFile = Object.keys(data.files)[0]
      if (firstFile && files[firstFile]) {
        openFile(firstFile)
      }
      
      logActivity(`Generated ${Object.keys(data.files).length} file(s) with folder structure`, 'success')
    } else if (data.code) {
      // Single file response
      files[currentFile] = data.code
      editor.setValue(data.code)
      saveFilesToStorage()
      logActivity('Code generated', 'success')
    } else {
      logActivity('No code generated', 'info')
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
