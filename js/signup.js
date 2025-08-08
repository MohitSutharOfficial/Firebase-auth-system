// Sign Up Functionality
// This module handles user registration with email and password

import { auth } from './firebase-config.js';
import { handleGlobalError } from './auth-state.js';
import { 
    createUserWithEmailAndPassword,
    updateProfile,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Enhanced utility functions for UI feedback
function showMessage(elementId, message, isError = false) {
    try {
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
            
            // Auto-scroll to message if needed
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
        } else {
            console.warn(`⚠️ Message element '${elementId}' not found`);
        }
    } catch (error) {
        console.error('❌ Error showing message:', error);
    }
}

function hideMessages() {
    try {
        const errorElement = document.getElementById('errorMessage');
        const successElement = document.getElementById('successMessage');
        
        if (errorElement) errorElement.classList.add('hidden');
        if (successElement) successElement.classList.add('hidden');
    } catch (error) {
        console.error('❌ Error hiding messages:', error);
    }
}

function toggleLoadingState(isLoading) {
    try {
        const submitBtn = document.getElementById('signupBtn');
        if (!submitBtn) {
            console.warn('⚠️ Signup button not found');
            return;
        }
        
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.loading-spinner');
        
        if (isLoading) {
            submitBtn.disabled = true;
            if (btnText) btnText.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            if (btnText) btnText.classList.remove('hidden');
            if (spinner) spinner.classList.add('hidden');
        }
    } catch (error) {
        console.error('❌ Error toggling loading state:', error);
    }
}

// Enhanced password validation with security requirements
function validatePassword(password, confirmPassword) {
    const errors = [];
    
    if (!password) {
        errors.push('Password is required');
        return errors;
    }
    
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }
    
    if (password !== confirmPassword) {
        errors.push('Passwords do not match');
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common. Please choose a stronger password');
    }
    
    // Optional: Add more password requirements (can be disabled for simpler passwords)
    const strongPasswordMode = false; // Set to true for stricter requirements
    
    if (strongPasswordMode) {
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/(?=.*[@$!%*?&])/.test(password)) {
            errors.push('Password must contain at least one special character (@$!%*?&)');
        }
    }
    
    return errors;
}

// Enhanced email validation
function validateEmail(email) {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
}

// Validate display name
function validateDisplayName(name) {
    const errors = [];
    
    if (!name || name.trim().length === 0) {
        errors.push('Display name is required');
    } else if (name.trim().length < 2) {
        errors.push('Display name must be at least 2 characters');
    } else if (name.length > 50) {
        errors.push('Display name must be less than 50 characters');
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
        errors.push('Display name can only contain letters, spaces, hyphens, apostrophes, and periods');
    }
    
    return errors;
// Enhanced form submission handler with comprehensive error handling
async function handleSignUp(event) {
    event.preventDefault();
    
    try {
        // Get form data
        const formData = new FormData(event.target);
        const displayName = formData.get('displayName')?.trim() || '';
        const email = formData.get('email')?.trim() || '';
        const password = formData.get('password') || '';
        const confirmPassword = formData.get('confirmPassword') || '';
        
        // Clear previous messages
        hideMessages();
        
        console.log('🔄 Starting signup process...');
        
        // Validate display name
        const nameErrors = validateDisplayName(displayName);
        if (nameErrors.length > 0) {
            showMessage('errorMessage', nameErrors.join('. '), true);
            document.getElementById('displayName')?.focus();
            return;
        }
        
        // Validate email
        if (!validateEmail(email)) {
            showMessage('errorMessage', 'Please enter a valid email address', true);
            document.getElementById('email')?.focus();
            return;
        }
        
        // Validate passwords
        const passwordErrors = validatePassword(password, confirmPassword);
        if (passwordErrors.length > 0) {
            showMessage('errorMessage', passwordErrors.join('. '), true);
            document.getElementById('password')?.focus();
            return;
        }
        
        // Check if Firebase Auth is available
        if (!auth) {
            throw new Error('Firebase Authentication is not initialized');
        }
        
        // Show loading state
        toggleLoadingState(true);
        
        // Create user account
        console.log('📝 Creating user account...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ User account created:', user.uid);
        
        // Update user profile with display name
        console.log('👤 Updating user profile...');
        await updateProfile(user, {
            displayName: displayName.trim()
        });
        
        console.log('✅ User profile updated');
        
        // Send email verification
        console.log('📧 Sending verification email...');
        await sendEmailVerification(user, {
            url: window.location.origin + '/login.html',
            handleCodeInApp: false
        });
        
        console.log('✅ Verification email sent');
        
        // Show success message
        showMessage('successMessage', 
            `🎉 Account created successfully! A verification email has been sent to ${email}. Please check your inbox and verify your email address before signing in.`
        );
        
        // Disable form to prevent duplicate submissions
        const form = document.getElementById('signupForm');
        if (form) {
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => input.disabled = true);
        }
        
        // Redirect to login page after a delay
        setTimeout(() => {
            window.location.href = `login.html?email=${encodeURIComponent(email)}`;
        }, 4000);
        
    } catch (error) {
        console.error('❌ Error creating account:', error);
        
        // Handle specific Firebase Auth errors with user-friendly messages
        let errorMessage = 'An error occurred while creating your account. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email address is already registered. Please use a different email or try signing in instead.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled. Please contact support.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please choose a stronger password with at least 6 characters.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection and try again.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please wait a few minutes before trying again.';
                break;
            case 'auth/quota-exceeded':
                errorMessage = 'Service temporarily unavailable. Please try again later.';
                break;
            case 'auth/app-deleted':
                errorMessage = 'Application configuration error. Please contact support.';
                break;
            default:
                // For unexpected errors, show a generic message but log details
                console.error('Unexpected error details:', {
                    code: error.code,
                    message: error.message,
                    stack: error.stack
                });
                errorMessage = `Unexpected error: ${error.message}. Please try again or contact support if the problem persists.`;
        }
        
        showMessage('errorMessage', errorMessage, true);
        handleGlobalError(error, 'User Registration');
        
    } finally {
        // Always hide loading state
        toggleLoadingState(false);
    }
}

// Enhanced real-time password validation with visual feedback
function setupPasswordValidation() {
    try {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const displayNameInput = document.getElementById('displayName');
        const emailInput = document.getElementById('email');
        
        if (!passwordInput || !confirmPasswordInput) {
            console.warn('⚠️ Password inputs not found for validation setup');
            return;
        }
        
        // Real-time password strength indicator
        function updatePasswordStrength(password) {
            const errors = validatePassword(password, confirmPasswordInput.value);
            const isStrong = password.length >= 8 && 
                           /(?=.*[a-z])/.test(password) && 
                           /(?=.*[A-Z])/.test(password) && 
                           /(?=.*\d)/.test(password);
            
            // Update password input styling
            passwordInput.classList.remove('weak', 'medium', 'strong');
            if (password.length > 0) {
                if (errors.length === 0 && isStrong) {
                    passwordInput.classList.add('strong');
                } else if (errors.length <= 1) {
                    passwordInput.classList.add('medium');
                } else {
                    passwordInput.classList.add('weak');
                }
            }
        }
        
        // Real-time confirm password validation
        function validatePasswordMatch() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (confirmPassword.length > 0) {
                if (password === confirmPassword) {
                    confirmPasswordInput.setCustomValidity('');
                    confirmPasswordInput.classList.remove('error');
                    confirmPasswordInput.classList.add('valid');
                } else {
                    confirmPasswordInput.setCustomValidity('Passwords do not match');
                    confirmPasswordInput.classList.remove('valid');
                    confirmPasswordInput.classList.add('error');
                }
            } else {
                confirmPasswordInput.setCustomValidity('');
                confirmPasswordInput.classList.remove('valid', 'error');
            }
        }
        
        // Real-time email validation
        function validateEmailField() {
            const email = emailInput.value.trim();
            if (email.length > 0) {
                if (validateEmail(email)) {
                    emailInput.setCustomValidity('');
                    emailInput.classList.remove('error');
                    emailInput.classList.add('valid');
                } else {
                    emailInput.setCustomValidity('Please enter a valid email address');
                    emailInput.classList.remove('valid');
                    emailInput.classList.add('error');
                }
            } else {
                emailInput.setCustomValidity('');
                emailInput.classList.remove('valid', 'error');
            }
        }
        
        // Real-time display name validation
        function validateDisplayNameField() {
            const name = displayNameInput.value.trim();
            const errors = validateDisplayName(name);
            
            if (name.length > 0) {
                if (errors.length === 0) {
                    displayNameInput.setCustomValidity('');
                    displayNameInput.classList.remove('error');
                    displayNameInput.classList.add('valid');
                } else {
                    displayNameInput.setCustomValidity(errors.join('. '));
                    displayNameInput.classList.remove('valid');
                    displayNameInput.classList.add('error');
                }
            } else {
                displayNameInput.setCustomValidity('');
                displayNameInput.classList.remove('valid', 'error');
            }
        }
        
        // Attach event listeners
        passwordInput.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
            validatePasswordMatch();
        });
        
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        
        if (emailInput) {
            emailInput.addEventListener('input', validateEmailField);
            emailInput.addEventListener('blur', validateEmailField);
        }
        
        if (displayNameInput) {
            displayNameInput.addEventListener('input', validateDisplayNameField);
            displayNameInput.addEventListener('blur', validateDisplayNameField);
        }
        
        console.log('✅ Password validation setup complete');
        
    } catch (error) {
        console.error('❌ Error setting up password validation:', error);
        handleGlobalError(error, 'Password Validation Setup');
    }
}

// Enhanced initialization with error handling
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing signup page...');
    
    try {
        const signupForm = document.getElementById('signupForm');
        
        if (signupForm) {
            // Setup form submission handler
            signupForm.addEventListener('submit', handleSignUp);
            
            // Setup real-time validation
            setupPasswordValidation();
            
            // Focus on first input
            const firstInput = document.getElementById('displayName');
            if (firstInput) {
                firstInput.focus();
            }
            
            // Add form validation styling
            const style = document.createElement('style');
            style.textContent = `
                .form-group input.valid {
                    border-color: #28a745;
                    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
                }
                .form-group input.error {
                    border-color: #dc3545;
                    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
                }
                .form-group input.weak {
                    border-color: #dc3545;
                }
                .form-group input.medium {
                    border-color: #ffc107;
                }
                .form-group input.strong {
                    border-color: #28a745;
                }
                .status-verified {
                    color: #28a745;
                }
                .status-unverified {
                    color: #ffc107;
                }
            `;
            document.head.appendChild(style);
            
            console.log('✅ Signup form initialized successfully');
            
        } else {
            console.warn('⚠️ Signup form not found on this page');
        }
        
        // Add global error handling for this page
        window.addEventListener('error', (event) => {
            console.error('❌ Global error on signup page:', event.error);
            handleGlobalError(event.error, 'Signup Page');
        });
        
        // Check if user is already signed in
        if (auth?.currentUser) {
            console.log('ℹ️ User already signed in, redirecting to dashboard...');
            window.location.href = 'dashboard.html';
        }
        
    } catch (error) {
        console.error('❌ Error initializing signup page:', error);
        handleGlobalError(error, 'Signup Page Initialization');
        
        // Show fallback message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'initialization-error';
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            margin: 1rem;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>Initialization Error</h3>
            <p>There was an error loading the signup form. Please refresh the page.</p>
            <button onclick="window.location.reload()" class="btn btn-primary">Refresh Page</button>
        `;
        document.body.appendChild(errorDiv);
    } catch (initError) {
        console.error('❌ Critical error in signup initialization:', initError);
    }
});
