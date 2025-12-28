import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthState } = useAuth() as any;
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Verify email from token in URL
      verifyEmailToken(token);
    }
  }, [token]);

  const verifyEmailToken = async (verificationToken: string) => {
    setStatus('verifying');
    try {
      const response = await authService.verifyEmail(verificationToken);
      
      // Store auth token and user data
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('cachedUser', JSON.stringify(response.user));
      
      setStatus('success');
      setMessage('Email verified successfully! Redirecting to dashboard...');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Email verification failed. The link may have expired.');
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) return;
    
    try {
      setStatus('verifying');
      await authService.sendVerificationEmail(email, name || '', '');
      setStatus('success');
      setMessage('Verification email sent! Please check your inbox.');
      setTimeout(() => setStatus('pending'), 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to resend email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            {status === 'pending' && (
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-blue-600" />
              </div>
            )}
            {status === 'verifying' && (
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'pending' && 'Verify Your Email'}
            {status === 'verifying' && 'Verifying...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          {/* Message */}
          {status === 'pending' && (
            <div className="text-gray-600 mb-6">
              <p className="mb-4">
                We've sent a verification link to:
              </p>
              <p className="font-semibold text-gray-900 mb-4">
                {email}
              </p>
              <p className="text-sm">
                Please check your inbox and click the verification link to complete your registration.
              </p>
            </div>
          )}

          {status === 'verifying' && (
            <p className="text-gray-600 mb-6">
              Verifying your email address...
            </p>
          )}

          {message && (
            <p className={`mb-6 ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          {/* Actions */}
          {status === 'pending' && (
            <div className="space-y-3">
              <button
                onClick={resendVerificationEmail}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Resend Verification Email
              </button>
              <button
                onClick={() => navigate('/auth?mode=signin')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={resendVerificationEmail}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send New Verification Link
              </button>
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Didn't receive the email?</p>
          <p>Check your spam folder or contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
