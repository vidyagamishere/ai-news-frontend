import React, { useState, useEffect, useCallback, useRef } from 'react';
import { List, Grid, TrendingUp, BookOpen, Mic, Video, Menu, X, Home, ChevronRight, LogIn, UserCircle, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeviceType } from '../hooks/useDeviceType';
import Loading from '../components/Loading';
import { 
  apiService, 
  getArticleSource,
  getArticleSummary,
  getArticlePublishedDate,
  normalizeArticle
} from '../services/api';

import type { Article } from '../services/api';

interface LandingCategory {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  priority?: number;
  content?: {
    blogs: any[];
    podcasts: any[];
    videos: any[];
  };
}

interface MenuItem {
  id: number | null;
  name: string;
  description: string;
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop, type, width } = useDeviceType();
  
  // ==================== STATE ====================
  const [viewMode, setViewMode] = useState<'swipe' | 'list'>('swipe');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>('blogs');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [breakingNews, setBreakingNews] = useState<any[]>([]);
  const [categories, setCategories] = useState<LandingCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [contentCounts, setContentCounts] = useState<{
    blogs: number;
    podcasts: number;
    videos: number;
    total: number;
  } | null>(null);
  
  const [categoryWiseCounts, setCategoryWiseCounts] = useState<{
    category_id: number;
    category_name: string;
    blogs: number;
    podcasts: number;
    videos: number;
    total: number;
  }[]>([]);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    console.log('📱 Device Info:', {
      type,
      isMobile,
      isTablet,
      isDesktop,
      width,
    });
  }, [type, isMobile, isTablet, isDesktop, width]);

  const navigateToAuth = (mode: 'signin' | 'signup') => {
    navigate(`/auth?mode=${mode}`);
  };

  // ==================== HELPER FUNCTIONS ====================
  const handleCategoryChange = (categoryId: number | null) => {
    console.log('Category changed to:', categoryId);
    setSelectedCategory(categoryId);
    setCurrentIndex(0);
    setPage(1);
    setArticles([]);
    setHasMore(true);
    loadPaginatedArticles(1, true, categoryId);
  };

  const handleContentTypeChange = (contentType: string) => {
    console.log('Content type changed to:', contentType);
    setSelectedContentType(contentType);
    setCurrentIndex(0);
  };

  const handleArticleClick = (article: any, event: React.MouseEvent) => {
    event.preventDefault();
    console.log('Article clicked:', article);

    const url = article.url || article.link || article.article_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('No URL found for article:', article);
    }
  };

  const handleSwipeLeft = () => {
    if (currentIndex < articles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (hasMore) {
      loadPaginatedArticles(page + 1, false);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // ==================== DATA LOADING ====================
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      console.log('📡 Fetching initial landing data...');
      setInitialLoading(true);

      const [breakingResponse, landingResponse, countsResponse] = await Promise.all([
        apiService.getBreakingNewsAlerts(10),
        apiService.getLandingContent(),
        apiService.getContentCounts('all')
      ]);

      if (breakingResponse && Array.isArray(breakingResponse)) {
        setBreakingNews(breakingResponse.slice(0, 5));
        console.log('✅ Breaking news loaded:', breakingResponse.length);
      }

      if (landingResponse?.categories) {
        setCategories(landingResponse.categories);
        
        const categoryMenus: MenuItem[] = landingResponse.categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || ''
        }));
        
        setMenuItems([
          { id: null, name: 'All', description: 'All Categories' },
          ...categoryMenus
        ]);

        const catCounts = landingResponse.categories.map((cat: any) => ({
          category_id: cat.id,
          category_name: cat.name,
          blogs: cat.content?.blogs?.length || 0,
          podcasts: cat.content?.podcasts?.length || 0,
          videos: cat.content?.videos?.length || 0,
          total: (cat.content?.blogs?.length || 0) + 
                 (cat.content?.podcasts?.length || 0) + 
                 (cat.content?.videos?.length || 0)
        }));
        setCategoryWiseCounts(catCounts);
        
        console.log('✅ Categories loaded:', landingResponse.categories.length);
      }

      if (countsResponse) {
        setContentCounts(countsResponse);
        console.log('✅ Content counts loaded:', countsResponse);
      }

      await loadPaginatedArticles(1, true);

    } catch (error) {
      console.error('❌ Initial data load failed:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadPaginatedArticles = async (
    pageNum: number, 
    isInitial: boolean = false,
    categoryId: number | null = selectedCategory
  ) => {
    if (loading) return;

    try {
      setLoading(true);
      console.log(`📡 Loading articles page ${pageNum}...`);

      // ✅ FIXED: Use getPaginatedContent with correct parameters
      const response = await apiService.getPaginatedContent({
        page: pageNum,
        page_size: 10,  // ✅ Changed from 'limit' to 'page_size'
        category_id: categoryId || undefined
      });

      // ✅ FIXED: Use 'items' instead of 'articles'
      if (response?.items && Array.isArray(response.items)) {
        const newArticles = response.items.map(item => normalizeArticle(item));
        
        if (isInitial) {
          setArticles(newArticles);
        } else {
          setArticles(prev => [...prev, ...newArticles]);
        }

        setPage(pageNum);
        // ✅ FIXED: Use meta.has_next instead of has_more
        setHasMore(response.meta?.has_next || false);
        
        // ✅ FIXED: Use meta.total_pages instead of total_pages
        console.log(`✅ Loaded ${newArticles.length} articles (page ${pageNum}/${response.meta?.total_pages || '?'})`);
      } else {
        setHasMore(false);
        console.warn('⚠️ No articles in response');
      }
    } catch (error) {
      console.error('❌ Failed to load articles:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER: HEADER ====================
  const renderHeader = () => (
    <header className="landing-header bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          
          {!isDesktop && (
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          )}

          <div className="flex items-center flex-1 justify-center lg:justify-start lg:flex-initial">
            <button 
              onClick={() => {
                setSelectedCategory(null);
                setSelectedContentType('blogs');
                setCurrentIndex(0);
              }}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
              aria-label="Go to home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight leading-none">
                  Vidyagam
                </h1>
                {isDesktop && (
                  <span className="text-xs text-gray-500 font-normal mt-0.5">
                    AI Intelligence, Simplified
                  </span>
                )}
              </div>
            </button>
          </div>

          {isDesktop && (
            <nav className="flex items-center gap-6 mr-6">
              <button 
                onClick={() => {
                  setSelectedCategory(null);
                  setIsMenuOpen(false);
                }}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                All Content
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                Categories
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {!isMobile && (
              <button 
                onClick={() => navigateToAuth('signin')}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="Sign In"
              >
                Sign In
              </button>
            )}
            
            <button 
              onClick={() => navigateToAuth('signup')}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              aria-label="Get Started"
            >
              <span>{isMobile ? 'Start' : 'Get Started'}</span>
              <svg className="w-4 h-4 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </header>
  );

  // ==================== RENDER: BREAKING NEWS ====================
  const renderBreakingNews = () => {
    if (breakingNews.length === 0) return null;

    return (
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-2.5 sm:py-3 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">
              Breaking
            </span>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap inline-block">
              {breakingNews.map((item, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleArticleClick(item, e)}
                  className="inline-block mx-6 sm:mx-8 hover:underline text-sm sm:text-base font-medium cursor-pointer bg-transparent border-none transition-opacity hover:opacity-80"
                  type="button"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER: HAMBURGER MENU ====================
  const renderHamburgerMenu = () => {
    if (!isMenuOpen || isDesktop) return null;

    return (
      <>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />

        <div 
          className={`fixed left-0 top-0 bottom-0 ${
            isMobile ? 'w-full' : 'w-80'
          } bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out`}
          style={{
            transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)'
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-64px)]">
            <nav className="p-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleCategoryChange(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedCategory === item.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    {selectedCategory === item.id && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </>
    );
  };

  // ==================== RENDER: DESKTOP DROPDOWN ====================
  const renderDesktopCategoriesDropdown = () => {
    if (!isMenuOpen || !isDesktop) return null;

    return (
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 p-6">
        <button
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <h3 className="text-xl font-semibold text-gray-900 mb-6">Browse by Category</h3>

        <div className={`grid gap-4 ${
          width >= 1280 ? 'grid-cols-4' : 'grid-cols-3'
        }`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                handleCategoryChange(item.id);
                setIsMenuOpen(false);
              }}
              className={`group p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                selectedCategory === item.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className={`text-base font-semibold mb-1 ${
                  selectedCategory === item.id ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  {item.name}
                </span>
                {item.description && (
                  <span className="text-sm text-gray-500 line-clamp-2">
                    {item.description}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ==================== RENDER: HORIZONTAL MENU ====================
  const renderHorizontalMenu = () => (
    <div className="bg-white border-b border-gray-200 sticky top-14 sm:top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-3 scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleCategoryChange(item.id)}
              className={`
                flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0
                ${selectedCategory === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
            >
              {item.id === null && <Home className="w-4 h-4" />}
              <span>{item.name}</span>
              {selectedCategory === item.id && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ==================== RENDER: CONTENT COUNTS ====================
  const renderContentCounts = () => {
    if (!contentCounts) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Blogs', count: contentCounts.blogs, icon: BookOpen, color: 'from-blue-500 to-blue-600' },
              { label: 'Podcasts', count: contentCounts.podcasts, icon: Mic, color: 'from-purple-500 to-purple-600' },
              { label: 'Videos', count: contentCounts.videos, icon: Video, color: 'from-pink-500 to-pink-600' },
              { label: 'Total', count: contentCounts.total, icon: TrendingUp, color: 'from-green-500 to-green-600' },
            ].map(({ label, count, icon: Icon, color }) => (
              <button
                key={label}
                onClick={() => handleContentTypeChange(label.toLowerCase())}
                className={`
                  p-4 sm:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer
                  ${selectedContentType === label.toLowerCase() ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{(count ?? 0).toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER: SWIPE VIEW ====================
  const renderSwipeView = () => {
    if (articles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles yet</h3>
          <p className="text-gray-600 text-center max-w-md">
            We're working on bringing you the latest AI news. Check back soon!
          </p>
        </div>
      );
    }

    const currentArticle = articles[currentIndex];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div 
              ref={swipeContainerRef}
              className="bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-all hover:scale-[1.02] hover:shadow-2xl"
              onClick={(e) => handleArticleClick(currentArticle, e)}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {selectedContentType.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {getArticlePublishedDate(currentArticle)}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {currentArticle.title}
                </h2>

                <div className="prose prose-lg max-w-none text-gray-700 mb-6">
                  {getArticleSummary(currentArticle)}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">{getArticleSource(currentArticle)}</span>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                    Read More
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handleSwipeRight}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="text-sm font-medium text-gray-600">
                {currentIndex + 1} / {articles.length}
              </div>

              <button
                onClick={handleSwipeLeft}
                disabled={!hasMore && currentIndex === articles.length - 1}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Next</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="lg:w-80 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">View Mode</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('swipe')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'swipe' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Swipe</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER: LIST VIEW ====================
  const renderListView = () => {
    if (articles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles yet</h3>
          <p className="text-gray-600 text-center max-w-md">
            We're working on bringing you the latest AI news. Check back soon!
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
          <button
            onClick={() => setViewMode('swipe')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Grid className="w-4 h-4" />
            <span>Swipe View</span>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, idx) => (
            <div
              key={idx}
              onClick={(e) => handleArticleClick(article, e)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {selectedContentType.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getArticlePublishedDate(article)}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {getArticleSummary(article)}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">{getArticleSource(article)}</span>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                    Read
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => loadPaginatedArticles(page + 1, false)}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (initialLoading) {
    return <Loading message="Loading amazing AI content..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      {renderBreakingNews()}
      {renderHamburgerMenu()}
      {renderDesktopCategoriesDropdown()}
      {renderHorizontalMenu()}
      {renderContentCounts()}
      {viewMode === 'swipe' ? renderSwipeView() : renderListView()}
    </div>
  );
};

export default Landing;