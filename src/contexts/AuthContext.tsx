import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState, LoginCredentials, SignupCredentials } from '../types/auth';
import { authService } from '../services/authService';
import apiService from '../services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<User>;
  upgradeSubscription: () => Promise<void>;
  sendOTP: (email: string, name?: string, authMode?: 'signin' | 'signup') => Promise<void>;
  verifyOTP: (email: string, otp: string, userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  // Debug auth state changes
  useEffect(() => {
    console.log('🔄 Auth state changed:', {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      userName: authState.user?.name,
      userEmail: authState.user?.email,
      loading: authState.loading
    });
  }, [authState]);

  const initializeAuth = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('authToken');
      const cachedUser = localStorage.getItem('cachedUser');
      console.log('🔑 Auth initialization - Token found:', !!token, 'Cached user found:', !!cachedUser);
      
      if (token) {
        // If we have cached user data, use it immediately while validating in background
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            console.log('📦 Using cached user data while validating...');
            setAuthState({
              isAuthenticated: true,
              user: parsedUser,
              loading: false,
              error: null
            });
            
            // Validate token in background and update if needed
            authService.validateToken(token).then(validatedUser => {
              console.log('✅ Background token validation successful');
              localStorage.setItem('cachedUser', JSON.stringify(validatedUser));
              setAuthState(prev => ({ ...prev, user: validatedUser }));
            }).catch(error => {
              console.warn('⚠️ Background token validation failed, keeping cached user:', error);
              // Only remove session if it's a 401 (unauthorized), keep for other errors
              if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
                console.log('🔄 Token expired, clearing session');
                localStorage.removeItem('authToken');
                localStorage.removeItem('cachedUser');
                setAuthState({
                  isAuthenticated: false,
                  user: null,
                  loading: false,
                  error: null
                });
              }
            });
            return;
          } catch (parseError) {
            console.warn('⚠️ Failed to parse cached user, validating token normally');
          }
        }
        
        // No cached user or parsing failed, validate token normally
        console.log('🚀 Validating token...');
        const user = await authService.validateToken(token);
        console.log('✅ Token valid - User authenticated:', { name: user.name, email: user.email });
        
        // Cache the user data
        localStorage.setItem('cachedUser', JSON.stringify(user));
        
        setAuthState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null
        });
      } else {
        console.log('❌ No token found in localStorage');
        localStorage.removeItem('cachedUser');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('cachedUser');
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { user, token } = await authService.login(credentials);
      localStorage.setItem('authToken', token);
      localStorage.setItem('cachedUser', JSON.stringify(user));
      
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authService.signup(credentials);
      
      // Check if response indicates OTP verification is required
      if ('emailVerificationRequired' in response && response.emailVerificationRequired) {
        setAuthState(prev => ({ ...prev, loading: false }));
        // Throw special error to trigger OTP flow in Auth component
        throw new Error('OTP_VERIFICATION_REQUIRED');
      }
      
      // Normal signup success - user is logged in
      if ('user' in response && 'token' in response) {
        const { user, token } = response;
        localStorage.setItem('authToken', token);
        localStorage.setItem('cachedUser', JSON.stringify(user));
        setAuthState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      }));
      throw error;
    }
  };

  const googleLogin = async (idToken: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Decode the Google ID token to extract user data for logging
      const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
      const tokenData = {
        email: tokenPayload.email,
        name: tokenPayload.name,
        picture: tokenPayload.picture,
        sub: tokenPayload.sub
      };
      
      console.log('🔐 Decoded Google token data:', tokenData);
      
      // Send the raw ID token to the backend (backend expects id_token)
      const response = await apiService.authenticateWithGoogle(idToken) as any;
      console.log('✅ Google login API response:', JSON.stringify(response, null, 2));
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from Google login API');
      }
      
      if (!response.user) {
        console.error('❌ Response structure:', response);
        throw new Error('No user data returned from Google login API');
      }
      
      if (!response.token) {
        console.error('❌ No token in response:', response);
        throw new Error('No token returned from Google login API');
      }
      
      const { user, token } = response;
      const userWithPreferences = user as any;
      
      // Validate user object structure
      if (!user.name || !user.email) {
        console.error('❌ Invalid user data structure:', user);
        throw new Error(`Invalid user data: missing ${!user.name ? 'name' : 'email'}`);
      }
      
      console.log('✅ Google login successful - User data:', { name: user.name, email: user.email, id: user.id });
      
      // Use backend's isUserExist flag to determine onboarding flow
      const isExistingUser = (response as any).isUserExist === true;
      const hasTopics = userWithPreferences.preferences?.topics && userWithPreferences.preferences.topics.length > 0;
      const hasCompletedOnboarding = userWithPreferences.preferences?.onboarding_completed === true;
      const isAdmin = userWithPreferences.is_admin === true;
      
      console.log('🔍 User onboarding check:', {
        isExistingUser: (response as any).isUserExist,
        hasTopics,
        hasCompletedOnboarding,
        isAdmin,
        topicsCount: userWithPreferences.preferences?.topics?.length || 0
      });
      
      // Admin users always skip onboarding, or existing users with topics and completed onboarding
      const shouldSkipOnboarding = isAdmin || (isExistingUser && hasTopics && hasCompletedOnboarding);
      
      if (shouldSkipOnboarding) {
        console.log(isAdmin ? '✅ Admin user - skipping onboarding' : '✅ Existing user with preferences - skipping onboarding');
        localStorage.setItem('onboardingComplete', 'true');
      } else {
        console.log('🔄 User needs onboarding - clearing completion flag');
        localStorage.removeItem('onboardingComplete');
      }
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('cachedUser', JSON.stringify(user));
      const newState = {
        isAuthenticated: true,
        user: userWithPreferences,
        loading: false,
        error: null
      } as any;
      console.log('🔄 Setting auth state after Google login:', newState);
      setAuthState(newState);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Google sign in failed'
      }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('cachedUser');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });
    window.location.href = '/'; // Redirect to home page to see public content
  };

  const updatePreferences = async (preferences: Partial<User['preferences']>) => {
    if (!authState.user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 AuthContext: Calling authService.updateUserPreferences with:', preferences);
      const updatedUser = await authService.updateUserPreferences(preferences);
      console.log('🔄 AuthContext: Received updated user:', updatedUser);
      
      if (!updatedUser) {
        console.warn('⚠️ AuthContext: No updated user returned, using current user with updated preferences');
        // If no user returned, manually update preferences on current user
        const preservedUser = {
          ...authState.user,
          preferences: {
            ...authState.user.preferences,
            ...preferences
          }
        };
        setAuthState(prev => ({ ...prev, user: preservedUser }));
        localStorage.setItem('cachedUser', JSON.stringify(preservedUser));
        return preservedUser;
      }
      
      // Preserve existing user data, especially name, if the backend doesn't return it properly
      console.log('🔍 AuthContext: Current user preferences:', authState.user.preferences);
      console.log('🔍 AuthContext: Updated user preferences:', updatedUser.preferences);
      console.log('🔍 AuthContext: Original preferences update:', preferences);
      
      const mergedPreferences = {
        ...authState.user.preferences, // Keep existing preferences
        ...updatedUser.preferences,    // Override with new preferences
        ...preferences                  // Force the original update to be included
      };
      
      console.log('🔍 AuthContext: Merged preferences:', mergedPreferences);
      
      const preservedUser = {
        ...authState.user, // Keep existing user data
        ...updatedUser,     // Override with updated data from backend
        name: updatedUser.name || authState.user.name, // Ensure name is preserved
        email: updatedUser.email || authState.user.email, // Ensure email is preserved
        preferences: mergedPreferences
      };
      
      console.log('🔄 AuthContext: Setting preserved user:', preservedUser);
      console.log('🔍 AuthContext: Final newsletter_subscribed:', preservedUser.preferences?.newsletter_subscribed);
      setAuthState(prev => ({ ...prev, user: preservedUser }));
      
      // Update cached user data
      localStorage.setItem('cachedUser', JSON.stringify(preservedUser));
      return preservedUser;
    } catch (error) {
      console.error('❌ AuthContext: updatePreferences failed:', error);
      throw error;
    }
  };

  const upgradeSubscription = async () => {
    if (!authState.user) throw new Error('User not authenticated');
    
    try {
      const updatedUser = await authService.upgradeSubscription();
      setAuthState(prev => ({ ...prev, user: updatedUser }));
    } catch (error) {
      throw error;
    }
  };

  const sendOTP = async (email: string, name?: string, authMode: 'signin' | 'signup' = 'signin') => {
    try {
      await authService.sendOTP(email, name, authMode);
    } catch (error) {
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string, userData: any) => {
    try {
      const response = await authService.verifyOTP(email, otp, userData) as any;
      const { user, token: authToken, isUserExist } = response;
      
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('cachedUser', JSON.stringify(user));
      
      // Set onboarding status based on whether user exists and has completed onboarding
      const hasCompletedOnboarding = user.preferences?.onboarding_completed === true;
      const isAdmin = user.is_admin === true;
      const shouldSkipOnboarding = isAdmin || (isUserExist && hasCompletedOnboarding);
      
      if (shouldSkipOnboarding) {
        console.log(isAdmin ? '✅ Admin user - skipping onboarding' : '✅ Existing user with completed onboarding - skipping onboarding');
        localStorage.setItem('onboardingComplete', 'true');
      } else {
        console.log('🔄 User needs onboarding - clearing completion flag');
        localStorage.removeItem('onboardingComplete');
      }
      
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'OTP verification failed'
      }));
      throw error;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    googleLogin,
    logout,
    updatePreferences,
    upgradeSubscription,
    sendOTP,
    verifyOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};