# 🚀 Setup Test Project - Quick Guide

## Step 1: Upload the Project

1. **Open the IDE Agent Demo**: http://localhost:3001

2. **Click "⬆ Upload" button** in the left sidebar

3. **Select the test_project folder**:
   - Navigate to: `ai-code-fix-tool/ide-agent-demo/test_project`
   - Select the entire folder
   - Click "Upload" or "Select Folder"

4. **Wait for indexing** - You should see:
   - 6 files indexed
   - Symbol count updated
   - Chunks indexed

## Step 2: Verify Upload

Check the left sidebar shows:
```
📁 test_project/
  📁 src/
    📁 auth/
      📄 AuthService.js
    📁 cart/
      📄 CartService.js
    📁 payment/
      📄 PaymentProcessor.js
    📁 models/
      📄 User.js
    📁 api/
      📁 routes/
        📄 orderRoutes.js
    📁 utils/
      📄 emailService.js
  📄 README.md
```

## Step 3: Configure Settings

1. **Click "Settings" button** (top right)

2. **Select Provider**: OpenRouter

3. **Enter API Key**: Your OpenRouter API key

4. **Verify Model**: Should show `arcee-ai/trinity-large-preview:free`

5. **Click "Save Settings"**

## Step 4: Test Reasoning

### Quick Test (30 seconds)
Ask this question:
```
Find all security vulnerabilities in the authentication system
```

**What to watch for:**
- ✅ Purple "🧠 THINKING" badge appears in topbar
- ✅ Console shows: `🧠 REASONING EVENT RECEIVED`
- ✅ Purple section appears with reasoning
- ✅ Final answer lists vulnerabilities

### Full Test (2 minutes)
Ask this question:
```
Trace the complete checkout flow from adding items to cart through payment completion. What could go wrong?
```

**Expected reasoning:**
```
Let me analyze the checkout flow:
1. First, I'll search for cart-related files
2. Then I'll read CartService to understand cart operations
3. Next, I'll examine PaymentProcessor for payment flow
4. I'll trace order creation process
5. Finally, I'll identify potential failure points
```

## Step 5: Verify Console Logs

**Open Browser Console** (F12) and look for:
```
🧠 REASONING EVENT RECEIVED: Let me analyze...
[REASONING DISPLAYED] Let me analyze...
```

**Check Server Terminal** for:
```
[SERVER] 🧠 THINKING BLOCK STARTED
[SERVER] 🧠 BUFFERING THINKING: Let me analyze...
[SERVER] 🧠 REASONING DETECTED: Let me analyze...
[SERVER] 🧠 EMITTING reasoning EVENT
```

## Troubleshooting

### No reasoning appears?

1. **Check model**: Settings should show `arcee-ai/trinity-large-preview:free`
2. **Check provider**: Must be "OpenRouter"
3. **Check API key**: Test connection in Settings
4. **Check console**: Look for errors
5. **Restart server**: `Ctrl+C` then `node server.js`

### Badge not showing?

1. **Hard refresh**: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. **Clear cache**: Browser settings → Clear cache
3. **Check HTML**: Search for `reasoningBadge` in index.html

### No files showing?

1. **Click "Clear" button** in sidebar
2. **Re-upload** the test_project folder
3. **Check browser console** for upload errors

## Quick Reference

**Test Questions File**: `TEST_QUESTIONS.md`
- 15 questions designed to trigger reasoning
- Categorized by complexity
- Expected reasoning patterns included

**Project Files**: `test_project/`
- 6 JavaScript files with realistic bugs
- Authentication, cart, payment, orders
- Multiple security vulnerabilities
- Complex business logic

**Verification Guide**: `VERIFY_REASONING_SIGNAL.md`
- All visible signals explained
- Console log patterns
- Troubleshooting steps

## Success Checklist

- [ ] Project uploaded (6 files)
- [ ] OpenRouter configured
- [ ] Model set to `arcee-ai/trinity-large-preview:free`
- [ ] Purple badge appears when asking questions
- [ ] Reasoning section shows in chat
- [ ] Console logs show reasoning events
- [ ] Agent uses multiple tools (search, read_file)
- [ ] Final answer is detailed and accurate

## Next Steps

Once reasoning is working:
1. Try all 15 test questions
2. Compare reasoning quality
3. Test with different providers
4. Experiment with complex queries

---

**Ready to test!** 🎉

Upload the project and ask: "Find all security vulnerabilities in the authentication system"
