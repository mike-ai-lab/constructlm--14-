# Setup & Testing - Ready to Go! 🚀

## Quick Setup

### 1. Install Dependencies
```powershell
cd ai-editor
npm install
```

This will install:
- express
- cors
- archiver (NEW - for ZIP downloads)
- dotenv
- node-fetch

### 2. Start Server
```powershell
node server.js
```

**Expected Output:**
```
✓ Groq API Key loaded successfully
✓ AI Code Editor running on http://localhost:5000
✓ Groq API configured: Yes
```

### 3. Open Browser
```
http://localhost:5000
```

---

## Test Sequence

### Test 1: Dashboard Project (5 min)
```
Input: "Create a modern analytics dashboard with sidebar, header, metric cards, charts, and activity table"

Expected:
✅ Folder structure appears in explorer
✅ Files organized in components/, pages/, utils/, etc.
✅ First file opens in editor
✅ Activity log shows success
```

### Test 2: Download Project (2 min)
```
Action: Click "Download" button

Expected:
✅ my-dashboard.zip downloads
✅ Activity log shows "✅ Downloaded: my-dashboard.zip"
✅ File appears in Downloads folder
```

### Test 3: Verify ZIP Contents (3 min)
```
Action: Extract ZIP file

Expected:
✅ All files present
✅ Folder structure intact
✅ Files are valid React code
✅ Can open and read files
```

### Test 4: Check Server Logs (2 min)
```powershell
dir logs/
cat logs/projects-2026-03-10.json
```

**Expected:**
```json
[
  {
    "timestamp": "2026-03-10T...",
    "projectName": "my-dashboard",
    "projectType": "dashboard",
    "filesCount": 8,
    "instruction": "Create a modern analytics dashboard...",
    "success": true,
    "status": "✅ SUCCESS"
  }
]
```

### Test 5: E-commerce Project (5 min)
```
Input: "Build an e-commerce store with products, cart, and checkout"

Expected:
✅ Different folder structure (ecommerce type)
✅ Different components (ProductList, Cart, Checkout)
✅ Download works
✅ Logged in server
```

### Test 6: Blog Project (5 min)
```
Input: "Generate a blog application with posts, comments, and categories"

Expected:
✅ Blog-specific structure
✅ Post, Comment, Category components
✅ Download works
✅ Logged in server
```

---

## Verification Checklist

### Frontend Features
- [ ] Download button visible in header
- [ ] Download button has download icon
- [ ] Download works for generated projects
- [ ] Activity log shows download messages
- [ ] Folder structure displays correctly
- [ ] Files open in editor

### Backend Features
- [ ] `/create-project` endpoint works
- [ ] `/download-project` endpoint works
- [ ] Files written to disk
- [ ] Logs directory created
- [ ] Log files written correctly
- [ ] ZIP files created successfully

### Integration
- [ ] Create project → files generated
- [ ] Files → displayed in explorer
- [ ] Download → ZIP created
- [ ] ZIP → contains all files
- [ ] Logs → recorded on server

---

## File Locations

**Server:** `ai-editor/server.js`
**Frontend:** `ai-editor/js/app.js`
**Header:** `ai-editor/components/header.html`
**Logs:** `ai-editor/logs/projects-YYYY-MM-DD.json`
**Generated Projects:** `ai-editor/{projectName}/`

---

## Troubleshooting

### Server won't start
```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F

# Try again
node server.js
```

### Download button doesn't work
- Check browser console (F12)
- Verify server is running
- Check that files are generated

### ZIP file is empty
- Verify files are in `files` object
- Check server logs for errors
- Try generating project again

### Logs not created
- Check `logs/` directory exists
- Verify write permissions
- Check server console output

---

## Success Criteria

✅ All tests pass  
✅ Projects generate with folder structure  
✅ Download creates valid ZIP files  
✅ Server logs all generations  
✅ No errors in browser console  
✅ No errors in server console  

**Then proceed to Phase 2!** 🎉

---

## Commands Reference

```powershell
# Install dependencies
npm install

# Start server
node server.js

# View logs
cat logs/projects-2026-03-10.json

# List generated projects
dir

# Check if port is in use
netstat -ano | findstr :5000
```

---

## Next: Phase 2

After all tests pass:
1. Document any issues found
2. Create test report
3. Plan Phase 2 improvements
4. Begin Phase 2 implementation

**Current Status:** ✅ READY FOR TESTING
