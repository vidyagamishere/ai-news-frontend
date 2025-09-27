import React from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { isAdminAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        Loading admin authentication...
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;