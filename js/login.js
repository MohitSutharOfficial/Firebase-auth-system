// Login Functionality
// This module handles user authentication with email/password and Google Sign-In

import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Utility functions for UI feedback
function showMessage(elementId, message, isError = false) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.classList.remove('hidden');
        
        // Hide the opposite message type
        const oppositeId = isError ? 'successMessage' : 'errorMessage';
        const oppositeElement = document.getElementById(oppositeId);
        if (oppositeElement) {
            oppositeElement.classList.add('hidden');
        }
    }
}

function hideMessages() {
    const errorElement = document.getElementById('errorMessage');
    const successElement = document.getElementById('successMessage');
    
    if (errorElement) errorElement.classList.add('hidden');
    if (successElement) successElement.classList.add('hidden');
}

function toggleLoadingState(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.loading-spinner');
    
    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.classList.add('hidden');
        if (spinner) spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        if (btnText) btnText.classList.remove('hidden');
        if (spinner) spinner.classList.add('hidden');
    }
}

// Email validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle email/password login
async function handleEmailLogin(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const email = formData.get('email').trim();
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe');
    
    // Clear previous messages
    hideMessages();
    
    // Validate inputs
    if (!email || !password) {
        showMessage('errorMessage', 'Please enter both email and password', true);
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('errorMessage', 'Please enter a valid email address', true);
        return;
    }
    
    // Show loading state
    toggleLoadingState('loginBtn', true);
    
    try {
        // Set persistence based on "Remember Me" checkbox
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        
        console.log('Signing in user...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('User signed in successfully:', user.uid);
        
        // Show success message
        showMessage('successMessage', 'Signed in successfully! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error signing in:', error);
        
        // Handle specific Firebase Auth errors
        let errorMessage = 'An error occurred while signing in. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again or reset your password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled. Please contact support.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed sign-in attempts. Please try again later or reset your password.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection and try again.';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Invalid email or password. Please check your credentials and try again.';
                break;
            default:
                errorMessage = `Error: ${error.message}`;
        }
        
        showMessage('errorMessage', errorMessage, true);
    } finally {
        // Hide loading state
        toggleLoadingState('loginBtn', false);
    }
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
    // Clear previous messages
    hideMessages();
    
    try {
        console.log('Initiating Google Sign-In...');
        
        // Create Google Auth Provider
        const provider = new GoogleAuthProvider();
        
        // Optional: Add custom parameters
        provider.addScope('email');
        provider.addScope('profile');
        
        // Set custom parameters
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        // Sign in with popup
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        // Get additional info
        const credential = GoogleAuthProvider.credentialFromResult(userCredential);
        const token = credential.accessToken;
        
        console.log('Google Sign-In successful:', user.uid);
        console.log('User info:', {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL
        });
        
        // Show success message
        showMessage('successMessage', `Welcome ${user.displayName}! Redirecting...`);
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error with Google Sign-In:', error);
        
        // Handle specific Google Sign-In errors
        let errorMessage = 'An error occurred with Google Sign-In. Please try again.';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign-in cancelled. Please try again.';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Pop-up blocked by browser. Please allow pop-ups and try again.';
                break;
            case 'auth/cancelled-popup-request':
                errorMessage = 'Sign-in cancelled. Please try again.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Google Sign-In is not enabled. Please contact support.';
                break;
            case 'auth/account-exists-with-different-credential':
                errorMessage = 'An account already exists with this email address but different sign-in method. Please try signing in with email/password.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection and try again.';
                break;
            default:
                errorMessage = `Error: ${error.message}`;
        }
        
        showMessage('errorMessage', errorMessage, true);
    }
}

// Setup form validation and UI enhancements
function setupFormValidation() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    
    // Password visibility toggle
    if (passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            passwordToggle.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }
    
    // Real-time email validation
    emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && !validateEmail(email)) {
            emailInput.classList.add('error');
            emailInput.setCustomValidity('Please enter a valid email address');
        } else {
            emailInput.classList.remove('error');
            emailInput.setCustomValidity('');
        }
    });
    
    // Clear validation on input
    emailInput.addEventListener('input', () => {
        emailInput.classList.remove('error');
        emailInput.setCustomValidity('');
    });
    
    passwordInput.addEventListener('input', () => {
        passwordInput.classList.remove('error');
        passwordInput.setCustomValidity('');
    });
    
    // Add success state on valid input
    emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        if (email && validateEmail(email)) {
            emailInput.classList.add('success');
        } else {
            emailInput.classList.remove('success');
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const googleSignInBtn = document.getElementById('googleSignIn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleEmailLogin);
        setupFormValidation();
        
        // Focus on email input
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.focus();
        }
    }
    
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    // Auto-fill email from URL parameters (e.g., from password reset)
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = emailParam;
            // Focus on password field instead
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.focus();
            }
        }
    }
});
