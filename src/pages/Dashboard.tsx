import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import CompleteMobileDashboard from '../components/CompleteMobileDashboard';
import NewDashboard from '../newcomponents/Dashboard';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  console.log('🔍 Dashboard render:', { 
    authLoading, 
    isAuthenticated, 
    hasUser: !!user,
    userId: user?.id,
    onboarding_completed: user?.preferences?.onboarding_completed 
  });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('🏠 User not authenticated, redirecting to home');
      navigate('/');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Check if user needs onboarding (first-time users - both Google and non-Google)
  useEffect(() => {
    console.log('🎯 Dashboard onboarding useEffect triggered:', {
      authLoading,
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id
    });
    
    if (!authLoading && isAuthenticated && user) {
      // Check if onboarding is completed
      const onboardingCompleted = user.preferences?.onboarding_completed;
      const localOnboardingComplete = localStorage.getItem('onboardingComplete');
      const isGoogleUser = (user as any).is_google;
      
      console.log('🎯 Dashboard onboarding check:', {
        user_onboarding_completed: onboardingCompleted,
        local_onboarding_complete: localOnboardingComplete,
        user_email: user.email,
        is_google_user: isGoogleUser,
        user_preferences: user.preferences
      });
      
      // Redirect to onboarding for ALL first-time users (Google and non-Google)
      // who haven't completed onboarding yet
      if (!onboardingCompleted && !localOnboardingComplete) {
        console.log('🚀 First-time user needs onboarding, redirecting to preferences');
        navigate('/onboarding');
        return;
      }
      
      // Users who have completed onboarding go directly to dashboard
      console.log('📱 Returning user detected, staying on dashboard');
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  // Show loading while authentication is being determined
  if (authLoading) {
    return <Loading message="Checking authentication..." />;
  }

  // If not authenticated, the useEffect will redirect to home
  if (!isAuthenticated) {
    return <Loading message="Loading..." />;
  }

  // Check onboarding status before rendering dashboard
  console.log('🔒 Synchronous onboarding check before render:', {
    hasUser: !!user,
    onboarding_completed: user?.preferences?.onboarding_completed,
    localStorage: localStorage.getItem('onboardingComplete')
  });
  
  if (user) {
    const onboardingCompleted = user.preferences?.onboarding_completed;
    const localOnboardingComplete = localStorage.getItem('onboardingComplete');
    
    if (!onboardingCompleted && !localOnboardingComplete) {
      console.log('🛑 Blocking dashboard render - onboarding incomplete');
      // User needs onboarding, show loading while redirect happens
      return <Loading message="Setting up your experience..." />;
    }
  }

  // Main dashboard - use the complete mobile dashboard component
  return <NewDashboard />;
};

export default Dashboard;