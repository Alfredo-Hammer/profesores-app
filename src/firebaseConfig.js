

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCG9VHwnz-TzyZEqGrle9iKcerYy-EAUIM",
  authDomain: "profsesor-app.firebaseapp.com",
  projectId: "profsesor-app",
  storageBucket: "profsesor-app.firebasestorage.app",
  messagingSenderId: "222804078552",
  appId: "1:222804078552:web:01dc32c72eff3b867d0cad",
  measurementId: "G-FTN0CN3N56"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app)
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, analytics, storage };
