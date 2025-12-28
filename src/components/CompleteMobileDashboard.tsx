import React, { useState, useEffect, useRef } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Article } from '../services/api';
import SEO from './SEO';
import { DashboardSkeleton } from './LoadingSkeleton';
import { useNavigate } from 'react-router-dom';
import SettingsFullScreen from './SettingsFullScreen';
import EnhancedSearchBar from './EnhancedSearchBar';
import ThreeColumnLayout from './layout/ThreeColumnLayout';
import SidebarNavigation from './layout/SidebarNavigation';
import RecommendationsPanel from './layout/RecommendationsPanel';
import HorizontalArticleCard from './cards/HorizontalArticleCard';
import { cacheService, CACHE_DURATION } from '../utils/cacheService';
import '../styles/design-tokens.css';
import '../styles/components.css';
import '../styles/dashboard.css';
import '../styles/landing.css';
import { MobileHeader } from '../components/MobileHeader';

const CompleteMobileDashboard: React.FC = () => {
  const { user, isAuthenticated, updatePreferences, logout } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTab, setSelectedTab] = useState<'news' | 'audio' | 'video' | 'posts' | 'learning'>('news');
  const [dateFilter, setDateFilter] = useState<1 | 7 | 30 | 365>(7);
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());
  const [contentCounts, setContentCounts] = useState<{
    blogs: number;
    podcasts: number;
    videos: number;
  } | null>(null);
  const hasLoadedContent = useRef(false);
  const hasInitializedOptions = useRef(false); // ✅ Prevent duplicate options load
  const hasInitializedBookmarks = useRef(false); // ✅ Prevent duplicate bookmarks load
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [savingSettings, setSavingSettings] = useState(false);
  const [menuItems, setMenuItems] = useState<Array<{id: string, name: string, icon: string, description: string}>>([
    { id: 'all', name: 'All', icon: '🏠', description: 'All Categories' }
  ]);
  const [contentTypeTabs] = useState([
    { id: 'news', icon: '📰', label: 'News' },
    { id: 'audio', icon: '🎧', label: 'Podcasts' },
    { id: 'video', icon: '📹', label: 'Videos' },
    { id: 'posts', icon: '💬', label: 'Posts' },
    { id: 'learning', icon: '🎓', label: 'Learning' }
  ]);

  const [userPreferences, setUserPreferences] = useState({
    experience_level: user?.preferences?.experience_level || 'intermediate',
    professional_roles: (user?.preferences as any)?.professional_roles || ['enthusiast'],
    categories_selected: (user?.preferences as any)?.category_ids_selected || [],
    content_types_selected: (user?.preferences as any)?.content_type_ids_selected || [],
    publishers_selected: (user?.preferences as any)?.publisher_ids_selected || []
  });

  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<any[]>([]);
  const [availablePublishers, setAvailablePublishers] = useState<any[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Helper function to map dateFilter to timeFilter string
  const getTimeFilterString = (days: number): 'Last 24 Hours' | 'Last Week' | 'Last Month' | 'This Year' => {
    switch (days) {
      case 1: return 'Last 24 Hours';
      case 7: return 'Last Week';
      case 30: return 'Last Month';
      case 365: return 'This Year';
      default: return 'Last Week';
    }
  };

  // Helper function to get category icon
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

  // Load available options for settings - ONCE
  useEffect(() => {
    // ✅ Prevent duplicate loads (React Strict Mode issue)
    if (hasInitializedOptions.current) {
      console.log('⏭️ [loadOptions] Already initialized, skipping');
      return;
    }

    hasInitializedOptions.current = true;

    const loadOptions = async () => {
      console.log('⚡ [loadOptions] Starting parallel options load...');
      const startTime = performance.now();

      try {
        // ⚡ OPTIMIZED: Load all options in parallel with caching
        const [categoriesRes, contentTypesRes, publishersRes] = await Promise.all([
          cacheService.get(
            'available_categories',
            () => apiService.getAvailableCategories(),
            CACHE_DURATION.LONG
          ),
          cacheService.get(
            'available_content_types',
            () => apiService.getAvailableContentTypes(),
            CACHE_DURATION.LONG
          ),
          cacheService.get(
            'available_publishers',
            () => apiService.getAvailablePublishers(),
            CACHE_DURATION.MEDIUM
          )
        ]);

        // ✅ React handles component unmounting automatically - no need for isMounted check
        const loadTime = performance.now() - startTime;
        console.log(`✅ [loadOptions] Options loaded in ${Math.round(loadTime)}ms`);
        console.log('✅ [loadOptions] Categories:', categoriesRes.categories?.length || 0);
        console.log('✅ [loadOptions] Content types:', contentTypesRes.content_types?.length || 0);
        console.log('✅ [loadOptions] Publishers:', publishersRes.publishers?.length || 0);

        setAvailableCategories(categoriesRes.categories || []);
        setAvailableContentTypes(contentTypesRes.content_types || []);
        setAvailablePublishers(publishersRes.publishers || []);

        console.log('✅ [loadOptions] State updates queued - React will re-render and trigger loadFeed');
      } catch (err) {
        console.error('❌ [loadOptions] Error loading options:', err);
      }
    };

    loadOptions();
  }, []);

  // Load bookmarks - DISABLED for now (endpoint not available)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // ✅ Bookmarks disabled - endpoint returns 404
    console.log('⏭️ [loadBookmarks] Disabled - endpoint not available yet');
    setSavedArticles(new Set());

    /* DISABLED UNTIL BACKEND ENDPOINT IS READY
    if (hasInitializedBookmarks.current) {
      console.log('⏭️ [loadBookmarks] Already initialized, skipping');
      return;
    }

    hasInitializedBookmarks.current = true;

    const loadBookmarks = async () => {
      try {
        console.log('📚 Loading user bookmarks...');
        const bookmarks = await apiService.getBookmarks();
        const bookmarkIds = new Set(
          bookmarks.articles.map(a => a.id?.toString() || '')
        );
        setSavedArticles(bookmarkIds);
        console.log('✅ Loaded', bookmarkIds.size, 'bookmarks');
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          console.log('⚠️ Bookmarks feature not available yet - using empty state');
          setSavedArticles(new Set());
        } else {
          console.error('❌ Failed to load bookmarks:', error);
        }
      }
    };

    loadBookmarks();
    */
  }, [isAuthenticated, user]);

  // ✅ Handle Search - Uses search API for precise results
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // Clear search - restore normal browsing
      setIsSearchActive(false);
      setSearchResults(null);
      setSearchCounts(null);
      setSearchQuery('');
      setSearchError(null);
      return;
    }

    try {
      setLoading(true);
      setIsSearchActive(true);
      setSearchQuery(query);
      setSearchError(null);

      // Get category ID if not "All"
      const categoryId = selectedCategory === 'All' ? undefined :
        availableCategories.find(cat => cat.name === selectedCategory)?.id;

      console.log('🔍 Executing personalized search - Query:', query, 'Category:', selectedCategory, 'Days:', dateFilter);

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
        setSearchError(`No results found for "${query}"`);
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
      setSearchError('Search temporarily unavailable. Please try again.');
      setIsSearchActive(true);
      setSearchResults({ blogs: [], podcasts: [], videos: [] });
      setSearchCounts({ blogs: 0, podcasts: 0, videos: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Load feed - triggers on date filter, category, tab, search, or preference changes
  useEffect(() => {
    // ✅ Handle search mode - don't load feed when searching
    if (isSearchActive && searchQuery) {
      handleSearch(searchQuery);
      return;
    }

    console.log('🔄 [loadFeed] Effect triggered');
    console.log('   - Categories:', availableCategories.length, 'Content Types:', availableContentTypes.length, 'Publishers:', availablePublishers.length);
    console.log('   - Selected Category:', selectedCategory, 'Tab:', selectedTab, 'Date Filter:', dateFilter);

    const loadFeed = async () => {
      // ✅ Check if lookup data is available FIRST
      if (availableCategories.length === 0 || availableContentTypes.length === 0 || availablePublishers.length === 0) {
        console.log('⏳ Waiting for lookup data...');
        setLoading(false);
        return;
      }

      console.log('✅ Lookup data available! Loading content with current filters...');

      setLoading(true);
      setError(null);

      try {
        console.log('📱 Loading personalized feed...');

        // ✅ FIX: Apply category filter from UI selection
        let categoryNames: string[];
        if (selectedCategory === 'All' || !selectedCategory) {
          // Use user preferences for categories
          categoryNames = userPreferences.categories_selected
            .map((id: any) => availableCategories.find(cat => cat.id === id)?.name)
            .filter(Boolean) as string[];
        } else {
          // Use selected category from sidebar
          categoryNames = [selectedCategory];
        }

        // ✅ FIX: Apply content type filter from UI tab selection
        let contentTypeNames: string[];
        const tabToContentTypeMap: Record<string, string> = {
          'news': 'blog',
          'audio': 'podcast',
          'video': 'video',
          'posts': 'post',
          'learning': 'course'
        };

        const selectedContentType = tabToContentTypeMap[selectedTab];
        if (selectedContentType && selectedTab !== 'news') {
          // User selected specific tab - use only that content type
          contentTypeNames = [selectedContentType];
        } else {
          // News tab or default - use all content types from preferences
          contentTypeNames = userPreferences.content_types_selected
            .map((id: any) => availableContentTypes.find(ct => ct.id === id)?.name)
            .filter(Boolean) as string[];
        }

        let publisherNames: string[];
        if (userPreferences.publishers_selected.includes('all')) {
          publisherNames = ['all'];
        } else {
          publisherNames = userPreferences.publishers_selected
            .map((id: any) => {
              if (typeof id === 'number') {
                return availablePublishers.find(pub => pub.id === id)?.name;
              }
              return id;
            })
            .filter(Boolean) as string[];
        }

        const filterRequest = {
          interests: categoryNames.length > 0 ? categoryNames : ['Generative AI', 'Machine Learning'],
          content_types: contentTypeNames.length > 0 ? contentTypeNames : ['blog', 'video', 'podcast'],
          publishers: publisherNames.length > 0 ? publisherNames : ['all'],
          time_filter: getTimeFilterString(dateFilter),
          search_query: searchQuery,
          limit: 500
        };

        console.log('📤 Sending feed request:', filterRequest);

        const response = await apiService.getPersonalizedFeed(filterRequest);

        const articles: Article[] = [];

        response.grouped_content?.forEach((group: any) => {
          group.items?.forEach((item: any) => {
            articles.push({
              id: item.id?.toString() || Math.random().toString(),
              title: item.title || 'Untitled',
              url: item.url || '#',
              source: item.source || 'Unknown',
              source_name: item.source || 'Unknown',
              time: item.published_date || new Date().toISOString(),
              published_date: item.published_date || new Date().toISOString(),
              significanceScore: item.significance_score || 5,
              summary: item.summary || item.description || 'No description available',
              description: item.summary || item.description,
              content_summary: item.content_summary,
              type: item.content_type_label || item.content_type || item.type || 'BLOGS',
              content_type: item.content_type_label || item.content_type || item.type,
              content_type_name: item.content_type_label || item.content_type || item.type,
              significance: item.significance_score || 5,
              significance_score: item.significance_score,
              read_time: item.read_time || item.readTime || item.estimated_read_time,
              readTime: item.read_time || item.readTime,
              complexity: item.complexity || item.complexity_level,
              impact: item.impact || item.impact_level || 'medium',
              duration: item.duration,
              category: group.category,
              category_name: group.category,
              thumbnail_url: item.thumbnail_url || item.thumbnail || item.image,
              thumbnail: item.thumbnail_url || item.thumbnail,
              imageUrl: item.thumbnail_url || item.thumbnail,
              image: item.thumbnail_url || item.thumbnail || item.image,
              ranking_score: item.ranking_score || item.rankingScore,
              rankingScore: item.ranking_score || item.rankingScore,
              topics: item.topics ? item.topics.map((t: any) => ({
                id: 0,
                name: typeof t === 'string' ? t : t.name,
                category: '',
                significance_weight: 1
              })) : undefined,
              topic_names: item.topic_names,
              is_bookmarked: savedArticles.has(item.id?.toString() || ''),
              is_liked: false,
              likes_count: 0,
              views_count: 0,
              bookmarks_count: 0,
              engagement_score: 0
            });
          });
        });

        setContent(articles);

        // Calculate counts
        const counts = {
          blogs: articles.filter(a => ['blog', 'blogs', 'article'].includes(a.content_type?.toLowerCase() || '')).length,
          podcasts: articles.filter(a => ['podcast', 'podcasts'].includes(a.content_type?.toLowerCase() || '')).length,
          videos: articles.filter(a => ['video', 'videos'].includes(a.content_type?.toLowerCase() || '')).length
        };
        setContentCounts(counts);

        console.log('✅ Feed loaded successfully:', articles.length, 'items, counts:', counts);

      } catch (err) {
        console.error('❌ Error loading feed:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [
    isAuthenticated,
    user?.id,
    searchQuery,
    dateFilter, // ✅ Date filter changes trigger reload
    selectedCategory, // ✅ Category selection triggers reload
    selectedTab, // ✅ Tab selection triggers reload
    JSON.stringify(userPreferences.categories_selected),
    JSON.stringify(userPreferences.content_types_selected),
    JSON.stringify(userPreferences.publishers_selected),
    availableCategories.length, // Use length to avoid re-render on array reference change
    availableContentTypes.length,
    availablePublishers.length
  ]);

  // Update user preferences from context
  useEffect(() => {
    if (user?.preferences) {
      setUserPreferences({
        experience_level: user.preferences.experience_level || 'intermediate',
        professional_roles: (user.preferences as any).professional_roles || ['enthusiast'],
        categories_selected: (user.preferences as any).category_ids_selected || [],
        content_types_selected: (user.preferences as any).content_type_ids_selected || [],
        publishers_selected: (user.preferences as any).publisher_ids_selected || []
      });
    }
  }, [user?.preferences]);

  // Build menu items from user categories
  useEffect(() => {
    console.log('🔧 [buildMenuItems] Effect triggered', {
      availableCategoriesCount: availableCategories.length,
      userCategoriesSelectedCount: userPreferences.categories_selected.length,
      userCategoriesSelected: userPreferences.categories_selected
    });

    if (availableCategories.length > 0 && userPreferences.categories_selected.length > 0) {
      const userCategories = availableCategories.filter(cat =>
        userPreferences.categories_selected.includes(cat.id)
      );

      console.log('🔧 [buildMenuItems] Filtered user categories:', userCategories.length, userCategories.map(c => c.name));

      const categoryMenus = [
        { id: 'all', name: 'All', icon: '🏠', description: 'All Categories' }, // Always include "All"
        ...userCategories.map(cat => ({
          id: cat.name.toLowerCase().replace(/\s+/g, '-'),
          name: cat.name,
          icon: getCategoryIcon(cat.name),
          description: cat.description || ''
        }))
      ];

      console.log('✅ [buildMenuItems] Setting menu items:', categoryMenus.length, categoryMenus.map(m => m.name));
      setMenuItems(categoryMenus);
    } else if (availableCategories.length > 0 && userPreferences.categories_selected.length === 0) {
      // FALLBACK: If user has no categories selected, show top categories
      console.log('⚠️ [buildMenuItems] No user categories selected - using fallback');
      const fallbackCategories = availableCategories.slice(0, 5); // Top 5 categories
      const categoryMenus = [
        { id: 'all', name: 'All', icon: '🏠', description: 'All Categories' },
        ...fallbackCategories.map(cat => ({
          id: cat.name.toLowerCase().replace(/\s+/g, '-'),
          name: cat.name,
          icon: getCategoryIcon(cat.name),
          description: cat.description || ''
        }))
      ];
      console.log('✅ [buildMenuItems] Setting fallback menu items:', categoryMenus.length, categoryMenus.map(m => m.name));
      setMenuItems(categoryMenus);
    }
  }, [availableCategories, userPreferences.categories_selected]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const selectedCategoryNames = availableCategories
        .filter(category => userPreferences.categories_selected.includes(category.id))
        .map(category => category.name);

      const selectedContentTypeNames = availableContentTypes
        .filter(contentType => userPreferences.content_types_selected.includes(contentType.id))
        .map(contentType => contentType.name);

      const cleanedPublisherIds = userPreferences.publishers_selected
        .filter((id: any) => id !== 'all' && typeof id === 'number') as number[];

      const selectedPublisherNames = availablePublishers
        .filter(publisher => cleanedPublisherIds.includes(publisher.id))
        .map(publisher => publisher.name);

      const preferences = {
        experience_level: userPreferences.experience_level,
        professional_roles: userPreferences.professional_roles,
        categories_selected: selectedCategoryNames,
        content_types_selected: selectedContentTypeNames,
        publishers_selected: selectedPublisherNames,
        category_ids_selected: userPreferences.categories_selected,
        content_type_ids_selected: userPreferences.content_types_selected,
        publisher_ids_selected: cleanedPublisherIds.length > 0 ? cleanedPublisherIds : [],
        newsletter_frequency: "weekly" as "weekly" | "12_hours" | "daily" | "monthly",
        email_notifications: true,
        breaking_news_alerts: false,
        onboarding_completed: true
      };

      await updatePreferences(preferences);

      // Show success dialog
      setShowSuccessDialog(true);

      // Auto-close dialog and return to dashboard after 2 seconds
      setTimeout(() => {
        setShowSuccessDialog(false);
        setCurrentView('dashboard');
        hasLoadedContent.current = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Failed to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Get tab content - handles both normal browsing and search results
  const getTabContent = () => {
    // ✅ If search is active, use search results
    if (isSearchActive && searchResults) {
      switch (selectedTab) {
        case 'news':
          return searchResults.blogs;
        case 'audio':
          return searchResults.podcasts;
        case 'video':
          return searchResults.videos;
        default:
          return [];
      }
    }

    // Normal browsing mode - use personalized feed
    let filteredContent = content;

    // Filter by category if not "All"
    if (selectedCategory !== 'All') {
      filteredContent = filteredContent.filter(item =>
        item.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by selected tab
    switch (selectedTab) {
      case 'news':
        return filteredContent.filter(item =>
          ['blog', 'blogs', 'article'].includes(item.content_type?.toLowerCase() || '')
        );
      case 'audio':
        return filteredContent.filter(item =>
          ['podcast', 'podcasts'].includes(item.content_type?.toLowerCase() || '')
        );
      case 'video':
        return filteredContent.filter(item =>
          ['video', 'videos'].includes(item.content_type?.toLowerCase() || '')
        );
      default:
        return [];
    }
  };

  return (
    <>
      <SEO
        title="AI News Dashboard | Vidyagam"
        description="Your personalized AI news dashboard"
        keywords="AI news, dashboard, artificial intelligence"
      />

      {/* Settings View */}
      {currentView === 'settings' && (
        <SettingsFullScreen
          userPreferences={userPreferences}
          setUserPreferences={setUserPreferences}
          availableCategories={availableCategories}
          availableContentTypes={availableContentTypes}
          availablePublishers={availablePublishers}
          onClose={() => {
            setCurrentView('dashboard');
          }}
          onSave={handleSaveSettings}
          savingSettings={savingSettings}
          setSettingsChanged={() => {}}
        />
      )}

      {/* Dashboard Mobile View */}
      {currentView === 'dashboard' && (
        <div className="landing-container">
          {/* Mobile Header - Add Preferences and Sign Out */}
          <div className="mobile-only">
            <MobileHeader
              logoIcon="🔥"
              logoText="Vidyagam"
              searchBar={
                <EnhancedSearchBar
                  onSearch={(query) => handleSearch(query)}
                  categoryId={
                    selectedCategory === 'All'
                      ? undefined
                      : availableCategories.find(cat => cat.name === selectedCategory)?.id
                  }
                  placeholder="Search..."
                  showSuggestions={true}
                />
              }
              dateFilter={
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm transition-colors"
                  style={{ 
                    color: '#000000',
                    outline: 'none'
                  }}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(Number(e.target.value) as 1 | 7 | 30 | 365)}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#000000';
                    e.target.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value={1}>Last 24 hours</option>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={365}>Last year</option>
                </select>
              }
              contentTabs={contentTypeTabs.map(tab => ({
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
              categories={menuItems
                .filter(item => item.id !== 'all')
                .map((item) => {
                  const actualCat = availableCategories.find(cat =>
                    cat.name.toLowerCase() === item.name.toLowerCase()
                  );
                  return {
                    id: actualCat?.id || 0,
                    name: item.name,
                    icon: item.icon
                  };
                })}
              activeTab={selectedTab}
              activeCategory={selectedCategory}
              onTabChange={(tabId) => {
                if (tabId === 'news') {
                  setSelectedCategory('All');
                }
                setSelectedTab(tabId as any);
              }}
              onCategoryChange={(categoryId) => {
                const category = availableCategories.find(cat => cat.id === categoryId);
                if (category) {
                  setSelectedCategory(category.name);
                }
              }}
              onPreferences={() => setCurrentView('settings')}
              onSignOut={handleLogout}
              showAuth={false}
            />
          </div>

          {/* Desktop Header */}
          <header className="landing-header desktop-only">
            <div className="landing-header-content">
              {/* 1. Logo - Far Left */}
              <div className="landing-logo" onClick={() => navigate('/dashboard')}>
                <div className="landing-logo-icon">🔥</div>
                <span className="landing-logo-text">Vidyagam</span>
              </div>

              {/* 2. Search Bar + Date Filter - Center (Wide) */}
              <div className="landing-search-container">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <EnhancedSearchBar
                    onSearch={(query) => handleSearch(query)}
                    categoryId={
                      selectedCategory === 'All'
                        ? undefined
                        : availableCategories.find(cat => cat.name === selectedCategory)?.id
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

              {/* 3. Preferences & Sign Out Buttons - Right */}
              <div className="landing-auth-buttons">
                <button
                  onClick={() => setCurrentView('settings')}
                  className="landing-btn-signin"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Settings size={16} />
                  <span>Preferences</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="landing-btn-signup"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </header>

          {/* Three Column Layout */}
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

                    // ✅ Use search counts when searching, otherwise use normal counts
                    if (isSearchActive && searchCounts && countKey) {
                      return searchCounts[countKey as keyof typeof searchCounts] as number;
                    } else if (!isSearchActive && contentCounts && countKey) {
                      return contentCounts[countKey as keyof typeof contentCounts];
                    }
                    return undefined;
                  })()
                }))}
                onTabChange={(tabId) => {
                  if (tabId === 'news') {
                    setSelectedCategory('All');
                  }
                  setSelectedTab(tabId as any);
                }}
                isAuthenticated={true}
              />
            }
            mainContent={
              <>
                {loading ? (
                  <DashboardSkeleton />
                ) : error ? (
                  <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    background: '#f3f4f6',
                    borderRadius: '0.5rem',
                    margin: '2rem 0'
                  }}>
                    <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="landing-btn-view-all"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
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

                    {/* News Tab */}
                    {selectedTab === 'news' && (
                      <>
                        <div className="landing-section-header">
                          <h2 className="landing-section-title">
                            {isSearchActive ? 'Search Results - News' : 'Latest AI News'}
                          </h2>
                          <p className="landing-section-subtitle">
                            {selectedCategory === 'All' ? 'All categories' : selectedCategory}
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
                              Try adjusting your filters or preferences
                            </p>
                          </div>
                        ) : (
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
                        )}
                      </>
                    )}

                    {/* Audio Tab */}
                    {selectedTab === 'audio' && (
                      <>
                        <div className="landing-section-header">
                          <h2 className="landing-section-title">AI Podcasts</h2>
                          <p className="landing-section-subtitle">
                            {selectedCategory === 'All' ? 'All categories' : selectedCategory}
                          </p>
                        </div>

                        {getTabContent().length === 0 ? (
                          <div style={{ padding: '3rem', textAlign: 'center', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎧</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>No podcasts available</h3>
                          </div>
                        ) : (
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
                        )}
                      </>
                    )}

                    {/* Video Tab */}
                    {selectedTab === 'video' && (
                      <>
                        <div className="landing-section-header">
                          <h2 className="landing-section-title">AI Videos</h2>
                          <p className="landing-section-subtitle">
                            {selectedCategory === 'All' ? 'All categories' : selectedCategory}
                          </p>
                        </div>

                        {getTabContent().length === 0 ? (
                          <div style={{ padding: '3rem', textAlign: 'center', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>No videos available</h3>
                          </div>
                        ) : (
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
                      </div>
                    )}
                  </>
                )}
              </>
            }
            rightSidebar={
              <RecommendationsPanel
                categories={menuItems
                  .filter(item => item.id !== 'all') // Exclude "All" from right sidebar
                  .map((item) => {
                    const actualCat = availableCategories.find(cat =>
                      cat.name.toLowerCase() === item.name.toLowerCase()
                    );
                    return {
                      id: actualCat?.id || 0,
                      name: item.name,
                      icon: item.icon
                    };
                  })}
                onCategoryClick={(categoryId) => {
                  const category = availableCategories.find(cat => cat.id === categoryId);
                  if (category) {
                    setSelectedCategory(category.name);
                  }
                }}
                trendingArticles={[]}
                isAuthenticated={true}
              />
            }
          />

          {/* Footer */}
          <footer className="landing-footer">
            <div className="landing-footer-content">
              <p>© 2025 Vidyagam. All rights reserved.</p>
            </div>
          </footer>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
          onClick={() => setShowSuccessDialog(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              animation: 'slideUp 0.3s ease-out',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                animation: 'scaleIn 0.5s ease-out'
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Success Message */}
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '0.5rem'
              }}
            >
              Settings Saved!
            </h3>
            <p
              style={{
                color: '#6b7280',
                fontSize: '1rem',
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}
            >
              Your preferences have been updated successfully. Your personalized feed is being refreshed...
            </p>

            {/* OK Button */}
            <button
              onClick={() => {
                setShowSuccessDialog(false);
                setCurrentView('dashboard');
                hasLoadedContent.current = false;
              }}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default CompleteMobileDashboard;
