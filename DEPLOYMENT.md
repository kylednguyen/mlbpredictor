# Deploying to Vercel

## Prerequisites

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Make sure you have a Vercel account at [vercel.com](https://vercel.com)

## Deployment Steps

### 1. Login to Vercel
```bash
vercel login
```

### 2. Deploy from the project root (sweat/ directory)
```bash
cd sweat
vercel
```

### 3. Follow the prompts:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N`
- Project name: `mlbmodels` (or your preferred name)
- In which directory is your code located: `./` (current directory)
- Want to override the settings: `N`

### 4. For production deployment
```bash
vercel --prod
```

## Project Structure

The deployment is configured to handle:
- **Backend**: Flask API in `/api/` directory
- **Frontend**: React app in `/frontend/` directory
- **Static files**: Built React app served from `/frontend/dist/`

## API Endpoints

Your Flask API will be available at:
- `/api/mlbid/<name>` - Get player MLB ID
- `/api/playerlogs/<name>` - Get player game logs
- `/api/seasonstats/<name>` - Get season stats
- `/api/dual_seasonstats/<name>` - Get dual stats (for players like Ohtani)
- `/api/allplayers` - Get all players
- `/api/risersdroppers` - Get risers and droppers

## Environment Variables

If you need to add environment variables:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add any required variables

## Troubleshooting

### Common Issues:

1. **Build fails**: Check that all dependencies are in `api/requirements.txt`
2. **API not found**: Ensure routes in `vercel.json` are correct
3. **Frontend not loading**: Check that the build output directory matches `vercel.json`

### Debugging:
```bash
vercel logs
```

## Local Development

To test locally before deploying:
```bash
# Backend
cd api
python app.py

# Frontend
cd frontend
npm run dev
``` 