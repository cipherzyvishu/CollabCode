# 🚀 Railway Deployment Guide for CollabCode Server

## Prerequisites
1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Ensure your code is pushed to GitHub
3. **Environment Variables**: Have your Supabase credentials ready

## 📋 Step-by-Step Deployment

### 1. Prepare the Repository
```bash
# Commit all changes
git add .
git commit -m "feat: Add code execution service and Railway deployment config"
git push origin main
```

### 2. Deploy to Railway

#### Option A: Using Railway CLI (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway project:create collabcode-server

# Link to your repo (optional)
railway project:link

# Set environment variables
railway env set NODE_ENV=production
railway env set SUPABASE_URL=https://xygdsizwhthynrswjlqb.supabase.co
railway env set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
railway env set ALLOWED_ORIGINS=https://your-client-domain.vercel.app

# Deploy
railway up
```

#### Option B: Using Railway Web Interface
1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Choose the `/server` folder as the root directory
5. Railway will auto-detect Node.js and use the `railway.toml` config

### 3. Configure Environment Variables in Railway Dashboard

Go to your Railway project dashboard and add these variables:

```env
NODE_ENV=production
PORT=8000
SUPABASE_URL=https://xygdsizwhthynrswjlqb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2RzaXp3aHRoeW5yc3dqbHFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE5NjQzMSwiZXhwIjoyMDY2NzcyNDMxfQ.5-KrVl1sdxQgQsf0JDcQ7GRh6N-4TdHEtpM5mu0hwpk
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://collabcode.vercel.app
```

**Important**: Replace `your-vercel-app.vercel.app` with your actual Vercel domain once you deploy the client.

### 4. Verify Deployment

After deployment, Railway will provide you with a URL like:
`https://collabcode-server-production.up.railway.app`

Test the endpoints:
- Health check: `https://your-railway-url.railway.app/health`
- Socket.IO: Connect from your client app

## 🔧 Railway Configuration Files

### `railway.toml`
```toml
[build]
  command = "npm run build"
  
[deploy]
  command = "npm start"

[health]
  path = "/health"
  interval = 30
```

### `Dockerfile` (Optional)
Railway can use this for containerized deployment:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8000
CMD ["npm", "start"]
```

## 🌍 Production Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (auto-set by Railway) | `8000` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for server operations | `eyJhbGci...` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed client origins | `https://app.vercel.app` |

## 🔍 Monitoring & Debugging

### Railway Dashboard
- **Logs**: View real-time server logs
- **Metrics**: Monitor CPU, memory, and network usage
- **Deployments**: Track deployment history

### Health Check
Your server includes a health endpoint at `/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-03T12:00:00.000Z",
  "uptime": 12345,
  "version": "1.0.0"
}
```

### Log Monitoring
The server uses Winston logger with structured logging:
```bash
# View logs in Railway dashboard or CLI
railway logs --follow
```

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to your main branch. To update:

```bash
git add .
git commit -m "Update server features"
git push origin main
```

## 🛠️ Troubleshooting

### Common Issues

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **Health Check Fails**: Ensure `/health` endpoint is accessible
3. **Socket.IO Connection Issues**: Verify CORS origins include your client domain
4. **Memory Issues**: Railway provides 512MB RAM by default (upgradeable)

### Debug Commands
```bash
# Check deployment status
railway status

# View logs
railway logs

# Open Railway dashboard
railway open
```

## 📝 Next Steps

After Railway deployment:

1. **Note the Railway URL**: e.g., `https://collabcode-server-production.up.railway.app`
2. **Update Client**: Set `NEXT_PUBLIC_SOCKET_URL` in Vercel to your Railway URL
3. **Update CORS**: Add your Vercel domain to `ALLOWED_ORIGINS`
4. **Test**: Verify all features work in production

## 🎯 Production Checklist

- [ ] Server deploys successfully to Railway
- [ ] Health check endpoint responds
- [ ] Environment variables configured
- [ ] CORS origins include client domain
- [ ] Socket.IO connections work
- [ ] Code execution service functions
- [ ] Logs are accessible
- [ ] Domain/SSL certificate (if using custom domain)

Your CollabCode server is now production-ready on Railway! 🚀
