import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ComprehensiveOnboarding from '../components/onboarding/ComprehensiveOnboarding';
import Loading from '../components/Loading';
import './onboarding.css';


const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if user is not authenticated
    if (!user) {
      navigate('/auth');
      return;
    }

    // Debug: Admin check in onboarding
    console.log('🧪 Onboarding decision debug:', {
      userEmail: user.email,
      isAdmin: user.is_admin,
      userObject: user
    });

    // Redirect admin users to admin interface
    if (user.is_admin) {
      console.log('✅ Admin user detected in onboarding, redirecting to admin interface');
      navigate('/admin');
      return;
    }

    // Check if user has already completed onboarding
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      console.log('✅ User has completed onboarding, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    console.log('✅ Setting showOnboarding to true');
  }, [user, navigate]);

  const handleComplete = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return <Loading message="Loading..." />;
  }

  return (
    <div className="onboarding-page">
      <ComprehensiveOnboarding 
        onComplete={handleComplete}
      />
    </div>
  );
};

export default Onboarding;