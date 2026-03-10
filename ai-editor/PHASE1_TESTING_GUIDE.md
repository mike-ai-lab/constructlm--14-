# Phase 1 Testing Guide

## Quick Start

### 1. Start the Server
```bash
cd ai-editor
node server.js
```

You should see:
```
✓ Groq API Key loaded successfully
✓ AI Code Editor running on http://localhost:5000
✓ Groq API configured: Yes
```

### 2. Test the /create-project Endpoint

#### Test 1: Dashboard Project
```bash
curl -X POST http://localhost:5000/create-project \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-dashboard",
    "instruction": "Create a dashboard with charts, tables, and sidebar"
  }'
```

Expected Response:
```json
{
  "success": true,
  "projectName": "my-dashboard",
  "projectType": "dashboard",
  "structure": {
    "components": [],
    "pages": [],
    "utils": [],
    "hooks": [],
    "styles": []
  },
  "filesCreated": 5,
  "files": {
    "my-dashboard/components/Sidebar.js": "...",
    "my-dashboard/components/Header.js": "...",
    "my-dashboard/pages/Dashboard.js": "...",
    "my-dashboard/utils/helpers.js": "...",
    "my-dashboard/hooks/useAuth.js": "..."
  },
  "summary": "✅ Created project \"my-dashboard\" with 5 files in organized structure"
}
```

#### Test 2: E-commerce Project
```bash
curl -X POST http://localhost:5000/create-project \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-store",
    "instruction": "Create an e-commerce store with products, cart, and checkout"
  }'
```

Expected: Should include `services/` folder for API calls

#### Test 3: Blog Project
```bash
curl -X POST http://localhost:5000/create-project \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-blog",
    "instruction": "Create a blog with posts, categories, and search"
  }'
```

Expected: Should include `posts/` folder

#### Test 4: Portfolio Project
```bash
curl -X POST http://localhost:5000/create-project \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-portfolio",
    "instruction": "Create a portfolio website to showcase my projects"
  }'
```

Expected: Should NOT include `hooks/` or `services/` folders

#### Test 5: Generic App
```bash
curl -X POST http://localhost:5000/create-project \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-app",
    "instruction": "Create a todo app with add, delete, and filter"
  }'
```

Expected: Should include all folders (default structure)

---

## Validation Checks

### Check 1: File Organization
Verify files are in correct folders:
- ✅ Components in `components/`
- ✅ Pages in `pages/`
- ✅ Utilities in `utils/`
- ✅ Hooks in `hooks/`
- ✅ Services in `services/`

### Check 2: Naming Conventions
Verify naming follows conventions:
- ✅ Components: PascalCase (Button.js, Sidebar.js)
- ✅ Utilities: camelCase (helpers.js, api.js)
- ✅ Hooks: camelCase (useAuth.js, useFetch.js)

### Check 3: Code Quality
Verify all files are valid React:
- ✅ Has `export default function`
- ✅ Returns JSX (not string/object/null)
- ✅ No CSS imports
- ✅ No external libraries
- ✅ State is initialized

### Check 4: Project Type Detection
Verify correct project type is detected:
- ✅ "dashboard" keyword → dashboard type
- ✅ "store" keyword → ecommerce type
- ✅ "blog" keyword → blog type
- ✅ "portfolio" keyword → portfolio type
- ✅ No keywords → app type

---

## Common Issues & Solutions

### Issue: "Project name must be lowercase alphanumeric with hyphens"
**Solution:** Use lowercase names with hyphens
- ✅ my-dashboard
- ✅ my-store
- ❌ MyDashboard
- ❌ my_dashboard

### Issue: "Missing projectName or instruction"
**Solution:** Ensure both fields are provided in request body
```json
{
  "projectName": "my-app",
  "instruction": "Create a todo app"
}
```

### Issue: Files not in correct folders
**Solution:** Check if project type was detected correctly
- Look at `projectType` in response
- Verify keywords in instruction match detection keywords

### Issue: Generated code has errors
**Solution:** Check validation errors in console
- Server logs validation errors for each file
- Look for "Validation errors in" messages

---

## Performance Metrics

### Expected Response Times
- Small project (3-5 files): 2-5 seconds
- Medium project (5-8 files): 5-10 seconds
- Large project (8+ files): 10-15 seconds

### File Size Expectations
- Small component: 200-400 bytes
- Medium component: 400-800 bytes
- Large component: 800-1500 bytes

---

## Success Indicators

✅ All tests pass
✅ Files organized in correct folders
✅ Naming conventions followed
✅ All generated code is valid React
✅ Project type detected correctly
✅ Response includes summary message
✅ No validation errors in console

---

## Next Steps

After Phase 1 testing is complete:
1. Integrate with frontend UI
2. Add "Create Project" button
3. Display project structure in explorer
4. Move to Phase 2: Interactive Chat Integration
