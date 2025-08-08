// Enhanced Security Configuration for Firebase Authentication
// This file contains production-ready security configurations

// Security configuration object
const SECURITY_CONFIG = {
    // Authentication settings
    auth: {
        // Password requirements (production-grade)
        password: {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxLength: 128,
            preventCommonPasswords: true,
            preventPersonalInfo: true
        },
        
        // Session management
        session: {
            timeout: 30 * 60 * 1000, // 30 minutes
            warningTime: 5 * 60 * 1000, // 5 minutes before timeout
            extendOnActivity: true,
            maxConcurrentSessions: 3
        },
        
        // Rate limiting
        rateLimiting: {
            loginAttempts: {
                maxAttempts: 5,
                windowMs: 15 * 60 * 1000, // 15 minutes
                blockDuration: 30 * 60 * 1000 // 30 minutes
            },
            passwordReset: {
                maxAttempts: 3,
                windowMs: 60 * 60 * 1000, // 1 hour
                blockDuration: 24 * 60 * 60 * 1000 // 24 hours
            },
            apiCalls: {
                maxRequests: 100,
                windowMs: 60 * 1000 // 1 minute
            }
        }
    },
    
    // Multi-Factor Authentication
    mfa: {
        required: false, // Set to true for mandatory MFA
        methods: {
            sms: true,
            totp: true,
            webauthn: false // Hardware security keys
        },
        gracePeriod: 7 * 24 * 60 * 60 * 1000 // 7 days to set up MFA
    },
    
    // Security monitoring
    monitoring: {
        logSecurityEvents: true,
        alertOnSuspiciousActivity: true,
        trackFailedAttempts: true,
        trackUnusualAccess: true,
        retentionPeriod: 90 * 24 * 60 * 60 * 1000 // 90 days
    },
    
    // Data protection
    dataProtection: {
        encryptSensitiveData: true,
        anonymizeOnDelete: true,
        autoDeleteInactive: {
            enabled: false,
            inactivePeriod: 2 * 365 * 24 * 60 * 60 * 1000 // 2 years
        }
    },
    
    // Security headers (for web apps)
    headers: {
        enforceHTTPS: true,
        contentSecurityPolicy: {
            enabled: true,
            policy: `
                default-src 'self';
                script-src 'self' https://www.gstatic.com https://apis.google.com;
                style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                font-src 'self' https://fonts.gstatic.com;
                img-src 'self' data: https:;
                connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com;
                frame-ancestors 'none';
                base-uri 'self';
                form-action 'self';
            `.replace(/\s+/g, ' ').trim()
        },
        frameOptions: 'DENY',
        contentTypeOptions: 'nosniff',
        xssProtection: '1; mode=block'
    }
};

// Common weak passwords to block
const COMMON_PASSWORDS = [
    'password', 'password123', '123456', '123456789', 'qwerty',
    'qwertyuiop', 'abc123', 'admin', 'admin123', 'welcome',
    'welcome123', 'letmein', 'monkey', '1234567890', 'password1',
    '123123', 'dragon', 'master', 'superman', 'trustno1'
];

// Security utility functions
class SecurityUtils {
    // Enhanced password validation
    static validatePassword(password, userInfo = {}) {
        const config = SECURITY_CONFIG.auth.password;
        const errors = [];
        const warnings = [];
        
        // Length validation
        if (password.length < config.minLength) {
            errors.push(`Password must be at least ${config.minLength} characters long`);
        }
        
        if (password.length > config.maxLength) {
            errors.push(`Password must be less than ${config.maxLength} characters`);
        }
        
        // Character requirements
        if (config.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (config.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (config.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        // Common password check
        if (config.preventCommonPasswords && COMMON_PASSWORDS.includes(password.toLowerCase())) {
            errors.push('Password is too common. Please choose a more unique password');
        }
        
        // Personal information check
        if (config.preventPersonalInfo && userInfo.email) {
            const emailPrefix = userInfo.email.split('@')[0].toLowerCase();
            if (password.toLowerCase().includes(emailPrefix)) {
                warnings.push('Password should not contain your email address');
            }
        }
        
        if (config.preventPersonalInfo && userInfo.name) {
            const nameParts = userInfo.name.toLowerCase().split(' ');
            for (const part of nameParts) {
                if (part.length > 2 && password.toLowerCase().includes(part)) {
                    warnings.push('Password should not contain your name');
                    break;
                }
            }
        }
        
        // Calculate password strength
        const strength = this.calculatePasswordStrength(password);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            strength
        };
    }
    
    // Password strength calculation
    static calculatePasswordStrength(password) {
        let score = 0;
        const bonus = {
            length: Math.min(25, password.length * 2),
            lowercase: /[a-z]/.test(password) ? 5 : 0,
            uppercase: /[A-Z]/.test(password) ? 5 : 0,
            numbers: /\d/.test(password) ? 5 : 0,
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 10 : 0,
            variety: new Set(password).size > password.length * 0.7 ? 10 : 0
        };
        
        score = Object.values(bonus).reduce((sum, points) => sum + points, 0);
        
        // Penalty for common patterns
        if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
        if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
        
        return Math.max(0, Math.min(100, score));
    }
    
    // Rate limiting check
    static checkRateLimit(type, identifier) {
        const key = `${type}_${identifier}`;
        const now = Date.now();
        const config = SECURITY_CONFIG.auth.rateLimiting[type];
        
        if (!config) return { allowed: true };
        
        // Get stored attempts from localStorage (in production, use Redis/database)
        const stored = localStorage.getItem(key);
        const attempts = stored ? JSON.parse(stored) : [];
        
        // Clean old attempts
        const validAttempts = attempts.filter(time => now - time < config.windowMs);
        
        // Check if limit exceeded
        if (validAttempts.length >= config.maxAttempts) {
            const oldestAttempt = Math.min(...validAttempts);
            const blockedUntil = oldestAttempt + config.blockDuration;
            
            if (now < blockedUntil) {
                return {
                    allowed: false,
                    retryAfter: Math.ceil((blockedUntil - now) / 1000),
                    reason: 'Rate limit exceeded'
                };
            }
        }
        
        // Record this attempt
        validAttempts.push(now);
        localStorage.setItem(key, JSON.stringify(validAttempts));
        
        return {
            allowed: true,
            remaining: config.maxAttempts - validAttempts.length
        };
    }
    
    // Input sanitization
    static sanitizeInput(input, type = 'general') {
        if (typeof input !== 'string') return input;
        
        const sanitizers = {
            general: (str) => str.trim().replace(/[<>]/g, ''),
            email: (str) => str.trim().toLowerCase().replace(/[^a-zA-Z0-9@._-]/g, ''),
            name: (str) => str.trim().replace(/[^a-zA-Z\s'-]/g, ''),
            phone: (str) => str.replace(/[^\d+()-\s]/g, '')
        };
        
        return sanitizers[type] ? sanitizers[type](input) : sanitizers.general(input);
    }
    
    // Generate secure token
    static generateSecureToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Device fingerprinting (basic)
    static getDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvas: canvas.toDataURL()
        };
        
        return btoa(JSON.stringify(fingerprint)).slice(0, 32);
    }
}

// Security event logger
class SecurityLogger {
    static log(event) {
        const securityEvent = {
            timestamp: new Date().toISOString(),
            type: event.type,
            severity: event.severity || 'INFO',
            userId: event.userId,
            sessionId: event.sessionId,
            details: event.details,
            userAgent: navigator.userAgent,
            fingerprint: SecurityUtils.getDeviceFingerprint()
        };
        
        // In production, send to security monitoring service
        console.log('Security Event:', securityEvent);
        
        // Store locally for analysis
        this.storeEvent(securityEvent);
        
        // Check for security alerts
        this.checkForAlerts(securityEvent);
    }
    
    static storeEvent(event) {
        const key = 'security_events';
        const stored = localStorage.getItem(key);
        const events = stored ? JSON.parse(stored) : [];
        
        events.push(event);
        
        // Keep only recent events (last 100 or based on retention period)
        const retentionMs = SECURITY_CONFIG.monitoring.retentionPeriod;
        const cutoff = Date.now() - retentionMs;
        const recentEvents = events.filter(e => new Date(e.timestamp).getTime() > cutoff);
        
        localStorage.setItem(key, JSON.stringify(recentEvents.slice(-100)));
    }
    
    static checkForAlerts(event) {
        if (!SECURITY_CONFIG.monitoring.alertOnSuspiciousActivity) return;
        
        const recent = this.getRecentEvents(15 * 60 * 1000); // Last 15 minutes
        
        // Multiple failed login attempts
        const failedLogins = recent.filter(e => e.type === 'auth_failed').length;
        if (failedLogins >= 3) {
            this.triggerAlert('Multiple failed login attempts detected', 'HIGH');
        }
        
        // Unusual access patterns
        const accessAttempts = recent.filter(e => e.type === 'access_attempt').length;
        if (accessAttempts >= 10) {
            this.triggerAlert('Unusual access pattern detected', 'MEDIUM');
        }
    }
    
    static getRecentEvents(timeWindowMs) {
        const key = 'security_events';
        const stored = localStorage.getItem(key);
        const events = stored ? JSON.parse(stored) : [];
        const cutoff = Date.now() - timeWindowMs;
        
        return events.filter(e => new Date(e.timestamp).getTime() > cutoff);
    }
    
    static triggerAlert(message, severity) {
        console.warn(`🚨 Security Alert [${severity}]: ${message}`);
        
        // In production, this would send alerts to security team
        if (severity === 'HIGH' && typeof window !== 'undefined') {
            this.showUserAlert(message);
        }
    }
    
    static showUserAlert(message) {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="font-size: 1.2em; margin-right: 8px;">🚨</span>
                <div>
                    <strong>Security Alert</strong><br>
                    <small>${message}</small>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-left: 10px; background: none; border: none; font-size: 1.2em; cursor: pointer;">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 10000);
    }
}

// Export configuration and utilities
export { 
    SECURITY_CONFIG, 
    COMMON_PASSWORDS, 
    SecurityUtils, 
    SecurityLogger 
};

// Make available globally for easy access
if (typeof window !== 'undefined') {
    window.SECURITY_CONFIG = SECURITY_CONFIG;
    window.SecurityUtils = SecurityUtils;
    window.SecurityLogger = SecurityLogger;
}
