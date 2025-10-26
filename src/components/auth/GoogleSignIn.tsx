import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface GoogleSignInProps {
  onSuccess: () => void;
}

declare global {
  interface Window {
    google: any;
    googleCallback: (response: any) => void;
  }
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess }) => {
  const { loading, googleLogin } = useAuth();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Don't render Google Sign-In if not configured
  if (!googleClientId) {
    return null;
  }

  useEffect(() => {
    // Load Google Identity Services script
    if (!window.google && googleClientId) {
      console.log('Loading Google Sign-In script...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        console.log('Google Sign-In script loaded');
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleGoogleResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
              use_fedcm_for_prompt: false,
              context: 'signin'
            });
            console.log('Google Sign-In initialized successfully');
          } catch (error) {
            console.error('Google Sign-In initialization error:', error);
          }
        }
      };
    } else if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
          context: 'signin'
        });
        console.log('Google Sign-In re-initialized successfully');
      } catch (error) {
        console.error('Google Sign-In initialization error (existing script):', error);
      }
    }
  }, [googleClientId]);

  const handleGoogleResponse = async (response: any) => {
    try {
      console.log('Google response received:', { 
        hasCredential: !!response.credential,
        credentialLength: response.credential?.length 
      });
      
      if (response.credential) {
        console.log('Attempting to authenticate with Google credential...');
        await googleLogin(response.credential);
        console.log('Google authentication successful');
        onSuccess();
      } else {
        console.error('No credential in Google response');
        alert('Google Sign In failed - no credentials received');
      }
    } catch (error: any) {
      console.error('Google Sign In error:', error);
      
      // Show user-friendly error messages
      if (error.message?.includes('not configured')) {
        alert('Google Sign In is not configured on this server. Please use email/password authentication.');
      } else if (error.message?.includes('Invalid Google client')) {
        alert('Google Sign In configuration error. Please contact support.');
      } else if (error.message?.includes('Email not verified')) {
        alert('Please verify your email with Google first, then try again.');
      } else {
        alert(`Google Sign In failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleClientId) {
      alert('Google Sign In not configured. Please use email/password for now.');
      return;
    }

    try {
      console.log('Google sign-in button clicked');
      console.log('Google API status:', {
        googleExists: !!window.google,
        accountsExists: !!window.google?.accounts,
        idExists: !!window.google?.accounts?.id
      });

      if (window.google?.accounts?.id) {
        console.log('Triggering Google Sign-In popup...');
        // Use renderButton for more reliable popup authentication
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'none';
        document.body.appendChild(buttonContainer);
        
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with'
        });
        
        // Programmatically click the hidden button to trigger popup
        setTimeout(() => {
          const googleButton = buttonContainer.querySelector('div[role="button"]');
          if (googleButton) {
            (googleButton as HTMLElement).click();
          } else {
            // Fallback to One Tap prompt
            console.log('Falling back to One Tap prompt...');
            window.google.accounts.id.prompt();
          }
          // Clean up
          document.body.removeChild(buttonContainer);
        }, 100);
      } else {
        console.error('Google Sign-In API not available');
        if (!window.google) {
          alert('Google Sign In is still loading. Please wait a moment and try again, or use email/password authentication.');
        } else {
          alert('Google Sign In is not properly configured. Please use email/password authentication.');
        }
      }
    } catch (error) {
      console.error('Google Sign In error:', error);
      alert('Google Sign In temporarily unavailable. Please use email/password authentication.');
    }
  };

  return (
    <div className="google-signin-container">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="google-signin-btn"
      >
        <svg 
          className="google-icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24"
        >
          <path 
            fill="#4285F4" 
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path 
            fill="#34A853" 
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path 
            fill="#FBBC05" 
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path 
            fill="#EA4335" 
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </button>
    </div>
  );
};

export default GoogleSignIn;