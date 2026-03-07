import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { LandingSkeleton } from '../components/LoadingSkeleton';
import SEO from '../components/SEO';
import { SearchProvider } from '../contexts/SearchContext';
import NewsItemContainer from '../newcomponents/cards/NewsItemContainer';
import Header from '../newcomponents/Header';
import PostsTab from '../newcomponents/PostsTab';
import { apiService } from '../services/api';
import type { Article, LandingContent } from '../types/article';
import { CACHE_DURATION, cacheService } from '../utils/cacheService';

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
  const outletContext = useOutletContext<{
    dateFilter?: 1 | 7 | 30 | 365;
    onDateFilterChange?: (filter: 1 | 7 | 30 | 365) => void;
    selectedTab?: 'news' | 'audio' | 'video' | 'posts' | 'courses' | 'jobs' | 'events';
    onTabChange?: (tab: 'news' | 'audio' | 'video' | 'posts' | 'courses' | 'jobs' | 'events') => void;
    onCategoryChangeHandlerSet?: (handler: (category: string) => void) => void;
    onSearchStart?: () => void;
    onMenuClick?: () => void;
    onTrendingClick?: () => void;
    onTrendingHandlerSet?: (handler: (topic: string) => void) => void;
  }>();

  // Check if caching is enabled via environment variable (disabled by default)
  const isCacheEnabled = import.meta.env.VITE_ENABLE_CACHE === 'true';

  // ✅ ADD THIS STATE
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);

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
    courses: Article[];
    jobs: Article[];
    events: Article[];
  } | null>(null);
  const [searchCounts, setSearchCounts] = useState<{
    blogs: number;
    podcasts: number;
    videos: number;
    courses?: number;
    jobs?: number;
    events?: number;
    total: number;
  } | null>(null);
  const [contentCounts, setContentCounts] = useState<{
    blogs: number;
    podcasts: number;
    videos: number;
  } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'news' | 'posts' | 'audio' | 'video' | 'courses' | 'jobs' | 'events'>('news');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [contentTypeTabs, setContentTypeTabs] = useState<Array<{ id: string; icon: string; label: string }>>([]);
  const dateFilter = outletContext?.dateFilter || 7;
  const setDateFilter = outletContext?.onDateFilterChange || (() => { });
  const [loadedContentTypes, setLoadedContentTypes] = useState<Set<number>>(new Set([1])); // Track loaded content types (start with blogs)
  const [contentTypeCache, setContentTypeCache] = useState<Map<string, any>>(new Map()); // Cache content by category+type
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false); // ✅ Prevent duplicate initial loads
  const [visibleItemsCount, setVisibleItemsCount] = useState(20);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Helper function to get current content based on mode
  const getCurrentContent = (): Article[] => {
    // Search mode
    if (isSearchActive && searchResults) {
      return [
        ...searchResults.blogs,
        ...searchResults.podcasts,
        ...searchResults.videos,
        ...(searchResults.courses || [])
      ];
    }

    // Normal browsing mode
    if (!landingContent) return [];

    if (activeCategory === 'All') {
      const allContent: Article[] = [];
      if (landingContent.categories) {
        landingContent.categories.forEach(cat => {
          allContent.push(
            ...cat.content.blogs,
            ...cat.content.podcasts,
            ...cat.content.videos,
            ...(cat.content.courses || []),
            ...(cat.content.posts || []),
            ...(cat.content.events || []),
            ...(cat.content.jobs || [])
          );
        });
      }
      return allContent;
    } else {
      const category = landingContent.categories?.find(cat => cat.name === activeCategory);
      if (category) {
        return [
          ...category.content.blogs,
          ...category.content.podcasts,
          ...category.content.videos,
          ...(category.content.courses || []),
          ...(category.content.posts || []),
          ...(category.content.events || []),
          ...(category.content.jobs || [])
        ];
      }
    }
    return [];
  };

  // Memoize filtered content to prevent redundant filtering on each render
  const tabContent = useMemo(() => {
    const allContent = getCurrentContent();

    switch (selectedTab) {
      case 'news':
        return allContent.filter(item => {
          const isArticle = item.content_type === 'article' ||
            item.content_type === 'blog' ||
            item.content_type === 'blogs' ||
            item.type === 'blog' ||
            item.type === 'blogs' ||
            item.type === 'article';
          return isArticle;
        });

      case 'audio':
        return allContent.filter(item =>
          item.content_type === 'podcast' ||
          item.content_type === 'podcasts' ||
          item.content_type === 'audio' ||
          item.type === 'audio' ||
          item.type === 'podcast' ||
          item.type === 'podcasts'
        );

      case 'video':
        return allContent.filter(item =>
          item.content_type === 'video' ||
          item.content_type === 'videos' ||
          item.type === 'video' ||
          item.type === 'videos'
        );
        case 'courses':
          return allContent.filter(item =>
            item.content_type === 'course' ||
            item.content_type === 'courses' ||
            item.type === 'course' ||
            item.type === 'courses'
        );

      case 'jobs':
        return allContent.filter(item =>
          item.content_type === 'job' ||
          item.content_type === 'jobs' ||
          item.type === 'job' ||
          item.type === 'jobs' ||
          item.content_type_label === 'Jobs' ||
          item.content_type_name === 'Jobs'
        );

      case 'events':
        return allContent.filter(item =>
          item.content_type === 'event' ||
          item.content_type === 'events' ||
          item.type === 'event' ||
          item.type === 'events' ||
          item.content_type_label === 'Events' ||
          item.content_type_name === 'Events'
        );

      default:
        return allContent;
    }
  }, [landingContent, isSearchActive, searchResults, selectedTab, activeCategory]);

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

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!contentContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollPosition = scrollTop + clientHeight;
      const threshold = scrollHeight - 500; // Load more when 500px from bottom

      if (scrollPosition > threshold) {
        const totalContent = tabContent.length;
        if (visibleItemsCount < totalContent) {
          setVisibleItemsCount(prev => Math.min(prev + 20, totalContent));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleItemsCount, tabContent]);

  // Reset visible items when tab or category changes
  useEffect(() => {
    setVisibleItemsCount(20);
  }, [selectedTab, activeCategory, isSearchActive]);

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

        // Add Posts and courses tabs (coming soon)
        tabs.push(
          { id: 'posts', icon: '🗨️', label: 'Posts' },
          { id: 'courses', icon: '🎓', label: 'Courses' }
        );

        // Reorder to: News, Podcasts, Videos, Posts, Courses
        const orderedTabs = [
          tabs.find(t => t.id === 'news'),
          tabs.find(t => t.id === 'audio'),
          tabs.find(t => t.id === 'video'),
          tabs.find(t => t.id === 'posts'),
          tabs.find(t => t.id === 'courses')
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
          { id: 'courses', icon: '🎓', label: 'Courses' }
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
        { id: 'courses', icon: '🎓', label: 'Courses' }
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
      console.log('🔄 Fetching content - Category:', categoryId, 'ContentType:', contentTypeId, 'Days:', days);

      const landingResponse = await apiService.getLandingContent(50, days, categoryId, contentTypeId);

      console.log('📰 Landing Response:', landingResponse, 'for contentTypeId:', contentTypeId);

      if (landingResponse?.categories) {
        const transformedContent: LandingContent = {
          categories: landingResponse.categories.map(cat => ({
            ...cat,
            content: {
              // Only keep the content for the requested type
              blogs: contentTypeId === 1 || !contentTypeId
                ? (cat.content?.blogs || []).map((item: any) => ({
                  ...item,
                  url: item.url || item.link || '#',
                  time: item.published_date || new Date().toISOString(),
                  published_date: item.published_date || null,
                  readTime: '5 min'
                }))
                : [],
              podcasts: contentTypeId === 3 || !contentTypeId
                ? (cat.content?.podcasts || []).map((item: any) => ({
                  ...item,
                  url: item.url || item.link || '#',
                  time: item.published_date || new Date().toISOString(),
                  published_date: item.published_date || null,
                  readTime: '30 min'
                }))
                : [],
              videos: contentTypeId === 2 || !contentTypeId
                ? (cat.content?.videos || []).map((item: any) => ({
                  ...item,
                  url: item.url || item.link || '#',
                  time: item.published_date || new Date().toISOString(),
                  published_date: item.published_date || null,
                  readTime: '15 min'
                }))
                : [],
              posts: (cat.content?.posts || []).map((item: any) => ({
                ...item,
                url: item.url || item.link || '#',
                time: item.published_date || new Date().toISOString(),
                published_date: item.published_date || null,
                readTime: '10 min'
              })),
              courses: (cat.content?.courses || []).map((item: any) => ({
                ...item,
                url: item.url || item.link || '#',
                time: item.published_date || new Date().toISOString(),
                published_date: item.published_date || null,
                readTime: '60 min'
              })),
              jobs: (cat.content?.jobs || []).map((item: any) => ({
                ...item,
                url: item.url || item.link || '#',
                time: item.published_date || new Date().toISOString(),
                published_date: item.published_date || null,
              })),
              events: (cat.content?.events || []).map((item: any) => ({
                ...item,
                url: item.url || item.link || '#',
                time: item.published_date || new Date().toISOString(),
                published_date: item.published_date || null,
              }))
            }
          })),
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
        console.log('📊 Content by type:', {
          blogs: transformedContent.categories.reduce((sum, cat) => sum + (cat.content?.blogs?.length || 0), 0),
          podcasts: transformedContent.categories.reduce((sum, cat) => sum + (cat.content?.podcasts?.length || 0), 0),
          videos: transformedContent.categories.reduce((sum, cat) => sum + (cat.content?.videos?.length || 0), 0)
        });
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

    let coursesCount = 0;

    if (content && content.categories) {
      content.categories.forEach(cat => {
        blogsCount += (cat.content?.blogs || []).length;
        podcastsCount += (cat.content?.podcasts || []).length;
        videosCount += (cat.content?.videos || []).length;
        coursesCount += (cat.content?.courses || []).length;
      });
    }

    setContentCounts({
      blogs: blogsCount,
      podcasts: podcastsCount,
      videos: videosCount,
      courses: coursesCount
    } as any);

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

      // Clear category selection when searching
      setActiveCategory('All');

      // Notify ResponsiveLayout to clear category selection in RightSection
      if (outletContext?.onSearchStart) {
        outletContext.onSearchStart();
      }

      // Get category ID if not "All" (will be undefined after clearing above)
      const categoryId = undefined; // Always search across all categories

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
        setSearchResults({ blogs: [], podcasts: [], videos: [], courses: [], jobs: [], events: [] });
        setSearchCounts({ blogs: 0, podcasts: 0, videos: 0, courses: 0, total: 0 });
      } else {
        // Store search results
        setSearchResults({
          blogs: searchResponse.results.blogs.map((item: any) => ({
            ...item,
            url: item.url || item.link || '#',
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '5 min'
          })),
          podcasts: searchResponse.results.podcasts.map((item: any) => ({
            ...item,
            url: item.url || item.link || '#',
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '30 min'
          })),
          videos: searchResponse.results.videos.map((item: any) => ({
            ...item,
            url: item.url || item.link || '#',
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '15 min'
          })),
          courses: (searchResponse.results.courses || []).map((item: any) => ({
            ...item,
            url: item.url || item.link || '#',
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '60 min'
          })),
          jobs: (searchResponse.results.jobs || []).map((item: any) => ({
            ...item,
            url: item.url || item.link || '#',
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
          })),
          events: (searchResponse.results.events || []).map((item: any) => ({
            ...item,
            url: item.url || item.link || '#',
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
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
      setSearchResults({ blogs: [], podcasts: [], videos: [], courses: [], jobs: [], events: [] });
      setSearchCounts({ blogs: 0, podcasts: 0, videos: 0, courses: 0, total: 0 });
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
      'courses': 5, // courses
      'jobs': 6,    // jobs
      'events': 7   // events
    };

    return tabMap[tab];
  };

  // ✅ CONSOLIDATED: Single effect for all data loading
  useEffect(() => {
    // ✅ FIX: Use ref to prevent duplicate initial loads (React Strict Mode issue)
    const isInitialMount = !landingContent && !hasInitializedRef.current;

    // Handle initial load ONCE
    if (isInitialMount) {
      hasInitializedRef.current = true;

      const loadInitialData = async () => {
        console.log('⚡ Starting initial data load...');
        const startTime = performance.now();

        try {
          await Promise.all([
            fetchCategories(),
            fetchContentTypes()
          ]);

          // Load initial content with proper content type ID (blogs = 1)
          await fetchLandingContent(dateFilter, undefined, 1);

          const loadTime = performance.now() - startTime;
          console.log(`✅ Initial data loaded in ${Math.round(loadTime)}ms`);
        } catch (error) {
          console.error('❌ Initial data load failed:', error);
        }
      };

      loadInitialData();
      return;
    }

    // ✅ Handle search mode
    if (isSearchActive && searchQuery) {
      handleSearch(searchQuery);
      return;
    }

    // ✅ Handle filter changes
    console.log('📅 Loading content with filters - Date:', dateFilter, 'days, Category:', activeCategory, 'Tab:', selectedTab);

    const contentTypeMap: Record<string, number> = {
      news: 1,    // blogs
      audio: 3,   // podcasts
      video: 2,   // videos
      posts: 4,
      courses: 5, // courses
      jobs: 6,    // jobs
      events: 7   // events
    };
    const contentTypeId = contentTypeMap[selectedTab];

    // Get category ID
    const categoryId = activeCategory === 'All'
      ? undefined
      : getCategoryIdFromName(activeCategory);

    // Always fetch with the specific content type ID
    console.log('🔄 Loading content:', selectedTab, 'for category:', activeCategory, 'contentTypeId:', contentTypeId);
    fetchLandingContent(dateFilter, categoryId, contentTypeId);

  }, [dateFilter, activeCategory, selectedTab]);

  // Sync with parent layout's tab state (if available, but don't require it)
  useEffect(() => {
    if (outletContext?.selectedTab && outletContext.selectedTab !== selectedTab) {
      console.log('🔄 Landing: Syncing tab from layout:', outletContext.selectedTab);
      setSelectedTab(outletContext.selectedTab);
    }
  }, [outletContext?.selectedTab]);

  const handleTabChange = (newTab: 'news' | 'audio' | 'video' | 'posts' | 'courses') => {
    console.log('📑 Landing: Tab changed locally to:', newTab);
    setSelectedTab(newTab);
    // Try to sync with parent if handler exists
    if (outletContext?.onTabChange) {  // ✅ Now properly typed
      outletContext.onTabChange(newTab);
    }
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    // Debounce search - wait for user to stop typing
    clearTimeout((window as any).searchTimeout);
    (window as any).searchTimeout = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const handleCategoryChange = React.useCallback((categoryName: string) => {
    console.log('🔄 Landing: Category changed to:', categoryName);
    setActiveCategory(categoryName);

    // Clear search if active
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchResults(null);
      setSearchCounts(null);
      setSearchQuery('');
    }

    // Fetch content for the selected category
    const categoryId = categoryName === 'All'
      ? undefined
      : getCategoryIdFromName(categoryName);

    const contentTypeId = getContentTypeIdFromTab(selectedTab);

    fetchLandingContent(dateFilter, categoryId, contentTypeId);
  }, [isSearchActive, selectedTab, dateFilter]);

  // Register category change handler with parent layout
  useEffect(() => {
    if (outletContext?.onCategoryChangeHandlerSet) {
      outletContext.onCategoryChangeHandlerSet(handleCategoryChange);
    }
  }, [handleCategoryChange, outletContext]);

  // Register trending topic click handler
  useEffect(() => {
    if (outletContext?.onTrendingHandlerSet) {
      outletContext.onTrendingHandlerSet(handleSearch);
    }
  }, [outletContext]);

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
          {/* Header */}
          <Stack sx={{ bgcolor: 'background.default', justifyContent: 'space-between' }}>
            <Header
              isAuthenticated={false}
              onMenuClick={outletContext?.onMenuClick}
              onTrendingClick={outletContext?.onTrendingClick}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
            />
          </Stack>

          {/* Main Layout with SideNav */}
          <Box sx={{ display: 'flex' }}>
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: 'flex',
                width: '100%',
                minHeight: '100vh',
                //ml: {xs: 0, md: '0px' },  // ✅ Add back the margin left for sidebar
              }}
            >

              <Box sx={{
                display: 'flex',
                gap: 3,
                maxWidth: '1200px',  // ✅ Adjusted max width
                mx: 'auto',
                width: '100%'
              }}>
                <Container maxWidth="lg">
                  <Box sx={{
                    flex: 1,
                    minWidth: 0
                  }}>
                    {/* Breadcrumb showing active filters */}
                    {!isSearchActive && (
                      <Box sx={{ py: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            pt: { lg: 2 },
                            pl: { lg: 2 },
                            gap: 1
                          }}
                        >
                          <Chip
                            label={activeCategory}
                            size="small"
                            color={activeCategory === 'All' ? 'default' : 'primary'}
                            sx={{ fontWeight: 600 }}
                          />
                          <ChevronRight size={16} color={theme.palette.text.secondary} />
                          <Chip
                            label={selectedTab === 'news' ? 'Articles' : selectedTab === 'audio' ? 'Podcasts' : selectedTab === 'video' ? 'Videos' : selectedTab === 'posts' ? 'Posts' : selectedTab === 'courses' ? 'Courses' : selectedTab === 'jobs' ? 'Jobs' : selectedTab === 'events' ? 'Events' : selectedTab}
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
                        </Box>
                      </Box>
                    )}

                    {/* Content Type Tabs */}

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
                          px: 2,
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
                    <Box ref={contentContainerRef}>
                      {selectedTab === 'news' && (
                        <>
                          <NewsItemContainer
                            headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                            articles={tabContent.slice(0, visibleItemsCount)}
                            contentType="blog"
                            showInteractions={false}
                            emptyMessage="No articles found"
                            emptyIcon="📰"
                          />
                          {visibleItemsCount < tabContent.length && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                              <CircularProgress size={24} />
                              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Loading more articles...</Typography>
                            </Box>
                          )}
                        </>
                      )}

                      {/* Audio Tab */}
                      {selectedTab === 'audio' && (
                        <>
                          <NewsItemContainer
                            headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                            articles={tabContent.slice(0, visibleItemsCount)}
                            contentType="podcast"
                            showInteractions={false}
                            emptyMessage="No podcasts available yet"
                            emptyIcon="🎧"
                          />
                          {visibleItemsCount < tabContent.length && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                              <CircularProgress size={24} />
                              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Loading more podcasts...</Typography>
                            </Box>
                          )}
                        </>
                      )}

                      {/* Video Tab */}
                      {selectedTab === 'video' && (
                        <>
                          <NewsItemContainer
                            headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                            articles={tabContent.slice(0, visibleItemsCount)}
                            contentType="video"
                            showInteractions={false}
                            emptyMessage="No videos available yet"
                            emptyIcon="📹"
                          />
                          {visibleItemsCount < tabContent.length && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                              <CircularProgress size={24} />
                              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Loading more videos...</Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>

                    {/* Posts Tab */}
                    {selectedTab === 'posts' && (
                      <PostsTab />
                    )}

                    {/* Courses Tab */}
                    {selectedTab === 'courses' && (
                      <Box>
                        <NewsItemContainer
                          headerTitle={`🎓 AI Courses - ${activeCategory}`}
                          headerSubtitle="Learn AI through curated courses and tutorials"
                          articles={tabContent.slice(0, visibleItemsCount)}
                          contentType="course"
                          showInteractions={false}
                          emptyMessage="No courses available yet"
                          emptyIcon="🎓"
                        />
                        {visibleItemsCount < tabContent.length && (
                          <Box sx={{ textAlign: 'center', py: 3 }}>
                            <CircularProgress size={24} />
                            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                              Loading more courses...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Jobs Tab */}
                    {selectedTab === 'jobs' && (
                      <Box>
                        <NewsItemContainer
                          headerTitle={`💼 AI & ML Jobs - ${activeCategory}`}
                          headerSubtitle="Open positions in Gen AI, Machine Learning, and AI Infrastructure"
                          articles={tabContent.slice(0, visibleItemsCount)}
                          contentType="job"
                          showInteractions={false}
                          emptyMessage="No AI/ML job listings available yet"
                          emptyIcon="💼"
                        />
                        {visibleItemsCount < tabContent.length && (
                          <Box sx={{ textAlign: 'center', py: 3 }}>
                            <CircularProgress size={24} />
                            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                              Loading more jobs...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Events Tab */}
                    {selectedTab === 'events' && (
                      <Box>
                        <NewsItemContainer
                          headerTitle={`📅 AI & ML Events - ${activeCategory}`}
                          headerSubtitle="Conferences, workshops, and meetups in AI, Cloud, and Machine Learning"
                          articles={tabContent.slice(0, visibleItemsCount)}
                          contentType="event"
                          showInteractions={false}
                          emptyMessage="No AI/ML events available yet"
                          emptyIcon="📅"
                        />
                        {visibleItemsCount < tabContent.length && (
                          <Box sx={{ textAlign: 'center', py: 3 }}>
                            <CircularProgress size={24} />
                            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                              Loading more events...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Container>
              </Box>
            </Box>
          </Box>
        </SearchProvider>
      )}
    </>
  );
};

export default Landing;