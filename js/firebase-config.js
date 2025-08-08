// Firebase Configuration
// This file contains your Firebase project configuration and initializes Firebase services

// Import Firebase modules (using Firebase v9+ modular SDK from CDN)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { 
    getAuth, 
    connectAuthEmulator 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDftWk2YRg7MUECFvatToXgQ1yD0x8r7WI",
  authDomain: "my-auth-app-9a95f.firebaseapp.com",
  projectId: "my-auth-app-9a95f",
  storageBucket: "my-auth-app-9a95f.firebasestorage.app",
  messagingSenderId: "1094556067616",
  appId: "1:1094556067616:web:5cb83e370f30707d0d5945"
};

// Initialize Firebase
let app, auth;

try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
    
    // Initialize Firebase Authentication and get a reference to the service
    auth = getAuth(app);
    console.log('✅ Firebase Auth initialized successfully');
    
    // Set up auth state debugging
    auth.onAuthStateChanged = new Proxy(auth.onAuthStateChanged, {
        apply: function(target, thisArg, argumentsList) {
            console.log('🔐 Auth state listener attached');
            return target.apply(thisArg, argumentsList);
        }
    });
    
} catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    console.error('Configuration used:', firebaseConfig);
    
    // Show user-friendly error
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #f8d7da;
                color: #721c24;
                padding: 1rem;
                text-align: center;
                z-index: 9999;
                border-bottom: 1px solid #f5c6cb;
            `;
            errorDiv.innerHTML = `
                <strong>Firebase Configuration Error:</strong> 
                Please check the console for details. ${error.message}
            `;
            document.body.insertBefore(errorDiv, document.body.firstChild);
        });
    }
}

// Optional: Connect to Auth Emulator for local development
// Uncomment the lines below if you want to use Firebase Auth Emulator for testing
// if (location.hostname === 'localhost') {
//     connectAuthEmulator(auth, 'http://localhost:9099');
// }

// Export auth instance for use in other modules
export { auth };

// Export other Firebase services as needed
export { app };

/* 
SETUP INSTRUCTIONS:
==================

1. CREATE A FIREBASE PROJECT:
   - Go to https://console.firebase.google.com/
   - Click "Create a project"
   - Follow the setup wizard
   - Choose a project name (e.g., "my-auth-app")

2. ENABLE AUTHENTICATION:
   - In the Firebase Console, go to Authentication > Sign-in method
   - Enable "Email/Password" authentication
   - Optionally enable "Google" for social login

3. GET YOUR CONFIGURATION:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click "Add app" and choose "Web" (</>) 
   - Register your app with a nickname
   - Copy the firebaseConfig object and replace the one above

4. CONFIGURE AUTHORIZED DOMAINS:
   - In Authentication > Settings > Authorized domains
   - Add your domain (for local development, localhost is already included)

5. SECURITY RULES (Optional):
   - For production, consider setting up Firestore security rules
   - For this demo, we're only using Authentication

EXAMPLE CONFIG (replace with your actual values):
{
    apiKey: "AIzaSyABC123...",
    authDomain: "my-auth-app-12345.firebaseapp.com",
    projectId: "my-auth-app-12345",
    storageBucket: "my-auth-app-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
}
*/
