import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import GoogleSignIn from '../components/auth/GoogleSignIn';
import '../components/auth/auth.css';
import './auth.css';

type AuthMode = 'signin' | 'signup';

// ✅ ADD: Logger utility
const logger = {
  info: (message: string, ...args: any[]) => console.log(`ℹ️ ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`❌ ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`⚠️ ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`🔍 ${message}`, ...args)
};

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  
  const { loading, error, isAuthenticated, login, signup, isGmailDomain } = useAuth();
  const navigate = useNavigate();

  // ✅ ADD: Missing state for modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect authenticated users to dashboard
      console.log('User authenticated, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (mode === 'signup' && !formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation for non-Gmail users
    const isGmail = isGmailDomain(formData.email);
    if (!isGmail) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (mode === 'signup') {
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      }
    }
    
    if (mode === 'signup' && !formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the Terms of Service';
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      console.log('🔍 Auth Debug:', { mode, email: formData.email, name: formData.name });
      
      const isGmail = isGmailDomain(formData.email);
      
      if (mode === 'signin') {
        if (isGmail) {
          // Gmail user - use email verification
          console.log('📧 Sending verification for Gmail signin');
          await authService.sendOTP(formData.email, '', 'signin');
          navigate('/verify-otp?email=' + encodeURIComponent(formData.email) + '&userData=' + encodeURIComponent(JSON.stringify({name: '', email: formData.email})) + '&authMode=signin');
        } else {
          // Non-Gmail user - use password verification
          console.log('🔐 Password signin for non-Gmail user');
          const result = await login({
            email: formData.email,
            password: formData.password
          });
          // Login success - user will be redirected by useEffect
        }
      } else {
        if (isGmail) {
          // Gmail user - use email verification
          console.log('📧 Sending verification for Gmail signup');
          await authService.sendOTP(formData.email, formData.name, 'signup');
          navigate('/verify-otp?email=' + encodeURIComponent(formData.email) + '&userData=' + encodeURIComponent(JSON.stringify(formData)) + '&authMode=signup');
        } else {
          // Non-Gmail user - use password signup
          console.log('🔐 Password signup for non-Gmail user');
          const result = await signup({
            email: formData.email,
            name: formData.name,
            password: formData.password,
            confirmPassword: formData.password,
            acceptTerms: true
          });
          // Signup success - user will be redirected by useEffect
        }
      }
    } catch (err: any) {
      // Handle specific authentication errors
      console.error('Authentication error:', err);
      console.log('🔍 Error details:', {
        error_code: err.error_code,
        message: err.message,
        status: err.status,
        redirect_to_signin: err.redirect_to_signin,
        redirect_to_signup: err.redirect_to_signup
      });
      
      // Check for specific error codes from backend
      if (err.error_code === 'EMAIL_EXISTS' && mode === 'signup') {
        // User tried to signup with existing email - show detailed message
        const message = err.message || 'An account with this email already exists. Please sign in instead.';
        setFormErrors({ 
          email: message
        });
        console.log('📧 Existing user signup blocked:', {
          email: formData.email,
          message: message,
          options: err.detailed_instructions?.existing_user_options
        });
        // Switch to signin mode after showing the message
        setTimeout(() => {
          setMode('signin');
          setFormErrors({});
        }, 5000); // Increased to 5 seconds to read the message
      } else if (err.error_code === 'EMAIL_NOT_FOUND' && mode === 'signin') {
        // User tried to signin with non-existent email - show detailed message  
        const message = err.message || 'No account found with this email. Please sign up first.';
        setFormErrors({ 
          email: message
        });
        console.log('📧 Non-existent user signin blocked:', {
          email: formData.email,
          message: message,
          options: err.detailed_instructions?.new_user_options
        });
        // Switch to signup mode after showing the message
        setTimeout(() => {
          setMode('signup');
          setFormErrors({});
        }, 5000); // Increased to 5 seconds to read the message
      } else {
        // Handle fallback cases - check error message content for known patterns
        const errorMsg = err.message || '';
        if (errorMsg.includes('Email ID already registered') && mode === 'signup') {
          setFormErrors({ 
            email: 'An account with this email already exists. Please sign in instead.'
          });
          setTimeout(() => {
            setMode('signin');
            setFormErrors({});
          }, 5000);
        } else if (errorMsg.includes('No account found') && mode === 'signin') {
          setFormErrors({ 
            email: 'No account found with this email. Please sign up first.'
          });
          setTimeout(() => {
            setMode('signup');
            setFormErrors({});
          }, 5000);
        } else {
          // Generic error handling
          setFormErrors({ 
            email: errorMsg || 'An error occurred. Please try again.'
          });
        }
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    console.log(`🔍 Input change: ${field} = ${value}`, { formData });
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGoogleSuccess = () => {
    // Let Dashboard component handle routing based on user state
    navigate('/dashboard');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    });
    setFormErrors({});
  };

  const isSignIn = mode === 'signin';
  const isSignUp = mode === 'signup';

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-left-panel">
          <div className="auth-branding">
            <div className="brand-content">
              <div className="brand-logo">
                <div className="neural-icon">🧠</div>
                <h1>Vidyagam</h1>
              </div>
              <h2>Gaining Knowledge, Filtered for You</h2>
              <p>Join 50,000+ AI researchers, engineers, and visionaries accessing breakthrough intelligence curated by advanced neural networks.</p>
              
              <div className="brand-features">
                <div className="brand-feature">
                  <div className="feature-icon">🚀</div>
                  <div>
                    <strong>Quantum-Speed Intelligence</strong>
                    <span>Real-time AI developments before they break mainstream</span>
                  </div>
                </div>
                <div className="brand-feature">
                  <div className="feature-icon">🔬</div>
                  <div>
                    <strong>Research-Grade Insights</strong>
                    <span>Direct pipeline from labs to your dashboard</span>
                  </div>
                </div>
                <div className="brand-feature">
                  <div className="feature-icon">🎯</div>
                  <div>
                    <strong>Neural Personalization</strong>
                    <span>AI that learns your technical interests</span>
                  </div>
                </div>
                <div className="brand-feature">
                  <div className="feature-icon">🏛️</div>
                  <div>
                    <strong>Elite Network Access</strong>
                    <span>Trusted by DeepMind, OpenAI, and top AI labs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right-panel">
          <div className="auth-form-container">
          <div className="auth-card-header">
            <h2>{isSignIn ? 'Welcome back' : 'Join Vidyagam'}</h2>
            <p>
              {isSignIn 
                ? 'Enter your credentials to access your dashboard' 
                : 'Enter your details to get started with your AI news experience'
              }
            </p>
          </div>

          <div className="auth-social">
            <GoogleSignIn onSuccess={handleGoogleSuccess} />
          </div>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required={isSignUp}
                  />
                </div>
                {formErrors.name && (
                  <div className="field-error">{formErrors.name}</div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              {formErrors.email && (
                <div className="field-error">{formErrors.email}</div>
              )}
            </div>

            {/* Password fields for non-Gmail users */}
            {formData.email && !isGmailDomain(formData.email) && (
              <>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <div className="field-error">{formErrors.password}</div>
                  )}
                </div>

                {isSignUp && (
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={18} />
                      <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                      />
                    </div>
                    {formErrors.confirmPassword && (
                      <div className="field-error">{formErrors.confirmPassword}</div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ✅ FIXED: Show Terms checkbox ONLY for Sign Up, NOT for Sign In */}
            {mode === 'signup' && (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label 
                  htmlFor="terms-privacy-checkbox"
                  style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    id="terms-privacy-checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => {
                      handleInputChange('acceptTerms', e.target.checked);
                      logger.info(`Terms checkbox changed: ${e.target.checked}`);
                    }}
                    style={{
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      minHeight: '20px',
                      marginTop: '2px',
                      cursor: 'pointer',
                      accentColor: '#3b82f6',
                      flexShrink: 0
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', flex: 1 }}>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowTermsModal(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        font: 'inherit'
                      }}
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPrivacyModal(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        font: 'inherit'
                      }}
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>

                {/* Visual indicator */}
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: formData.acceptTerms ? '#dcfce7' : '#fee2e2',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: formData.acceptTerms ? '#15803d' : '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>
                    {formData.acceptTerms ? '✓' : '!'}
                  </span>
                  <span>
                    {formData.acceptTerms 
                      ? 'Policies accepted - you can proceed' 
                      : 'Please accept Terms of Service and Privacy Policy'}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {/* Submit Button - LIGHT SKY BLUE */}
            <button
              type="submit"
              disabled={mode === 'signup' ? !formData.acceptTerms || loading : loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (mode === 'signup' && !formData.acceptTerms) || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: (mode === 'signup' && !formData.acceptTerms) || loading ? '#d1d5db' : '#0ea5e9', // ✅ Light sky blue
                color: '#ffffff',
                boxShadow: (mode === 'signup' && !formData.acceptTerms) || loading ? 'none' : '0 2px 4px rgba(14, 165, 233, 0.2)',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => {
                if ((mode === 'signin' || formData.acceptTerms) && !loading) {
                  e.currentTarget.style.backgroundColor = '#0284c7'; // Darker sky blue on hover
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(14, 165, 233, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if ((mode === 'signin' || formData.acceptTerms) && !loading) {
                  e.currentTarget.style.backgroundColor = '#0ea5e9';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(14, 165, 233, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? 'Processing...' : (mode === 'signup' ? 'Continue to Sign Up' : 'Continue to Sign In')}
            </button>
          </form>

          <div className="auth-footer">
            {isSignIn ? (
              <>
                <div className="auth-divider-footer">
                  <span>or</span>
                </div>
                
                <button 
                  type="button"
                  onClick={() => switchMode('signup')} 
                  className="auth-link-btn auth-signup-link"
                >
                  New to Vidyagam? Create account →
                </button>
              </>
            ) : (
              <>
                <p>
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => switchMode('signin')} 
                    className="auth-link-btn"
                  >
                    Sign in here
                  </button>
                </p>
                
                <div className="auth-terms">
                  <p>
                    By creating an account, you agree to our{' '}
                    <Link to="/terms">Terms of Service</Link>{' '}
                    and <Link to="/privacy">Privacy Policy</Link>
                  </p>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ADD: Terms Modal */}
      {showTermsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
              Terms of Service
            </h2>
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', marginBottom: '24px' }}>
              <p style={{ marginBottom: '12px' }}>
                By using this service, you agree to our Terms of Service. We are committed to providing you with high-quality AI news and content.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>1. Acceptance of Terms:</strong> By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
              <p>
                For complete terms and conditions, please contact our support team.
              </p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ✅ ADD: Privacy Modal */}
      {showPrivacyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
              Privacy Policy
            </h2>
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', marginBottom: '24px' }}>
              <p style={{ marginBottom: '12px' }}>
                We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
              <p>
                For complete privacy information, please contact our support team.
              </p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;