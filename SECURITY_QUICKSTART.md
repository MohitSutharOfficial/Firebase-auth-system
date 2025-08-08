# 🚀 Security Implementation Quick Start Guide

## Immediate Security Enhancements

### 1. Enable Production Security Features

Add this enhanced security configuration to your `firebase-config.js`:

```javascript
// Enhanced Firebase configuration with security features
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};

// Production security settings
const securityConfig = {
  // Force HTTPS in production
  requireHTTPS: process.env.NODE_ENV === "production",

  // Enhanced session settings
  persistence: {
    type: "local", // or 'session' for stricter security
    timeout: 30 * 60 * 1000, // 30 minutes
  },

  // Rate limiting
  rateLimiting: {
    enabled: true,
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  },
};
```

### 2. Implement Enhanced Password Security

Replace the basic password validation in `signup.js` with this production-ready version:

```javascript
// Production password validation
function validateSecurePassword(password, userInfo = {}) {
  const errors = [];
  const warnings = [];

  // Length requirements
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  // Complexity requirements
  const requirements = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  Object.entries(requirements).forEach(([req, passed]) => {
    if (!passed) {
      errors.push(`Password must contain ${req} characters`);
    }
  });

  // Security checks
  const commonPasswords = [
    "password",
    "123456789",
    "qwertyuiop",
    "abc123456",
    "password123",
    "admin123",
    "welcome123",
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common");
  }

  // Personal information check
  if (
    userInfo.email &&
    password.toLowerCase().includes(userInfo.email.split("@")[0].toLowerCase())
  ) {
    warnings.push("Password should not contain your email");
  }

  if (
    userInfo.name &&
    password.toLowerCase().includes(userInfo.name.toLowerCase())
  ) {
    warnings.push("Password should not contain your name");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength: calculatePasswordStrength(password),
  };
}

function calculatePasswordStrength(password) {
  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  if (password.length >= 16) score += 25;

  // Complexity scoring
  if (/[a-z]/.test(password)) score += 5;
  if (/[A-Z]/.test(password)) score += 5;
  if (/\d/.test(password)) score += 5;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

  return Math.min(100, score);
}
```

### 3. Add Multi-Factor Authentication (MFA)

Create a new file `js/mfa.js`:

```javascript
// Multi-Factor Authentication implementation
import { auth } from "./firebase-config.js";
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

class MFAManager {
  static async setupPhoneMFA(phoneNumber) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // Setup reCAPTCHA
      const recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
        },
        auth
      );

      // Get MFA session
      const multiFactorSession = await multiFactor(user).getSession();

      // Initialize phone auth
      const phoneInfoOptions = {
        phoneNumber: phoneNumber,
        session: multiFactorSession,
      };

      const phoneAuthCredential = await PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );

      // Create MFA credential
      const multiFactorCredential =
        PhoneMultiFactorGenerator.credential(phoneAuthCredential);

      // Enroll the user
      await multiFactor(user).enroll(multiFactorCredential, "Phone Number");

      return { success: true, message: "MFA enabled successfully" };
    } catch (error) {
      console.error("MFA setup error:", error);
      throw error;
    }
  }

  static async verifyMFA(verificationCode) {
    try {
      const resolver = window.mfaResolver; // Set during sign-in process
      if (!resolver) throw new Error("No MFA resolver available");

      const phoneAuthCredential = PhoneAuthProvider.credential(
        resolver.hints[0].uid,
        verificationCode
      );

      const multiFactorCredential =
        PhoneMultiFactorGenerator.credential(phoneAuthCredential);

      const userCredential = await resolver.resolveSignIn(
        multiFactorCredential
      );
      return userCredential.user;
    } catch (error) {
      console.error("MFA verification error:", error);
      throw error;
    }
  }
}

export { MFAManager };
```

### 4. Implement Session Security

Add this to your `auth-state.js`:

```javascript
// Enhanced session management
class SessionManager {
  constructor() {
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.warningTime = 5 * 60 * 1000; // 5 minutes before timeout
    this.lastActivity = Date.now();
    this.timeoutWarningShown = false;

    this.startSessionMonitoring();
  }

  startSessionMonitoring() {
    // Track user activity
    ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
      (event) => {
        document.addEventListener(
          event,
          () => {
            this.updateActivity();
          },
          { passive: true }
        );
      }
    );

    // Check session validity every minute
    setInterval(() => {
      this.checkSessionValidity();
    }, 60000);
  }

  updateActivity() {
    this.lastActivity = Date.now();
    this.timeoutWarningShown = false;

    // Hide timeout warning if shown
    const warningElement = document.getElementById("session-warning");
    if (warningElement) {
      warningElement.remove();
    }
  }

  checkSessionValidity() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeUntilTimeout = this.sessionTimeout - timeSinceActivity;

    if (timeUntilTimeout <= 0) {
      this.handleSessionTimeout();
    } else if (
      timeUntilTimeout <= this.warningTime &&
      !this.timeoutWarningShown
    ) {
      this.showTimeoutWarning(Math.ceil(timeUntilTimeout / 60000));
    }
  }

  showTimeoutWarning(minutesLeft) {
    this.timeoutWarningShown = true;

    const warningDiv = document.createElement("div");
    warningDiv.id = "session-warning";
    warningDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            color: #856404;
            padding: 1rem;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            z-index: 9999;
            max-width: 300px;
        `;
    warningDiv.innerHTML = `
            <strong>Session Timeout Warning</strong><br>
            Your session will expire in ${minutesLeft} minute(s).
            <br><br>
            <button onclick="this.parentElement.remove(); sessionManager.updateActivity();" 
                    class="btn btn-warning btn-sm">
                Extend Session
            </button>
        `;

    document.body.appendChild(warningDiv);
  }

  async handleSessionTimeout() {
    try {
      await signOut(auth);

      // Show timeout message
      alert(
        "Your session has expired due to inactivity. Please sign in again."
      );
      window.location.href = "login.html";
    } catch (error) {
      console.error("Error during session timeout:", error);
      // Force redirect anyway
      window.location.href = "login.html";
    }
  }
}

// Initialize session manager
const sessionManager = new SessionManager();
window.sessionManager = sessionManager; // Make available globally
```

### 5. Add Security Headers (for server deployments)

If you're deploying to a server, add these security headers:

```javascript
// Express.js example
app.use((req, res, next) => {
  // Security headers
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    `
        default-src 'self';
        script-src 'self' https://www.gstatic.com https://apis.google.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        connect-src 'self' https://*.googleapis.com;
        frame-ancestors 'none';
    `
  );

  next();
});
```

### 6. Security Monitoring & Alerts

Add this monitoring system to `auth-state.js`:

```javascript
// Security monitoring and alerting
class SecurityMonitor {
  constructor() {
    this.suspiciousActivities = [];
    this.alertThreshold = 3; // Number of suspicious activities before alert
  }

  logSecurityEvent(event) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity,
      userId: auth.currentUser?.uid,
      details: event.details,
      userAgent: navigator.userAgent,
      ipAddress: this.getClientIP(),
    };

    // Log to console (in production, send to security service)
    console.log("Security Event:", securityEvent);

    // Check for suspicious patterns
    this.analyzeSuspiciousActivity(securityEvent);

    // Store locally for pattern analysis
    this.suspiciousActivities.push(securityEvent);

    // Keep only last 100 events
    if (this.suspiciousActivities.length > 100) {
      this.suspiciousActivities.shift();
    }
  }

  analyzeSuspiciousActivity(event) {
    const recentEvents = this.suspiciousActivities.filter(
      (e) => Date.now() - new Date(e.timestamp).getTime() < 15 * 60 * 1000 // Last 15 minutes
    );

    // Multiple failed login attempts
    const failedLogins = recentEvents.filter(
      (e) => e.type === "failed_login"
    ).length;
    if (failedLogins >= 3) {
      this.triggerSecurityAlert("Multiple failed login attempts", "HIGH");
    }

    // Unusual access patterns
    const accessAttempts = recentEvents.filter(
      (e) => e.type === "access_attempt"
    ).length;
    if (accessAttempts >= 10) {
      this.triggerSecurityAlert("Unusual access pattern detected", "MEDIUM");
    }
  }

  triggerSecurityAlert(message, severity) {
    console.warn(`🚨 Security Alert [${severity}]: ${message}`);

    // In production, this would send alerts to security team
    // For demo, show user notification
    if (severity === "HIGH") {
      this.showSecurityNotification(message);
    }
  }

  showSecurityNotification(message) {
    const alertDiv = document.createElement("div");
    alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            z-index: 9999;
            max-width: 400px;
        `;
    alertDiv.innerHTML = `
            <strong>🚨 Security Alert</strong><br>
            ${message}<br>
            <small>If this wasn't you, please contact support immediately.</small>
            <button onclick="this.parentElement.remove()" style="float: right; margin-left: 10px;">✕</button>
        `;

    document.body.appendChild(alertDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 10000);
  }

  getClientIP() {
    // This would typically be handled server-side
    return "client-ip-hidden";
  }
}

// Initialize security monitor
const securityMonitor = new SecurityMonitor();
window.securityMonitor = securityMonitor;
```

## Quick Deployment Checklist

### Before Going Live:

- [ ] **Replace Firebase config** with production credentials
- [ ] **Enable MFA** for admin accounts
- [ ] **Set up rate limiting** on Firebase project
- [ ] **Configure security headers** if using custom hosting
- [ ] **Enable audit logging** in Firebase Console
- [ ] **Test all security features** in staging environment
- [ ] **Review Firebase Security Rules** for Firestore/Storage
- [ ] **Set up monitoring alerts**
- [ ] **Create incident response plan**
- [ ] **Train team on security procedures**

### Post-Launch:

- [ ] **Monitor security logs** daily
- [ ] **Review access permissions** weekly
- [ ] **Update dependencies** monthly
- [ ] **Conduct security assessment** quarterly
- [ ] **Update security documentation** as needed

---

This quick start guide provides immediate, actionable security enhancements you can implement right away. For comprehensive security planning, refer to the main `SECURITY_README.md` file.
