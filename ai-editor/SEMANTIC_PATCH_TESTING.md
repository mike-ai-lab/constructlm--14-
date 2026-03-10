# Semantic Patch System - Testing Guide

## 🧪 Test Setup

### Prerequisites

1. **Server running:**
   ```bash
   cd ai-editor
   node server.js
   ```

2. **Browser open:**
   ```
   http://localhost:5000
   ```

3. **DevTools open:**
   ```
   F12 → Console tab
   ```

## 📋 Test Cases

### Test 1: Basic Semantic Matching

**Objective:** Verify file matching works correctly

**Setup:**
1. Create `Carousel.js`:
   ```javascript
   export default function Carousel() {
     return <div>Carousel</div>
   }
   ```

2. Create `Carousel.css`:
   ```css
   .carousel {
     width: 100%;
   }
   ```

**Test:**
1. Type in chat: `"Add parallax effect to carousel"`
2. Check console for:
   ```
   [AI-EDITOR] Matched files: Carousel.js (score: 18), Carousel.css (score: 10)
   ```

**Expected Result:** ✅ Both files matched with correct scores

---

### Test 2: Dependency Extraction

**Objective:** Verify import parsing works

**Setup:**
1. Create `Carousel.js`:
   ```javascript
   import React from 'react'
   import './Carousel.css'
   import { motion } from 'framer-motion'
   
   export default function Carousel() {
     return <div>Carousel</div>
   }
   ```

**Test:**
1. Type: `"Update carousel styling"`
2. Check console for:
   ```
   [AI-EDITOR] Dependency graph built: 2 files to send
   ```

**Expected Result:** ✅ Carousel.css included, framer-motion skipped

---

### Test 3: Context Building

**Objective:** Verify context payload is minimal

**Setup:**
1. Create multiple files (10+ files)
2. Only Carousel.js and Carousel.css are relevant

**Test:**
1. Type: `"Modify carousel animation"`
2. Check console for:
   ```
   [AI-EDITOR] Context payload built: 2 files, XXX chars
   ```

**Expected Result:** ✅ Only 2 files sent, not all 10+

---

### Test 4: Patch Application

**Objective:** Verify patches are applied correctly

**Setup:**
1. Create `Button.js`:
   ```javascript
   export default function Button() {
     return <button>Click me</button>
   }
   ```

**Test:**
1. Type: `"Add hover effect to button"`
2. Wait for patches
3. Check if Button.js was updated

**Expected Result:** ✅ Button.js modified with new code

---

### Test 5: Error Handling - No Matches

**Objective:** Verify graceful failure when no files match

**Setup:**
1. Create only `index.js` (no carousel files)

**Test:**
1. Type: `"Add parallax to carousel"`
2. Check console for:
   ```
   [AI-EDITOR] ❌ No matching files found
   ```

**Expected Result:** ✅ Error message shown, fallback offered

---

### Test 6: Error Handling - Context Mismatch

**Objective:** Verify patch rejection on context mismatch

**Setup:**
1. Create `Carousel.js` with specific content
2. Manually edit it while patch is processing

**Test:**
1. Type: `"Add parallax effect"`
2. Quickly edit Carousel.js
3. Check console for:
   ```
   [AI-EDITOR] ❌ Patch failed – context mismatch at line X
   ```

**Expected Result:** ✅ Patch rejected, error shown

---

### Test 7: Automatic Detection

**Objective:** Verify semantic vs full generation detection

**Test A - Semantic Patch (with existing files):**
1. Create `Carousel.js`
2. Type: `"Add parallax effect"`
3. Check: Should use semantic patches

**Test B - Full Generation (no files):**
1. Delete all files
2. Type: `"Create a carousel component"`
3. Check: Should use full generation

**Expected Result:** ✅ Correct path chosen automatically

---

### Test 8: Multi-File Patches

**Objective:** Verify multiple files can be patched

**Setup:**
1. Create `Carousel.js`
2. Create `Carousel.css`
3. Create `CarouselSlide.js`

**Test:**
1. Type: `"Update carousel styling and animation"`
2. Check console for:
   ```
   [AI-EDITOR] Patches parsed: X patches found
   [AI-EDITOR] ✓ Patch applied to Carousel.js
   [AI-EDITOR] ✓ Patch applied to Carousel.css
   ```

**Expected Result:** ✅ Multiple files patched successfully

---

### Test 9: Logging Completeness

**Objective:** Verify all logging points work

**Setup:**
1. Create `Carousel.js` and `Carousel.css`

**Test:**
1. Type: `"Add parallax effect"`
2. Check console for all these logs:
   ```
   [AI-EDITOR] User instruction received
   [AI-EDITOR] Searching semantic matches
   [AI-EDITOR] Matched files
   [AI-EDITOR] Parsing imports
   [AI-EDITOR] Dependency graph built
   [AI-EDITOR] Building context payload
   [AI-EDITOR] Context payload built
   [AI-EDITOR] Awaiting AI patch response
   [AI-EDITOR] ✓ AI response received
   [AI-EDITOR] Patches parsed
   [AI-EDITOR] Applying patches
   [AI-EDITOR] ✓ Patch applied
   [AI-EDITOR] ✅ Patches applied successfully
   ```

**Expected Result:** ✅ All logs present in order

---

### Test 10: Performance

**Objective:** Verify system is fast

**Setup:**
1. Create 5+ files
2. Create Carousel.js and Carousel.css

**Test:**
1. Type: `"Add parallax effect"`
2. Measure time from input to result
3. Check console timestamps

**Expected Result:** ✅ Total time < 5 seconds

---

## 🔍 Console Inspection

### What to Look For

**Success Indicators:**
- ✅ All logs present
- ✅ No error messages
- ✅ Patches applied count > 0
- ✅ Files updated in editor

**Error Indicators:**
- ❌ "No matching files found"
- ❌ "Context mismatch"
- ❌ "Network error"
- ❌ "No patches found"

### Debug Commands

Open console and run:

```javascript
// Check if client initialized
window.patchClient
// Output: SemanticPatchClient { apiEndpoint: "http://localhost:5000", isProcessing: false }

// Check files object
files
// Output: { "Carousel.js": "...", "Carousel.css": "..." }

// Check current file
currentFile
// Output: "Carousel.js"

// Manually request patches
await window.patchClient.requestPatches("Add parallax effect", files)
```

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Test 1: Basic Semantic Matching
- Status: ✅ PASS / ❌ FAIL
- Notes: [any observations]

### Test 2: Dependency Extraction
- Status: ✅ PASS / ❌ FAIL
- Notes: [any observations]

### Test 3: Context Building
- Status: ✅ PASS / ❌ FAIL
- Notes: [any observations]

### Test 4: Patch Application
- Status: ✅ PASS / ❌ FAIL
- Notes: [any observations]

### Test 5: Error Handling - No Matches
- Status: ✅ PASS / ❌ FAIL
- Notes: [any observations]

### Test 6: Error Handling - Context Mismatch
- Status: ✅ PASS / ❌ FAIL
- Notes: [any observations]

### Test 7: Automatic Detection
- Status: ✅ PASS / ❌ FAIL
- Notes: [any observations]

### Test 8: Multi-File Patches
- Status: ✅ PASS / ❌ FAIL
- Notes: [any observations]

### Test 9: Logging Completeness
- Status: ✅ PASS / ❌ FAIL
- Notes: [any observations]

### Test 10: Performance
- Status: ✅ PASS / ❌ FAIL
- Time: [X seconds]
- Notes: [any observations]

## Summary
- Total Tests: 10
- Passed: X
- Failed: X
- Success Rate: X%
```

## 🐛 Troubleshooting Tests

### Issue: "No matching files found"

**Cause:** Files not created or named differently

**Solution:**
1. Check file explorer
2. Verify file names match keywords
3. Try more specific keywords

### Issue: "Patch failed – context mismatch"

**Cause:** File changed during processing

**Solution:**
1. Save all files first
2. Don't edit during patch processing
3. Try again

### Issue: "Network error"

**Cause:** Server not running or wrong port

**Solution:**
1. Check server is running: `node server.js`
2. Check port: `http://localhost:5000`
3. Check console for errors

### Issue: "No patches found in AI response"

**Cause:** AI didn't return valid patches

**Solution:**
1. Check console for raw response
2. Try simpler instruction
3. Check AI model availability

## 📈 Performance Benchmarks

### Expected Times

| Operation | Time |
|-----------|------|
| File matching | <10ms |
| Dependency extraction | <20ms |
| Context building | <50ms |
| AI request | 2-5s |
| Patch application | <100ms |
| **Total** | **2-5s** |

### Token Usage

| Scenario | Tokens |
|----------|--------|
| Small project (2 files) | 500 |
| Medium project (5 files) | 1,000 |
| Large project (10+ files) | 1,500 |

## ✅ Sign-Off Checklist

- [ ] All 10 tests passed
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Logging complete
- [ ] Error handling works
- [ ] Fallback works
- [ ] Multi-file support works
- [ ] Automatic detection works
- [ ] Files update correctly
- [ ] Ready for production

## 🎯 Next Steps

1. **Run all tests** - Complete the test suite
2. **Document results** - Use template above
3. **Fix any issues** - Debug and resolve
4. **Performance tune** - Optimize if needed
5. **Deploy** - Ready for production

## 📞 Support

For issues during testing:

1. Check console logs (F12)
2. Review `SEMANTIC_PATCH_SYSTEM.md`
3. Check `SEMANTIC_PATCH_QUICKSTART.md`
4. Verify server is running
5. Try simpler test cases first

---

**Happy Testing!** 🚀
