import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import MobileDashboard from '../components/MobileDashboard';

// Lazy load heavy components for onboarding
const ComprehensiveOnboarding = lazy(() => import('../components/onboarding/ComprehensiveOnboarding'));

const Dashboard: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Debug Dashboard component lifecycle with detailed tracking
  useEffect(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🏠 [${timestamp}] Dashboard component MOUNTED:`, {
      userId: user?.id,
      userEmail: user?.email,
      isAuthenticated,
      authLoading,
      onboardingCompleted: user?.preferences?.onboarding_completed,
      stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });
    return () => {
      const unmountTimestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.log(`🏠 [${unmountTimestamp}] Dashboard component UNMOUNTING`);
    };
  }, []);

  // Track when user or auth state changes
  useEffect(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🏠 [${timestamp}] Dashboard: User/Auth state changed:`, {
      userId: user?.id,
      userEmail: user?.email,
      isAuthenticated,
      authLoading,
      onboardingCompleted: user?.preferences?.onboarding_completed
    });
  }, [user?.id, isAuthenticated, authLoading]);
  
  // Check for force onboarding URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const forceOnboarding = urlParams.get('force-onboarding') === 'true';

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to home');
      navigate('/');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🏠 [${timestamp}] Dashboard: Onboarding logic triggered:`, {
      hasUser: !!user,
      hasPreferences: !!user?.preferences,
      onboardingCompleted: user?.preferences?.onboarding_completed,
      forceOnboarding,
      currentShowOnboarding: showOnboarding,
      currentShowWelcome: showWelcome
    });
    
    if (user && user.preferences) {
      // Trust backend's onboarding determination completely
      const hasCompletedOnboarding = user.preferences?.onboarding_completed === true;
      
      // Show onboarding only if backend determined it's needed OR if forced via URL parameter
      const needsOnboarding = forceOnboarding || !hasCompletedOnboarding;
      
      if (needsOnboarding) {
        console.log(`🔄 [${timestamp}] Dashboard: SHOWING onboarding (forceOnboarding: ${forceOnboarding}, hasCompleted: ${hasCompletedOnboarding})`);
        setShowOnboarding(true);
        setShowWelcome(false);
      } else {
        console.log(`✅ [${timestamp}] Dashboard: SHOWING dashboard (backend determined onboarding complete)`);
        setShowOnboarding(false);
        setShowWelcome(false);
      }
    } else {
      console.log(`⏳ [${timestamp}] Dashboard: Waiting for user data (user: ${!!user}, preferences: ${!!user?.preferences})`);
    }
  }, [user?.id, user?.preferences?.onboarding_completed, forceOnboarding]); // Use specific properties instead of entire user object

  // Show loading while authentication is being determined
  if (authLoading) {
    return <Loading message="Checking authentication..." />;
  }

  // If not authenticated, the useEffect will redirect to home
  if (!isAuthenticated) {
    return <Loading message="Loading..." />;
  }

  if (showOnboarding) {
    return (
      <div className="app onboarding-app">
        <Suspense fallback={<Loading message="Loading onboarding..." />}>
          <ComprehensiveOnboarding 
            onComplete={() => {
              setShowOnboarding(false);
              setShowWelcome(false);
              // Clear force-onboarding parameter from URL
              if (forceOnboarding) {
                const newUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, newUrl);
              }
            }}
          />
        </Suspense>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <div className="app">
        <div className="welcome-overlay">
          <div className="welcome-modal">
            <h2>Welcome to AI News Digest!</h2>
            <p>Let's customize your experience</p>
            <div className="welcome-actions">
              <button 
                onClick={() => {
                  setShowWelcome(false);
                  setShowOnboarding(true);
                }}
                className="btn btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Memoize the dashboard component to prevent unnecessary re-renders
  // Use stable key and add showOnboarding/showWelcome as dependencies to prevent incorrect memoization
  const dashboard = useMemo(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🏠 [${timestamp}] Dashboard: Creating MobileDashboard via useMemo`);
    return <MobileDashboard key="main-dashboard" />;
  }, [showOnboarding, showWelcome]); // Add state dependencies to ensure correct memoization

  // Main dashboard - use the new MobileDashboard component
  return dashboard;
};

export default Dashboard;