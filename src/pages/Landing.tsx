import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';
import { LandingSkeleton } from '../components/LoadingSkeleton';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout';
import SidebarNavigation from '../components/layout/SidebarNavigation';
import RecommendationsPanel from '../components/layout/RecommendationsPanel';
import HorizontalArticleCard from '../components/cards/HorizontalArticleCard';
import { apiService } from '../services/api';
import type { Article, Category, LandingContent } from '../types/article';
import { getContentTypeInfo, formatTimeAgo, getArticleSummary, getArticleSource } from '../types/article';
import { cacheService, CACHE_DURATION } from '../utils/cacheService';
import '../styles/landing.css';
import { MobileHeader } from '../components/MobileHeader';

interface MenuItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const Landing: React.FC = () => {
  // Check if caching is enabled via environment variable (disabled by default)
  const isCacheEnabled = import.meta.env.VITE_ENABLE_CACHE === 'true';
  
  const [landingContent, setLandingContent] = useState<LandingContent | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{
    blogs: Article[];
    podcasts: Article[];
    videos: Article[];
  } | null>(null);
  const [searchCounts, setSearchCounts] = useState<{
    blogs: number;
    podcasts: number;
    videos: number;
    total: number;
  } | null>(null);
  const [contentCounts, setContentCounts] = useState<{
    blogs: number;
    podcasts: number;
    videos: number;
  } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'news' | 'posts' | 'audio' | 'video' | 'learning'>('news');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [contentTypeTabs, setContentTypeTabs] = useState<Array<{id: string; icon: string; label: string}>>([]);
  const [dateFilter, setDateFilter] = useState<1 | 7 | 30 | 365>(7); // Default 7 days
  const [loadedContentTypes, setLoadedContentTypes] = useState<Set<number>>(new Set([1])); // Track loaded content types (start with blogs)
  const [contentTypeCache, setContentTypeCache] = useState<Map<string, any>>(new Map()); // Cache content by category+type
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false); // ✅ Prevent duplicate initial loads
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function to get category icon (moved from ArticleCard section)
  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: { [key: string]: string } = {
      'all': '🏠',
      'generative ai': '🤖',
      'machine learning': '🧠',
      'computer vision': '👁️',
      'natural language processing': '💬',
      'robotics': '🤖',
      'ai research': '🔬',
      'ai tools': '🛠️',
      'ai ethics': '⚖️',
      'deep learning': '🧠',
      'neural networks': '🕸️',
      'ai startups': '🚀',
      'ai news': '📰',
      'ai events': '📅',
      'ai education': '🎓',
      'ai applications': '💼'
    };
    return iconMap[categoryName.toLowerCase()] || '📰';
  };

  const fetchCategories = async () => {
    try {
      // ✅ FIX: Use dedicated categories endpoint to always get all 11 categories
      const categoriesResponse = await cacheService.get(
        'all_categories_menu',
        () => apiService.getAvailableCategories(),
        CACHE_DURATION.LONG
      );
      
      if (categoriesResponse?.categories) {
        const categoryMenus: MenuItem[] = categoriesResponse.categories.map((cat: any) => ({
          id: cat.name.toLowerCase().replace(/\s+/g, '-'),
          name: cat.name,
          icon: getCategoryIcon(cat.name),
          description: cat.description || ''
        }));
        setMenuItems(categoryMenus);
        console.log('📂 Category Menus Loaded:', categoryMenus.length, 'categories');
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback categories
      setMenuItems([
        { id: 'generative-ai', name: 'Generative AI', icon: '🤖', description: 'LLMs and AI Generation' },
        { id: 'machine-learning', name: 'Machine Learning', icon: '🧠', description: 'ML Algorithms & Techniques' },
        { id: 'ai-research', name: 'AI Research', icon: '🔬', description: 'Latest AI Research' },
        { id: 'ai-tools', name: 'AI Tools', icon: '🛠️', description: 'AI Development Tools' }
      ]);
    }
  };

  const fetchContentTypes = async () => {
    try {
      // Use cache with 24-hour TTL (static data)
      const response = await cacheService.get(
        'content_types',
        () => apiService.getAvailableContentTypes(),
        CACHE_DURATION.LONG
      );
      
      if (response?.content_types && response.content_types.length > 0) {
        // Map content types to tabs with proper order and icons
        const typeToTab: Record<string, {id: string; icon: string}> = {
          'blogs': { id: 'news', icon: '📰' },
          'podcasts': { id: 'audio', icon: '🎧' },
          'videos': { id: 'video', icon: '📹' }
        };
        
        const tabs = response.content_types
          .filter(ct => typeToTab[ct.name])
          .map(ct => ({
            id: typeToTab[ct.name].id,
            icon: typeToTab[ct.name].icon,
            label: ct.display_name
          }));
        
        // Add Posts and Learning tabs (coming soon)
        tabs.push(
          { id: 'posts', icon: '🗨️', label: 'Posts' },
          { id: 'learning', icon: '🎓', label: 'Learning' }
        );
        
        // Reorder to: News, Podcasts, Videos, Posts, Learning
        const orderedTabs = [
          tabs.find(t => t.id === 'news'),
          tabs.find(t => t.id === 'audio'),
          tabs.find(t => t.id === 'video'),
          tabs.find(t => t.id === 'posts'),
          tabs.find(t => t.id === 'learning')
        ].filter(Boolean) as Array<{id: string; icon: string; label: string}>;
        
        setContentTypeTabs(orderedTabs);
        console.log('📋 Content Type Tabs:', orderedTabs);
      } else {
        // Fallback tabs
        setContentTypeTabs([
          { id: 'news', icon: '📰', label: 'News' },
          { id: 'audio', icon: '🎧', label: 'Podcasts' },
          { id: 'video', icon: '📹', label: 'Videos' },
          { id: 'posts', icon: '🗨️', label: 'Posts' },
          { id: 'learning', icon: '🎓', label: 'Learning' }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch content types:', error);
      // Fallback tabs
      setContentTypeTabs([
        { id: 'news', icon: '📰', label: 'News' },
        { id: 'audio', icon: '🎧', label: 'Podcasts' },
        { id: 'video', icon: '📹', label: 'Videos' },
        { id: 'posts', icon: '🗨️', label: 'Posts' },
        { id: 'learning', icon: '🎓', label: 'Learning' }
      ]);
    }
  };

  const fetchLandingContent = async (days: number = 7, categoryId?: number, contentTypeId?: number) => {
    try {
      // Check cache first (only if caching is enabled)
      if (isCacheEnabled) {
        const cacheKey = getCacheKey(categoryId, contentTypeId);
        if (contentTypeCache.has(cacheKey)) {
          console.log('✅ Using cached data for:', cacheKey);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      
      const landingResponse = await apiService.getLandingContent(50, days, categoryId, contentTypeId);
      
      console.log('📰 Landing Response:', landingResponse, 'ContentType:', contentTypeId, 'Days:', days); // ✅ DEBUG LOG
      
      if (landingResponse?.categories) {
        const transformedContent: LandingContent = {
          categories: landingResponse.categories.map(cat => {
            // Get existing content for this category to merge with
            const existingCat = landingContent?.categories.find(c => c.id === cat.id);
            
            return {
              ...cat,
              content: {
                // Merge new content with existing content
                blogs: [
                  ...(existingCat?.content?.blogs || []),
                  ...(cat.content?.blogs || []).map((item: any) => ({
                    ...item,
                    time: item.published_date || new Date().toISOString(),
                    published_date: item.published_date || null,
                    readTime: '5 min'
                  }))
                ].filter((item, index, self) => 
                  index === self.findIndex(t => t.url === item.url) // Remove duplicates
                ),
                podcasts: [
                  ...(existingCat?.content?.podcasts || []),
                  ...(cat.content?.podcasts || []).map((item: any) => ({
                    ...item,
                    time: item.published_date || new Date().toISOString(),
                    published_date: item.published_date || null,
                    readTime: '30 min'
                  }))
                ].filter((item, index, self) => 
                  index === self.findIndex(t => t.url === item.url)
                ),
                videos: [
                  ...(existingCat?.content?.videos || []),
                  ...(cat.content?.videos || []).map((item: any) => ({
                    ...item,
                    time: item.published_date || new Date().toISOString(),
                    published_date: item.published_date || null,
                    readTime: '15 min'
                  }))
                ].filter((item, index, self) => 
                  index === self.findIndex(t => t.url === item.url)
                )
              }
            };
          }),
          total_categories: landingResponse.total_categories
        };
        
        setLandingContent(transformedContent);
        
        // Store in cache (only if caching is enabled)
        if (isCacheEnabled) {
          const cacheKey = getCacheKey(categoryId, contentTypeId);
          const newCache = new Map(contentTypeCache);
          newCache.set(cacheKey, transformedContent);
          setContentTypeCache(newCache);
          console.log('💾 Cached content for:', cacheKey);
        }
        
        // Calculate content counts for tabs
        updateContentCounts(transformedContent);
        
        console.log('📰 Content loaded:', transformedContent.categories.length, 'categories');
      }
    } catch (err: any) {
      console.error('Failed to fetch landing content:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateContentCounts = (content: LandingContent) => {
    // Calculate counts across all categories or filtered category
    let blogsCount = 0;
    let podcastsCount = 0;
    let videosCount = 0;
    
    if (content && content.categories) {
      content.categories.forEach(cat => {
        blogsCount += (cat.content?.blogs || []).length;
        podcastsCount += (cat.content?.podcasts || []).length;
        videosCount += (cat.content?.videos || []).length;
      });
    }
    
    setContentCounts({
      blogs: blogsCount,
      podcasts: podcastsCount,
      videos: videosCount
    });
    
    console.log('📊 Content counts updated:', { blogs: blogsCount, podcasts: podcastsCount, videos: videosCount });
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // Clear search - restore normal browsing
      setIsSearchActive(false);
      setSearchResults(null);
      setSearchCounts(null);
      setSearchQuery('');
      setSearchError(null);
      
      // Reload all content types to restore proper counts
      const categoryId = activeCategory === 'All' ? undefined : getCategoryIdFromName(activeCategory);
      fetchLandingContent(dateFilter, categoryId, undefined);
      return;
    }
    
    try {
      setLoading(true);
      setIsSearchActive(true);
      setSearchQuery(query);
      setSearchError(null); // Clear any previous errors
      
      // Get category ID if not "All"
      const categoryId = activeCategory === 'All' ? undefined : getCategoryIdFromName(activeCategory);
      
      console.log('🔍 Executing search with filters - Category:', activeCategory, 'Days:', dateFilter);
      
      // Execute search with category and time filters
      const searchResponse = await apiService.searchContent(
        query,
        categoryId,
        dateFilter,
        20 // limit per type
      );
      
      console.log('✅ Search results received:', searchResponse);
      
      // Check if we got any results
      const totalResults = searchResponse.counts.total;
      if (totalResults === 0) {
        setSearchError(`No results found for "${query}" in ${activeCategory} category`);
        setSearchResults({ blogs: [], podcasts: [], videos: [] });
        setSearchCounts({ blogs: 0, podcasts: 0, videos: 0, total: 0 });
      } else {
        // Store search results
        setSearchResults({
          blogs: searchResponse.results.blogs.map((item: any) => ({
            ...item,
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '5 min'
          })),
          podcasts: searchResponse.results.podcasts.map((item: any) => ({
            ...item,
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '30 min'
          })),
          videos: searchResponse.results.videos.map((item: any) => ({
            ...item,
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '15 min'
          }))
        });
        
        setSearchCounts(searchResponse.counts);
        setSearchError(null);
      }
      
      console.log('📊 Search counts:', searchResponse.counts);
    } catch (err: any) {
      console.error('❌ Search failed:', err);
      // Show user-friendly error message
      setSearchError(`Search temporarily unavailable. Please try again.`);
      setIsSearchActive(true); // Keep search active to show error message
      setSearchResults({ blogs: [], podcasts: [], videos: [] });
      setSearchCounts({ blogs: 0, podcasts: 0, videos: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Cache key generator for content type caching - includes date filter
  const getCacheKey = (categoryId: number | undefined, contentTypeId: number | undefined, days: number = dateFilter) => 
    `${categoryId || 'all'}-${contentTypeId || 'all'}-${days}d`;

  const getCategoryIdFromName = (categoryName: string): number | undefined => {
    if (categoryName === 'All') return undefined;
    
    // Map category names to IDs (from your categories list)
    const categoryMap: Record<string, number> = {
      'Machine Learning': 1,
      'AI Applications': 2,
      'AI Infrastructure': 3,
      'AI Governance': 4,
      'Generative AI': 5,
      'Quantum AI': 6,
      'AI Startups': 9,
      'Cloud Computing': 10,
      'Robotics': 11,
      'Internet Of Things': 12,
      'Future Technology': 13
    };
    
    return categoryMap[categoryName];
  };

  const getContentTypeIdFromTab = (tab: string): number | undefined => {
    const tabMap: Record<string, number> = {
      'news': 1,    // blogs
      'audio': 3,   // podcasts
      'video': 2,   // videos
      'posts': 4,   // posts
      'learning': 5 // learning
    };
    
    return tabMap[tab];
  };

  // ✅ CONSOLIDATED: Single effect for all data loading
  useEffect(() => {
    // ✅ FIX: Use ref to prevent duplicate initial loads (React Strict Mode issue)
    const isInitialMount = !landingContent && !hasInitializedRef.current;

    // Handle initial load ONCE
    if (isInitialMount) {
      hasInitializedRef.current = true; // Mark as initialized immediately

      const loadInitialData = async () => {
        console.log('⚡ Starting initial data load...');
        const startTime = performance.now();

        try {
          // Load categories and content types in parallel
          await Promise.all([
            fetchCategories(),
            fetchContentTypes()
          ]);

          // Then load initial content (blogs only)
          await fetchLandingContent(dateFilter, undefined, 1);

          const loadTime = performance.now() - startTime;
          console.log(`✅ Initial data loaded in ${Math.round(loadTime)}ms`);
        } catch (error) {
          console.error('❌ Initial data load failed:', error);
        }
      };

      loadInitialData();
      return; // ✅ EXIT: Don't run the filter logic on initial mount
    }

    // ✅ Handle search mode
    if (isSearchActive && searchQuery) {
      handleSearch(searchQuery);
      return;
    }

    // ✅ Handle date filter changes
    // When date filter changes, clear cache and reset loaded content types
    console.log('📅 Loading content with filters - Date:', dateFilter, 'days, Category:', activeCategory, 'Tab:', selectedTab);

    if (isCacheEnabled) {
      setContentTypeCache(new Map()); // Clear cache
      setLoadedContentTypes(new Set()); // Reset loaded types
    }

    // Map selected tab to content type ID
    const contentTypeMap: Record<string, number> = {
      news: 1,    // blogs
      audio: 3,   // podcasts
      video: 2,   // videos
      posts: 4,   // posts
      learning: 5 // learning
    };
    const contentTypeId = contentTypeMap[selectedTab];

    // Get category ID
    const categoryId = activeCategory === 'All' ? undefined :
      landingContent?.categories.find(cat => cat.name === activeCategory)?.id;

    // Check cache with date filter included (only if caching is enabled)
    if (isCacheEnabled) {
      const cacheKey = getCacheKey(categoryId, contentTypeId, dateFilter);
      const isContentLoaded = contentTypeCache.has(cacheKey);

      if (isContentLoaded) {
        console.log('✅ Using cached content for:', selectedTab, 'category:', activeCategory);
        return;
      }
    }

    // Load content with current filters
    console.log('🔄 Loading content:', selectedTab, 'for category:', activeCategory);
    fetchLandingContent(dateFilter, categoryId, contentTypeId).then(() => {
      setLoadedContentTypes(prev => new Set([...prev, contentTypeId]));
    });
  }, [dateFilter, activeCategory, selectedTab]); // ✅ Combined dependencies

  const getCurrentContent = () => {    // If search is active, use search results
    if (isSearchActive && searchResults) {
      // Return all search results (they're already filtered by category and time)
      return [
        ...searchResults.blogs,
        ...searchResults.podcasts,
        ...searchResults.videos
      ];
    }
    
    // Normal browsing mode
    if (!landingContent) return [];
    
    if (activeCategory === 'All') {
      const allContent: Article[] = [];
      if (landingContent.categories) {
        landingContent.categories.forEach(cat => {
          allContent.push(...cat.content.blogs, ...cat.content.podcasts, ...cat.content.videos);
        });
      }
      return allContent;
    } else {
      const category = landingContent.categories?.find(cat => cat.name === activeCategory);
      if (category) {
        return [...category.content.blogs, ...category.content.podcasts, ...category.content.videos];
      }
    }
    return [];
  };

  const getTabContent = () => {
    const allContent = getCurrentContent();
    
    console.log('🎯 All Content:', allContent);
    console.log('📑 Selected Tab:', selectedTab);
    
    switch (selectedTab) {
      case 'news':
        const newsItems = allContent.filter(item => {
          // ✅ FIXED: Check for both singular and plural forms
          const isArticle = item.content_type === 'article' || 
                           item.content_type === 'blog' ||
                           item.content_type === 'blogs' ||  // ✅ ADD PLURAL
                           item.type === 'blog' ||
                           item.type === 'blogs' ||  // ✅ ADD PLURAL
                           item.type === 'article';
          console.log('📰 Article check:', item.title, '- Type:', item.content_type || item.type, '- Match:', isArticle);
          return isArticle;
        });
        console.log('📰 News Items Found:', newsItems.length);
        return newsItems;
        
      case 'audio':
        const audioItems = allContent.filter(item => 
          item.content_type === 'podcast' || 
          item.content_type === 'podcasts' ||  // ✅ ADD PLURAL
          item.content_type === 'audio' ||
          item.type === 'audio' ||
          item.type === 'podcast' ||
          item.type === 'podcasts'  // ✅ ADD PLURAL
        );
        console.log('🎧 Audio Items Found:', audioItems.length);
        return audioItems;
        
      case 'video':
        const videoItems = allContent.filter(item => 
          item.content_type === 'video' || 
          item.content_type === 'videos' ||  // ✅ ADD PLURAL
          item.type === 'video' ||
          item.type === 'videos'  // ✅ ADD PLURAL
        );
        console.log('📹 Video Items Found:', videoItems.length);
        return videoItems;
        
      default:
        console.log('📋 All Items:', allContent.length);
        return allContent;
    }
  };

  return (
    <>
      <SEO 
        title="Vidyagam - Master AI & Tech Skills"
        description="Curated AI news, expert insights, and learning resources"
      />
      
      {/* Add explicit CSS for mobile/desktop separation */}
      <style>{`
        .mobile-only {
          display: block;
        }
        .desktop-only {
          display: none;
        }
        @media (min-width: 768px) {
          .mobile-only {
            display: none !important;
          }
          .desktop-only {
            display: block !important;
          }
        }
      `}</style>
      
      {loading ? (
        <LandingSkeleton />
      ) : (
        <div className="landing-container">
          {/* Mobile Header - Force hide on desktop */}
          <div className="mobile-only">
            <MobileHeader
              logoIcon="🔥"
              logoText="Vidyagam"
              searchBar={
                <EnhancedSearchBar
                  onSearch={(query) => handleSearch(query)}
                  categoryId={
                    activeCategory === 'All'
                      ? undefined
                      : landingContent?.categories.find(cat => cat.name === activeCategory)?.id
                  }
                  placeholder="Search..."
                  showSuggestions={true}
                />
              }
              dateFilter={
                <select
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border-0 focus:outline-none focus:ring-0"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(Number(e.target.value) as 1 | 7 | 30 | 365)}
                >
                  <option value={1}>Last 24 hours</option>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={365}>Last year</option>
                </select>
              }
              contentTabs={contentTypeTabs}
              categories={menuItems
                .filter(item => item.id !== 'all')
                .slice(0, 11)
                .map((item) => {
                  const actualCat = landingContent?.categories.find(cat => 
                    cat.name.toLowerCase() === item.name.toLowerCase()
                  );
                  return {
                    id: actualCat?.id || getCategoryIdFromName(item.name) || 0,
                    name: item.name,
                    icon: item.icon
                  };
                })}
              activeTab={selectedTab}
              activeCategory={activeCategory}
              onTabChange={(tabId) => {
                if (tabId === 'news') {
                  setActiveCategory('All');
                  if (landingContent?.categories) {
                    setLandingContent({
                      categories: landingContent.categories.map(cat => ({
                        ...cat,
                        content: { blogs: [], podcasts: [], videos: [] }
                      })),
                      total_categories: landingContent.total_categories
                    });
                  }
                  fetchLandingContent(dateFilter, undefined, 1);
                }
                setSelectedTab(tabId as any);
              }}
              onCategoryChange={(categoryId) => {
                const categoryName = Object.entries({
                  1: 'Machine Learning',
                  2: 'AI Applications',
                  3: 'AI Infrastructure',
                  4: 'AI Governance',
                  5: 'Generative AI',
                  6: 'Quantum AI',
                  9: 'AI Start Ups',
                  10: 'Cloud Computing',
                  11: 'Robotics',
                  12: 'Internet Of Things',
                  13: 'Future Technology'
                }).find(([id]) => Number(id) === categoryId)?.[1];
                
                if (categoryName) {
                  setActiveCategory(categoryName);
                }
              }}
              onSignIn={() => navigate('/auth')}
              onSignUp={() => navigate('/auth?mode=signup')}
              showAuth={true}
            />
          </div>

          {/* Desktop Header - Force hide on mobile */}
          <header className="landing-header desktop-only">
            <div className="landing-header-content">
              {/* Mobile Hamburger Menu */}
              <button 
                className="mobile-hamburger-btn"
                onClick={() => {
                  if ((window as any).toggleMobileSidebar) {
                    (window as any).toggleMobileSidebar();
                  }
                }}
                aria-label="Toggle menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              
              {/* 1. Logo - Far Left */}
              <div className="landing-logo" onClick={() => navigate('/')}>
                <div className="landing-logo-icon">🔥</div>
                <span className="landing-logo-text">Vidyagam</span>
              </div>

              {/* 2. Search Bar + Date Filter - Center (Wide) */}
              <div className="landing-search-container">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <EnhancedSearchBar
                    onSearch={(query) => handleSearch(query)}
                    categoryId={
                      activeCategory === 'All'
                        ? undefined
                        : landingContent?.categories.find(cat => cat.name === activeCategory)?.id
                    }
                    placeholder="Search AI news, courses, discussions..."
                    showSuggestions={true}
                  />
                </div>

                {/* Date Filter - Next to Search */}
                <div className="landing-date-filter">
                  <select
                    className="landing-filter-select"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(Number(e.target.value) as 1 | 7 | 30 | 365)}
                  >
                    <option value={1}>Last 24 hours</option>
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={365}>Last year</option>
                  </select>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Headers - USE CSS CLASSES */}
          <ThreeColumnLayout
            leftSidebar={
              <SidebarNavigation
                activeTab={selectedTab}
                tabs={contentTypeTabs.map(tab => ({
                  ...tab,
                  count: (() => {
                    const countKey = tab.id === 'news' ? 'blogs' : 
                                    tab.id === 'audio' ? 'podcasts' : 
                                    tab.id === 'video' ? 'videos' : null;
                    if (isSearchActive && searchCounts && countKey) {
                      return searchCounts[countKey as keyof typeof searchCounts] as number;
                    } else if (!isSearchActive && contentCounts && countKey) {
                      return contentCounts[countKey as keyof typeof contentCounts];
                    }
                    return undefined;
                  })()
                }))}
                onTabChange={(tabId) => {
                  // Reset to 'All' categories when clicking Home/News tab
                  if (tabId === 'news') {
                    console.log('🏠 Home clicked - reloading all categories');
                    setActiveCategory('All');
                    // Force reload all categories' blog content (even if already on news tab)
                    // Clear existing content first to ensure fresh data
                    if (landingContent?.categories) {
                      setLandingContent({
                        categories: landingContent.categories.map(cat => ({
                          ...cat,
                          content: { blogs: [], podcasts: [], videos: [] }
                        })),
                        total_categories: landingContent.total_categories
                      });
                    }
                    fetchLandingContent(dateFilter, undefined, 1); // Load all blogs
                  }
                  setSelectedTab(tabId as any);
                }}
                isAuthenticated={false}
              />
            }
            mainContent={
              <>
                {/* Search Error/No Results Message */}
                {isSearchActive && searchError && (
                  <div className="search-message-container">
                    <div className="search-message-icon">🔍</div>
                    <h3 className="search-message-title">{searchError}</h3>
                    <p className="search-message-text">
                      Try adjusting your search terms or filters
                    </p>
                    <button 
                      className="search-clear-button"
                      onClick={() => handleSearch('')}
                    >
                      Clear Search
                    </button>
                  </div>
                )}

                {/* Search Active Indicator */}
                {isSearchActive && !searchError && searchCounts && (
                  <div className="search-active-banner">
                    <span>🔍 Showing search results for <strong>"{searchQuery}"</strong></span>
                    <span className="search-result-count">
                      {searchCounts.total} result{searchCounts.total !== 1 ? 's' : ''} found
                    </span>
                    <button 
                      className="search-clear-link"
                      onClick={() => handleSearch('')}
                    >
                      Clear ✕
                    </button>
                  </div>
                )}

                {/* Content Section */}
                {selectedTab === 'news' && (
                  <>
                    <div className="landing-section-header">
                      <h2 className="landing-section-title">Latest AI News</h2>
                      <p className="landing-section-subtitle">
                        {activeCategory === 'All' ? 'All categories' : activeCategory}
                      </p>
                    </div>

                    {getTabContent().length === 0 ? (
                      <div style={{ 
                        padding: '3rem', 
                        textAlign: 'center', 
                        background: '#f3f4f6', 
                        borderRadius: '0.5rem',
                        margin: '2rem 0'
                      }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                          No articles found
                        </h3>
                        <p style={{ color: '#6b7280' }}>
                          Category: {activeCategory} | Tab: {selectedTab}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="landing-article-list">
                          {getTabContent().slice(0, 20).map((item, index) => (
                            <HorizontalArticleCard 
                              key={index} 
                              article={item} 
                              contentType="blog"
                              showInteractions={false}
                            />
                          ))}
                        </div>

                        <button onClick={() => navigate('/auth')} className="landing-btn-view-all">
                          View All News →
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Audio Tab */}
                {selectedTab === 'audio' && (
                  <>
                    <div className="landing-section-header">
                      <h2 className="landing-section-title">AI Podcasts</h2>
                      <p className="landing-section-subtitle">
                        {activeCategory === 'All' ? 'All categories' : activeCategory}
                      </p>
                    </div>

                    {getTabContent().length === 0 ? (
                      <div style={{ padding: '3rem', textAlign: 'center', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎧</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>No podcasts available yet</h3>
                      </div>
                    ) : (
                      <>
                        <div className="landing-article-list">
                          {getTabContent().slice(0, 20).map((item, index) => (
                            <HorizontalArticleCard 
                              key={index} 
                              article={item} 
                              contentType="podcast"
                              showInteractions={false}
                            />
                          ))}
                        </div>
                        <button onClick={() => navigate('/auth')} className="landing-btn-view-all">
                          View All Podcasts →
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Video Tab */}
                {selectedTab === 'video' && (
                  <>
                    <div className="landing-section-header">
                      <h2 className="landing-section-title">AI Videos</h2>
                      <p className="landing-section-subtitle">
                        {activeCategory === 'All' ? 'All categories' : activeCategory}
                      </p>
                    </div>

                    {getTabContent().length === 0 ? (
                      <div style={{ padding: '3rem', textAlign: 'center', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>No videos available yet</h3>
                      </div>
                    ) : (
                      <>
                        <div className="landing-article-list">
                          {getTabContent().slice(0, 20).map((item, index) => (
                            <HorizontalArticleCard 
                              key={index} 
                              article={item} 
                              contentType="video"
                              showInteractions={false}
                            />
                          ))}
                        </div>
                        <button onClick={() => navigate('/auth')} className="landing-btn-view-all">
                          View All Videos →
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Posts Tab */}
                {selectedTab === 'posts' && (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗨️</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>Community Coming Soon</h2>
                    <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                      Join discussions with AI experts and learners
                    </p>
                    <button onClick={() => navigate('/auth')} className="landing-btn-view-all">
                      Join Waitlist
                    </button>
                  </div>
                )}

                {/* Learning Tab */}
                {selectedTab === 'learning' && (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>Learning Paths Coming Soon</h2>
                    <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                      Structured courses from beginner to expert
                    </p>
                    <button onClick={() => navigate('/auth')} className="landing-btn-view-all">
                      Join Waitlist
                    </button>
                  </div>
                )}
              </>
            }
            rightSidebar={
              <RecommendationsPanel
                categories={menuItems
                  .filter(item => item.id !== 'all') // Exclude "All" from sidebar
                  .slice(0, 11)
                  .map((item) => {
                    // Find the actual category ID from landingContent if available
                    const actualCat = landingContent?.categories.find(cat => 
                      cat.name.toLowerCase() === item.name.toLowerCase()
                    );
                    return {
                      id: actualCat?.id || getCategoryIdFromName(item.name) || 0, // Use actual DB ID
                      name: item.name,
                      icon: item.icon
                    };
                  })}
                onCategoryClick={(categoryId) => {
                  // Find category by ID from menuItems using the name mapping
                  const categoryName = Object.entries({
                    1: 'Machine Learning',
                    2: 'AI Applications',
                    3: 'AI Infrastructure',
                    4: 'AI Governance',
                    5: 'Generative AI',
                    6: 'Quantum AI',
                    9: 'AI Start Ups',
                    10: 'Cloud Computing',
                    11: 'Robotics',
                    12: 'Internet Of Things',
                    13: 'Future Technology'
                  }).find(([id]) => Number(id) === categoryId)?.[1];
                  
                  if (categoryName) {
                    console.log('🎯 Category selected:', categoryName, '(ID:', categoryId, ')');
                    setActiveCategory(categoryName);
                  }
                }}
                trendingArticles={[]}
                onSignIn={() => navigate('/auth')}
                onSignUp={() => navigate('/auth?mode=signup')}
                isAuthenticated={false}
              />
            }
          />

          {/* Footer */}
            <footer className="landing-footer">
              <div className="landing-footer-content">
                <p style={{ color: '#111' }}>Vidyagam @ 2025 - All Rights Reserved</p>
              </div>
            </footer>
        </div>
      )}
    </>
  );
};

export default Landing;
