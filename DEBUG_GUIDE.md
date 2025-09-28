# Debug Logging System Guide

This application includes a comprehensive debug logging system that provides detailed entrance/exit logging for all major functions with parameter and return value tracking.

## 🚀 Quick Start

### Enable Debug Mode

**Method 1: Environment Variable (Recommended for Development)**
```bash
# In .env.local
VITE_DEBUG_MODE=true
```

**Method 2: URL Parameter (Quick Testing)**
```
https://your-app.com?debug=true
```

**Method 3: Browser Console (Runtime Toggle)**
```javascript
// Enable debug mode
window.debug.enable()

// Disable debug mode
window.debug.disable()

// Check status
window.debug.status()

// Reset to default
window.debug.clear()
```

**Method 4: localStorage (Persistent Browser Setting)**
```javascript
localStorage.setItem('debug_mode', 'true')
// Refresh page to apply
```

## 📊 Debug Output Format

When debug mode is enabled, you'll see detailed logs like this:

```
🟢 [14:23:45] AuthContext.verifyOTP() ENTER
  {
    function: "verifyOTP",
    context: "AuthContext", 
    params: {
      email: "admin@vidyagam.com",
      otp: "[REDACTED]",
      userData: {...}
    },
    timestamp: "2025-09-28T14:23:45.123Z"
  }

🔵 [14:23:45] AuthContext.verifyOTP() -> calling_auth_service
  {
    function: "verifyOTP",
    context: "AuthContext",
    step: "calling_auth_service", 
    timestamp: "2025-09-28T14:23:45.234Z"
  }

🔴 [14:23:46] AuthContext.verifyOTP() EXIT (1250ms)
  {
    function: "verifyOTP",
    context: "AuthContext",
    returnValue: {
      success: true,
      userEmail: "admin@vidyagam.com", 
      isAdmin: true
    },
    executionTime: 1250,
    timestamp: "2025-09-28T14:23:46.373Z"
  }
```

## 🏗️ System Architecture

### Components with Debug Logging

1. **AuthContext** - User authentication flow
   - `initializeAuth()` - Initial authentication check
   - `verifyOTP()` - OTP verification process
   - `login()` - User login flow
   - `updatePreferences()` - User preference updates

2. **API Service** - Backend communication
   - `makeModularRequest()` - All API calls
   - Individual endpoint methods

3. **AuthService** - Authentication service
   - `request()` - Base HTTP request method
   - `verifyOTP()` - OTP verification API call
   - `validateToken()` - Token validation

4. **Dashboard Component** - Main dashboard logic
   - `useEffect[user_onboarding_check]` - Admin/onboarding routing
   - `fetchDigest()` - Content loading

5. **Onboarding Component** - User onboarding flow
   - Admin detection and routing logic

## 🔒 Security Features

### Sensitive Data Protection
The debug system automatically sanitizes sensitive information:

- **Passwords, tokens, secrets** → `[REDACTED]`
- **Long strings (>200 chars)** → `[LONG_STRING:1234chars]`
- **Large objects** → Truncated with size info
- **JWT tokens** → `[STRING:456chars]`

### Safe Logging
```javascript
// ✅ Safe - Will be sanitized
debug.enter('login', { 
  email: 'user@example.com',
  password: 'secret123',      // → [REDACTED]
  authToken: 'very.long.jwt'  // → [REDACTED]
})

// ✅ Safe - Automatic detection
debug.step('api_call', 'received_token', {
  token: 'bearer.jwt.token'   // → [REDACTED]
})
```

## 🎛️ Advanced Usage

### Custom Debug Loggers
```javascript
import DebugLogger from '../utils/debug';

// Create context-specific logger
const debug = new DebugLogger('MyComponent');

// Force enable regardless of global setting
const forceDebug = new DebugLogger('CriticalComponent', true);
```

### Function Wrapping
```javascript
import { debugWrap } from '../utils/debug';

// Automatically wrap functions
const myFunction = debugWrap('MyClass', 'myMethod', (param1, param2) => {
  return param1 + param2;
});

// Now all calls are automatically logged
myFunction(1, 2); // Logs entrance, execution time, and return value
```

### Manual Logging
```javascript
const debug = new DebugLogger('MyComponent');

function complexOperation(data) {
  debug.enter('complexOperation', { data });
  
  try {
    debug.step('complexOperation', 'validation', { dataSize: data.length });
    // ... validation logic
    
    debug.step('complexOperation', 'processing', { stage: 'transform' });
    // ... processing logic
    
    const result = processData(data);
    debug.exit('complexOperation', { result });
    return result;
    
  } catch (error) {
    debug.error('complexOperation', error);
    throw error;
  }
}
```

## 🐛 Troubleshooting Admin Flow

When debugging admin user routing issues, look for these log patterns:

1. **Authentication Logs**
   ```
   🟢 AuthContext.verifyOTP() ENTER
   🔵 AuthContext.verifyOTP() -> received_response { isAdmin: true }
   🔴 AuthContext.verifyOTP() EXIT { isAdmin: true }
   ```

2. **Dashboard Routing Logs**
   ```
   🟢 Dashboard.useEffect[user_onboarding_check]() ENTER
   🔵 Dashboard.useEffect[user_onboarding_check]() -> user_exists { isAdmin: true }
   🔵 Dashboard.useEffect[user_onboarding_check]() -> admin_redirect
   🔴 Dashboard.useEffect[user_onboarding_check]() EXIT { action: 'admin_redirect' }
   ```

3. **API Request Logs**
   ```
   🟢 APIService.makeModularRequest() ENTER { endpoint: 'auth/verify-otp' }
   🔵 APIService.makeModularRequest() -> sending_request
   🔵 APIService.makeModularRequest() -> received_response { status: 200 }
   🔴 APIService.makeModularRequest() EXIT (892ms)
   ```

## 📈 Performance Impact

- **Debug Disabled**: Zero performance impact
- **Debug Enabled**: Minimal impact (~1-3ms per function call)
- **Memory Usage**: Logs are not stored, only output to console
- **Production**: Always disable debug mode in production builds

## 🔧 Configuration Options

### Environment Variables
```bash
# Main debug toggle
VITE_DEBUG_MODE=true

# Component-specific debugging (future enhancement)
VITE_DEBUG_AUTH=true
VITE_DEBUG_API=true
VITE_DEBUG_ROUTING=true
```

### Runtime Configuration
```javascript
// Global controls available in browser console
window.debug.enable()     // Enable debug mode
window.debug.disable()    // Disable debug mode  
window.debug.status()     // Check current status
window.debug.clear()      // Reset to environment default
```

## 🎯 Best Practices

1. **Enable for Development**: Always enable debug mode during development
2. **Disable for Production**: Never enable in production builds
3. **Use URL Parameter**: For quick testing without environment changes
4. **Monitor Performance**: Check execution times in debug logs
5. **Sanitize Sensitive Data**: The system does this automatically, but be aware
6. **Use Specific Contexts**: Create meaningful context names for easier filtering

## 📋 Debug Checklist for Admin Issues

When troubleshooting admin user flow:

- [ ] Debug mode enabled (`window.debug.status()`)
- [ ] Check AuthContext.verifyOTP logs for `isAdmin: true`
- [ ] Verify Dashboard useEffect logs show admin detection
- [ ] Confirm admin redirect action in logs
- [ ] Check API logs for successful authentication
- [ ] Verify no errors in the debug output
- [ ] Look for execution times to identify slow operations

This debug system provides complete visibility into the application flow, making it easy to identify where admin routing might be failing or where performance bottlenecks exist.