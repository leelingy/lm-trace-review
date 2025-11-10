# Backend Migration Guide

This app now supports two storage backends:
1. **IndexedDB** (browser-based, default)
2. **API Backend** (Node.js + SQLite)

## Current Setup (IndexedDB)

By default, the app uses IndexedDB for local storage. No backend server needed.

## Switching to API Backend

### Step 1: Start the Backend Server

```bash
# In a new terminal
cd server
npm start
```

The server will run on `http://localhost:3002`

### Step 2: Update Environment Configuration

Edit the `.env` file in the project root:

```bash
# Change from:
VITE_STORAGE_BACKEND=indexeddb

# To:
VITE_STORAGE_BACKEND=api
```

### Step 3: Restart the Frontend

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

That's it! The app will now use the API backend instead of IndexedDB.

## Switching Back to IndexedDB

Edit `.env` and change back to:

```bash
VITE_STORAGE_BACKEND=indexeddb
```

Then restart the frontend dev server.

## How It Works

The app uses a **storage adapter pattern**:

- `src/services/dataService.js` - Adapter that routes to the correct backend
- `src/services/indexedDBService.js` - IndexedDB implementation
- `src/services/apiService.js` - API client for backend
- `server/index.js` - Express API server
- `server/db.js` - SQLite database

The adapter automatically selects the backend based on `VITE_STORAGE_BACKEND` environment variable.

## Benefits of API Backend

- **Persistent data** across browser sessions and devices
- **Better performance** for large datasets
- **Multi-user support** (data shared across users)
- **Easier backup** (just backup the SQLite file)
- **Web deployment ready** - can deploy to any hosting service

## Data Migration

### From IndexedDB to API

Currently, there's no automatic migration. You'll need to:
1. Export your data as CSV from IndexedDB mode
2. Switch to API mode
3. Re-import the CSV

### From API to IndexedDB

Same process - export CSV and re-import.

## Production Deployment

When deploying to production:

1. **Frontend**: Deploy to Netlify, Vercel, or any static host
2. **Backend**: Deploy to Heroku, Railway, or any Node.js host
3. **Update .env**: Point `VITE_API_URL` to your deployed backend URL

Example:
```bash
VITE_STORAGE_BACKEND=api
VITE_API_URL=https://your-backend-app.herokuapp.com/api
```

## Troubleshooting

### Backend won't start
- Make sure you're in the `server` directory
- Check if port 3002 is available
- Run `npm install` in the server directory

### Frontend can't connect to backend
- Verify backend is running on port 3002
- Check `.env` has `VITE_STORAGE_BACKEND=api`
- Restart frontend dev server after changing `.env`
- Check browser console for errors

### Data not showing up
- Make sure you're looking at the right backend (check console log: "Using indexeddb backend" or "Using api backend")
- Data is NOT shared between IndexedDB and API backends
- If switching backends, you'll need to re-import your data
