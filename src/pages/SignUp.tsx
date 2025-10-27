import React, { useState } from 'react';
import logger from 'some-logger-library'; // Adjust the import based on your logger setup

const SignUp = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNonGoogleSignUp = async () => {
    // ✅ FIX: Check if BOTH terms and privacy are accepted
    if (!termsAccepted || !privacyAccepted) {
      setError('Please accept both Terms of Service and Privacy Policy to continue');
      return;
    }

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // ...existing validation code...
  };

  return (
    <div style={{ /* ...existing styles... */ }}>
      {/* ...existing code... */}

      {/* Terms and Privacy Checkboxes - COMPLETELY OVERRIDE CSS */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        {/* Terms Checkbox */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <label 
            htmlFor="terms-checkbox"
            style={{ 
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              flex: 1,
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                logger.info(`Terms checkbox: ${e.target.checked ? 'checked' : 'unchecked'}`);
              }}
              className="" // ✅ Remove any class that might apply CSS
              style={{
                width: '20px !important' as any,
                height: '20px !important' as any,
                minWidth: '20px',
                minHeight: '20px',
                marginTop: '2px',
                cursor: 'pointer',
                accentColor: '#3b82f6',
                flexShrink: 0,
                opacity: '1 !important' as any,
                position: 'static !important' as any,
                visibility: 'visible !important' as any,
                pointerEvents: 'auto !important' as any
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
            </span>
          </label>
        </div>

        {/* Privacy Checkbox */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <label 
            htmlFor="privacy-checkbox"
            style={{ 
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              flex: 1,
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              id="privacy-checkbox"
              checked={privacyAccepted}
              onChange={(e) => {
                setPrivacyAccepted(e.target.checked);
                logger.info(`Privacy checkbox: ${e.target.checked ? 'checked' : 'unchecked'}`);
              }}
              className="" // ✅ Remove any class that might apply CSS
              style={{
                width: '20px !important' as any,
                height: '20px !important' as any,
                minWidth: '20px',
                minHeight: '20px',
                marginTop: '2px',
                cursor: 'pointer',
                accentColor: '#3b82f6',
                flexShrink: 0,
                opacity: '1 !important' as any,
                position: 'static !important' as any,
                visibility: 'visible !important' as any,
                pointerEvents: 'auto !important' as any
              }}
            />
            <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', flex: 1 }}>
              I accept the{' '}
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
        </div>

        {/* Visual indicator */}
        <div style={{
          padding: '12px',
          backgroundColor: termsAccepted && privacyAccepted ? '#dcfce7' : '#fee2e2',
          borderRadius: '6px',
          fontSize: '13px',
          color: termsAccepted && privacyAccepted ? '#15803d' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>
            {termsAccepted && privacyAccepted ? '✓' : '!'}
          </span>
          <span>
            {termsAccepted && privacyAccepted 
              ? 'Both policies accepted - you can proceed' 
              : 'Please accept both Terms of Service and Privacy Policy'}
          </span>
        </div>
      </div>

      {/* ✅ FIXED: Sign Up button with light sky blue background */}
      <button
        onClick={handleNonGoogleSignUp}
        disabled={!termsAccepted || !privacyAccepted || isLoading}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '16px',
          backgroundColor: (!termsAccepted || !privacyAccepted) ? '#d1d5db' : isLoading ? '#9ca3af' : '#0ea5e9', // ✅ Light sky blue (#0ea5e9)
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: (!termsAccepted || !privacyAccepted || isLoading) ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: (!termsAccepted || !privacyAccepted || isLoading) ? 'none' : '0 2px 4px rgba(14, 165, 233, 0.2)'
        }}
        onMouseEnter={(e) => {
          if (termsAccepted && privacyAccepted && !isLoading) {
            e.currentTarget.style.backgroundColor = '#0284c7'; // Darker sky blue on hover
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(14, 165, 233, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (termsAccepted && privacyAccepted && !isLoading) {
            e.currentTarget.style.backgroundColor = '#0ea5e9';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(14, 165, 233, 0.2)';
          }
        }}
      >
        {isLoading ? 'Signing Up...' : 'Sign Up with Password'}
      </button>

      {/* Terms Modal */}
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
          zIndex: 1000
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
              <p style={{ marginBottom: '12px' }}>
                <strong>2. Use License:</strong> Permission is granted to temporarily download one copy of the materials (information or software) on our service for personal, non-commercial transitory viewing only.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>3. Disclaimer:</strong> The materials on our service are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
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

      {/* Privacy Modal */}
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
          zIndex: 1000
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
              <p style={{ marginBottom: '12px' }}>
                <strong>1. Information We Collect:</strong> We may collect information about you in a variety of ways. The information we may collect on the Site includes:
              </p>
              <ul style={{ marginLeft: '20px', marginBottom: '12px' }}>
                <li>Personal Data: Name, email address, and other personal information you voluntarily provide.</li>
                <li>Usage Data: Information about how you interact with our service.</li>
              </ul>
              <p style={{ marginBottom: '12px' }}>
                <strong>2. Use of Your Information:</strong> Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>3. Protection of Information:</strong> We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our Site.
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

      {/* ...existing code... */}
    </div>
  );
};

export default SignUp;