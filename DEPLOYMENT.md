# Deployment Guide

## Quick Deploy (Recommended)

### Step 1: Deploy Backend to Railway

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repo**: Choose this repository
4. **Configure**:
   - Railway will auto-detect Node.js
   - It will use the `railway.json` configuration
   - The database file will persist automatically
5. **Get URL**: After deployment, copy your backend URL (e.g., `https://your-app.up.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Sign up**: Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. **New Project**: Click "Add New..." → "Project"
3. **Import Repo**: Select this repository
4. **Configure**:
   - Framework Preset: Vite
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables**:
   ```
   VITE_STORAGE_BACKEND=api
   VITE_API_URL=https://your-app.up.railway.app/api
   ```
   (Replace with your actual Railway backend URL)
6. **Deploy**: Click "Deploy"

### Step 3: Access Your App

Your app will be live at: `https://your-project.vercel.app`

---

## Alternative: Deploy Both on Render

### Backend Service
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Name: `lm-trace-review-backend`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Click "Create Web Service"

### Frontend Static Site
1. New → Static Site
2. Connect same GitHub repo
3. Settings:
   - Name: `lm-trace-review-frontend`
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. Environment Variables:
   ```
   VITE_STORAGE_BACKEND=api
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
5. Click "Create Static Site"

---

## Important Notes

### Database Persistence
- **Railway/Render**: Database file persists in the file system
- **For production**: Consider migrating to PostgreSQL or MySQL for better reliability

### CORS Configuration
- The backend already has CORS enabled for all origins
- For production, update `server/index.js` to restrict CORS to your frontend domain:
  ```javascript
  app.use(cors({
    origin: 'https://your-frontend.vercel.app'
  }));
  ```

### Environment Variables
- **Backend**: Uses `PORT` environment variable (auto-set by platforms)
- **Frontend**: Requires `VITE_STORAGE_BACKEND` and `VITE_API_URL`

---

## Troubleshooting

### Backend won't start
- Check logs in Railway/Render dashboard
- Ensure `server` directory has all dependencies
- Verify `npm start` works locally first

### Frontend can't connect to backend
- Check CORS settings
- Verify `VITE_API_URL` is correct (should end with `/api`)
- Check backend is actually running

### Database not persisting
- Railway/Render free tiers may have limitations
- Consider upgrading to paid tier or using managed database

---

## Cost Estimates

- **Railway**: Free tier includes 500 hours/month, $5/month after
- **Vercel**: Free tier for personal projects, unlimited bandwidth
- **Render**: Free tier available (may spin down after inactivity)

All platforms offer free tiers suitable for personal projects!
