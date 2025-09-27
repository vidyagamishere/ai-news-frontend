import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './auth.css';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'sending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token');
  
  const { sendOTP, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If there's a token in URL, verify it automatically
    if (token) {
      handleTokenVerification(token);
    }
  }, [token]);

  const handleTokenVerification = async (_verificationToken: string) => {
    // Redirect to OTP verification for new flow
    navigate('/verify-otp?email=' + encodeURIComponent(email));
  };

  const handleResendOTP = async () => {
    if (!email) {
      setMessage('No email address provided');
      return;
    }

    setVerificationStatus('sending');
    try {
      await sendOTP(email);
      setVerificationStatus('pending');
      setMessage('OTP sent! Please check your inbox.');
    } catch (error) {
      setVerificationStatus('error');
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
                <p>Your account has been activated. Redirecting you to complete your setup...</p>
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
              <h2>Check Your Email</h2>
              <p>We've sent a verification link to activate your Vidyagam account.</p>
            </div>
          </div>
        </div>

        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="auth-card-header">
              <div className="verification-icon">
                <Mail size={64} color="#3b82f6" />
              </div>
              <h2>Verify Your Email</h2>
              <p>
                We've sent a verification email to <strong>{email}</strong>
              </p>
              <p>Click the link in the email to activate your account and access your personalized AI digest.</p>
            </div>

            {message && (
              <div className={`auth-message ${verificationStatus === 'error' ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="verification-actions">
              <p>Didn't receive the email?</p>
              <button
                onClick={handleResendOTP}
                disabled={loading || verificationStatus === 'sending'}
                className="btn btn-outline"
              >
                {verificationStatus === 'sending' ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Resend OTP
                  </>
                )}
              </button>
            </div>

            <div className="auth-footer">
              <div className="auth-links">
                <button 
                  onClick={() => navigate('/auth')}
                  className="auth-link-btn"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;