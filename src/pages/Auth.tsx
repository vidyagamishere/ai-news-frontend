import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import GoogleSignIn from '../components/auth/GoogleSignIn';
import '../components/auth/auth.css';
import './auth.css';

type AuthMode = 'signin' | 'signup';

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

            {isSignUp && (
              <div className="form-group">
                <div className="terms-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                      required={isSignUp}
                      id="acceptTerms"
                      name="acceptTerms"
                    />
                    <span>
                      I accept the <Link to="/terms" target="_blank">Terms of Service</Link> and{' '}
                      <Link to="/privacy" target="_blank">Privacy Policy</Link>
                    </span>
                  </label>
                </div>
                {formErrors.acceptTerms && (
                  <div className="field-error">{formErrors.acceptTerms}</div>
                )}
              </div>
            )}


            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit" 
              disabled={loading}
            >
              {loading 
                ? (isSignIn ? 'Signing In...' : 'Signing Up...')
                : (formData.email && !isGmailDomain(formData.email)
                    ? (isSignIn ? 'Sign In with Password' : 'Sign Up with Password')
                    : (isSignIn ? 'Continue to Sign In' : 'Continue to Sign Up')
                  )
              }
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
    </div>
  );
};

export default Auth;