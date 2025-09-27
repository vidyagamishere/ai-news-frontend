import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Settings, Crown, Power, Archive } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import SubscriptionTiers from './subscription/SubscriptionTiers';

interface HeaderProps {
  onRefresh: () => void;
  onManualScrape: () => void;
  isLoading: boolean;
  lastUpdated?: string;
  showAuthButtons?: boolean;
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showAuthButtons = false, onSignInClick, onSignUpClick }) => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, user, logout } = useAuth();
  const { isAdminAuthenticated, adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  // Determine which user and auth state to use
  const effectiveUser = isAdminAuthenticated ? adminUser : user;
  const isEffectivelyAuthenticated = isAuthenticated || isAdminAuthenticated;
  const effectiveLogout = isAdminAuthenticated ? adminLogout : logout;

  // Debug logging for authentication issues
  useEffect(() => {
    console.log('Header Auth Debug:', {
      isAuthenticated,
      isAdminAuthenticated,
      isEffectivelyAuthenticated,
      user: user ? { name: user.name, email: user.email, subscriptionTier: user.subscriptionTier } : null,
      effectiveUser: effectiveUser ? { name: effectiveUser.name, email: effectiveUser.email, subscriptionTier: effectiveUser.subscriptionTier } : null,
      authToken: localStorage.getItem('authToken') ? 'exists' : 'missing',
      adminAuth: localStorage.getItem('adminAuth') ? 'exists' : 'missing'
    });
  }, [isAuthenticated, isAdminAuthenticated, user, effectiveUser]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleLogout = () => {
    effectiveLogout();
    setShowUserMenu(false);
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <>
      <header className="header modern-header">
        <div className="header-content">
          {/* Desktop Layout - Redesigned */}
          <div className="desktop-layout desktop-only">
            {/* Top Row: Title and User Section */}
            <div className="desktop-header-row">
              <div className="desktop-title-section">
                <h1 className="title ai-title">
                  <Brain className="title-icon" />
                  Vidyagam
                </h1>
              </div>
              <div className="desktop-user-section">
                {isEffectivelyAuthenticated && effectiveUser ? (
                  <div className="desktop-user-greeting">
                    <p className="user-greeting-text">Hello, {effectiveUser.name || 'User'}</p>
                  </div>
                ) : (
                  <div className="auth-buttons">
                    {showAuthButtons ? (
                      <>
                        <button onClick={onSignInClick || handleSignIn} className="btn btn-ghost">
                          Sign In
                        </button>
                        <button onClick={onSignUpClick} className="btn-header-signup">
                          Sign Up Free
                        </button>
                      </>
                    ) : (
                      <button onClick={handleSignIn} className="btn btn-primary">
                        Sign In
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Middle Row: Subtitle */}
            <div className="desktop-subtitle-row">
              <p className="subtitle">Intelligence at Light Speed</p>
            </div>
            
            {/* Bottom Row: Social Media and Actions */}
            <div className="desktop-actions-row">
              <div className="desktop-social-links">
                <a href="https://www.linkedin.com/in/vidyagam-learning-063610382/" target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://facebook.com/vidyagam" target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@vidyagam" target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="https://open.spotify.com/show/vidyagam" target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
                <a href="https://x.com/vidyagam" target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
              
              <div className="desktop-user-actions">
                {isEffectivelyAuthenticated && effectiveUser && (
                  <>
                    {effectiveUser.subscriptionTier === 'premium' && (
                      <div className="desktop-action-item">
                        <div className="desktop-action-icon premium-action">
                          <Crown size={16} />
                        </div>
                        <span className="desktop-action-label">Premium</span>
                      </div>
                    )}
                    {isAdminAuthenticated && (
                      <div className="desktop-action-item">
                        <button 
                          onClick={() => navigate('/admin')}
                          className="desktop-action-icon admin-action"
                          title="Admin Panel"
                          style={{ background: '#667eea', color: 'white' }}
                        >
                          <Settings size={16} />
                        </button>
                        <span className="desktop-action-label">Admin</span>
                      </div>
                    )}
                    <div className="desktop-action-item">
                      <button 
                        onClick={() => navigate('/archive')}
                        className="desktop-action-icon archive-action"
                        title="Archive"
                      >
                        <Archive size={16} />
                      </button>
                      <span className="desktop-action-label">Archive</span>
                    </div>
                    <div className="desktop-action-item">
                      <button 
                        onClick={() => navigate('/preferences')}
                        className="desktop-action-icon settings-action"
                        title="Settings"
                      >
                        <Settings size={16} />
                      </button>
                      <span className="desktop-action-label">Settings</span>
                    </div>
                    <div className="desktop-action-item">
                      <button 
                        onClick={handleLogout}
                        className="desktop-action-icon logout-action"
                        title="Sign Out"
                      >
                        <Power size={16} />
                      </button>
                      <span className="desktop-action-label">Sign Out</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Layout - Completely Redesigned */}
          <div className="mobile-layout mobile-only">
            {/* Top Row: Title */}
            <div className="mobile-title-row">
              <h1 className="title ai-title mobile-title">
                <Brain className="title-icon mobile-title-icon" />
                Vidyagam
              </h1>
            </div>
            
            {/* Middle Row: Subtitle and User Greeting */}
            <div className="mobile-middle-row">
              <div className="mobile-subtitle-container">
                <p className="subtitle mobile-subtitle">Intelligence at Light Speed</p>
              </div>
              <div className="mobile-user-section">
                {isAuthenticated && user && (
                  <div className="mobile-user-greeting">
                    <p className="mobile-greeting-text">Hello, {user.name || 'User'}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom Row: Social Media and Actions */}
            <div className="mobile-bottom-row">
              <div className="mobile-social-links">
                <a href="https://www.linkedin.com/in/vidyagam-learning-063610382/" target="_blank" rel="noopener noreferrer" className="mobile-social-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://facebook.com/vidyagam" target="_blank" rel="noopener noreferrer" className="mobile-social-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@vidyagam" target="_blank" rel="noopener noreferrer" className="mobile-social-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="https://open.spotify.com/show/vidyagam" target="_blank" rel="noopener noreferrer" className="mobile-social-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
                <a href="https://x.com/vidyagam" target="_blank" rel="noopener noreferrer" className="mobile-social-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
              
              <div className="mobile-actions">
                {isEffectivelyAuthenticated && effectiveUser ? (
                  <div className="mobile-user-actions">
                    {effectiveUser.subscriptionTier === 'premium' && (
                      <div className="mobile-action-item">
                        <div className="mobile-action-icon premium-action">
                          <Crown size={12} />
                        </div>
                        <span className="mobile-action-label">Premium</span>
                      </div>
                    )}
                    {isAdminAuthenticated && (
                      <div className="mobile-action-item">
                        <button 
                          onClick={() => navigate('/admin')}
                          className="mobile-action-icon admin-action"
                          title="Admin Panel"
                          style={{ background: '#667eea', color: 'white' }}
                        >
                          <Settings size={12} />
                        </button>
                        <span className="mobile-action-label">Admin</span>
                      </div>
                    )}
                    <div className="mobile-action-item">
                      <button 
                        onClick={() => navigate('/archive')}
                        className="mobile-action-icon archive-action"
                        title="Archive"
                      >
                        <Archive size={12} />
                      </button>
                      <span className="mobile-action-label">Archive</span>
                    </div>
                    <div className="mobile-action-item">
                      <button 
                        onClick={() => navigate('/preferences')}
                        className="mobile-action-icon settings-action"
                        title="Settings"
                      >
                        <Settings size={12} />
                      </button>
                      <span className="mobile-action-label">Settings</span>
                    </div>
                    <div className="mobile-action-item">
                      <button 
                        onClick={handleLogout}
                        className="mobile-action-icon logout-action"
                        title="Sign Out"
                      >
                        <Power size={12} />
                      </button>
                      <span className="mobile-action-label">Sign Out</span>
                    </div>
                  </div>
                ) : (
                  <div className="mobile-auth-buttons">
                    {showAuthButtons ? (
                      <>
                        <button onClick={onSignInClick || handleSignIn} className="btn btn-ghost mobile-auth-btn">
                          Sign In
                        </button>
                        <button onClick={onSignUpClick} className="btn btn-primary mobile-auth-btn">
                          Sign Up
                        </button>
                      </>
                    ) : (
                      <button onClick={handleSignIn} className="btn btn-primary mobile-signin-btn">
                        Sign In
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      {showSubscriptionModal && (
        <SubscriptionTiers
          onClose={() => setShowSubscriptionModal(false)}
          showOnlyUpgrade={true}
        />
      )}
    </>
  );
};

export default Header;