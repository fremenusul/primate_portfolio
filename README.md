# 🐒 The Monkey Index (Primate Portfolio)

A satirical fintech web application designed to test a simple hypothesis: **Can a completely random stock pick beat the professionals?** Every day, the index selects a random stock from major US exchanges and tracks its performance against the market.

## 🚀 Live Demo
Check out the live application at: **[https://primate-portfolio-app.web.app](https://primate-portfolio-app.web.app)**

---

## 🏗️ Architecture & Tech Stack

The project is split into a React-based frontend and a Python-powered backend running on Google Cloud.

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TailwindCSS](https://tailwindcss.com/)
- **Backend**: Python [Google Cloud Functions](https://cloud.google.com/functions)
- **Database**: [Cloud Firestore](https://cloud.google.com/firestore) (Native Mode)
- **Scheduling**: [Cloud Scheduler](https://cloud.google.com/scheduler) for daily automated picks
- **Hosting**: [Firebase Hosting](https://firebase.google.com/docs/hosting)
- **Data Provider**: [Tiingo API](https://api.tiingo.com/) for real-time stock data

---

## 🛠️ Setup & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (3.10+)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install)
- A [Tiingo API Key](https://api.tiingo.com/) (Free tier available)

### 1. Google Cloud & Firebase Configuration

1. **Create a GCP Project**: Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. **Enable Required APIs**:
   - Cloud Functions API
   - Cloud Build API
   - Artifact Registry API
   - Cloud Firestore API
   - Cloud Scheduler API
3. **Initialize Firestore**:
   - In the Firebase or GCP Console, create a Firestore database in **Native Mode**.
4. **Firebase Setup**:
   - Run `firebase login` and `firebase init` in the `frontend/` directory to link your project.

### 2. Backend Setup (Cloud Functions)

Navigate to the `backend/` directory.

#### Environment Variables
You will need to pass your `TIINGO_API_KEY` during deployment.

#### Deployment
Run the following commands to deploy the core functions:

```bash
# Deploy "Generate Pick" (Runs every morning)
gcloud functions deploy generate-pick \
  --runtime python310 \
  --trigger-http \
  --entry-point generate_pick \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT=YOUR_PROJECT_ID,TIINGO_API_KEY=YOUR_API_KEY" \
  --source .

# Deploy "Update Performance" (Runs every evening)
gcloud functions deploy update-performance \
  --runtime python310 \
  --trigger-http \
  --entry-point update_performance \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT=YOUR_PROJECT_ID,TIINGO_API_KEY=YOUR_API_KEY" \
  --source .
```

#### Automation (Cloud Scheduler)
Set up cron jobs to trigger these functions automatically:

```bash
# Pick generation (6:05 AM PST M-F)
gcloud scheduler jobs create http daily-pick-job --schedule="5 6 * * 1-5" --uri="[YOUR_FUNCTION_URL]/generate-pick" --http-method=GET --time-zone="America/Los_Angeles" --location=us-central1

# Update Performance (6:00 PM EST M-F)
gcloud scheduler jobs create http daily-update-job --schedule="0 18 * * 1-5" --uri="[YOUR_FUNCTION_URL]/update-performance" --http-method=GET --time-zone="America/New_York" --location=us-central1
```

### 3. Frontend Setup (React)

Navigate to the `frontend/` directory.

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment Variables**:
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
3. **Run Locally**:
   ```bash
   npm run dev
   ```
4. **Build & Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 📜 License
This project is for educational and entertainment purposes only. It is not investment advice.
