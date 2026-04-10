# Deployment Instructions

This guide explains how to deploy updates to both the Frontend (via Firebase) and the Backend (via Google Cloud Platform).

## 1. Frontend Checkout & Deploy (Firebase)

When you make changes to the `frontend/` directory (e.g., React components, styling), you must build the app and deploy it to Firebase Hosting.

**Prerequisites:** 
Make sure you are logged in using `firebase login`.

**Deployment Steps:**
1. Open your terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Build the production assets:
   ```bash
   npm run build
   ```
3. Deploy the build to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
   *Your live site will update immediately upon completion.*

---

## 2. Backend Deploy (GCP Cloud Functions)

When you make changes to `backend/main.py` or add new dependencies to `backend/requirements.txt`, you need to redeploy the affected Cloud Functions.

**Prerequisites:** 
Make sure you are authenticated with the GCP CLI (`gcloud auth login`) and the active project is set.

**Deployment Steps:**
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Deploy the functions using the `gcloud` CLI. You only need to deploy the functions whose logic you've changed.

*Note: If the environment variables (`GCP_PROJECT` and `TIINGO_API_KEY`) are already set in GCP from a previous deployment, you can omit the `--set-env-vars` flags to keep the existing configuration.*

**A. Deploy Frontend API (`get-picks-api`)**
*(This handles requests from the React app)*
```bash
gcloud functions deploy get-picks-api \
  --runtime python310 \
  --trigger-http \
  --entry-point get_picks_api \
  --region us-central1 \
  --allow-unauthenticated \
  --source .
```

**B. Deploy Morning Picker (`generate-pick`)**
*(This runs the morning CRON job to pick the stock)*
```bash
gcloud functions deploy generate-pick \
  --runtime python310 \
  --trigger-http \
  --entry-point generate_pick \
  --region us-central1 \
  --allow-unauthenticated \
  --source .
```

**C. Deploy Evening Updater (`update-performance`)**
*(This runs the evening CRON job to update pricing)*
```bash
gcloud functions deploy update-performance \
  --runtime python310 \
  --trigger-http \
  --entry-point update_performance \
  --region us-central1 \
  --allow-unauthenticated \
  --source .
```
