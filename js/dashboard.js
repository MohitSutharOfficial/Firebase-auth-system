// Dashboard Functionality
// This module handles the protected dashboard page with user profile management

import { auth } from './firebase-config.js';
import { 
    onAuthStateChanged,
    updateProfile,
    updateEmail,
    sendEmailVerification,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Utility functions
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.remove('hidden');
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.add('hidden');
}

function showMessage(message, isError = false) {
    // Create a temporary message element
    const messageDiv = document.createElement('div');
    messageDiv.className = isError ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '1001';
    messageDiv.style.maxWidth = '300px';
    
    document.body.appendChild(messageDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Update user profile display
function updateUserProfileDisplay(user) {
    const userProfileElement = document.getElementById('userProfile');
    if (userProfileElement) {
        userProfileElement.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Your Account Information</div>
                    <div class="card-description">Manage your profile and account settings</div>
                </div>
                <div class="card-content">
                    <div class="user-details-grid">
                        <div class="user-detail-item">
                            <label>Display Name:</label>
                            <span>${user.displayName || 'Not set'}</span>
                        </div>
                        <div class="user-detail-item">
                            <label>Email Address:</label>
                            <span>${user.email}</span>
                        </div>
                        <div class="user-detail-item">
                            <label>Email Verified:</label>
                            <span class="${user.emailVerified ? 'text-success' : 'text-warning'}">
                                ${user.emailVerified ? '✅ Verified' : '⚠️ Not Verified'}
                            </span>
                        </div>
                        <div class="user-detail-item">
                            <label>Account Created:</label>
                            <span>${new Date(user.metadata.creationTime).toLocaleDateString()}</span>
                        </div>
                        <div class="user-detail-item">
                            <label>Last Sign In:</label>
                            <span>${new Date(user.metadata.lastSignInTime).toLocaleDateString()}</span>
                        </div>
                        <div class="user-detail-item">
                            <label>User ID:</label>
                            <span class="user-id">${user.uid}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update header user info
    updateHeaderUserInfo(user);
    
    // Update email verification status
    updateEmailVerificationStatus(user);
}

// Update header user information
function updateHeaderUserInfo(user) {
    const userEmailElement = document.getElementById('userEmail');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }
    
    if (userAvatarElement) {
        // Show first letter of email or name
        const initial = (user.displayName || user.email || '?').charAt(0).toUpperCase();
        userAvatarElement.textContent = initial;
    }
}

// Update email verification status
function updateEmailVerificationStatus(user) {
    const verificationStatusElement = document.getElementById('verificationStatus');
    if (verificationStatusElement) {
        if (user.emailVerified) {
            verificationStatusElement.innerHTML = `
                <div class="alert alert-success">
                    <div class="alert-icon">✅</div>
                    <div class="alert-content">
                        <div class="alert-title">Email Verified</div>
                        <div class="alert-description">Your email address is verified and secure</div>
                    </div>
                </div>
            `;
        } else {
            verificationStatusElement.innerHTML = `
                <div class="alert alert-warning">
                    <div class="alert-icon">⚠️</div>
                    <div class="alert-content">
                        <div class="alert-title">Email Not Verified</div>
                        <div class="alert-description">Please verify your email address for full account access</div>
                    </div>
                </div>
                <button id="sendVerificationBtn" class="btn btn-outline btn-block mt-3">
                    Send Verification Email
                </button>
            `;
            
            // Add event listener for verification button
            const sendVerificationBtn = document.getElementById('sendVerificationBtn');
            if (sendVerificationBtn) {
                sendVerificationBtn.addEventListener('click', sendVerificationEmail);
            }
        }
    }
}

// Send email verification
async function sendVerificationEmail() {
    try {
        const user = auth.currentUser;
        if (user) {
            await sendEmailVerification(user);
            showMessage('Verification email sent! Please check your inbox.');
        }
    } catch (error) {
        console.error('Error sending verification email:', error);
        showMessage('Error sending verification email. Please try again.', true);
    }
}

// Modal management
function openModal() {
    const modal = document.getElementById('profileModal');
    const user = auth.currentUser;
    
    if (modal && user) {
        // Pre-fill form with current user data
        document.getElementById('newDisplayName').value = user.displayName || '';
        document.getElementById('newEmail').value = user.email || '';
        
        modal.classList.remove('hidden');
        document.getElementById('newDisplayName').focus();
    }
}

function closeModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Handle profile updates
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newDisplayName = formData.get('newDisplayName').trim();
    const newEmail = formData.get('newEmail').trim();
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        let updated = false;
        
        // Update display name if changed
        if (newDisplayName !== (user.displayName || '')) {
            await updateProfile(user, {
                displayName: newDisplayName
            });
            updated = true;
            console.log('Display name updated');
        }
        
        // Update email if changed
        if (newEmail !== user.email) {
            try {
                await updateEmail(user, newEmail);
                await sendEmailVerification(user);
                updated = true;
                console.log('Email updated and verification sent');
                showMessage('Email updated! Please check your new email for verification.');
            } catch (emailError) {
                if (emailError.code === 'auth/requires-recent-login') {
                    showMessage('Please sign out and sign in again before changing your email.', true);
                } else {
                    throw emailError;
                }
            }
        }
        
        if (updated) {
            // Refresh the profile display
            updateUserProfileDisplay(user);
            closeModal();
            if (newDisplayName !== (user.displayName || '')) {
                showMessage('Profile updated successfully!');
            }
        } else {
            showMessage('No changes detected.');
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        
        let errorMessage = 'Error updating profile. Please try again.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already in use by another account.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'Please sign out and sign in again before making this change.';
                break;
        }
        
        showMessage(errorMessage, true);
    }
}

// Handle password change
async function handlePasswordChange() {
    const currentPassword = prompt('Enter your current password:');
    if (!currentPassword) return;
    
    const newPassword = prompt('Enter your new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
        showMessage('New password must be at least 6 characters long.', true);
        return;
    }
    
    const confirmPassword = prompt('Confirm your new password:');
    if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match.', true);
        return;
    }
    
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        // Re-authenticate user before changing password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Update password
        await updatePassword(user, newPassword);
        
        showMessage('Password updated successfully!');
        console.log('Password updated');
        
    } catch (error) {
        console.error('Error updating password:', error);
        
        let errorMessage = 'Error updating password. Please try again.';
        switch (error.code) {
            case 'auth/wrong-password':
                errorMessage = 'Current password is incorrect.';
                break;
            case 'auth/weak-password':
                errorMessage = 'New password is too weak.';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'Please sign out and sign in again before changing your password.';
                break;
        }
        
        showMessage(errorMessage, true);
    }
}

// Initialize dashboard
function initializeDashboard() {
    // Setup event listeners
    const editProfileBtn = document.getElementById('editProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const profileForm = document.getElementById('profileForm');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openModal);
    }
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', handlePasswordChange);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeModal);
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
    const loadingState = document.getElementById('loadingState');
    const dashboardContent = document.getElementById('dashboardContent');
    const unauthenticatedState = document.getElementById('unauthenticatedState');
    
    if (user) {
        // User is authenticated
        console.log('User authenticated, loading dashboard...');
        
        hideElement('loadingState');
        hideElement('unauthenticatedState');
        showElement('dashboardContent');
        
        // Update user profile display
        updateUserProfileDisplay(user);
        
    } else {
        // User is not authenticated
        console.log('User not authenticated');
        
        hideElement('loadingState');
        hideElement('dashboardContent');
        showElement('unauthenticatedState');
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});
