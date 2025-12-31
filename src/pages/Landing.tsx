import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Menu as MenuIcon,
  KeyboardArrowDown
} from '@mui/icons-material';
import SEO from '../components/SEO';
import { LandingSkeleton } from '../components/LoadingSkeleton';
import ThreeColumnLayout from '../components/layout/ThreeColumnLayout';
import Header from '../newcomponents/Header';
import { SearchProvider } from '../contexts/SearchContext';
import SidebarNavigation from '../components/layout/SidebarNavigation';
import RecommendationsPanel from '../components/layout/RecommendationsPanel';
import { apiService } from '../services/api';
import type { Article, Category, LandingContent } from '../types/article';
import { getContentTypeInfo, formatTimeAgo, getArticleSummary, getArticleSource } from '../types/article';
import { cacheService, CACHE_DURATION } from '../utils/cacheService';
import HorizontalArticleCard from '../newcomponents/cards/HorizontalArticleCard';
import CardContainer from '../newcomponents/cards/CardContainer';
import RightSection from '../newcomponents/RightSection';

interface MenuItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const Landing: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

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
  const [contentTypeTabs, setContentTypeTabs] = useState<Array<{ id: string; icon: string; label: string }>>([]);
  const [dateFilter, setDateFilter] = useState<1 | 7 | 30 | 365>(7); // Default 7 days
  const [loadedContentTypes, setLoadedContentTypes] = useState<Set<number>>(new Set([1])); // Track loaded content types (start with blogs)
  const [contentTypeCache, setContentTypeCache] = useState<Map<string, any>>(new Map()); // Cache content by category+type
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false); // ✅ Prevent duplicate initial loads

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
        const typeToTab: Record<string, { id: string; icon: string }> = {
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
        ].filter(Boolean) as Array<{ id: string; icon: string; label: string }>;

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

      {loading ? (
        <LandingSkeleton />
      ) : (
        <SearchProvider
          onSearch={handleSearch}
          categoryId={
            activeCategory === 'All'
              ? undefined
              : landingContent?.categories.find(cat => cat.name === activeCategory)?.id
          }
          showSearch={true}
        >
          <Header isAuthenticated={false} />
          
          <Stack spacing={2} direction="row" sx={{ minHeight: '100vh', bgcolor: 'background.default' }} >
            <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
              {/* Search Error/No Results Message */}
              {isSearchActive && searchError && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 3
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
                <CardContainer
                  headerTitle="Latest AI News"
                  headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                  articles={getTabContent().slice(0, 20)}
                  contentType="blog"
                  showInteractions={false}
                  emptyMessage="No articles found"
                  emptyIcon="📰"
                />
              )}

              {/* Audio Tab */}
              {selectedTab === 'audio' && (
                <CardContainer
                  headerTitle="AI Podcasts"
                  headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                  articles={getTabContent().slice(0, 20)}
                  contentType="podcast"
                  showInteractions={false}
                  emptyMessage="No podcasts available yet"
                  emptyIcon="🎧"
                />
              )}

              {/* Video Tab */}
              {selectedTab === 'video' && (
                <CardContainer
                  headerTitle="AI Videos"
                  headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                  articles={getTabContent().slice(0, 20)}
                  contentType="video"
                  showInteractions={false}
                  emptyMessage="No videos available yet"
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
                    onClick={() => navigate('/auth')}
                    sx={{ px: 4 }}
                  >
                    Join Waitlist
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
                    onClick={() => navigate('/auth')}
                    sx={{ px: 4 }}
                  >
                    Join Waitlist
                  </Button>
                </Box>
              )}
          </Container>
          <Box
            sx={{
              width: 320,
              flexShrink: 0,
              display: { xs: 'none', lg: 'block' },
              pr: 2,
              py: 4
            }}
          >
            <RightSection />
          </Box>
        </Stack>
        </SearchProvider>
      )}
    </>
  );
};

export default Landing;
