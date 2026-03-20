# The Monkey Index

A satirical fintech web app that tests if a completely random stock pick can beat the pros.

## Architecture & Stack
- **Backend**: Python Google Cloud Functions (`generate-pick`, `update-performance`)
- **Database**: Firestore Native Mode
- **Frontend**: React + Vite + TailwindCSS
- **Continuous Execution**: Google Cloud Scheduler triggers the functions daily
- **Hosting**: Firebase Hosting

## Setup & Deployment Commands

If you need to re-deploy any part of the stack, run these from the respective directories:

### Cloud Functions (Backend)
Navigate into the `backend/` folder:
```bash
# Deploy Generate Pick Function (Replace YOUR_TIINGO_API_KEY with the actual key)
gcloud functions deploy generate-pick --runtime python310 --trigger-http --entry-point generate_pick --project primateportfolio --region us-central1 --allow-unauthenticated --set-env-vars "GCP_PROJECT=primateportfolio,TIINGO_API_KEY=YOUR_TIINGO_API_KEY" --source .

# Deploy Update Performance Function
gcloud functions deploy update-performance --runtime python310 --trigger-http --entry-point update_performance --project primateportfolio --region us-central1 --allow-unauthenticated --set-env-vars "GCP_PROJECT=primateportfolio,TIINGO_API_KEY=YOUR_TIINGO_API_KEY" --source .
```

### Cloud Scheduler (Cron Jobs)
```bash
# Pick generation (6:05 AM PST M-F / 9:05 AM EST)
gcloud scheduler jobs create http daily-pick-job --schedule="5 6 * * 1-5" --uri="https://us-central1-primateportfolio.cloudfunctions.net/generate-pick" --http-method=GET --time-zone="America/Los_Angeles" --location=us-central1

# Update Performance (6:00 PM EST M-F)
gcloud scheduler jobs create http daily-update-job --schedule="0 18 * * 1-5" --uri="https://us-central1-primateportfolio.cloudfunctions.net/update-performance" --http-method=GET --time-zone="America/New_York" --location=us-central1
```

### Frontend (Firebase Hosting)
Navigate into the `frontend/` folder:
```bash
# Build React App
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Running the App
The frontend is live and deployed at: **https://primate-portfolio-app.web.app**

The cron jobs will automatically execute the Python scripts on weekdays. You can also manually trigger them in the Google Cloud Console under "Cloud Scheduler" by clicking "Force Run".
