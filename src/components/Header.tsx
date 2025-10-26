import React, { useState, useEffect } from 'react';
import { Menu, Search, X, Settings, LogOut, BookmarkIcon, User, Home, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  console.log('Header Auth Debug:', { user, hasUser: !!user });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => document.body.classList.remove('menu-open');
  }, [isMenuOpen]);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('🔍 Searching for:', searchQuery);
      setIsSearchOpen(false);
    }
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: BookmarkIcon,
      label: 'My Categories',
      path: '/categories',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Settings,
      label: 'Preferences',
      path: '/preferences',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      icon: User,
      label: 'Profile',
      path: '/profile',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/notifications',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <>
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg' 
            : 'bg-white shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          {/* Left: Hamburger Menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X size={24} className="text-gray-700" />
            ) : (
              <Menu size={24} className="text-gray-700 group-hover:text-blue-600 transition-colors" />
            )}
          </button>

          {/* Center: Logo/Brand */}
          <div 
            className="flex-1 text-center cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              ✨ AI News Hub
            </h1>
          </div>

          {/* Right: Search Icon */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group relative"
            aria-label="Search"
          >
            <Search size={24} className="text-gray-700 group-hover:text-purple-600 transition-colors" />
            {!isSearchOpen && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Search Bar (Expandable) */}
        {isSearchOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 animate-slideDown">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AI news, research papers, tutorials..."
                className="w-full px-4 py-3 pl-12 pr-4 rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-gradient-to-r from-blue-50/30 to-purple-50/30"
                autoFocus
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" size={20} />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </form>
          </div>
        )}
      </header>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-80 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="relative p-6 pb-8 border-b border-gray-200/50 bg-gradient-to-br from-blue-600 to-purple-600">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
            
            <div className="flex items-center gap-4 mt-2">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-16 h-16 rounded-full border-4 border-white/30 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-pink-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white/30 shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-white text-lg">{user?.name || 'User'}</p>
                <p className="text-sm text-white/80 truncate">{user?.email}</p>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-xs font-medium text-white">
                    {user?.subscriptionTier === 'premium' ? '⭐ Premium' : '🆓 Free'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 text-left group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transform scale-105'
                        : 'hover:bg-white/60 hover:shadow-md hover:transform hover:scale-105'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : item.bgColor} transition-colors`}>
                      <Icon 
                        size={20} 
                        className={isActive ? 'text-white' : item.color}
                      />
                    </div>
                    <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stats Section */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Activity</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Articles Read</span>
                  <span className="text-sm font-bold text-blue-600">127</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Bookmarks</span>
                  <span className="text-sm font-bold text-purple-600">34</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Streak</span>
                  <span className="text-sm font-bold text-green-600">🔥 7 days</span>
                </div>
              </div>
            </div>
          </nav>

          {/* Menu Footer */}
          <div className="p-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all duration-300 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;