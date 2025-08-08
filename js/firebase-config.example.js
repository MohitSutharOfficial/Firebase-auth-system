// Example Firebase configuration
// Copy this file to firebase-config.js and replace with your actual Firebase project config

const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "your-app-id-here"
};

// Don't edit below this line
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Development helper
if (window.location.hostname === "localhost") {
  console.log("🔥 Firebase initialized in development mode");
}
