import React, { useState } from 'react';
import { Menu, X, User, UserPlus, Settings, LogOut } from 'lucide-react';

interface ContentTab {
  id: string;
  icon: string;
  label: string;
  count?: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface MobileHeaderProps {
  logoIcon: string;
  logoText: string;
  searchBar: React.ReactNode;
  dateFilter: React.ReactNode;
  contentTabs: ContentTab[];
  categories: Category[];
  activeTab: string;
  activeCategory: string;
  onTabChange: (tabId: string) => void;
  onCategoryChange: (categoryId: number) => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
  showAuth?: boolean;
  onPreferences?: () => void;  // NEW
  onSignOut?: () => void;      // NEW
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  logoIcon,
  logoText,
  searchBar,
  dateFilter,
  contentTabs,
  categories,
  activeTab,
  activeCategory,
  onTabChange,
  onCategoryChange,
  onSignIn,
  onSignUp,
  showAuth = true,
  onPreferences,
  onSignOut,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Force hide on desktop with inline style */}
      <style>{`
        .mobile-header-container {
          display: block;
        }
        @media (min-width: 768px) {
          .mobile-header-container {
            display: none !important;
          }
        }
        /* Remove all blue focus states */
        .mobile-header-container select:focus,
        .mobile-header-container input:focus,
        .mobile-header-container button:focus {
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important;
          border-color: #000000 !important;
        }
      `}</style>

      <div className="mobile-header-container">
        {/* First Row - Hamburger, Logo (Centered), Auth/Settings Buttons */}
        <div className="flex items-center justify-between px-3 py-3 bg-white border-b sticky top-0 z-30">
          {/* Hamburger Menu - Black Icon */}
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors"
            aria-label="Toggle menu"
            style={{ color: '#000000', outline: 'none' }}
          >
            <Menu size={20} strokeWidth={2} style={{ color: '#000000' }} />
          </div>

          {/* Logo - Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <span className="text-xl">{logoIcon}</span>
            <span className="text-base font-bold" style={{ color: '#000000' }}>{logoText}</span>
          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Show Preferences + Sign Out for authenticated users */}
            {onPreferences && onSignOut ? (
              <>
                <div
                  onClick={onPreferences}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Preferences"
                  style={{ color: '#000000', outline: 'none' }}
                >
                  <Settings size={18} strokeWidth={2} style={{ color: '#000000' }} />
                </div>
                <div
                  onClick={onSignOut}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Sign out"
                  style={{ color: '#000000', outline: 'none' }}
                >
                  <LogOut size={18} strokeWidth={2} style={{ color: '#000000' }} />
                </div>
              </>
            ) : (
              /* Show Sign In + Sign Up for non-authenticated users */
              showAuth && onSignIn && onSignUp && (
                <>
                  <div
                    onClick={onSignIn}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Sign in"
                    style={{ color: '#000000', outline: 'none' }}
                  >
                    <User size={18} strokeWidth={2} style={{ color: '#000000' }} />
                  </div>
                </>
              )
            )}
          </div>
        </div>

        {/* Second Row - Search Bar */}
        <div className="px-3 py-2 bg-white border-b">
          {searchBar}
        </div>

        {/* Third Row - Date and Category Filters */}
        <div className="px-3 py-2 bg-white border-b space-y-2">
          {/* Date Filter */}
          <div>{dateFilter}</div>
          
          {/* Category Filter Dropdown */}
          <select
            value={categories.find(cat => cat.name === activeCategory)?.id || ''}
            onChange={(e) => {
              const categoryId = Number(e.target.value);
              if (categoryId) {
                onCategoryChange(categoryId);
              }
            }}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm transition-colors"
            style={{ 
              color: '#000000',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#000000';
              e.target.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Slide-in Menu - Auto Height, Black & White */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <div 
              className="fixed top-0 left-0 w-72 bg-white shadow-lg z-50 overflow-y-auto"
              style={{
                height: 'auto',
                maxHeight: '100vh'
              }}
            >
              <div className="p-4">
                {/* Menu Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold" style={{ color: '#000000' }}>Menu</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ color: '#000000', outline: 'none' }}
                  >
                    <X size={22} strokeWidth={2} style={{ color: '#000000' }} />
                  </button>
                </div>

                {/* Content Types - Black & White */}
                <div className="mb-6">
                  <div className="space-y-1">
                    {contentTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors"
                        style={{
                          backgroundColor: activeTab === tab.id ? '#f3f4f6' : 'transparent',
                          color: '#000000',
                          fontWeight: activeTab === tab.id ? 600 : 400,
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== tab.id) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== tab.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{tab.icon}</span>
                          <span className="text-sm">{tab.label}</span>
                        </div>
                        {tab.count !== undefined && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: '#e5e7eb',
                              color: '#6b7280'
                            }}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sign In (when showAuth is false) */}
                {!showAuth && onSignIn && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        onSignIn();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                      style={{ color: '#000000', fontWeight: 500, backgroundColor: 'transparent', outline: 'none' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <User size={18} strokeWidth={2} style={{ color: '#000000' }} />
                      <span className="text-sm">Sign In</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
