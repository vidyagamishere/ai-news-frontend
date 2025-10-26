import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Preferences from './pages/Preferences';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Archive from './pages/Archive';
import EmailVerification from './pages/EmailVerification';
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
  const { isAuthenticated, loading, user } = useAuth();
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`🛡️ [${timestamp}] ProtectedRoute render:`, {
    isAuthenticated,
    loading,
    userId: user?.id,
    userEmail: user?.email,
    hasChildren: !!children,
    childrenType: typeof children === 'object' && children && 'type' in children 
      ? (children as any).type?.name || typeof children 
      : typeof children,
    stackTrace: new Error().stack?.split('\n').slice(1, 3).join('\n')
  });
  
  if (loading) {
    console.log(`🛡️ [${timestamp}] ProtectedRoute: Loading state, showing Loading component`);
    return <Loading message="Loading..." />;
  }
  
  if (!isAuthenticated) {
    console.log(`🛡️ [${timestamp}] ProtectedRoute: Not authenticated, redirecting to /auth`);
    return <Navigate to="/auth" replace />;
  }
  
  console.log(`🛡️ [${timestamp}] ProtectedRoute: Authenticated, rendering children`);
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

// Landing Route Component - shows Landing page for non-authenticated, Dashboard for authenticated
const LandingRoute: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return <Loading message="Loading..." />;
  }
  
  if (isAuthenticated) {
    // Debug: Log admin check in LandingRoute
    console.log('🔍 LandingRoute Admin Check:', {
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
  
  return <Landing />;
};

function AppContent() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={<LandingRoute />} 
      />
      <Route 
        path="/home" 
        element={<Home />} 
      />
      {/* Removed direct mobile route to prevent duplicate instances */}
      <Route 
        path="/auth" 
        element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        } 
      />
      <Route 
        path="/old-landing" 
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
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
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