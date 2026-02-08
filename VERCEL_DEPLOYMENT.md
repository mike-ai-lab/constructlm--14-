# Deploying ConstructLM to Vercel

This guide walks you through deploying ConstructLM as a separate Vercel project.

## Prerequisites

- Vercel account (free tier works)
- Git repository for ConstructLM
- Domain access (if using custom subdomain)

## Deployment Steps

### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy from ConstructLM directory**:
```bash
cd path/to/constructlm
vercel
```

4. **Follow the prompts**:
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N`
   - Project name? `constructlm` (or your preferred name)
   - Directory? `./` (current directory)
   - Override settings? `N`

5. **Deploy to production**:
```bash
vercel --prod
```

### Option B: Deploy via Vercel Dashboard

1. **Push to Git**:
   - Commit all changes
   - Push to GitHub/GitLab/Bitbucket

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your ConstructLM repository
   - Configure:
     - Framework Preset: `Other`
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`
   - Click "Deploy"

### Option C: Deploy as Subdomain of Your Main Website

1. **Deploy using Option A or B first**

2. **Configure Custom Domain**:
   - In Vercel dashboard, go to your ConstructLM project
   - Click "Settings" → "Domains"
   - Add domain: `constructlm.yourwebsite.com`
   - Follow DNS configuration instructions

3. **Update DNS** (in your domain provider):
   - Add CNAME record:
     - Name: `constructlm`
     - Value: `cname.vercel-dns.com`
   - Wait for DNS propagation (5-30 minutes)

## Environment Variables

ConstructLM doesn't require server-side environment variables since API keys are configured in-browser. However, if you want to pre-configure keys:

1. In Vercel dashboard → Settings → Environment Variables
2. Add (optional):
   - `VITE_GEMINI_API_KEY` (optional)
   - `VITE_CEREBRAS_API_KEY` (optional)

Note: Users can still configure their own keys in the app settings.

## Post-Deployment

1. **Test the deployment**:
   - Visit your Vercel URL (e.g., `constructlm.vercel.app`)
   - Upload a test document
   - Configure API keys in settings
   - Ask a test question

2. **Link from your main website**:
   - Add a link/button on your main site pointing to ConstructLM
   - Example: "Try ConstructLM" → `https://constructlm.yourwebsite.com`

## Updating the Deployment

### Automatic Updates (if connected to Git):
- Push changes to your repository
- Vercel automatically rebuilds and deploys

### Manual Updates (via CLI):
```bash
cd path/to/constructlm
vercel --prod
```

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version compatibility (v16+)
- Review build logs in Vercel dashboard

### CORS Issues
- The `vercel.json` includes necessary CORS headers
- If issues persist, check browser console for specific errors

### Model Loading Issues
- Ensure COOP/COEP headers are set (included in `vercel.json`)
- Check that Transformers.js can download models

### API Key Issues
- Users must configure their own API keys in settings
- Keys are stored in browser localStorage, not on server

## Keeping Both Netlify and Vercel

You can keep both deployments active:
- **Netlify**: `constructlm.netlify.app` (testing/backup)
- **Vercel**: `constructlm.yourwebsite.com` (production)

Once you confirm Vercel works perfectly, you can:
1. Delete the Netlify deployment, or
2. Keep it as a backup/staging environment

## Cost

- Vercel Free Tier includes:
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Automatic HTTPS
  - Perfect for personal projects

## Next Steps

1. Deploy using Option A or B above
2. Test thoroughly
3. Configure custom domain (optional)
4. Add link from your main website
5. Consider removing Netlify deployment once confirmed working
