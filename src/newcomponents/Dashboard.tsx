import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
  alpha,
  Chip,
  Stack,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  InputLabel
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Article } from '../services/api';
import type { LandingContent } from '../types/article';
import SEO from '../components/SEO';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { LandingSkeleton } from '../components/LoadingSkeleton';
import Header from './Header';
import { SearchProvider } from '../contexts/SearchContext';
import RightSection from './RightSection';
import NewsItemContainer from './cards/NewsItemContainer';
import { DashboardContext, type DashboardContextType } from '../contexts/DashboardContext';
import { cacheService, CACHE_DURATION } from '../utils/cacheService';
import SettingsFullScreen from '../components/SettingsFullScreen';

const NewDashboard: React.FC = () => {
  const { user, isAuthenticated, logout, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const outletContext = useOutletContext<{ 
    dateFilter?: 1 | 7 | 30 | 365;
    onDateFilterChange?: (filter: 1 | 7 | 30 | 365) => void;
    selectedTab?: 'news' | 'audio' | 'video' | 'posts' | 'learning';
    onTabChange?: (tab: 'news' | 'audio' | 'video' | 'posts' | 'learning') => void;
    onCategoryChangeHandlerSet?: (handler: (category: string) => void) => void;
    onSettingsClickHandlerSet?: (handler: () => void) => void;
    onSearchStart?: () => void;
    onMenuClick?: () => void;
    onTrendingClick?: () => void;
    onTrendingHandlerSet?: (handler: (topic: string) => void) => void;
  }>();

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
  const [selectedTab, setSelectedTab] = useState<'news' | 'audio' | 'video' | 'posts' | 'learning'>('news');
  const dateFilter = outletContext?.dateFilter || 7;
  const setDateFilter = outletContext?.onDateFilterChange || (() => {});
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<any[]>([]);
  const [availablePublishers, setAvailablePublishers] = useState<any[]>([]);
  const hasInitializedOptions = useRef(false);

  const [userPreferences, setUserPreferences] = useState({
    experience_level: user?.preferences?.experience_level || 'intermediate',
    professional_roles: (user?.preferences as any)?.professional_roles || ['enthusiast'],
    categories_selected: (user?.preferences as any)?.category_ids_selected || [],
    content_types_selected: (user?.preferences as any)?.content_type_ids_selected || [],
    publishers_selected: (user?.preferences as any)?.publisher_ids_selected || []
  });

  const getTimeFilterString = (days: number): 'Last 24 Hours' | 'Last Week' | 'Last Month' | 'This Year' => {
    switch (days) {
      case 1: return 'Last 24 Hours';
      case 7: return 'Last Week';
      case 30: return 'Last Month';
      case 365: return 'This Year';
      default: return 'Last Week';
    }
  };

  // Load available options
  useEffect(() => {
    if (hasInitializedOptions.current) return;
    hasInitializedOptions.current = true;

    const loadOptions = async () => {
      try {
        console.log('🔄 Loading available options...');
        
        const [categoriesRes, contentTypesRes, publishersRes] = await Promise.all([
          cacheService.get('available_categories', () => apiService.getAvailableCategories(), CACHE_DURATION.LONG),
          cacheService.get('available_content_types', () => apiService.getAvailableContentTypes(), CACHE_DURATION.LONG),
          cacheService.get('available_publishers', () => apiService.getAvailablePublishers(), CACHE_DURATION.MEDIUM)
        ]);

        console.log('📦 Categories response:', categoriesRes);
        console.log('📦 Content types response:', contentTypesRes);
        console.log('📦 Publishers response:', publishersRes);

        // Validate and set categories
        if (categoriesRes && Array.isArray(categoriesRes.categories)) {
          console.log('✅ Setting categories:', categoriesRes.categories.length, 'items');
          setAvailableCategories(categoriesRes.categories);
        } else {
          console.warn('⚠️ Invalid categories response structure:', categoriesRes);
          setAvailableCategories([]);
        }

        // Validate and set content types
        if (contentTypesRes && Array.isArray(contentTypesRes.content_types)) {
          console.log('✅ Setting content types:', contentTypesRes.content_types.length, 'items');
          setAvailableContentTypes(contentTypesRes.content_types);
        } else {
          console.warn('⚠️ Invalid content types response structure:', contentTypesRes);
          setAvailableContentTypes([]);
        }

        // Validate and set publishers
        if (publishersRes && Array.isArray(publishersRes.publishers)) {
          console.log('✅ Setting publishers:', publishersRes.publishers.length, 'items');
          setAvailablePublishers(publishersRes.publishers);
        } else {
          console.warn('⚠️ Invalid publishers response structure:', publishersRes);
          setAvailablePublishers([]);
        }
        
        // Once options are loaded, fetch personalized content
        if (categoriesRes.categories && contentTypesRes.content_types && publishersRes.publishers) {
          console.log('🚀 All options loaded successfully, fetching personalized feed...');
          loadPersonalizedFeed();
        } else {
          console.error('❌ Failed to load all options, cannot fetch personalized feed');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Error loading options:', err);
        setError('Failed to load filter options. Please refresh the page.');
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  // Load personalized feed
  const loadPersonalizedFeed = async () => {
    try {
      setLoading(true);

      let categoryNames: string[];
      if (activeCategory === 'All') {
        categoryNames = userPreferences.categories_selected
          .map((id: any) => availableCategories.find(cat => cat.id === id)?.name)
          .filter(Boolean) as string[];
        if (categoryNames.length === 0) {
          categoryNames = ['Generative AI', 'Machine Learning'];
        }
      } else {
        categoryNames = [activeCategory];
      }

      let contentTypeNames: string[];
      const tabToContentTypeMap: Record<string, string> = {
        'news': 'blog',
        'audio': 'podcast',
        'video': 'video'
      };

      const selectedContentType = tabToContentTypeMap[selectedTab];
      if (selectedContentType) {
        contentTypeNames = [selectedContentType];
      } else {
        contentTypeNames = ['blog', 'video', 'podcast'];
      }

      let publisherNames: string[];
      if (userPreferences.publishers_selected.includes('all') || userPreferences.publishers_selected.length === 0) {
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
        interests: categoryNames,
        content_types: contentTypeNames,
        publishers: publisherNames,
        time_filter: getTimeFilterString(dateFilter),
        search_query: '',
        limit: 500
      };

      const response = await apiService.getPersonalizedFeed(filterRequest);

      // Transform personalized feed into LandingContent structure
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
            summary: item.summary || item.description || 'No description available',
            description: item.summary || item.description,
            type: item.content_type_label || item.content_type || item.type || 'blog',
            content_type: item.content_type_label || item.content_type || item.type,
            category: group.category,
            category_name: group.category,
            thumbnail_url: item.thumbnail_url || item.thumbnail || item.image,
            image: item.thumbnail_url || item.thumbnail || item.image,
            readTime: item.read_time || item.readTime || '5 min'
          } as Article);
        });
      });

      // Group articles by category
      const categoriesMap = new Map<string, { blogs: Article[]; podcasts: Article[]; videos: Article[] }>();
      
      articles.forEach(article => {
        const cat = article.category_name || 'General';
        if (!categoriesMap.has(cat)) {
          categoriesMap.set(cat, { blogs: [], podcasts: [], videos: [] });
        }
        
        const content = categoriesMap.get(cat)!;
        const type = article.content_type?.toLowerCase() || '';
        
        if (type.includes('blog') || type.includes('article')) {
          content.blogs.push(article);
        } else if (type.includes('podcast')) {
          content.podcasts.push(article);
        } else if (type.includes('video')) {
          content.videos.push(article);
        }
      });

      // Convert to LandingContent structure
      const transformedContent: LandingContent = {
        categories: Array.from(categoriesMap.entries()).map(([name, content], index) => ({
          id: index + 1,
          name,
          priority: index + 1,
          description: '',
          content
        })),
        total_categories: categoriesMap.size
      };

      setLandingContent(transformedContent);
      updateContentCounts(transformedContent);
      setLoading(false);
    } catch (err) {
      console.error('Error loading personalized feed:', err);
      setLoading(false);
    }
  };

  const updateContentCounts = (content: LandingContent) => {
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
  };

  // Reload feed when filters change
  useEffect(() => {
    if (availableCategories.length > 0 && availableContentTypes.length > 0 && availablePublishers.length > 0) {
      loadPersonalizedFeed();
    }
  }, [dateFilter, activeCategory, selectedTab]);

  // Update preferences when user changes
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

  // Sync with parent layout's tab state
  useEffect(() => {
    if (outletContext?.selectedTab && outletContext.selectedTab !== selectedTab) {
      console.log('🔄 Dashboard: Syncing tab from layout:', outletContext.selectedTab);
      setSelectedTab(outletContext.selectedTab);
    }
  }, [outletContext?.selectedTab, selectedTab]);

  const getTabContent = () => {
    if (isSearchActive && searchResults) {
      // Return search results
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

    if (!landingContent?.categories) return [];

    // Get content from all categories or filtered category
    const relevantCategories = activeCategory === 'All'
      ? landingContent.categories
      : landingContent.categories.filter(cat => cat.name === activeCategory);

    let allContent: Article[] = [];
    relevantCategories.forEach(cat => {
      switch (selectedTab) {
        case 'news':
          allContent = [...allContent, ...(cat.content?.blogs || [])];
          break;
        case 'audio':
          allContent = [...allContent, ...(cat.content?.podcasts || [])];
          break;
        case 'video':
          allContent = [...allContent, ...(cat.content?.videos || [])];
          break;
      }
    });

    return allContent;
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setIsSearchActive(false);
      setSearchResults(null);
      setSearchCounts(null);
      setSearchQuery('');
      setSearchError(null);
      loadPersonalizedFeed();
      return;
    }

    try {
      setLoading(true);
      setIsSearchActive(true);
      setSearchQuery(query);
      setSearchError(null);
      
      // Clear category selection when searching
      setActiveCategory('All');
      
      // Notify ResponsiveLayout to clear category selection in RightSection
      if (outletContext?.onSearchStart) {
        outletContext.onSearchStart();
      }

      const categoryId = activeCategory === 'All' 
        ? undefined 
        : availableCategories.find(cat => cat.name === activeCategory)?.id;

      const searchResponse = await apiService.searchContent(
        query,
        categoryId,
        dateFilter,
        20
      );

      const totalResults = searchResponse.counts.total;
      if (totalResults === 0) {
        setSearchError(`No results found for "${query}"`);
        setSearchResults({ blogs: [], podcasts: [], videos: [] });
        setSearchCounts({ blogs: 0, podcasts: 0, videos: 0, total: 0 });
      } else {
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
    } catch (err: any) {
      console.error('Search failed:', err);
      setSearchError(`Search temporarily unavailable. Please try again.`);
      setIsSearchActive(true);
      setSearchResults({ blogs: [], podcasts: [], videos: [] });
      setSearchCounts({ blogs: 0, podcasts: 0, videos: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCategoryChange = React.useCallback((categoryName: string) => {
    console.log('🔄 Dashboard: Category changed to:', categoryName);
    setActiveCategory(categoryName);

    // Clear search if active
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchResults(null);
      setSearchCounts(null);
      setSearchQuery('');
    }
    // loadPersonalizedFeed will be called by the useEffect watching activeCategory
  }, [isSearchActive]);

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

      // Auto-close dialog and modal after 2 seconds
      setTimeout(() => {
        setShowSuccessDialog(false);
        setShowSettingsModal(false);
        // Reload feed with new preferences
        loadPersonalizedFeed();
      }, 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Failed to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Simplified context value - RightSection now fetches its own categories
  useEffect(() => {
    if (outletContext?.onCategoryChangeHandlerSet) {
      outletContext.onCategoryChangeHandlerSet(handleCategoryChange);
    }
  }, [handleCategoryChange, outletContext]);

  // Register settings click handler
  useEffect(() => {
    if (outletContext?.onSettingsClickHandlerSet) {
      outletContext.onSettingsClickHandlerSet(() => setShowSettingsModal(true));
    }
  }, [outletContext]);

  // Register trending topic click handler
  useEffect(() => {
    if (outletContext?.onTrendingHandlerSet) {
      outletContext.onTrendingHandlerSet(handleSearch);
    }
  }, [outletContext]);
  const dashboardContextValue: DashboardContextType = useMemo(() => {
    const contextValue = {
      content: getTabContent(),
      selectedCategory: activeCategory,
      selectedTab,
      categories: availableCategories && Array.isArray(availableCategories) 
        ? availableCategories.map(cat => cat.name).filter(Boolean)
        : []
    };
    
    return contextValue;
  }, [availableCategories, activeCategory, selectedTab, landingContent, isSearchActive, searchResults]);

  // Remove the debug window exposure in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).dashboardContext = dashboardContextValue;
    }
  }, [dashboardContextValue]);

  return (
    <SearchProvider
      onSearch={handleSearch}
      categoryId={activeCategory === 'All' ? undefined : availableCategories.find(cat => cat.name === activeCategory)?.id}
      showSearch={true}
    >
      <DashboardContext.Provider value={dashboardContextValue}>
        <SEO
          title="AI News Dashboard | Vidyagam"
          description="Your personalized AI news dashboard"
          keywords="AI news, dashboard, artificial intelligence"
        />

        {loading ? (
          <LandingSkeleton />
        ) : (
          <>
            <Header 
              isAuthenticated={true} 
              user={user ? { name: user.email || 'User', email: user.email } : undefined}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onPreferencesClick={() => navigate('/preferences')}
              onMenuClick={outletContext?.onMenuClick}
              onTrendingClick={outletContext?.onTrendingClick}
            />
            
            {/* Content wrapper - properly aligned */}
            <Box sx={{ 
              width: '100%',
              minHeight: '100vh',
              p: 3
            }}>
              <Box sx={{ 
                display: 'flex',
                gap: 3,
                maxWidth: '1400px',  // ✅ Adjusted max width
                mx: 'auto',
                width: '100%'
              }}>
                {/* Center Content */}
                <Box sx={{ 
                  flex: 1,
                  minWidth: 0
                }}>
                  {/* Breadcrumb showing active filters */}
                  {!isSearchActive && (
                    <Paper
                      elevation={0}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        mb: 2,
                        gap: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        border: 1,
                        borderColor: alpha(theme.palette.primary.main, 0.1)
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Your Feed:
                      </Typography>
                      <Chip
                        label={activeCategory}
                        size="small"
                        color={activeCategory === 'All' ? 'default' : 'primary'}
                        sx={{ fontWeight: 600 }}
                      />
                      <ChevronRight size={16} color={theme.palette.text.secondary} />
                      <Chip
                        label={selectedTab === 'news' ? 'Articles' : selectedTab === 'audio' ? 'Podcasts' : selectedTab === 'video' ? 'Videos' : selectedTab}
                        size="small"
                        color="secondary"
                        sx={{ fontWeight: 600 }}
                      />
                      <ChevronRight size={16} color={theme.palette.text.secondary} />
                      <Chip
                        label={`Last ${dateFilter === 1 ? '24h' : dateFilter === 7 ? 'Week' : dateFilter === 30 ? 'Month' : 'Year'}`}
                        size="small"
                        variant="outlined"
                      />
                    </Paper>
                  )}

                  {/* Search Error/No Results Message */}
                  {isSearchActive && searchError && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 6,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 3,
                        mb: 3
                      }}
                    >
                      <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔍</Typography>
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        {searchError}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Try adjusting your search terms or filters
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => handleSearch('')}
                      >
                        Clear Search
                      </Button>
                    </Paper>
                  )}

                  {/* Search Active Indicator */}
                  {isSearchActive && !searchError && searchCounts && (
                    <Paper
                      elevation={0}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        mb: 3,
                        gap: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        borderRadius: 2,
                        border: 1,
                        borderColor: alpha(theme.palette.info.main, 0.2)
                      }}
                    >
                      <Typography sx={{ flex: 1 }}>
                        🔍 Showing search results for <strong>"{searchQuery}"</strong>
                      </Typography>
                      <Chip
                        label={`${searchCounts.total} result${searchCounts.total !== 1 ? 's' : ''}`}
                        color="info"
                        size="small"
                      />
                      <Button
                        size="small"
                        onClick={() => handleSearch('')}
                      >
                        Clear ✕
                      </Button>
                    </Paper>
                  )}

                  {/* Content Section */}
                  {selectedTab === 'news' && (
                    <NewsItemContainer
                      headerTitle="Your Personalized AI News"
                      headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                      articles={getTabContent().slice(0, 20)}
                      contentType="blog"
                      showInteractions={true}
                      emptyMessage="No articles found. Try adjusting your preferences."
                      emptyIcon="📰"
                    />
                  )}

                  {/* Audio Tab */}
                  {selectedTab === 'audio' && (
                    <NewsItemContainer
                      headerTitle="Your AI Podcasts"
                      headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                      articles={getTabContent().slice(0, 20)}
                      contentType="podcast"
                      showInteractions={true}
                      emptyMessage="No podcasts available. Try adjusting your preferences."
                      emptyIcon="🎧"
                    />
                  )}

                  {/* Video Tab */}
                  {selectedTab === 'video' && (
                    <NewsItemContainer
                      headerTitle="Your AI Videos"
                      headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                      articles={getTabContent().slice(0, 20)}
                      contentType="video"
                      showInteractions={true}
                      emptyMessage="No videos available. Try adjusting your preferences."
                      emptyIcon="📹"
                    />
                  )}

                  {/* Posts Tab */}
                  {selectedTab === 'posts' && (
                    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                      <Typography sx={{ fontSize: '4rem', mb: 2 }}>🗨️</Typography>
                      <Typography variant="h3" fontWeight={700} gutterBottom>
                        Community Coming Soon
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                        Join discussions with AI experts and learners
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/preferences')}
                        sx={{ px: 4 }}
                      >
                        Manage Preferences
                      </Button>
                    </Box>
                  )}

                  {/* Learning Tab */}
                  {selectedTab === 'learning' && (
                    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                      <Typography sx={{ fontSize: '4rem', mb: 2 }}>🎓</Typography>
                      <Typography variant="h3" fontWeight={700} gutterBottom>
                        Learning Paths Coming Soon
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                        Structured courses from beginner to expert
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/preferences')}
                        sx={{ px: 4 }}
                      >
                        Manage Preferences
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <SettingsFullScreen
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
            availableCategories={availableCategories}
            availableContentTypes={availableContentTypes}
            availablePublishers={availablePublishers}
            onClose={() => setShowSettingsModal(false)}
            onSave={handleSaveSettings}
            savingSettings={savingSettings}
            setSettingsChanged={() => {}}
          />
        )}

        {/* Success Dialog */}
        {showSuccessDialog && (
          <Box
            sx={{
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
            <Paper
              elevation={24}
              sx={{
                borderRadius: 4,
                p: 4,
                maxWidth: 400,
                width: '90%',
                animation: 'slideUp 0.3s ease-out',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  animation: 'scaleIn 0.5s ease-out'
                }}
              >
                <Typography sx={{ fontSize: '2rem' }}>✓</Typography>
              </Box>

              <Typography variant="h5" fontWeight={700} gutterBottom>
                Settings Saved!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Your preferences have been updated successfully. Your personalized feed is being refreshed...
              </Typography>

              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setShowSuccessDialog(false);
                  setShowSettingsModal(false);
                }}
                sx={{ borderRadius: 2.5, py: 1.25, fontWeight: 600 }}
              >
                OK
              </Button>
            </Paper>
          </Box>
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
      </DashboardContext.Provider>
    </SearchProvider>
  );
};

export default NewDashboard;