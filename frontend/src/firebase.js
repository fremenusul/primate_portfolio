import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
  projectId: "primateportfolio",
  // Other fields are generally required for web SDKs, but for simple Firestore reads 
  // sometimes just projectId works if rules allow. We will need the full config for production.
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
