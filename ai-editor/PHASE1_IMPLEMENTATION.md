# Phase 1: Intelligent Folder Management - Implementation Guide

## Overview

Phase 1 focuses on making the AI automatically create organized folder structures and place files correctly.

## What Gets Built

### 1. Project Structure Analyzer

```javascript
// Analyzes user request to determine needed structure
function analyzeProjectStructure(instruction) {
  // Detect project type
  const projectType = detectType(instruction);
  // e.g., "dashboard", "ecommerce", "blog", "portfolio"
  
  // Determine needed folders
  const folders = getDefaultStructure(projectType);
  // e.g., components/, pages/, utils/, hooks/, styles/
  
  // Estimate needed files
  const files = estimateFiles(instruction);
  // e.g., ["components/Sidebar.js", "pages/Dashboard.js"]
  
  return { projectType, folders, files };
}
```

### 2. Project Creation Endpoint

```javascript
POST /create-project
{
  "projectName": "my-dashboard",
  "instruction": "Create a dashboard with charts, tables, and sidebar"
}

Response:
{
  "projectName": "my-dashboard",
  "structure": {
    "components": [],
    "pages": [],
    "utils": [],
    "hooks": [],
    "styles": []
  },
  "files": {
    "my-dashboard/components/Sidebar.js": "...",
    "my-dashboard/pages/Dashboard.js": "...",
    ...
  }
}
```

### 3. Smart File Placement

```javascript
// Determines where each file should go
function determineFilePath(fileName, fileType, projectName) {
  if (fileType === 'component') {
    return `${projectName}/components/${fileName}`;
  }
  if (fileType === 'page') {
    return `${projectName}/pages/${fileName}`;
  }
  if (fileType === 'utility') {
    return `${projectName}/utils/${fileName}`;
  }
  if (fileType === 'hook') {
    return `${projectName}/hooks/${fileName}`;
  }
  if (fileType === 'style') {
    return `${projectName}/styles/${fileName}`;
  }
}
```

## Implementation Steps

### Step 1: Update System Prompt

Add to `SYSTEM_PROMPT`:

```
PROJECT STRUCTURE RULES:
When creating a new project, organize files as follows:

FOLDER STRUCTURE:
- components/ - React components (PascalCase)
- pages/ - Page components (PascalCase)
- utils/ - Utility functions (camelCase)
- hooks/ - Custom React hooks (camelCase)
- styles/ - CSS/styling files (kebab-case)

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
└── styles/
    └── dashboard.css

When generating code, include the full path in comments:
// File: my-dashboard/components/Sidebar.js
```

### Step 2: Create Project Structure Analyzer

```javascript
// Add to server.js

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
  for (const [type, keywords] of Object.entries({
    dashboard: ['dashboard', 'analytics', 'metrics', 'charts'],
    ecommerce: ['shop', 'store', 'product', 'cart', 'checkout'],
    blog: ['blog', 'post', 'article', 'news'],
    portfolio: ['portfolio', 'project', 'showcase']
  })) {
    if (keywords.some(k => instruction.toLowerCase().includes(k))) {
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
```

### Step 3: Create Project Endpoint

```javascript
// Add to server.js

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
- Include index.js files for folder exports
- Follow the naming conventions`;

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
    
    while ((match = fileRegex.exec(aiResponse)) !== null) {
      const filePath = match[1].trim();
      let content = match[2].trim();
      
      // Remove markdown code blocks
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:javascript|jsx|typescript|tsx)?\n?/, '')
                        .replace(/\n?```$/, '');
      }
      
      files[filePath] = content;
    }
    
    res.json({
      success: true,
      projectName,
      projectType: projectStructure.projectType,
      structure: projectStructure.structure,
      filesCreated: Object.keys(files).length,
      files: files,
      summary: `✅ Created project "${projectName}" with ${Object.keys(files).length} files`
    });
    
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Step 4: Update Frontend

```javascript
// Add to app.js

/**
 * Create new project
 */
async function createProject() {
  const projectName = prompt('Enter project name (e.g., my-dashboard):');
  if (!projectName) return;
  
  const instruction = prompt('Describe your project:');
  if (!instruction) return;
  
  const status = document.getElementById('status');
  status.textContent = 'Creating project...';
  status.className = 'status editing';
  
  try {
    const response = await fetch('http://localhost:5000/create-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName, instruction })
    });
    
    if (!response.ok) {
      throw new Error('Project creation failed');
    }
    
    const result = await response.json();
    
    // Add all files to project
    Object.entries(result.files).forEach(([path, content]) => {
      files[path] = content;
    });
    
    saveFilesToStorage();
    updateExplorer();
    
    addChatMessage(`✅ ${result.summary}\n\n📁 Created ${result.filesCreated} files in organized structure`, 'ai');
    
    status.textContent = 'Ready';
    status.className = 'status ready';
    
  } catch (error) {
    addChatMessage(`❌ Error: ${error.message}`, 'error');
    status.textContent = 'Ready';
    status.className = 'status ready';
  }
}

// Add button to UI
const createProjectBtn = document.createElement('button');
createProjectBtn.textContent = '+ New Project';
createProjectBtn.onclick = createProject;
// Add to header
```

## Testing Phase 1

### Test 1: Create Dashboard Project

```
Request: "Create a dashboard with charts, tables, and sidebar"
Expected:
- Folder structure created: components/, pages/, utils/, hooks/, styles/
- Files created: Sidebar.js, Dashboard.js, Charts.js, Tables.js, etc.
- All files in correct folders
- No errors in console
```

### Test 2: Create E-commerce Project

```
Request: "Create an e-commerce store with products, cart, and checkout"
Expected:
- Folder structure: components/, pages/, utils/, hooks/, styles/, services/
- Files: ProductList.js, Cart.js, Checkout.js, etc.
- Services folder for API calls
```

### Test 3: Verify File Organization

```
Check file explorer:
- All components in components/
- All pages in pages/
- All utilities in utils/
- Consistent naming (PascalCase for components)
```

## Success Criteria

✅ **Phase 1 Complete When:**
- [ ] Projects create organized folder structures
- [ ] Files are placed in correct folders automatically
- [ ] Naming conventions are followed
- [ ] File explorer shows organized structure
- [ ] No manual file organization needed
- [ ] Users can create full projects with one request

## Next Steps

After Phase 1 is complete:
1. Move to Phase 2: Interactive Chat
2. Add task summaries
3. Implement conversation context
4. Add natural language support

---

**Phase 1 transforms the editor from a code generator into a project generator!** 🚀
