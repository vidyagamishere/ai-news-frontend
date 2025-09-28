import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Archive from './pages/Archive';
import EmailVerification from './pages/EmailVerification';
import OTPVerification from './pages/OTPVerification';
import Preferences from './pages/Preferences';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Loading from './components/Loading';
import './App.css';
import './pages/legal.css';
import './pages/about.css';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loading message="Loading..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Auto-redirect authenticated users from auth pages to appropriate interface
const AuthRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return <Loading message="Loading..." />;
  }
  
  if (isAuthenticated) {
    // Debug: Log admin check in ProtectedRoute
    console.log('🔍 ProtectedRoute Admin Check:', {
      isAuthenticated,
      userEmail: user?.email,
      userIsAdmin: user?.is_admin,
      userObject: user
    });
    
    // Admin users go to admin interface
    if (user?.is_admin) {
      console.log('🔑 Authenticated admin user detected, redirecting to admin interface');
      return <Navigate to="/admin" replace />;
    }
    
    // Regular users go to dashboard (with onboarding check handled by HomeRoute)
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Home Route Component - shows Home for non-authenticated, Dashboard for authenticated
const HomeRoute: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return <Loading message="Loading..." />;
  }
  
  if (isAuthenticated) {
    // Debug: Log admin check in HomeRoute
    console.log('🔍 HomeRoute Admin Check:', {
      isAuthenticated,
      userEmail: user?.email,
      userIsAdmin: user?.is_admin,
      userObject: user
    });
    
    // Admin users go directly to admin interface
    if (user?.is_admin) {
      console.log('🔑 Admin user detected, redirecting to admin interface');
      return <Navigate to="/admin" replace />;
    }
    
    // Check if user has completed onboarding
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/onboarding" replace />;
    }
  }
  
  return <Home />;
};

function AppContent() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={<HomeRoute />} 
      />
      <Route 
        path="/auth" 
        element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        } 
      />
      <Route 
        path="/landing" 
        element={<Landing />} 
      />
      <Route 
        path="/signin" 
        element={<Navigate to="/auth" replace />}
      />
      <Route 
        path="/signup" 
        element={<Navigate to="/auth" replace />}
      />
      <Route 
        path="/verify-email" 
        element={<EmailVerification />}
      />
      <Route 
        path="/verify-otp" 
        element={<OTPVerification />}
      />
      <Route 
        path="/onboarding" 
        element={<Onboarding />}
      />
      <Route 
        path="/preferences" 
        element={
          <ProtectedRoute>
            <Preferences />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/archive" 
        element={
          <ProtectedRoute>
            <Archive />
          </ProtectedRoute>
        } 
      />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/about" element={<About />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route 
        path="/admin" 
        element={
          <ProtectedAdminRoute>
            <Admin />
          </ProtectedAdminRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;