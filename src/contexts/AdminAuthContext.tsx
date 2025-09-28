import React, { createContext, useContext, useState, useEffect } from 'react';
import DebugLogger from '../utils/debug';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminApiKey: string | null;
  adminUser: any | null;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Admin credentials (in production, these should be environment variables)
const ADMIN_CREDENTIALS = {
  username: 'admin@vidyagam.com',
  password: 'Vidyagam@Success', // Updated to match UI display
  apiKey: import.meta.env.VITE_ADMIN_API_KEY || 'admin-api-key-2024'
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const debug = new DebugLogger('AdminAuthContext');
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminApiKey, setAdminApiKey] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in (stored in localStorage)
    const savedAuth = localStorage.getItem('adminAuth');
    const savedUser = localStorage.getItem('adminUser');
    
    if (savedAuth && savedUser) {
      try {
        const { isAuthenticated, apiKey, timestamp } = JSON.parse(savedAuth);
        const user = JSON.parse(savedUser);
        
        // Check if authentication is still valid (24 hours)
        const isValid = Date.now() - timestamp < 24 * 60 * 60 * 1000;
        
        if (isAuthenticated && isValid && apiKey) {
          setIsAdminAuthenticated(true);
          setAdminApiKey(apiKey);
          setAdminUser(user);
        } else {
          // Clear expired auth
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminUser');
        }
      } catch (error) {
        console.error('Error parsing admin auth:', error);
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    debug.enter('adminLogin', { username, password: '[REDACTED]' });
    const startTime = Date.now();
    
    setIsLoading(true);
    
    try {
      debug.step('adminLogin', 'checking_credentials', { 
        providedUsername: username,
        expectedUsername: ADMIN_CREDENTIALS.username,
        passwordMatch: password === ADMIN_CREDENTIALS.password
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check credentials (support both email and old username format)
      if ((username === ADMIN_CREDENTIALS.username || username === 'admin') && 
          password === ADMIN_CREDENTIALS.password) {
        
        debug.step('adminLogin', 'credentials_valid', { success: true });
        
        // Create admin user object
        const adminUserData = {
          id: 'admin-user',
          email: 'admin@vidyagam.com',
          name: 'Admin User',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          preferences: {
            onboardingCompleted: true,
            topics: []
          },
          subscriptionTier: 'premium' as const
        };

        const authData = {
          isAuthenticated: true,
          apiKey: ADMIN_CREDENTIALS.apiKey,
          timestamp: Date.now()
        };
        
        // Save to localStorage
        localStorage.setItem('adminAuth', JSON.stringify(authData));
        localStorage.setItem('adminUser', JSON.stringify(adminUserData));
        
        setIsAdminAuthenticated(true);
        setAdminApiKey(ADMIN_CREDENTIALS.apiKey);
        setAdminUser(adminUserData);
        setIsLoading(false);
        
        const executionTime = Date.now() - startTime;
        debug.exit('adminLogin', { success: true, adminUser: adminUserData.email }, executionTime);
        return true;
      } else {
        debug.step('adminLogin', 'credentials_invalid', { 
          usernameMatch: (username === ADMIN_CREDENTIALS.username || username === 'admin'),
          passwordMatch: password === ADMIN_CREDENTIALS.password
        });
        
        setIsLoading(false);
        const executionTime = Date.now() - startTime;
        debug.exit('adminLogin', { success: false, reason: 'invalid_credentials' }, executionTime);
        return false;
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      debug.error('adminLogin', error, executionTime);
      
      console.error('Admin login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUser');
    setIsAdminAuthenticated(false);
    setAdminApiKey(null);
    setAdminUser(null);
    // Redirect to admin login
    window.location.href = '/admin/login';
  };

  const value = {
    isAdminAuthenticated,
    adminApiKey,
    adminUser,
    adminLogin,
    adminLogout,
    isLoading
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;