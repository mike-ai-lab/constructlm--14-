# API Key Setup Guide

## ✅ Changes Made:

### 1. Removed Hardcoded API Key
- **Before**: API key was hardcoded in HTML file (security risk!)
- **After**: API key loaded from localStorage
- **Result**: Your key is now secure and not exposed in the code

### 2. Auto-Sync from Main App
- Main ConstructLM app now syncs Groq API key to localStorage
- Happens automatically when you use the main app
- No manual setup needed if you use the main app

### 3. Manual Setup Option
- Use `SETUP-API-KEY.html` for manual configuration
- Test your API key before using
- Clear key anytime

## 🔑 How to Setup:

### Method 1: Automatic (Recommended)
1. Open `.env.local` in root folder
2. Ensure `VITE_GROQ_API_KEY=your_key_here` is set
3. Run the main ConstructLM app (`npm run dev`)
4. API key automatically syncs to localStorage
5. AI Code Fix tool will work immediately

### Method 2: Manual
1. Open `ai-code-fix-tool/SETUP-API-KEY.html`
2. Enter your Groq API key
3. Click "Save Key"
4. Test the key (optional)
5. Done!

## 🚨 About the 429 Error:

### What's Being Sent to Groq:

**Every AI Fix request sends:**
```
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    {
      "role": "user",
      "content": "[PROMPT BELOW]"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 4000,
  "stream": true
}
```

**Prompt Structure:**
1. **Instructions** (~150 tokens)
   - "Fix this React/JSX code..."
   - Format requirements
   
2. **Error Messages** (~200-300 tokens)
   - Full error text with line numbers
   - Context lines from Babel
   
3. **Your Code** (~varies)
   - Complete code you're fixing
   - For 43 lines: ~300-500 tokens
   
4. **Total Input**: ~650-950 tokens per request
5. **Expected Output**: ~500-1000 tokens

### Groq Free Tier Limits:
- **30 requests per minute (RPM)**
- **14,400 tokens per minute (TPM)**
- **14,400 requests per day (RPD)**

### Why 429 Happens:
1. **Multiple rapid requests** - Even 2-3 quick clicks can hit RPM limit
2. **Large code** - Big files use more tokens
3. **Shared IP** - If others use same IP, limits are shared
4. **Recent usage** - Limits reset per minute

### How to Avoid 429:
1. ✅ **Wait 2-3 seconds** between AI Fix requests
2. ✅ **Use "Detect Errors" first** (no API call, instant)
3. ✅ **Keep code under 200 lines** when possible
4. ✅ **Only click "AI Fix" when needed**
5. ✅ **Check debug log** for token usage

### Debug Log Shows:
- Prompt length in characters
- Estimated tokens (chars / 4)
- Number of code lines
- Actual API response

## 📊 Token Optimization:

The tool is already optimized:
- ✅ Minimal prompt (no fluff)
- ✅ Only sends errors found
- ✅ Streams response (faster perceived speed)
- ✅ No retry logic (avoids duplicate requests)

## 🔒 Security:

- API key stored in localStorage only
- Never hardcoded in files
- Never sent to any server except Groq
- Can be cleared anytime
- Not visible in HTML source

## 🆘 Troubleshooting:

### "API key not found"
- Run main app once, OR
- Use SETUP-API-KEY.html manually

### "429 Too Many Requests"
- Wait 60 seconds
- Check debug log for request frequency
- Reduce code size if possible

### "Invalid API key"
- Get new key from console.groq.com
- Test key in SETUP-API-KEY.html
- Check for typos

## 📝 Get API Key:

1. Go to https://console.groq.com
2. Sign up (free)
3. Create API key
4. Copy key (starts with `gsk_`)
5. Save in .env.local or SETUP-API-KEY.html
