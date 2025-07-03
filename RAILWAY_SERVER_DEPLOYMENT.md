# 🚄 CollabCode Server - Railway Deployment Guide

This guide will walk you through deploying the CollabCode server to Railway.

## ✅ Pre-Deployment Checklist
- [x] Ensure all server code is committed to GitHub
- [x] Have your Supabase credentials ready
- [x] Note your deployed Vercel client URL
- [x] Railway account created at [railway.app](https://railway.app)

## 🔧 Deployment Options

### Option A: Deploy via Railway Web Interface (Easiest)

1. **Sign in to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub or other authentication method

2. **Create a New Project**
   - Click "New Project" button
   - Select "Deploy from GitHub repo"

3. **Configure GitHub Repository**
   - Select your CollabCode repository
   - For the root directory, enter: `server` (important!)
   - Railway will auto-detect Node.js

4. **Configure Environment Variables**
   Add the following environment variables:
   ```
   NODE_ENV=production
   PORT=8000
   SUPABASE_URL=https://xygdsizwhthynrswjlqb.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ALLOWED_ORIGINS=https://your-client-domain.vercel.app
   LOG_LEVEL=info
   ```
   
   ⚠️ Replace the placeholder values:
   - `your_service_role_key_here` with your actual Supabase service role key
   - `https://your-client-domain.vercel.app` with your actual Vercel deployment URL

5. **Deploy**
   - Click "Deploy" button
   - Railway will build and deploy your server
   - This may take a few minutes

6. **Generate Domain**
   - Once deployed, go to Settings
   - Under "Domains", generate a custom domain or use the provided Railway domain

### Option B: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Create a new project**
   ```bash
   railway project:create collabcode-server
   ```

4. **Link to your local repository**
   ```bash
   cd server
   railway link
   ```

5. **Set environment variables**
   ```bash
   railway env set NODE_ENV=production
   railway env set PORT=8000
   railway env set SUPABASE_URL=https://xygdsizwhthynrswjlqb.supabase.co
   railway env set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   railway env set ALLOWED_ORIGINS=https://your-client-domain.vercel.app
   railway env set LOG_LEVEL=info
   ```

6. **Deploy**
   ```bash
   railway up
   ```

7. **Generate a domain**
   ```bash
   railway domain generate
   ```

## 🔍 Post-Deployment

### 1. Get Your Server URL
- Copy the URL provided by Railway (looks like `https://collabcode-server-production.up.railway.app`)
- This is your WebSocket server URL

### 2. Update Client Configuration
- Go to Vercel dashboard → your CollabCode client project
- Navigate to Settings → Environment Variables
- Update `NEXT_PUBLIC_SOCKET_URL` to your Railway server URL
- Redeploy your Vercel client (it may redeploy automatically)

### 3. Testing
- Visit your Vercel client app
- Try creating a new session
- Verify WebSocket connections work
- Test real-time collaboration features

## ❓ Troubleshooting

### Connection Issues
- Check browser console for WebSocket connection errors
- Verify that ALLOWED_ORIGINS includes your Vercel client URL
- Make sure your Supabase service role key is correct

### Build Failures
- Check the build logs in Railway dashboard
- Verify that your server code builds locally with `npm run build`
- Make sure all dependencies are listed in package.json

### npm ci Errors
If you encounter an error about `npm ci` failing:
1. We've updated the Dockerfile to use `npm install --omit=dev` instead of `npm ci`
2. The railway.toml has been updated to explicitly use `npm install`
3. A package-lock.json file has been generated
4. These changes should resolve npm installation issues

### UTF-8 Encoding Issues
If you encounter an error like "Error reading client/lib/database.types.ts: stream did not contain valid UTF-8":
1. We've fixed this issue by creating a clean version of the file with proper UTF-8 encoding
2. The fix is documented in the UTF8_ENCODING_FIX.md file
3. If you encounter similar issues with other files, you may need to recreate them with proper UTF-8 encoding

### rimraf Not Found Error
If you encounter an error with "rimraf: not found":
1. We've moved rimraf from devDependencies to dependencies
2. We've simplified the build process in railway.toml to use npx tsc directly
3. We've updated the scripts to handle cases where rimraf isn't available
4. These changes should resolve build errors related to missing dependencies

## 🔄 Next Steps

After successful deployment:
- Monitor server performance in Railway dashboard
- Consider setting up custom domains if needed
- Set up automated deployments for future updates

---

**Congratulations!** Your CollabCode application should now be fully deployed with the client on Vercel and the server on Railway. 🎉
