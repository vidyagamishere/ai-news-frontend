import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { User, AuthState, LoginCredentials, SignupCredentials } from '../types/auth';
import { authService } from '../services/authService';
import apiService from '../services/api';
import DebugLogger from '../utils/debug';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<User>;
  upgradeSubscription: () => Promise<void>;
  isGmailDomain: (email: string) => boolean;
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
  const debug = new DebugLogger('AuthContext');
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  // Debug auth state changes with detailed tracking
  useEffect(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🔄 [${timestamp}] Auth state changed:`, {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      userId: authState.user?.id,
      userName: authState.user?.name,
      userEmail: authState.user?.email,
      loading: authState.loading,
      error: authState.error,
      onboardingCompleted: authState.user?.preferences?.onboarding_completed,
      stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });
  }, [authState]);

  const initializeAuth = async () => {
    debug.enter('initializeAuth');
    const startTime = Date.now();
    
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('authToken');
      const cachedUser = localStorage.getItem('cachedUser');
      
      debug.step('initializeAuth', 'checking_storage', { 
        hasToken: !!token, 
        hasCachedUser: !!cachedUser 
      });
      
      console.log('🔑 Auth initialization - Token found:', !!token, 'Cached user found:', !!cachedUser);
      
      if (token) {
        // If we have cached user data, use it immediately while validating in background
        if (cachedUser) {
          try {
            debug.step('initializeAuth', 'parsing_cached_user');
            const parsedUser = JSON.parse(cachedUser);
            console.log('📦 Using cached user data while validating...');
            
            debug.step('initializeAuth', 'setting_cached_auth_state', { 
              userEmail: parsedUser?.email,
              isAdmin: parsedUser?.is_admin 
            });
            
            // Only update auth state if it has actually changed
            setAuthState(prev => {
              const newState = {
                isAuthenticated: true,
                user: parsedUser,
                loading: false,
                error: null
              };
              
              const hasChanged = prev.isAuthenticated !== newState.isAuthenticated ||
                                prev.user?.id !== newState.user?.id ||
                                prev.loading !== newState.loading ||
                                prev.error !== newState.error;
              
              if (hasChanged) {
                console.log('🔄 Cached user: State changed, updating');
                return newState;
              } else {
                console.log('🔄 Cached user: State unchanged, keeping existing');
                return prev;
              }
            });
            
            // Validate token in background and update if needed
            authService.validateToken(token).then(validatedUser => {
              console.log('✅ Background token validation successful');
              localStorage.setItem('cachedUser', JSON.stringify(validatedUser));
              
              // Only update if user data has actually changed
              setAuthState(prev => {
                if (prev.user?.id !== validatedUser?.id) {
                  console.log('🔄 Background validation: User changed, updating');
                  return { ...prev, user: validatedUser };
                } else {
                  console.log('🔄 Background validation: User unchanged');
                  return prev;
                }
              });
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
        
        // Only update auth state if it has actually changed
        setAuthState(prev => {
          const newState = {
            isAuthenticated: true,
            user,
            loading: false,
            error: null
          };
          
          const hasChanged = prev.isAuthenticated !== newState.isAuthenticated ||
                            prev.user?.id !== newState.user?.id ||
                            prev.loading !== newState.loading ||
                            prev.error !== newState.error;
          
          if (hasChanged) {
            console.log('🔄 Auth initialization: State changed, updating');
            return newState;
          } else {
            console.log('🔄 Auth initialization: State unchanged, keeping existing');
            return prev;
          }
        });
      } else {
        console.log('ℹ️ No auth token - user visiting as guest');
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
    } finally {
      const executionTime = Date.now() - startTime;
      debug.exit('initializeAuth', { 
        isAuthenticated: authState.isAuthenticated,
        hasUser: !!authState.user 
      }, executionTime);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { user, access_token: token } = await authService.login(credentials);
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
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authService.signup(credentials);
      
      // Direct signup success - user is logged in
      if ('user' in response && 'access_token' in response) {
        const { user, access_token: token } = response;
        localStorage.setItem('authToken', token);
        localStorage.setItem('cachedUser', JSON.stringify(user));
        
        // For new users, clear onboarding completion to trigger new onboarding
        localStorage.removeItem('onboardingComplete');
        
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
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🔐 [${timestamp}] Google login started`);
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
      
      if (!response.access_token) {
        console.error('❌ No access_token in response:', response);
        throw new Error('No access_token returned from Google login API');
      }
      
      const { user, access_token: token } = response;
      const userWithPreferences = user as any;
      
      // Validate user object structure
      if (!user.name || !user.email) {
        console.error('❌ Invalid user data structure:', user);
        throw new Error(`Invalid user data: missing ${!user.name ? 'name' : 'email'}`);
      }
      
      console.log('✅ Google login successful - User data:', { name: user.name, email: user.email, id: user.id });
      
      // Use backend's isUserExist flag to determine onboarding flow (for logging purposes)
      const isExistingUser = (response as any).isUserExist === true;
      console.log('🔍 User existence check:', { isExistingUser });
      const hasCategories = userWithPreferences.preferences?.categories_selected && userWithPreferences.preferences.categories_selected.length > 0;
      const hasContentTypes = userWithPreferences.preferences?.content_types_selected && userWithPreferences.preferences.content_types_selected.length > 0;
      const hasCompletedOnboarding = userWithPreferences.preferences?.onboarding_completed === true;
      const isAdmin = userWithPreferences.is_admin === true;
      
      console.log('🔍 User onboarding check:', {
        isExistingUser: (response as any).isUserExist,
        hasCategories,
        hasContentTypes,
        hasCompletedOnboarding,
        isAdmin,
        categoriesCount: userWithPreferences.preferences?.categories_selected?.length || 0,
        contentTypesCount: userWithPreferences.preferences?.content_types_selected?.length || 0,
        userPreferences: userWithPreferences.preferences
      });
      
      // Additional detailed logging for Google login response
      console.log('🔍 GOOGLE LOGIN RESPONSE ANALYSIS:', {
        rawResponse: response,
        userFromResponse: response.user,
        userWithPreferences: userWithPreferences,
        preferencesFromUser: userWithPreferences.preferences,
        onboardingCompletedFromPrefs: userWithPreferences.preferences?.onboarding_completed,
        isUserExistFlag: (response as any).isUserExist
      });
      
      // Trust backend's onboarding determination completely
      const shouldSkipOnboarding = isAdmin || hasCompletedOnboarding;
      
      if (shouldSkipOnboarding) {
        console.log(isAdmin ? '✅ Admin user - skipping onboarding' : '✅ Backend determined onboarding complete - skipping');
        localStorage.setItem('onboardingComplete', 'true');
      } else {
        console.log('🔄 Backend determined onboarding needed - clearing completion flag');
        localStorage.removeItem('onboardingComplete');
      }
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('cachedUser', JSON.stringify(user));
      
      // Only update auth state if it has actually changed to prevent unnecessary re-renders
      setAuthState(prev => {
        const newState = {
          isAuthenticated: true,
          user: userWithPreferences,
          loading: false,
          error: null
        };
        
        // Check if the state has actually changed
        const hasChanged = prev.isAuthenticated !== newState.isAuthenticated ||
                          prev.user?.id !== newState.user?.id ||
                          prev.loading !== newState.loading ||
                          prev.error !== newState.error;
        
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        if (hasChanged) {
          console.log(`🔄 [${timestamp}] Google login: Auth state CHANGED, updating:`, {
            prevState: { isAuth: prev.isAuthenticated, userId: prev.user?.id, loading: prev.loading },
            newState: { isAuth: newState.isAuthenticated, userId: newState.user?.id, loading: newState.loading },
            changeReason: {
              authChanged: prev.isAuthenticated !== newState.isAuthenticated,
              userIdChanged: prev.user?.id !== newState.user?.id,
              loadingChanged: prev.loading !== newState.loading,
              errorChanged: prev.error !== newState.error
            }
          });
          return newState;
        } else {
          console.log(`🔄 [${timestamp}] Google login: Auth state UNCHANGED, keeping existing`);
          return prev;
        }
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Google sign in failed'
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('cachedUser');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });
    window.location.href = '/'; // Redirect to home page to see public content
  }, []);

  const updatePreferences = useCallback(async (preferences: Partial<User['preferences']>) => {
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
  }, [authState.user]);

  const upgradeSubscription = useCallback(async () => {
    if (!authState.user) throw new Error('User not authenticated');
    
    try {
      const updatedUser = await authService.upgradeSubscription();
      setAuthState(prev => ({ ...prev, user: updatedUser }));
    } catch (error) {
      throw error;
    }
  }, [authState.user]);

  const isGmailDomain = useCallback((email: string): boolean => {
    return email.toLowerCase().endsWith('@gmail.com') || email.toLowerCase().endsWith('@googlemail.com');
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🔧 [${timestamp}] AuthContext: Creating new value object (should be rare)`, {
      isAuthenticated: authState.isAuthenticated,
      userId: authState.user?.id,
      loading: authState.loading
    });
    
    return {
      ...authState,
      login,
      signup,
      googleLogin,
      logout,
      updatePreferences,
      upgradeSubscription,
      isGmailDomain
    };
  }, [
    authState.isAuthenticated,
    authState.user?.id, // Only track user ID, not entire user object
    authState.loading,
    authState.error,
    login,
    signup,
    googleLogin,
    logout,
    updatePreferences,
    upgradeSubscription,
    isGmailDomain
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};