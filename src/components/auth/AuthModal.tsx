import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import GoogleSignIn from './GoogleSignIn';
import './AuthModal.css';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSwitchMode: (mode: 'signin' | 'signup') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSwitchMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(false);

  const { login, loading, error, isAuthenticated, sendOTP, user } = useAuth();
  const navigate = useNavigate();

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Close modal when authenticated and route appropriately
  useEffect(() => {
    if (isAuthenticated && user) {
      handleClose();
      // Check if user has completed onboarding using backend preferences
      const hasCompletedOnboarding = user.preferences?.onboarding_completed ||
                                   localStorage.getItem('onboardingComplete') === 'true' ||
                                   user.preferences?.topics?.some(t => t.selected) || false;
      
      if (hasCompletedOnboarding) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (mode === 'signup' && !formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Confirm password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.acceptTerms) {
        errors.acceptTerms = 'Please accept the terms';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For signup, only validate email and name (no password validation for OTP flow)
    if (mode === 'signup') {
      const errors: Record<string, string> = {};
      
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      }
      
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email';
      }
      
      if (!formData.acceptTerms) {
        errors.acceptTerms = 'Please accept the terms';
      }
      
      setFormErrors(errors);
      
      if (Object.keys(errors).length > 0) {
        return;
      }
      
      try {
        // For signup, send OTP and include optional password for future logins
        await sendOTP(formData.email, formData.name);
        // Clear onboarding completion to trigger onboarding for new email signups
        localStorage.removeItem('onboardingComplete');
        
        const userData: any = {
          name: formData.name,
          email: formData.email
        };
        
        // Include password if provided for future password-based logins
        if (formData.password && formData.password.length >= 6) {
          userData.password = formData.password;
        }
        
        navigate('/verify-otp?email=' + encodeURIComponent(formData.email) + '&userData=' + encodeURIComponent(JSON.stringify(userData)));
      } catch (err) {
        console.error('OTP sending error:', err);
      }
      return;
    }
    
    // For signin, validate all fields
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      await login({ email: formData.email, password: formData.password });
    } catch (err: any) {
      console.error('Authentication error:', err);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    });
    setFormErrors({});
    onSwitchMode(newMode);
  };

  const handleGoogleSuccess = () => {
    console.log('Google authentication successful');
    // For Google sign-in, we'll let the auth context handle onboarding routing
    // New users will be routed to onboarding, returning users to dashboard
    handleClose();
  };

  const isSignIn = mode === 'signin';

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div 
        className={`auth-modal ${isVisible ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-modal-header">
          <h2>{isSignIn ? 'Welcome back' : 'Join Vidyagam'}</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="auth-modal-content">
          {/* Mode Toggle */}
          <div className="auth-toggle">
            <button
              type="button"
              className={`toggle-btn ${isSignIn ? 'active' : ''}`}
              onClick={() => switchMode('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`toggle-btn ${!isSignIn ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
          </div>

          <p className="auth-subtitle">
            {isSignIn 
              ? 'Continue your AI intelligence journey' 
              : 'Get personalized AI news and insights'
            }
          </p>

          {/* Google Sign In - Primary Option */}
          <div className="auth-social-primary">
            <GoogleSignIn onSuccess={handleGoogleSuccess} />
            <p className="social-benefit">Instant access • No email verification required</p>
          </div>

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {!isSignIn && (
              <div className="form-group">
                <label htmlFor="modal-name">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    id="modal-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                {formErrors.name && (
                  <div className="field-error">{formErrors.name}</div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="modal-email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="modal-email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              {formErrors.email && (
                <div className="field-error">{formErrors.email}</div>
              )}
            </div>

            {isSignIn && (
              <div className="form-group">
                <label htmlFor="modal-password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
            )}

            {!isSignIn && (
              <div className="form-group">
                <label htmlFor="modal-password">Password (Optional)</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Set password for easy future access"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
            )}

            {!isSignIn && (
              <div className="signup-info">
                <p className="otp-info">
                  📧 We'll send a verification code to your email for secure access
                </p>
              </div>
            )}

            {!isSignIn && (
              <div className="form-group">
                <div className="terms-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    />
                    <span className="checkbox-checkmark"></span>
                    I accept the <Link to="/terms" target="_blank">Terms</Link> and{' '}
                    <Link to="/privacy" target="_blank">Privacy Policy</Link>
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
                ? (isSignIn ? 'Signing in...' : 'Creating account...') 
                : (isSignIn ? 'Sign In' : 'Create Account')
              }
            </button>

            {isSignIn && (
              <button
                type="button"
                onClick={async () => {
                  if (!formData.email.trim()) {
                    setFormErrors({...formErrors, email: 'Email is required for email login'});
                    return;
                  }
                  if (!/\S+@\S+\.\S+/.test(formData.email)) {
                    setFormErrors({...formErrors, email: 'Please enter a valid email'});
                    return;
                  }
                  try {
                    await sendOTP(formData.email, '');
                    navigate('/verify-otp?email=' + encodeURIComponent(formData.email) + '&isLogin=true');
                  } catch (err: any) {
                    console.error('Email login error:', err);
                    // Show error in the form instead of redirecting
                    setFormErrors({...formErrors, email: err.message || 'Failed to send verification email'});
                  }
                }}
                className="auth-submit auth-submit-secondary"
                disabled={loading}
              >
                📧 Continue with Email (No Password)
              </button>
            )}
          </form>

          <div className="auth-footer">
            {isSignIn ? (
              <p>
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={() => switchMode('signup')} 
                  className="auth-link-btn"
                >
                  Sign up here
                </button>
              </p>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;