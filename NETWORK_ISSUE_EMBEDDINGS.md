# Embedding Service Network Issue - URGENT FIX NEEDED

## Problem
The embedding model cannot download from HuggingFace CDN due to network timeout:
```
GET https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer.json net::ERR_TIMED_OUT
```

## Root Cause
Your internet connection cannot reach HuggingFace's CDN. This could be due to:
1. **Slow/unstable internet connection**
2. **Firewall blocking HuggingFace**
3. **ISP blocking the CDN**
4. **VPN/proxy issues**
5. **Geographic restrictions**

## Immediate Solutions

### Option 1: Check Internet Connection (FASTEST)
1. Test if you can access: https://huggingface.co/
2. If blocked, try using a VPN
3. Check your firewall settings
4. Try a different network

### Option 2: Use VPN
If HuggingFace is blocked in your region:
1. Enable a VPN
2. Reload the app
3. Upload the document again

### Option 3: Disable Embeddings Temporarily
If you need to use the app NOW without RAG:

1. The app will still work for chat without document context
2. You can chat with AI models normally
3. Just skip uploading documents until network is fixed

### Option 4: Pre-download Model (ADVANCED)
If you have intermittent connectivity:

1. Open browser console
2. Run this to manually trigger download:
```javascript
import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0').then(async (module) => {
  const { pipeline } = module;
  await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('Model cached!');
});
```

## What I Fixed in Code

1. **Added 30-second timeout** - Won't hang forever
2. **Better error messages** - Shows exactly what's wrong
3. **Helpful troubleshooting** - Console shows possible causes
4. **Graceful failure** - App shows clear error instead of freezing

## Testing the Fix

1. **With Good Internet**: Upload should work normally
2. **With Bad Internet**: You'll see clear error message after 30s
3. **Error Message**: "Failed to load embedding model: Model download timeout - check your internet connection"

## Current Status

❌ **Network Issue** - Cannot reach HuggingFace CDN
✅ **Code Fixed** - Better error handling and timeout
⏳ **Waiting** - Need to fix network connectivity

## Next Steps

**YOU NEED TO:**
1. Check if you can access https://huggingface.co/ in your browser
2. If blocked, enable VPN
3. If slow, wait for better connection
4. Try uploading document again

The code is now fixed to handle this gracefully, but the underlying issue is network connectivity to HuggingFace.
