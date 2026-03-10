# Quick Test Guide - Project Generation

## Setup

1. **Start the server** (if not already running):
```powershell
cd ai-editor
node server.js
```

2. **Open the app** in browser:
```
http://localhost:5000
```

---

## Test Cases

### ✅ Test 1: Dashboard Project
**Input:**
```
Create a modern analytics dashboard with:
- sidebar navigation
- top header with user profile
- 3 metric cards
- a line chart and a bar chart
- a recent activity table
```

**Expected Output:**
- Folder structure in explorer:
  - `components/` (Sidebar.js, Header.js, MetricCard.js, Charts.js, ActivityTable.js)
  - `pages/` (Dashboard.js)
  - `utils/`, `hooks/`, `services/`
- All folders auto-expanded
- First file opens in editor
- No files in root folder

---

### ✅ Test 2: E-commerce Project
**Input:**
```
Build an e-commerce store with products, cart, and checkout
```

**Expected Output:**
- Proper e-commerce folder structure
- ProductList, Cart, Checkout components
- API service file
- All organized in folders

---

### ✅ Test 3: Blog Project
**Input:**
```
Generate a blog application with posts, comments, and categories
```

**Expected Output:**
- Blog-specific folder structure
- Post, Comment, Category components
- Proper organization

---

### ✅ Test 4: Modify Existing (Should NOT use /create-project)
**Input:**
```
Add a logout button to the Header component
```

**Expected Output:**
- Uses `/edit` endpoint (not `/create-project`)
- Modifies existing Header.js
- Preserves folder structure

---

## Verification Checklist

After each test, verify:

- [ ] Folder structure appears in explorer
- [ ] Folders are nested correctly
- [ ] No files in root (all in folders)
- [ ] Folders are auto-expanded
- [ ] First file opens in editor
- [ ] File content is valid React code
- [ ] Can click on files to open them
- [ ] Can expand/collapse folders
- [ ] Activity log shows success message

---

## Troubleshooting

### Issue: Files appear in root, not in folders
**Solution:** Frontend is not preserving folder paths. Check that `handleFullGeneration()` is routing to `/create-project`.

### Issue: Folders don't expand
**Solution:** Check that `expandedFolders.add(path)` is being called for parent folders.

### Issue: First file doesn't open
**Solution:** Check that `openFile(firstFile)` is being called after files are added.

### Issue: No files appear at all
**Solution:** Check browser console for errors. Verify `/create-project` endpoint is returning files.

---

## Success Criteria

✅ All tests pass  
✅ Folder structure displays correctly  
✅ Files are organized in folders  
✅ No errors in browser console  
✅ Activity log shows success messages  

**Then proceed to Phase 2!** 🚀
