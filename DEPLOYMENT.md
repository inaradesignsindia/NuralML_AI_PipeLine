# NuralML AI Pipeline - Production Deployment Guide

## Overview
This guide covers deploying the NuralML AI Pipeline application to production using Netlify (frontend) and Render (backend).

## Prerequisites
- GitHub repository: https://github.com/inaradesignsindia/NuralML_AI_PipeLine.git
- Netlify account
- Render account
- API keys for external services (Binance, Cohere, Gemini, News API, GitHub OAuth)

## Frontend Deployment (Netlify)

### Automatic Deployment
1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the `netlify.toml` configuration
3. Build settings:
   - Build command: `cd client && npm run build`
   - Publish directory: `client/build`
   - Node version: 18

### Manual Deployment
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings as above
5. Deploy

## Backend Deployment (Render)

### Using render.yaml
1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` configuration
3. The service will be created with:
   - Node.js runtime
   - Persistent disk for SQLite database
   - Health check endpoint: `/health`

### Manual Deployment
1. Go to [Render](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Runtime: Node.js
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add persistent disk (1GB) for database
   - Health Check Path: `/health`

## Environment Variables

### Frontend (Netlify)
No environment variables needed for basic deployment.

### Backend (Render)
Set the following environment variables in Render dashboard:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=/app/database.db
FRONTEND_URL=https://your-netlify-app.netlify.app
JWT_SECRET=your-generated-jwt-secret
SESSION_SECRET=your-generated-session-secret
BINANCE_API_KEY=your-binance-api-key
BINANCE_API_SECRET=your-binance-api-secret
COHERE_API_KEY=your-cohere-api-key
GEMINI_API_KEY=your-gemini-api-key
NEWS_API_KEY=your-news-api-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
DAPP_INTERVAL=5000
```

## Post-Deployment Configuration

### 1. Update CORS
After deploying frontend, update the `FRONTEND_URL` environment variable in Render with your Netlify URL.

### 2. Database Migration
The SQLite database will be created automatically on first run. No manual migration needed.

### 3. WebSocket Support
WebSockets are automatically configured and will work through Render's infrastructure.

### 4. Health Checks
Monitor your deployment using:
- `/health` - Overall health status
- `/health/api-status` - API connectivity status
- `/health/model-performance` - AI model performance
- `/health/metrics` - System metrics

## Free Tier Limitations

### Netlify Free Tier
- 100GB bandwidth/month
- 100 build minutes/month
- Custom domains not included

### Render Free Tier
- 750 hours/month
- 1GB persistent disk
- 100GB bandwidth/month
- No custom domains

## Monitoring and Maintenance

### Logs
- Frontend: Netlify dashboard → Site settings → Build & deploy → Deploy logs
- Backend: Render dashboard → Service → Logs

### Scaling
- Netlify: Automatic scaling included
- Render: Upgrade to paid plans for more resources

### Backups
- Database: Implement regular backups of the SQLite file
- Code: All code is version controlled on GitHub

## Troubleshooting

### Common Issues
1. **CORS errors**: Ensure `FRONTEND_URL` matches your Netlify domain
2. **WebSocket connection fails**: Check Render's WebSocket support
3. **Database errors**: Verify persistent disk is mounted correctly
4. **Build failures**: Check Node.js version compatibility

### Support
- Netlify: https://docs.netlify.com/
- Render: https://docs.render.com/

## Security Considerations
- Store API keys securely in environment variables
- Use HTTPS (enabled by default on both platforms)
- Implement proper authentication and authorization
- Regularly update dependencies
- Monitor for security vulnerabilities

## Cost Optimization
- Monitor usage to stay within free tier limits
- Implement caching to reduce API calls
- Use efficient database queries
- Optimize bundle sizes for faster loading