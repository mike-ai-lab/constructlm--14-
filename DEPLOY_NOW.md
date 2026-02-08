# Quick Deployment Guide

Your ConstructLM app is ready to deploy to Vercel! Here's what I've set up:

## ✅ What's Ready

1. **vercel.json** - Configured with:
   - Proper build settings
   - SPA routing (all routes → index.html)
   - CORS headers for Transformers.js to work
   
2. **Build files** - Already in `dist/` folder and ready to deploy

3. **Deployment guide** - See `VERCEL_DEPLOYMENT.md` for detailed instructions

## 🚀 Deploy Now (Choose One Method)

### Method 1: Vercel CLI (Fastest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from this directory)
vercel

# After testing, deploy to production
vercel --prod
```

### Method 2: Vercel Dashboard (Easiest)

1. Push this code to GitHub/GitLab/Bitbucket
2. Go to https://vercel.com/new
3. Import your repository
4. Settings will auto-detect from vercel.json
5. Click "Deploy"

### Method 3: Drag & Drop (No Git Required)

1. Go to https://vercel.com/new
2. Select "Deploy from local directory"
3. Drag the entire `constructlm` folder
4. Click "Deploy"

## 🌐 Custom Domain Setup (Optional)

After deployment, to use `constructlm.yourwebsite.com`:

1. In Vercel dashboard → Your Project → Settings → Domains
2. Add domain: `constructlm.yourwebsite.com`
3. Add CNAME record in your DNS:
   - Name: `constructlm`
   - Value: `cname.vercel-dns.com`
4. Wait 5-30 minutes for DNS propagation

## 🔗 Link from Your Main Website

Once deployed, add a link on your main site:

```tsx
// Example: Add to your main website's navigation
<a href="https://constructlm.yourwebsite.com" target="_blank">
  ConstructLM - AI Document Chat
</a>
```

Or create a dedicated page/section that embeds or links to it.

## 📋 What You Need from Me

To help you further, I need to know:

1. **Which deployment method do you prefer?** (CLI, Dashboard, or Drag & Drop)
2. **Do you want a custom subdomain?** (e.g., constructlm.yourwebsite.com)
3. **Should I help integrate a link into your main website?**

## 🧪 Testing After Deployment

1. Visit your Vercel URL
2. Click settings (⚙️) and add your API keys:
   - Cerebras API key (required)
   - Gemini API key (optional)
3. Upload a test document
4. Ask a question
5. Verify citations work

## 💡 Next Steps

1. Deploy using one of the methods above
2. Test thoroughly
3. Let me know the URL and I can help you:
   - Add a link/button on your main website
   - Create a landing page section
   - Set up custom domain
   - Optimize anything needed

## 🔄 Keeping Netlify vs Switching

**Option A: Keep Both**
- Netlify: Staging/testing environment
- Vercel: Production on your domain

**Option B: Switch Completely**
- Deploy to Vercel
- Test for a few days
- Delete Netlify deployment

I recommend Option A initially - keep both until you're 100% confident Vercel works perfectly.
