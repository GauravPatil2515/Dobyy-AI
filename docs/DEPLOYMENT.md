# Deployment Guide

Complete steps to deploy Dobby Studio to Vercel.

## Prerequisites

1. ✅ GitHub account (free)
2. ✅ Vercel account (free, connect GitHub)
3. ✅ Groq API key (free from console.groq.com)
4. ✅ Project pushed to GitHub

## Step 1: Get Groq API Key

### Create Free Account
1. Go to https://console.groq.com/keys
2. Sign up (email or GitHub)
3. Verify email

### Generate API Key
1. **Dashboard** → **API Keys**
2. Click **Create API Key**
3. Name it: "Dobby Studio"
4. Copy the key (starts with `gsk_`)
5. **Save securely** (you'll need it)

⚠️ **Never share this key publicly!**

---

## Step 2: Push Code to GitHub

### If new repo:
```bash
git init
git add .
git commit -m "Initial commit: Dobby Studio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dobby-studio.git
git push -u origin main
```

### If existing repo:
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

---

## Step 3: Deploy to Vercel

### 1. Go to Vercel Dashboard
https://vercel.com/dashboard

### 2. Import Project
- Click **+ Add New** → **Project**
- Click **Import Git Repository**
- Paste: `https://github.com/YOUR_USERNAME/dobby-studio.git`
- Click **Import**

### 3. Configure Project
**Basic Settings:**
- **Framework Preset:** Vite (should auto-detect)
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `dist` (default)

Click **Deploy** (or continue to env vars first)

### 4. Add Environment Variables
**Critical Step!** This is where the API key goes.

#### In Vercel Dashboard:
1. **Settings** → **Environment Variables**
2. **Add Environment Variable:**

| Key | Value | Environments |
|-----|-------|---|
| `GROQ_API_KEY` | `gsk_your_actual_key_here` | ✅ Production, ✅ Preview, ✅ Development |
| `VITE_GROQ_API_KEY` | `gsk_your_actual_key_here` | ✅ Production, ✅ Preview, ✅ Development |

3. Click **Save** for each

⚠️ **Both variables must have the SAME value**  
⚠️ **Paste exact key with no extra spaces**

### 5. Deploy
The deployment should start automatically.

**Wait for:** ✅ Build → ✅ Functions deployed → ✅ Ready

### 6. Get Your URL
Once deployed:
- Click the **Visit** button
- URL format: `https://dobby-studio.vercel.app`
- Test it works!

---

## Environment Variables Reference

### Production Deployment
Add these in Vercel Settings:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

### Local Development
Create `.env` in project root:

```
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

### Local Development (without API key)
Leave `.env` empty → Local K-means fallback works (no chat)

---

## Verification Checklist

### After Deployment
- [ ] Visit your Vercel URL
- [ ] Page loads (no 404)
- [ ] Try chat feature (say "red and navy tartan")
- [ ] Image analysis works (drag fabric photo)
- [ ] Exports work (PNG, JSON)
- [ ] Design library saves
- [ ] No "401" or "500" errors in console

### Debugging Deployment

**Build Failed?**
1. Check build logs in Vercel
2. Common issue: Missing dependencies
3. Fix: `npm install`, push to git again

**API Key Error?**
1. Check environment variables exist in Vercel
2. Verify no extra spaces in value
3. Redeploy after adding variables

**Blank Page?**
1. Check browser console (F12) for errors
2. Check Vercel function logs
3. Verify `dist/` folder has `index.html`

---

## Common Errors & Solutions

### 401 Unauthorized
**Cause:** Wrong or missing API key  
**Fix:**
1. Get new key from console.groq.com
2. Add to Vercel env vars (both `GROQ_API_KEY` and `VITE_GROQ_API_KEY`)
3. Redeploy

### 404 Not Found
**Cause:** `/api/chat` function not deployed  
**Fix:**
1. Verify `/api/chat.js` exists in repo
2. Check deployment logs for serverless function errors
3. Redeploy

### CORS Error
**Cause:** Browser blocking request  
**Fix:**
✅ Already handled — `/api/chat.js` sets CORS headers

### Chat Returns Empty
**Cause:** API key not found on server  
**Fix:**
1. Verify **both** env vars in Vercel:
   - `GROQ_API_KEY`
   - `VITE_GROQ_API_KEY`
2. Redeploy
3. Check function logs

### Build Says "Vite not found"
**Cause:** Dependencies not installed  
**Fix:**
```bash
npm install
git add package-lock.json
git commit -m "Install dependencies"
git push
```

---

## Updates & Redeployment

### Code Changes Auto-Deploy
Any push to `main` branch → Vercel auto-deploys
- Build should succeed in 2–3 minutes
- Check Deployments tab

### Manual Redeploy
Sometimes needed if env vars changed:

1. Vercel Dashboard → **Deployments**
2. Find latest deploy
3. Click **...** → **Redeploy**
4. Wait ~2–3 minutes

### Rollback to Previous Version
If new deploy breaks things:

1. **Deployments** tab
2. Click previous working deploy
3. Click **...** → **Promote to Production**

---

## Performance Optimization

### Bundle Size
Current: ~500KB gzipped (acceptable)

Check:
```bash
npm run build
# Check dist/ folder size
```

### Cold Start Time
First request: ~1–2 seconds (Vercel cold start)  
Subsequent: <100ms

### CDN Caching
Vercel automatically caches static files globally — your app is fast everywhere!

---

## Security Best Practices

### API Key Management
✅ **DO:**
- Store in Vercel env vars (encrypted)
- Use `GROQ_API_KEY` in backend only (`/api/chat.js`)
- Rotate key monthly for production

❌ **DON'T:**
- Commit `.env` to GitHub
- Paste key in comments or issues
- Share URL with key in query params
- Use same key for multiple apps

### HTTPS
✅ All Vercel deployments use HTTPS automatically
✅ Your domain: `https://dobby-studio.vercel.app`

### Rate Limiting
Your Groq free tier has limits:
- 30 requests per minute
- 6000 tokens per minute

Vercel can add rate limiting if needed (Pro plan feature)

---

## Custom Domain (Optional)

Want your own domain? (e.g., `dobby-studio.com`)

### 1. Own a Domain
Use: GoDaddy, Namecheap, Route53, etc.

### 2. Add to Vercel
1. **Settings** → **Domains**
2. Enter your domain
3. Follow DNS instructions
4. Wait ~24 hours for DNS propagation

### 3. Verify
- Visit `https://YOUR_DOMAIN.com`
- Should show your Dobby app

---

## Monitoring & Logging

### Check Deployment Status
1. Vercel Dashboard → **Deployments**
2. Green checkmark = success
3. Red X = failed (click for logs)

### View Function Logs
1. Click latest deploy
2. **Functions** tab
3. Click `/api/chat.js`
4. See real-time logs

### Error Tracking (Optional)
Add Sentry/LogRocket for production monitoring:
```bash
npm install @sentry/react
```
(Advanced, not required)

---

## Troubleshooting Deployment

### Step-by-Step Debug

**1. Code Works Locally?**
```bash
npm run dev
# Test at http://localhost:5173
```

**2. Code on GitHub?**
```bash
git log --oneline -5
# Verify latest commit pushed
```

**3. Can See in Vercel?**
- Vercel Dashboard → **Deployments**
- Should show your latest git commit

**4. Environment Variables Set?**
- **Settings** → **Environment Variables**
- Both `GROQ_API_KEY` and `VITE_GROQ_API_KEY` present?

**5. Build Successful?**
- Deployment detail page
- Should see ✅ Build successful

**6. Function Deployed?**
- **Functions** tab
- `/api/chat.js` listed?

**7. Test Manually**
```bash
curl https://YOUR_URL
# Should return HTML (not 404)
```

### Get Help
- Check Vercel docs: https://vercel.com/docs
- Groq docs: https://console.groq.com/docs
- GitHub Issues: Report infrastructure bugs

---

## Success Indicators

Your deployment is working when:

✅ Can access https://your-domain.vercel.app  
✅ Chat responds to "red and navy tartan"  
✅ Image upload analyzes fabric  
✅ Exports (PNG, JSON, WIF) download  
✅ Design library saves & loads  
✅ No errors in browser console  
✅ No "401" or "500" errors  

---

## Next Steps

1. ✅ Deploy to Vercel
2. 📣 Share link with users
3. 🐛 Gather feedback
4. 📈 Monitor Groq API usage
5. 🔄 Push updates to GitHub (auto-deploy)
6. 🎯 Iterate on features

**Congratulations! 🎉 Dobby Studio is live!**
