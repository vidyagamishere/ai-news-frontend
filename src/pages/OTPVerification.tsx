import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './auth.css';

const OTPVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  
  const email = searchParams.get('email') || '';
  const userDataParam = searchParams.get('userData') || '';
  const authModeParam = searchParams.get('authMode') || '';
  const userData = userDataParam ? JSON.parse(decodeURIComponent(userDataParam)) : {};
  
  // Determine if this is signup or signin flow
  const isSignupFlow = authModeParam === 'signup' || (userData.name && userData.name.trim() !== '');
  const isSigninFlow = authModeParam === 'signin' || (!userData.name || userData.name.trim() === '');
  
  const { verifyOTP, sendOTP, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setMessage('Please enter a 6-digit OTP');
      return;
    }

    setVerificationStatus('verifying');
    try {
      await verifyOTP(email, otp, userData);
      setVerificationStatus('success');
      
      // Handle success based on auth flow type
      if (isSigninFlow) {
        // Signin flow - always go to dashboard (existing user)
        setMessage('Welcome back! Redirecting to your dashboard...');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else if (isSignupFlow) {
        // Signup flow - check if onboarding needed
        const onboardingComplete = localStorage.getItem('onboardingComplete');
        if (onboardingComplete === 'true') {
          setMessage('Account created! Redirecting to your dashboard...');
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setMessage('Email verified successfully! Let\'s set up your preferences...');
          setTimeout(() => navigate('/onboarding'), 2000);
        }
      } else {
        // Fallback - check onboarding status
        const onboardingComplete = localStorage.getItem('onboardingComplete');
        if (onboardingComplete === 'true') {
          setMessage('Welcome back! Redirecting to your dashboard...');
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setMessage('Email verified successfully! Redirecting to onboarding...');
          setTimeout(() => navigate('/onboarding'), 2000);
        }
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Invalid OTP. Please check and try again.');
    }
  };

  const handleResendOTP = async () => {
    try {
      // Pass correct auth mode when resending OTP
      const authMode = isSignupFlow ? 'signup' : 'signin';
      const name = userData.name || '';
      await sendOTP(email, name, authMode);
      setTimeLeft(600); // Reset timer
      setMessage('New OTP sent! Please check your email.');
      setVerificationStatus('pending');
      setOtp('');
    } catch (error) {
      setMessage('Failed to send OTP. Please try again.');
    }
  };

  if (verificationStatus === 'success') {
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
                <h2>Email Verified!</h2>
                <p>Welcome to the neural network of AI intelligence.</p>
              </div>
            </div>
          </div>

          <div className="auth-right-panel">
            <div className="auth-form-container">
              <div className="auth-card-header">
                <div className="success-icon">
                  <CheckCircle size={64} color="#22c55e" />
                </div>
                <h2>Email Verified Successfully!</h2>
                <p>Your account has been created. Redirecting you to complete your setup...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <h2>{isSigninFlow ? 'Verify Your Identity' : 'Verify Your Email'}</h2>
              <p>{isSigninFlow 
                ? 'Enter the 6-digit code sent to your email to sign in to your account.'
                : 'Enter the 6-digit code sent to your email to activate your Vidyagam account.'
              }</p>
            </div>
          </div>
        </div>

        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="auth-card-header">
              <div className="verification-icon">
                <Mail size={64} color="#3b82f6" />
              </div>
              <h2>Enter Verification Code</h2>
              <p>
                We've sent a 6-digit code to <strong>{email}</strong>
              </p>
              <p className="time-remaining">
                Code expires in: <strong>{formatTime(timeLeft)}</strong>
              </p>
            </div>

            {message && (
              <div className={`auth-message ${verificationStatus === 'error' ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleOTPSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="otp">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  className="otp-input"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationStatus === 'verifying' || otp.length !== 6}
                className="auth-submit"
              >
                {verificationStatus === 'verifying' 
                  ? 'Verifying...' 
                  : isSigninFlow 
                    ? 'Sign In' 
                    : 'Verify Email'
                }
              </button>
            </form>

            <div className="verification-actions">
              <p>Didn't receive the code?</p>
              <button
                onClick={handleResendOTP}
                disabled={loading || timeLeft > 540} // Allow resend after 1 minute
                className="btn btn-outline"
              >
                {timeLeft > 540 ? (
                  `Resend in ${Math.ceil((600 - timeLeft) / 60)}m`
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Resend Code
                  </>
                )}
              </button>
            </div>

            <div className="auth-footer">
              <div className="auth-links">
                <button 
                  onClick={() => navigate(`/auth${isSignupFlow ? '?mode=signup' : ''}`)}
                  className="auth-link-btn"
                >
                  ← Back to {isSignupFlow ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;