// Authentication State Management
// This module handles user authentication state changes across the application

import { auth } from './firebase-config.js';
import { 
    onAuthStateChanged,
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Global error handler
function handleGlobalError(error, context = 'Unknown') {
    console.error(`❌ Error in ${context}:`, error);
    
    // Show user-friendly error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'global-error-message';
    errorMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f8d7da;
        color: #721c24;
        padding: 1rem;
        border-radius: 4px;
        border: 1px solid #f5c6cb;
        z-index: 9999;
        max-width: 300px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    errorMessage.innerHTML = `
        <strong>Error:</strong> ${error.message || 'Something went wrong'}
        <button onclick="this.parentElement.remove()" style="
            float: right;
            background: none;
            border: none;
            color: #721c24;
            cursor: pointer;
            font-size: 1.2rem;
            margin-left: 10px;
        ">&times;</button>
    `;
    
    document.body.appendChild(errorMessage);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorMessage.parentNode) {
            errorMessage.parentNode.removeChild(errorMessage);
        }
    }, 10000);
}

// Enhanced utility function to show/hide elements
function toggleElement(elementId, show) {
    try {
        const element = document.getElementById(elementId);
        if (element) {
            if (show) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        } else if (elementId) {
            console.warn(`⚠️ Element with ID '${elementId}' not found`);
        }
    } catch (error) {
        handleGlobalError(error, `toggleElement(${elementId})`);
    }
}

// Enhanced utility function to update user info display
function updateUserInfo(user) {
    try {
        const userInfoElement = document.getElementById('userInfo');
        const userEmailElement = document.getElementById('userEmail');
        
        if (userInfoElement && user) {
            const creationTime = user.metadata?.creationTime 
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : 'Unknown';
            const lastSignInTime = user.metadata?.lastSignInTime 
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                : 'Unknown';
                
            userInfoElement.innerHTML = `
                <div class="user-profile">
                    <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                    <p><strong>Display Name:</strong> ${user.displayName || 'Not set'}</p>
                    <p><strong>Email Verified:</strong> 
                        <span class="${user.emailVerified ? 'status-verified' : 'status-unverified'}">
                            ${user.emailVerified ? '✅ Yes' : '⚠️ No'}
                        </span>
                    </p>
                    <p><strong>Account Created:</strong> ${creationTime}</p>
                    <p><strong>Last Sign In:</strong> ${lastSignInTime}</p>
                    <p><strong>User ID:</strong> <code>${user.uid}</code></p>
                </div>
            `;
        }
        
        if (userEmailElement && user?.email) {
            userEmailElement.textContent = user.email;
        }
    } catch (error) {
        handleGlobalError(error, 'updateUserInfo');
    }
}

// Enhanced logout functionality with better error handling
function setupLogoutHandlers() {
    const logoutButtons = document.querySelectorAll('#logoutBtn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            // Prevent double-clicking
            if (button.disabled) return;
            
            try {
                // Show loading state
                const originalText = button.textContent;
                button.disabled = true;
                button.textContent = 'Signing out...';
                
                console.log('🔓 Signing out user...');
                await signOut(auth);
                
                console.log('✅ User signed out successfully');
                
                // Show success message briefly
                button.textContent = 'Signed out!';
                
                // Redirect to home page after a brief delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                
            } catch (error) {
                console.error('❌ Error signing out:', error);
                handleGlobalError(error, 'Logout');
                
                // Reset button state
                button.disabled = false;
                button.textContent = 'Logout';
                
                // Fallback: clear local storage and redirect
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = 'index.html';
                } catch (fallbackError) {
                    console.error('❌ Fallback logout failed:', fallbackError);
                    alert('Sign out failed. Please refresh the page and try again.');
                }
            }
        });
    });
}

// Enhanced authentication state monitoring with comprehensive error handling
function initializeAuthStateListener() {
    try {
        if (!auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        console.log('🔐 Setting up auth state listener...');
        
        onAuthStateChanged(auth, (user) => {
            try {
                console.log('🔄 Auth state changed:', user ? 'User signed in' : 'User signed out');
                
                if (user) {
                    // User is signed in
                    console.log('✅ User authenticated:', {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        emailVerified: user.emailVerified,
                        provider: user.providerData?.[0]?.providerId || 'unknown'
                    });
                    
                    // Update UI for authenticated user
                    toggleElement('welcomeSection', false);
                    toggleElement('userSection', true);
                    toggleElement('unauthenticatedState', false);
                    toggleElement('loadingState', false);
                    toggleElement('dashboardContent', true);
                    
                    updateUserInfo(user);
                    
                    // Handle page-specific redirects
                    const currentPath = window.location.pathname.toLowerCase();
                    if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
                        console.log('🔄 Redirecting authenticated user to dashboard...');
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1000);
                    }
                    
                } else {
                    // User is signed out
                    console.log('🔓 No user signed in');
                    
                    // Update UI for unauthenticated user
                    toggleElement('welcomeSection', true);
                    toggleElement('userSection', false);
                    toggleElement('dashboardContent', false);
                    toggleElement('loadingState', false);
                    
                    // Handle protected pages
                    const currentPath = window.location.pathname.toLowerCase();
                    if (currentPath.includes('dashboard.html')) {
                        toggleElement('unauthenticatedState', true);
                    }
                }
                
            } catch (stateError) {
                console.error('❌ Error handling auth state change:', stateError);
                handleGlobalError(stateError, 'Auth State Change');
                
                // Fallback: show loading state
                toggleElement('loadingState', true);
            }
        }, (error) => {
            // Auth state listener error handler
            console.error('❌ Auth state listener error:', error);
            handleGlobalError(error, 'Auth State Listener');
            
            // Show fallback UI
            toggleElement('loadingState', false);
            toggleElement('welcomeSection', true);
            toggleElement('userSection', false);
            toggleElement('dashboardContent', false);
        });
        
        console.log('✅ Auth state listener initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize auth state listener:', error);
        handleGlobalError(error, 'Auth Initialization');
        
        // Show error state
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-init-error';
        errorDiv.style.cssText = `
            text-align: center;
            padding: 2rem;
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            margin: 2rem;
        `;
        errorDiv.innerHTML = `
            <h3>Authentication Error</h3>
            <p>Failed to initialize authentication system.</p>
            <p>Please refresh the page or contact support if the problem persists.</p>
            <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                Refresh Page
            </button>
        `;
        
        document.body.appendChild(errorDiv);
    }
}

// Enhanced initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing auth system...');
    
    try {
        // Initialize logout handlers
        setupLogoutHandlers();
        
        // Initialize auth state listener with delay to ensure Firebase is ready
        setTimeout(() => {
            initializeAuthStateListener();
        }, 100);
        
        // Add global error handler for unhandled promises
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Unhandled promise rejection:', event.reason);
            
            // Only show user-facing errors for auth-related issues
            if (event.reason?.code?.startsWith('auth/')) {
                handleGlobalError(event.reason, 'Authentication');
                event.preventDefault(); // Prevent default browser error handling
            }
        });
        
        // Add connection status monitoring
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored');
            const offlineMessages = document.querySelectorAll('.offline-message');
            offlineMessages.forEach(msg => msg.remove());
        });
        
        window.addEventListener('offline', () => {
            console.log('📡 Connection lost');
            const offlineDiv = document.createElement('div');
            offlineDiv.className = 'offline-message';
            offlineDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #fff3cd;
                color: #856404;
                padding: 0.75rem;
                text-align: center;
                z-index: 9998;
                border-bottom: 1px solid #ffeaa7;
            `;
            offlineDiv.innerHTML = `
                📡 You're offline. Some features may not work properly.
            `;
            document.body.insertBefore(offlineDiv, document.body.firstChild);
        });
        
        console.log('✅ Auth system initialization complete');
        
    } catch (error) {
        console.error('❌ Error during auth system initialization:', error);
        handleGlobalError(error, 'System Initialization');
    }
});

// Export utility functions for use in other modules
export { toggleElement, updateUserInfo, handleGlobalError };
