// Password Reset Functionality
// This module handles password reset via email

import { auth } from './firebase-config.js';
import { 
    sendPasswordResetEmail,
    confirmPasswordReset,
    verifyPasswordResetCode
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

function toggleLoadingState(isLoading) {
    const resetBtn = document.getElementById('resetBtn');
    const btnText = resetBtn.querySelector('.btn-text');
    const spinner = resetBtn.querySelector('.loading-spinner');
    
    if (isLoading) {
        resetBtn.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
    } else {
        resetBtn.disabled = false;
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// Email validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle password reset request
async function handlePasswordReset(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const email = formData.get('email').trim();
    
    // Clear previous messages
    hideMessages();
    
    // Validate email
    if (!email) {
        showMessage('errorMessage', 'Please enter your email address', true);
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('errorMessage', 'Please enter a valid email address', true);
        return;
    }
    
    // Show loading state
    toggleLoadingState(true);
    
    try {
        console.log('Sending password reset email to:', email);
        
        // Send password reset email
        await sendPasswordResetEmail(auth, email, {
            // Optional: Configure the email action settings
            url: window.location.origin + '/login.html?email=' + encodeURIComponent(email),
            handleCodeInApp: false
        });
        
        console.log('Password reset email sent successfully');
        
        // Show success message
        showMessage('successMessage', 
            `Password reset email sent to ${email}. Please check your inbox and follow the instructions to reset your password.`
        );
        
        // Disable form to prevent multiple requests
        const form = document.getElementById('resetPasswordForm');
        const emailInput = document.getElementById('email');
        if (form && emailInput) {
            emailInput.disabled = true;
            
            // Show additional instructions
            setTimeout(() => {
                showMessage('successMessage',
                    `Password reset email sent! If you don't see the email, please check your spam folder. You can close this page.`
                );
            }, 3000);
        }
        
    } catch (error) {
        console.error('Error sending password reset email:', error);
        
        // Handle specific Firebase Auth errors
        let errorMessage = 'An error occurred while sending the reset email. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many password reset requests. Please wait before trying again.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection and try again.';
                break;
            default:
                errorMessage = `Error: ${error.message}`;
        }
        
        showMessage('errorMessage', errorMessage, true);
    } finally {
        // Hide loading state
        toggleLoadingState(false);
    }
}

// Handle password reset confirmation (when user clicks link in email)
async function handlePasswordResetConfirmation() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');
    const continueUrl = urlParams.get('continueUrl');
    
    // Check if this is a password reset confirmation
    if (mode === 'resetPassword' && oobCode) {
        try {
            console.log('Handling password reset confirmation...');
            
            // Verify the password reset code
            const email = await verifyPasswordResetCode(auth, oobCode);
            console.log('Password reset code verified for:', email);
            
            // Show password reset form
            showPasswordResetForm(email, oobCode);
            
        } catch (error) {
            console.error('Error verifying password reset code:', error);
            
            let errorMessage = 'Invalid or expired password reset link.';
            switch (error.code) {
                case 'auth/expired-action-code':
                    errorMessage = 'This password reset link has expired. Please request a new one.';
                    break;
                case 'auth/invalid-action-code':
                    errorMessage = 'This password reset link is invalid. Please request a new one.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
            }
            
            showMessage('errorMessage', errorMessage, true);
        }
    }
}

// Show password reset form for confirmation
function showPasswordResetForm(email, oobCode) {
    const container = document.querySelector('.auth-form-container');
    if (container) {
        container.innerHTML = `
            <form id="confirmResetForm" class="auth-form">
                <h2>Set New Password</h2>
                <p class="form-description">
                    Enter a new password for <strong>${email}</strong>
                </p>
                
                <div id="confirmErrorMessage" class="error-message hidden"></div>
                <div id="confirmSuccessMessage" class="success-message hidden"></div>

                <div class="form-group">
                    <label for="newPassword">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" required minlength="6">
                    <small class="form-hint">Password must be at least 6 characters long</small>
                </div>

                <div class="form-group">
                    <label for="confirmNewPassword">Confirm New Password</label>
                    <input type="password" id="confirmNewPassword" name="confirmNewPassword" required>
                </div>

                <button type="submit" class="btn btn-primary" id="confirmResetBtn">
                    <span class="btn-text">Update Password</span>
                    <span class="loading-spinner hidden">Updating...</span>
                </button>

                <div class="form-footer">
                    <p><a href="login.html">Back to Login</a></p>
                </div>
            </form>
        `;
        
        // Setup form handler
        const confirmForm = document.getElementById('confirmResetForm');
        if (confirmForm) {
            confirmForm.addEventListener('submit', (event) => {
                handlePasswordResetConfirm(event, oobCode);
            });
        }
    }
}

// Handle password reset confirmation form submission
async function handlePasswordResetConfirm(event, oobCode) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newPassword = formData.get('newPassword');
    const confirmNewPassword = formData.get('confirmNewPassword');
    
    // Clear previous messages
    const errorElement = document.getElementById('confirmErrorMessage');
    const successElement = document.getElementById('confirmSuccessMessage');
    if (errorElement) errorElement.classList.add('hidden');
    if (successElement) successElement.classList.add('hidden');
    
    // Validate passwords
    if (newPassword.length < 6) {
        showConfirmMessage('Password must be at least 6 characters long', true);
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showConfirmMessage('Passwords do not match', true);
        return;
    }
    
    // Show loading state
    const confirmBtn = document.getElementById('confirmResetBtn');
    const btnText = confirmBtn.querySelector('.btn-text');
    const spinner = confirmBtn.querySelector('.loading-spinner');
    
    confirmBtn.disabled = true;
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    try {
        console.log('Confirming password reset...');
        
        // Confirm password reset
        await confirmPasswordReset(auth, oobCode, newPassword);
        
        console.log('Password reset successful');
        
        // Show success message
        showConfirmMessage('Password updated successfully! You can now sign in with your new password.');
        
        // Redirect to login page after delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
    } catch (error) {
        console.error('Error confirming password reset:', error);
        
        let errorMessage = 'Error updating password. Please try again.';
        switch (error.code) {
            case 'auth/expired-action-code':
                errorMessage = 'This password reset link has expired. Please request a new one.';
                break;
            case 'auth/invalid-action-code':
                errorMessage = 'This password reset link is invalid. Please request a new one.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please choose a stronger password.';
                break;
        }
        
        showConfirmMessage(errorMessage, true);
    } finally {
        // Hide loading state
        confirmBtn.disabled = false;
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// Show message for confirmation form
function showConfirmMessage(message, isError = false) {
    const elementId = isError ? 'confirmErrorMessage' : 'confirmSuccessMessage';
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.classList.remove('hidden');
        
        // Hide the opposite message type
        const oppositeId = isError ? 'confirmSuccessMessage' : 'confirmErrorMessage';
        const oppositeElement = document.getElementById(oppositeId);
        if (oppositeElement) {
            oppositeElement.classList.add('hidden');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if this is a password reset confirmation
    handlePasswordResetConfirmation();
    
    // Setup regular password reset form
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handlePasswordReset);
        
        // Focus on email input
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.focus();
        }
    }
});
