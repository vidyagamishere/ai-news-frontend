/**
 * Email Validation Utilities
 * Free spam prevention without external APIs
 */

// Common disposable/temporary email domains to block
const DISPOSABLE_DOMAINS = [
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.com',
  'throwaway.email', 'maildrop.cc', 'getnada.com', 'temp-mail.org',
  'fakeinbox.com', 'spamgourmet.com', 'trashmail.com', 'yopmail.com',
  'sharklasers.com', 'guerrillamail.info', 'guerrillamail.net', 
  'guerrillamail.org', 'guerrillamail.biz', 'spam4.me', 'grr.la',
  'mintemail.com', 'mytemp.email', 'tempinbox.com'
];

// Rate limiting storage (in-memory for now, can be moved to localStorage)
const signupAttempts: Map<string, number[]> = new Map();
const MAX_ATTEMPTS_PER_HOUR = 3;
const HOUR_IN_MS = 60 * 60 * 1000;

/**
 * Check if email domain is a known disposable/temporary email service
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return false;
  
  return DISPOSABLE_DOMAINS.includes(domain);
}

/**
 * Validate email format with RFC 5322 compliance
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) return false;
  
  // Additional checks
  const [localPart, domain] = email.split('@');
  
  // Check local part length (max 64 chars)
  if (localPart.length > 64) return false;
  
  // Check domain length (max 255 chars)
  if (domain.length > 255) return false;
  
  // Check for consecutive dots
  if (email.includes('..')) return false;
  
  // Check domain has at least one dot
  if (!domain.includes('.')) return false;
  
  return true;
}

/**
 * Check rate limiting for signup attempts from same email/IP
 * Returns true if rate limit exceeded
 */
export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const attempts = signupAttempts.get(identifier) || [];
  
  // Filter out attempts older than 1 hour
  const recentAttempts = attempts.filter(timestamp => now - timestamp < HOUR_IN_MS);
  
  if (recentAttempts.length >= MAX_ATTEMPTS_PER_HOUR) {
    return true;
  }
  
  // Update attempts
  recentAttempts.push(now);
  signupAttempts.set(identifier, recentAttempts);
  
  return false;
}

/**
 * Comprehensive email validation for signup
 * Returns error message if invalid, null if valid
 */
export function validateSignupEmail(email: string): string | null {
  // Format validation
  if (!isValidEmailFormat(email)) {
    return 'Please enter a valid email address';
  }
  
  // Disposable email check
  if (isDisposableEmail(email)) {
    return 'Temporary/disposable email addresses are not allowed. Please use a permanent email address.';
  }
  
  // Rate limiting check
  if (isRateLimited(email)) {
    return 'Too many signup attempts. Please try again later.';
  }
  
  return null; // Valid
}

/**
 * Reset rate limiting for an identifier (for testing)
 */
export function resetRateLimit(identifier: string): void {
  signupAttempts.delete(identifier);
}

/**
 * Check if email belongs to common free email providers (optional whitelist)
 * These are trusted providers less likely to be spam
 */
export function isTrustedEmailProvider(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  const trustedDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'protonmail.com', 'aol.com', 'mail.com', 'zoho.com'
  ];
  
  return trustedDomains.includes(domain);
}
