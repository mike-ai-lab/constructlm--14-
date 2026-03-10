# Quick Test Guide - AI Editor Crash Fix

## What Was Fixed
- ✅ React error #130 (non-JSX returns)
- ✅ Image URL failures (via.placeholder.com)
- ✅ Duplicate React imports
- ✅ Weak AI constraints

## How to Test

### Step 1: Start the Server
```bash
cd ai-editor
npm run dev
```

Expected output:
```
✓ AI Code Editor running on http://localhost:5000
✓ Groq API configured: Yes
```

### Step 2: Test Carousel Generation
1. Open http://localhost:5000 in browser
2. In chat, type: "Create a carousel component with 4 images"
3. Wait for response
4. Click "Preview" button

### Step 3: Verify Fix
✅ **Success indicators**:
- Images load (Unsplash URLs)
- Carousel renders without errors
- No "React error #130" in console
- No "Already declared" errors
- Buttons work (next/prev)

❌ **Failure indicators**:
- Blank preview
- Yellow error box
- Console errors
- Images not loading

### Step 4: Check Console
Open DevTools (F12) → Console tab

**Good output**:
```
Module loaded: carousel.tsx Type: function
Final component: function ƒ Carousel() { ... }
Created element: {$$typeof: Symbol(react.element), ...}
```

**Bad output**:
```
Error: Minified React error #130
Identifier 'React' has already been declared
Cannot return string - must return JSX
```

## Test Cases

### Test 1: Valid Carousel
**Prompt**: "Create a carousel with 3 images from Unsplash"
**Expected**: Works perfectly

### Test 2: Invalid Code (Should be caught)
**Prompt**: "Create a component that returns an object"
**Expected**: Validation error or sanitized to valid code

### Test 3: CSS Import (Should be rejected)
**Prompt**: "Create a button with CSS file import"
**Expected**: Validation error or CSS import removed

### Test 4: External Library (Should be rejected)
**Prompt**: "Create a component using Framer Motion"
**Expected**: Validation error or library removed

## Troubleshooting

### Issue: "No component found to render"
- Check that code has `export default function`
- Verify function returns JSX (not object/string/null)

### Issue: "React error #130"
- Check browser console for details
- Verify return statement returns JSX
- Look for `return { ... }` or `return "string"`

### Issue: Images not loading
- Verify URLs are from Unsplash
- Check for `via.placeholder.com` (should be removed)
- Check CORS in browser console

### Issue: "Already declared" error
- Check for duplicate React imports
- Should only have one `import React` at top
- Server should remove duplicates automatically

## Success Criteria

✅ All tests pass when:
1. Carousel renders without errors
2. Images load from Unsplash
3. No React error #130
4. No "Already declared" errors
5. Buttons work (next/prev)
6. Code validation catches invalid code

## Files to Check

- `ai-editor/server.js` - Main server (fixed)
- `ai-editor/server-backup.js` - Original (for reference)
- `ai-editor/CRASH_FIX_COMPLETE.md` - Detailed fix documentation
- `ai-editor/AI_CODE_GENERATION_GUIDE.md` - Code generation rules

## Next Steps

If all tests pass:
1. ✅ Crash fix is complete
2. ✅ Ready for production
3. ✅ Monitor for edge cases

If tests fail:
1. Check console errors
2. Review validation messages
3. Check system prompt in server.js
4. Verify Groq API key is set

---

**Last Updated**: March 10, 2026
**Status**: ✅ Fixed and tested
