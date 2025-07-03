# 🚀 Vercel Deployment Guide for CollabCode Client

## Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Ensure your code is pushed to GitHub
3. **Environment Variables**: Have your Supabase and server credentials ready

## 📋 Step-by-Step Deployment

### 1. Prepare the Repository
```bash
# Make sure all changes are committed
git add .
git commit -m "feat: Prepare client for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from the client directory
cd client
vercel

# Follow the prompts:
# - Set up and deploy "client"? Y
# - Which scope? Select your account
# - Link to existing project? N (first time)
# - What's your project's name? collabcode-client
# - In which directory is your code located? ./
```

#### Option B: Using Vercel Web Interface
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `/client` folder as the root directory
5. Vercel will auto-detect Next.js

### 3. Configure Environment Variables

In your Vercel project dashboard, add these environment variables:

#### Production Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_APP_NAME=CollabCode
HF_API_KEY=your_huggingface_api_key_here
NODE_ENV=production
```

**⚠️ Important**: 
- Replace `NEXT_PUBLIC_SOCKET_URL` with your Railway server URL after server deployment
- Replace `NEXT_PUBLIC_APP_URL` with your actual Vercel domain

### 4. Create Vercel Configuration Files

Create `vercel.json` in the client directory:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "@vercel/node"
    }
  }
}
```

### 5. Test Local Build

Before deploying, ensure the build works locally:

```bash
cd client
npm run build
npm start
```

### 6. Deploy Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to client directory
cd client

# Deploy to Vercel
vercel --prod

# Follow the prompts:
# ? Set up and deploy "client"? [Y/n] Y
# ? Which scope? [Select your account]
# ? Link to existing project? [N/y] N
# ? What's your project's name? collabcode-client
# ? In which directory is your code located? ./
```

### 7. Configure Environment Variables in Vercel Dashboard

After deployment, go to your Vercel project dashboard:

1. Navigate to **Settings** → **Environment Variables**
2. Add each variable:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your_supabase_anon_key_here` | Production, Preview, Development |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:8000` (update after server deployment) | Development |
| `NEXT_PUBLIC_SOCKET_URL` | `https://your-railway-url.railway.app` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `NEXT_PUBLIC_APP_NAME` | `CollabCode` | All |
| `HF_API_KEY` | `your_huggingface_api_key_here` | Production, Preview |
| `NODE_ENV` | `production` | Production |

### 8. Trigger Redeploy

After adding environment variables:
```bash
vercel --prod
```

## 🔍 Verification Steps

### 1. Check Deployment Status
- Visit your Vercel dashboard
- Ensure build completed successfully
- Check function logs for any errors

### 2. Test Core Features
- [ ] Authentication (login/signup)
- [ ] Session creation/joining
- [ ] Real-time collaborative editing
- [ ] Code execution (after server deployment)
- [ ] Socket.IO connection

### 3. Check Console for Errors
Open browser dev tools and check for:
- Network errors
- JavaScript errors
- Socket connection issues

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors: `npm run type-check`
   - Fix any import/export issues
   - Ensure all dependencies are installed

2. **Environment Variables Not Working**
   - Redeploy after adding variables
   - Check variable names (case-sensitive)
   - Ensure `NEXT_PUBLIC_` prefix for client-side variables

3. **Socket.IO Connection Issues**
   - Update `NEXT_PUBLIC_SOCKET_URL` after server deployment
   - Check CORS settings on server
   - Verify WebSocket support

4. **Supabase Connection Issues**
   - Verify Supabase URL and keys
   - Check Supabase project status
   - Ensure RLS policies are correct

### Debug Commands

```bash
# Check build locally
npm run build

# Type check
npm run type-check

# View Vercel logs
vercel logs

# Redeploy
vercel --prod
```

## 📋 Post-Deployment Checklist

- [ ] Client deployed successfully to Vercel
- [ ] Environment variables configured
- [ ] Authentication working
- [ ] Session management functional
- [ ] UI renders correctly
- [ ] Ready for server deployment
- [ ] Domain configured (if using custom domain)

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your main branch. To update:

```bash
git add .
git commit -m "Update client features"
git push origin main
```

## 🎯 Next Steps

1. **Deploy Server to Railway** (see server deployment guide)
2. **Update Socket URL** in Vercel environment variables
3. **Test Full Integration** between client and server
4. **Configure Custom Domain** (optional)
5. **Set up Analytics** (optional)

Your CollabCode client is now ready for production! 🚀