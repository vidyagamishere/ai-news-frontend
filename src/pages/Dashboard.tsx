import React, { useState, useEffect, lazy, Suspense } from 'react';
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
    if (user) {
      // For verified users, check onboarding status
      const hasCompletedOnboarding = user.preferences?.onboarding_completed === true;
      
      // Check if user has meaningful personalization data (actual topic/role selections)
      const hasPersonalizationData = (user.preferences?.topics?.length || 0) > 0 ||
                                     (user.preferences?.user_roles?.length || 0) > 0;
      
      // Show onboarding for users without personalization data OR if forced via URL parameter
      const needsOnboarding = forceOnboarding || (!hasCompletedOnboarding && !hasPersonalizationData);
      
      // Debug logging for onboarding decision
      console.log('🧪 Onboarding decision debug:', {
        forceOnboarding,
        hasCompletedOnboarding,
        hasPersonalizationData,
        needsOnboarding,
        onboarding_completed: user.preferences?.onboarding_completed,
        topics_length: user.preferences?.topics?.length,
        user_roles_length: user.preferences?.user_roles?.length
      });
      
      if (needsOnboarding) {
        console.log('✅ Setting showOnboarding to true');
        setShowOnboarding(true);
        return;
      } else {
        console.log('❌ Skipping onboarding - user has completed or has data');
        setShowOnboarding(false);
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      // Only show welcome for truly new users who haven't completed onboarding
      const isNewUser = new Date(user.createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      const hasCompletedOnboarding = user.preferences?.onboarding_completed === true;
      
      if (isNewUser && !showOnboarding && !hasCompletedOnboarding) {
        setShowWelcome(true);
      }
    }
  }, [user]);

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

  // Main dashboard - use the new MobileDashboard component
  return <MobileDashboard />;
};

export default Dashboard;