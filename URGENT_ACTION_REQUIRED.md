# 🚨 URGENT ACTION REQUIRED - API KEY COMPROMISED 🚨

## IMMEDIATE STEPS (DO THIS NOW!)

### Step 1: Revoke Compromised API Key ⚠️
**Your Gemini API key has been exposed and MUST be revoked immediately!**

1. Go to: https://aistudio.google.com/app/apikey
2. Find key ending in: `...SQag3Q`
3. Click "Delete" or "Revoke"
4. Confirm deletion

### Step 2: Generate New API Key
1. In the same page, click "Create API Key"
2. Copy the new key
3. Save it securely

### Step 3: Update Local Environment
```bash
# Edit .env.local
VITE_GEMINI_API_KEY=your_new_key_here
```

### Step 4: Update Production
- Go to your hosting dashboard (Netlify/Vercel)
- Update environment variable: `VITE_GEMINI_API_KEY`
- Set to your new API key

### Step 5: Deploy Fixed Code
```bash
# Test locally first
npm run dev

# Build and deploy
npm run build
git add .
git commit -m "SECURITY FIX: Move Gemini API key from URL to header"
git push origin main
```

---

## What Was Fixed

✅ **Security vulnerability patched** in `services/geminiService.ts`
- API key moved from URL query parameter to HTTP header
- Now uses `x-goog-api-key` header (secure method)
- API key no longer visible in browser network logs

---

## Why This Matters

The exposed API key could be:
- Stolen by anyone viewing network traffic
- Used to make unauthorized API calls
- Result in unexpected charges to your account
- Violate Google's terms of service

---

## Additional Security (Recommended)

After revoking and updating the key, set up restrictions:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your new API key
3. Click "Edit"
4. Add restrictions:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: `specbase.mimevents.com/*`
   - **API restrictions**: Only "Generative Language API"
5. Save

---

## Verification

After deploying, verify the fix:
1. Open your app in browser
2. Open DevTools → Network tab
3. Send a message using Gemini
4. Check the request URL
5. Confirm: URL should NOT contain `?key=`

---

**DO NOT USE THE APP UNTIL YOU COMPLETE THESE STEPS!**
