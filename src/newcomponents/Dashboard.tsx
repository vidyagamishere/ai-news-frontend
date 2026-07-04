import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Bookmark, ChevronRight, Settings } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { LandingSkeleton } from '../components/LoadingSkeleton';
import SEO from '../components/SEO';
import SettingsFullScreen from '../components/SettingsFullScreen';
import UserStatsPage from '../components/UserStatsPage';
import { useAuth } from '../contexts/AuthContext';
import { DashboardContext, type DashboardContextType } from '../contexts/DashboardContext';
import { SearchProvider } from '../contexts/SearchContext';
import type { Article } from '../services/api';
import { apiService, mapArticleImagesAsync } from '../services/api';
import type { LandingContent } from '../types/article';
import { CACHE_DURATION, cacheService } from '../utils/cacheService';
import Header from './Header';
import PostsTab from './PostsTab';
import CourseContainer from './cards/CourseContainer';
import EventContainer from './cards/EventContainer';
import JobContainer from './cards/JobContainer';
import NewsItemContainer from './cards/NewsItemContainer';


const NewDashboard: React.FC = () => {
  const { user, isAuthenticated, logout, updatePreferences } = useAuth();
  const [showStatsModal, setShowStatsModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const outletContext = useOutletContext<{
    dateFilter?: 1 | 7 | 30 | 365;
    onDateFilterChange?: (filter: 1 | 7 | 30 | 365) => void;
    selectedTab?: 'news' | 'audio' | 'video' | 'posts' | 'courses' | 'jobs' | 'events';
    onTabChange?: (tab: 'news' | 'audio' | 'video' | 'posts' | 'courses' | 'jobs' | 'events') => void;
    onCategoryChangeHandlerSet?: (handler: (category: string) => void) => void;
    onSettingsClickHandlerSet?: (handler: () => void) => void;
    onBookmarksClickHandlerSet?: (handler: () => void) => void;  // ✅ ADD THIS
    onStatsClickHandlerSet?: (handler: () => void) => void;      // ✅ ADD THIS
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
    courses: Article[];
    posts: Article[];
    jobs: Article[];
    events: Article[];
  } | null>(null);
  const [searchCounts, setSearchCounts] = useState<{
    blogs: number;
    podcasts: number;
    videos: number;
    courses: number;
    posts: number;
    jobs: number;
    events: number;
    total: number;
  } | null>(null);
  const [contentCounts, setContentCounts] = useState<{
    blogs: number;
    podcasts: number;
    videos: number;
    courses: number;
    posts: number;
    jobs: number;
    events: number;
  } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'news' | 'audio' | 'video' | 'posts' | 'courses' | 'jobs' | 'events'>('news');
  const dateFilter = outletContext?.dateFilter || 7;
  const setDateFilter = outletContext?.onDateFilterChange || (() => { });
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<any[]>([]);
  const [availablePublishers, setAvailablePublishers] = useState<any[]>([]);
  const hasInitializedOptions = useRef(false);
  const [visibleItemsCount, setVisibleItemsCount] = useState(20);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [savedArticles, setSavedArticles] = useState<Article[] | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [userPreferences, setUserPreferences] = useState({
    experience_level: user?.preferences?.experience_level || 'intermediate',
    professional_roles: (user?.preferences as any)?.professional_roles || ['enthusiast'],
    categories_selected: (user?.preferences as any)?.category_ids_selected || [],
    content_types_selected: (user?.preferences as any)?.content_type_ids_selected || [],
    publishers_selected: (user?.preferences as any)?.publisher_ids_selected || [],
    // Email & Newsletter preferences (read from saved user preferences)
    newsletter_subscribed: (user?.preferences as any)?.newsletter_subscribed ?? true,
    newsletter_frequency: (user?.preferences as any)?.newsletter_frequency || 'weekly',
    email_notifications: (user?.preferences as any)?.email_notifications ?? true,
    breaking_news_alerts: (user?.preferences as any)?.breaking_news_alerts ?? false,
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


  // Load personalized feed
  const loadPersonalizedFeed = React.useCallback(async () => {
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
        'news': 'blogs',
        'audio': 'podcasts',
        'video': 'videos',
        'courses': 'courses',
        'jobs': 'jobs',
        'events': 'events'
      };
      // ID-based mapping matches DB content_types table
      const tabToContentTypeIdMap: Record<string, number> = {
        'news': 1,
        'video': 2,
        'audio': 3,
        'posts': 4,
        'courses': 5,
        'jobs': 6,
        'events': 7
      };

      const selectedContentType = tabToContentTypeMap[selectedTab];
      const selectedContentTypeId = tabToContentTypeIdMap[selectedTab];
      if (selectedContentType) {
        contentTypeNames = [selectedContentType];
      } else {
        contentTypeNames = ['blogs', 'videos', 'podcasts', 'courses'];
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
        content_type_ids: selectedContentTypeId ? [selectedContentTypeId] : [],
        publishers: publisherNames,
        time_filter: getTimeFilterString(dateFilter),
        search_query: '',
        limit: 500
      };

      const response = await apiService.getPersonalizedFeed(filterRequest);

      // 🔍 DEBUG: Print raw backend response
      console.group('🔍 [Dashboard] Personalized feed raw response');
      console.log('filterRequest sent:', filterRequest);
      console.log('total_items:', response.total_items);
      console.log('grouped_content groups:', response.grouped_content?.length);
      response.grouped_content?.forEach((group: any) => {
        const sample = group.items?.[0];
        console.log(`  📂 ${group.category} (${group.items?.length} items) | sample content_type_label:`, sample?.content_type_label, '| content_type_id:', sample?.content_type_id);
      });
      console.groupEnd();

      // Transform personalized feed into LandingContent structure
      const articles: Article[] = [];
      response.grouped_content?.forEach((group: any) => {
        group.items?.forEach((item: any) => {
          // 🎫 DEBUG: Log event items to trace event_date
          if (item.content_type_label?.toLowerCase()?.includes('event') || item.content_type_id === 7) {
            console.log('🎫 [Dashboard] Mapping event item from personalized feed API:', item);
            console.log('   event_date (top-level):', item.event_date);
            console.log('   metadata:', item.metadata);
            console.log('   metadata?.event_date:', item.metadata?.event_date);
          }

          articles.push({
            id: item.id?.toString() || Math.random().toString(),
            slug: item.slug,
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
            readTime: item.read_time || item.readTime || '5 min',
            significanceScore: item.significance_score || 5,
            // ✅ Map user interaction states from backend
            is_liked: item.has_liked || false,
            is_bookmarked: item.has_bookmarked || false,
            is_viewed: item.has_viewed || false,
            // ✅ Map total counts from article_stats (visible to all users)
            likes: item.total_likes || 0,
            bookmarks: item.total_bookmarks || 0,
            views: item.total_views || 0,
            shares: item.total_shares || 0,
            comments: item.total_comments || 0,
            engagement_score: item.engagement_score || 0,
            // ✅ Map metadata fields (event_date, instructor, company, etc.)
            event_date: item.event_date || item.metadata?.event_date,
            event_location: item.event_location || item.metadata?.event_location,
            event_type: item.event_type || item.metadata?.event_type,
            is_virtual: item.is_virtual ?? item.metadata?.is_virtual,
            event_hosts: item.event_hosts || item.metadata?.event_hosts,
            registration_url: item.registration_url || item.metadata?.registration_url,
            instructor: item.instructor || item.metadata?.instructor,
            platform: item.platform || item.metadata?.platform,
            difficulty: item.difficulty || item.metadata?.difficulty,
            duration_hours: item.duration_hours || item.metadata?.duration_hours,
            is_free: item.is_free ?? item.metadata?.is_free,
            company: item.company || item.metadata?.company,
            job_title: item.job_title || item.metadata?.job_title,
            job_location: item.job_location || item.metadata?.job_location,
            is_remote: item.is_remote ?? item.metadata?.is_remote,
            salary_range: item.salary_range || item.metadata?.salary_range,
            application_deadline: item.application_deadline || item.metadata?.application_deadline,
            metadata: item.metadata
          } as Article);
        });
      });

      // Map Supabase category images (blog articles have no thumbnail_url in DB;
      // podcasts/videos already carry platform thumbnails so this is a no-op for them)
      const articlesWithImages = await mapArticleImagesAsync(articles);

      // 🔍 DEBUG: Print transformed articles sample
      console.group('🔍 [Dashboard] Transformed articles');
      console.log('Total articles:', articlesWithImages.length);
      const typeCounts: Record<string, number> = {};
      articlesWithImages.forEach(a => { const t = a.content_type || 'undefined'; typeCounts[t] = (typeCounts[t] || 0) + 1; });
      console.log('content_type breakdown:', typeCounts);
      console.groupEnd();

      // Group articles by category
      const categoriesMap = new Map<string, { blogs: Article[]; podcasts: Article[]; videos: Article[]; courses: Article[]; posts: Article[]; jobs: Article[]; events: Article[] }>();

      articlesWithImages.forEach((article, articleIndex) => {
        const cat = article.category_name || 'General';
        if (!categoriesMap.has(cat)) {
          categoriesMap.set(cat, { blogs: [], podcasts: [], videos: [], courses: [], posts: [], jobs: [], events: [] });
        }

        const content = categoriesMap.get(cat)!;
        const type = article.content_type?.toLowerCase() || '';

        if (articleIndex < 3) {
          console.log(`🔬 [GroupDebug] article[${articleIndex}] content_type="${article.content_type}" → type="${type}" | includes news=${type.includes('news')}`);
        }

        if (type.includes('blog') || type.includes('article') || type.includes('news')) {
          content.blogs.push(article);
        } else if (type.includes('podcast')) {
          content.podcasts.push(article);
        } else if (type.includes('video')) {
          content.videos.push(article);
        } else if (type.includes('course')) {
          content.courses.push(article);
        } else if (type.includes('job')) {
          content.jobs.push(article);
        } else if (type.includes('event')) {
          content.events.push(article);
        } else if (type.includes('post')) {
          content.posts.push(article);
        } else {
          console.warn('⚠️ [Dashboard] Unclassified article content_type:', article.content_type, '| title:', article.title?.slice(0, 40));
        }
      });

      // 🔍 DEBUG: Print grouped breakdown
      console.group('🔍 [Dashboard] After grouping');
      categoriesMap.forEach((content, cat) => {
        console.log(`  📂 ${cat}: blogs=${content.blogs.length} podcasts=${content.podcasts.length} videos=${content.videos.length} courses=${content.courses.length} jobs=${content.jobs.length} events=${content.events.length} posts=${content.posts.length}`);
      });
      console.log('selectedTab:', selectedTab, '| getTabContent will use: blogs bucket');
      console.groupEnd();

      // Convert to LandingContent structure
      const transformedContent: LandingContent = {
        categories: Array.from(categoriesMap.entries()).map(([name, content], index) => ({
          id: index + 1,
          name,
          priority: index + 1,
          description: '',
          content: { ...content }
        })),
        total_categories: categoriesMap.size
      };

      setLandingContent(transformedContent);
      console.log('🔍 [Dashboard] setLandingContent called — categories:', transformedContent.categories.length, '| first cat blogs:', transformedContent.categories[0]?.content?.blogs?.length ?? 'N/A');
      updateContentCounts(transformedContent);
      setLoading(false);
    } catch (err) {
      console.error('Error loading personalized feed:', err);
      setLoading(false);
    }
  }, [activeCategory, userPreferences, availableCategories, availablePublishers, selectedTab, dateFilter]);

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

  useEffect(() => {
    if (outletContext?.onStatsClickHandlerSet) {
      outletContext.onStatsClickHandlerSet(handleStatsClick);
    }
  }, [outletContext?.onStatsClickHandlerSet]);
  // Register stats handler with layout
  useEffect(() => {
    if (outletContext?.onStatsClickHandlerSet) {
      outletContext.onStatsClickHandlerSet(() => {
        setShowBookmarksOnly(false);
        setShowStatsModal(true);
      });
    }
  }, [outletContext]);

  const updateContentCounts = (content: LandingContent) => {
    let blogsCount = 0;
    let podcastsCount = 0;
    let videosCount = 0;
    let postsCount = 0;
    let coursesCount = 0;
    let jobsCount = 0;
    let eventsCount = 0;

    if (content && content.categories) {
      content.categories.forEach(cat => {
        blogsCount += (cat.content?.blogs || []).length;
        podcastsCount += (cat.content?.podcasts || []).length;
        videosCount += (cat.content?.videos || []).length;
        postsCount += (cat.content?.posts || []).length;
        coursesCount += (cat.content?.courses || []).length;
        jobsCount += (cat.content?.jobs || []).length;
        eventsCount += (cat.content?.events || []).length;
      });
    }

    setContentCounts({
      blogs: blogsCount,
      podcasts: podcastsCount,
      videos: videosCount,
      posts: postsCount,
      courses: coursesCount,
      jobs: jobsCount,
      events: eventsCount,
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
        publishers_selected: (user.preferences as any).publisher_ids_selected || [],
        newsletter_subscribed: (user.preferences as any)?.newsletter_subscribed ?? true,
        newsletter_frequency: (user.preferences as any)?.newsletter_frequency || 'weekly',
        email_notifications: (user.preferences as any)?.email_notifications ?? true,
        breaking_news_alerts: (user.preferences as any)?.breaking_news_alerts ?? false,
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
    // Bookmarks mode: return articles fetched from backend
    if (showBookmarksOnly) {
      return savedArticles || [];
    }

    let content: Article[];

    if (isSearchActive && searchResults) {
      // Return search results
      switch (selectedTab) {
        case 'news': content = searchResults.blogs; break;
        case 'audio': content = searchResults.podcasts; break;
        case 'video': content = searchResults.videos; break;
        case 'courses': content = searchResults.courses; break;
        case 'posts': content = searchResults.posts; break;
        case 'jobs': content = searchResults.jobs || []; break;
        case 'events': content = searchResults.events || []; break;
        default: content = [];
      }
    } else if (!landingContent?.categories) {
      content = [];
    } else {
      // Get content from all categories or filtered category
      const relevantCategories = activeCategory === 'All'
        ? landingContent.categories
        : landingContent.categories.filter(cat => cat.name === activeCategory);

      let allContent: Article[] = [];
      relevantCategories.forEach(cat => {
        switch (selectedTab) {
          case 'news': allContent = [...allContent, ...(cat.content?.blogs || [])]; break;
          case 'audio': allContent = [...allContent, ...(cat.content?.podcasts || [])]; break;
          case 'video': allContent = [...allContent, ...(cat.content?.videos || [])]; break;
          case 'courses': allContent = [...allContent, ...(cat.content?.courses || [])]; break;
          case 'posts': allContent = [...allContent, ...(cat.content?.posts || [])]; break;
          case 'jobs': allContent = [...allContent, ...(cat.content?.jobs || [])]; break;
          case 'events': allContent = [...allContent, ...(cat.content?.events || [])]; break;
        }
      });
      content = allContent;
    }

    return content;
  };

  const handleSearch = React.useCallback(async (query: string) => {
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
      setShowBookmarksOnly(false);

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
        setSearchResults({ blogs: [], podcasts: [], videos: [], courses: [], posts: [], jobs: [], events: [] });
        setSearchCounts({ blogs: 0, podcasts: 0, videos: 0, courses: 0, posts: 0, jobs: 0, events: 0, total: 0 });
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
          })),
          courses: (searchResponse.results.courses || []).map((item: any) => ({
            ...item,
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '60 min'
          })),
          posts: (searchResponse.results.posts || []).map((item: any) => ({
            ...item,
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '10 min'
          })) || [],
          jobs: (searchResponse.results.jobs || []).map((item: any) => ({
            ...item,
            time: item.published_date || new Date().toISOString(),
            published_date: item.published_date || null,
            readTime: '5 min'
          })),
          events: (searchResponse.results.events || []).map((item: any) => {
            // 🎫 DEBUG: Log event items from search results
            console.log('🎫 [Dashboard] Mapping event item from search results:', item);
            console.log('   event_date (top-level):', item.event_date);
            console.log('   metadata:', item.metadata);
            console.log('   metadata?.event_date:', item.metadata?.event_date);
            
            return {
              ...item,
              time: item.published_date || new Date().toISOString(),
              published_date: item.published_date || null,
              readTime: '5 min',
              // ✅ Map event metadata fields
              event_date: item.event_date || item.metadata?.event_date,
              event_location: item.event_location || item.metadata?.event_location,
              event_type: item.event_type || item.metadata?.event_type,
              is_virtual: item.is_virtual ?? item.metadata?.is_virtual,
              event_hosts: item.event_hosts || item.metadata?.event_hosts,
              registration_url: item.registration_url || item.metadata?.registration_url,
            };
          })
        });

        setSearchCounts({
          blogs: searchResponse.counts.blogs || 0,
          podcasts: searchResponse.counts.podcasts || 0,
          videos: searchResponse.counts.videos || 0,
          courses: searchResponse.counts.courses || 0,
          posts: searchResponse.counts.posts || 0,
          jobs: searchResponse.counts.jobs || 0,
          events: searchResponse.counts.events || 0,
          total: searchResponse.counts.total || 0
        });
        setSearchError(null);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setSearchError(`Search temporarily unavailable. Please try again.`);
      setIsSearchActive(true);
      setSearchResults({ blogs: [], podcasts: [], videos: [], courses: [], posts: [], jobs: [], events: [] });
      setSearchCounts({ blogs: 0, podcasts: 0, videos: 0, courses: 0, posts: 0, jobs: 0, events: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeCategory, availableCategories, dateFilter, outletContext, loadPersonalizedFeed]);

  useEffect(() => {
    const state = location.state as {
      preselectedTab?: 'news' | 'audio' | 'video' | 'posts' | 'courses' | 'jobs' | 'events';
      preselectedCategory?: string;
      initialSearchQuery?: string;
    } | null;

    if (!state) return;

    if (state.preselectedTab) {
      setSelectedTab(state.preselectedTab);
    }

    if (typeof state.preselectedCategory === 'string') {
      setActiveCategory(state.preselectedCategory);
      setShowBookmarksOnly(false);
      setShowStatsModal(false);
    }

    if (typeof state.initialSearchQuery === 'string' && state.initialSearchQuery.trim()) {
      handleSearch(state.initialSearchQuery.trim());
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, handleSearch]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Add handler (around line 500):
  const handleStatsClick = () => {
    setShowBookmarksOnly(false);
    setShowStatsModal(true);
  };

  const handleCategoryChange = React.useCallback((categoryName: string) => {
    console.log('🔄 Dashboard: Category changed to:', categoryName);
    setActiveCategory(categoryName);
    setShowBookmarksOnly(false);
    setShowStatsModal(false);

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
        newsletter_subscribed: userPreferences.newsletter_subscribed,
        newsletter_frequency: userPreferences.newsletter_frequency as "weekly" | "12_hours" | "daily" | "monthly",
        email_notifications: userPreferences.email_notifications,
        breaking_news_alerts: userPreferences.breaking_news_alerts,
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

  // Register bookmarks click handler
  useEffect(() => {
    if (outletContext?.onBookmarksClickHandlerSet) {
      outletContext.onBookmarksClickHandlerSet(() => {
        setShowStatsModal(false);
        setShowBookmarksOnly(true);
      });
    }
  }, [outletContext]);

  // Fetch real bookmarks from backend when entering bookmarks mode
  useEffect(() => {
    if (!showBookmarksOnly) {
      setSavedArticles(null);
      return;
    }
    setLoadingSaved(true);
    apiService.getBookmarks()
      .then(res => {
        const articles = (res.articles || []).map((item: any) => ({
          id: item.id?.toString() || '',
          title: item.title || 'Untitled',
          url: item.url || '#',
          source: item.source || 'Unknown',
          source_name: item.source || 'Unknown',
          time: item.published_date || new Date().toISOString(),
          published_date: item.published_date,
          summary: item.summary || '',
          type: item.content_type || 'blog',
          content_type: item.content_type_label || item.content_type || 'blog',
          category_name: item.category_name,
          thumbnail_url: item.thumbnail_url,
          image: item.thumbnail_url,
          is_bookmarked: true,
          likes: item.likes_count || 0,
          bookmarks: item.bookmarks_count || 0,
          views: item.views_count || 0,
          shares: item.shares_count || 0,
          comments: item.comments_count || 0,
        } as Article));
        setSavedArticles(articles);
      })
      .catch(err => {
        console.error('Failed to load saved articles:', err);
        setSavedArticles([]);
      })
      .finally(() => setLoadingSaved(false));
  }, [showBookmarksOnly]);

  // Register trending topic click handler
  useEffect(() => {
    if (outletContext?.onTrendingHandlerSet) {
      outletContext.onTrendingHandlerSet(handleSearch);
    }
  }, [outletContext, handleSearch]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!contentContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollPosition = scrollTop + clientHeight;
      const threshold = scrollHeight - 500; // Load more when 500px from bottom

      if (scrollPosition > threshold) {
        const totalContent = getTabContent().length;
        if (visibleItemsCount < totalContent) {
          setVisibleItemsCount(prev => Math.min(prev + 20, totalContent));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleItemsCount, landingContent, isSearchActive, searchResults, selectedTab, activeCategory]);

  // Reset visible items when tab or category changes
  useEffect(() => {
    setVisibleItemsCount(20);
  }, [selectedTab, activeCategory, isSearchActive]);
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
  }, [availableCategories, activeCategory, selectedTab, landingContent, isSearchActive, searchResults, showBookmarksOnly]);

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
              p: { xs: 0, lg: 4 }
            }}>
              <Container maxWidth="lg">
                <Box sx={{
                  display: 'flex',
                  gap: 3,
                  maxWidth: '1200px',  // ✅ Adjusted max width
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
                          px: 0,
                          py: 1,
                          mb: 2,
                          gap: 1,
                          background: 'none'
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

                    {/* Stats mode indicator */}
                    {showStatsModal && (
                      <Paper
                        elevation={0}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          py: 1,
                          mb: 3,
                          gap: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          borderRadius: 2,
                          border: 1,
                          borderColor: alpha(theme.palette.primary.main, 0.2)
                        }}
                      >
                        <Typography sx={{ flex: 1, fontWeight: 600 }}>Reading Stats</Typography>
                        <Button size="small" onClick={() => setShowStatsModal(false)}>Close ✕</Button>
                      </Paper>
                    )}

                    {/* Bookmarks-only mode indicator */}
                    {showBookmarksOnly && (
                      <Paper
                        elevation={0}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          py: 1,
                          mb: 3,
                          gap: 2,
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          borderRadius: 2,
                          border: 1,
                          borderColor: alpha(theme.palette.warning.main, 0.3)
                        }}
                      >
                        <Bookmark size={18} color={theme.palette.warning.main} fill={theme.palette.warning.main} />
                        <Typography sx={{ flex: 1, fontWeight: 600 }}>
                          Showing saved articles only
                          {loadingSaved && <CircularProgress size={14} sx={{ ml: 1, verticalAlign: 'middle' }} />}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => setShowBookmarksOnly(false)}
                        >
                          Clear ✕
                        </Button>
                      </Paper>
                    )}

                    {/* Content Section */}
                    <Box ref={contentContainerRef}>
                      {/* Stats inline view */}
                      {showStatsModal && <UserStatsPage />}

                      {!showStatsModal && selectedTab === 'news' && (
                        <>
                          {getTabContent().length === 0 && showBookmarksOnly && !loadingSaved && (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 6,
                                textAlign: 'center',
                                bgcolor: alpha(theme.palette.warning.main, 0.05),
                                borderRadius: 3,
                                border: '2px dashed',
                                borderColor: alpha(theme.palette.warning.main, 0.3),
                                mb: 3
                              }}
                            >
                              <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔖</Typography>
                              <Typography variant="h5" fontWeight={700} gutterBottom>
                                No saved articles yet
                              </Typography>
                              <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                                Bookmark articles you want to read later and they'll appear here.
                              </Typography>
                              <Button variant="contained" onClick={() => setShowBookmarksOnly(false)}>
                                Back to Feed
                              </Button>
                            </Paper>
                          )}
                          {getTabContent().length === 0 && !showBookmarksOnly && activeCategory !== 'All' && (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 6,
                                textAlign: 'center',
                                bgcolor: alpha(theme.palette.warning.main, 0.05),
                                borderRadius: 3,
                                border: '2px dashed',
                                borderColor: alpha(theme.palette.warning.main, 0.3),
                                mb: 3
                              }}
                            >
                              <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔔</Typography>
                              <Typography variant="h5" fontWeight={700} gutterBottom>
                                No content from {activeCategory}
                              </Typography>
                              <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                                This category is not in your preferences. Add it to start seeing articles, podcasts, and videos from {activeCategory}.
                              </Typography>
                              <Button
                                variant="contained"
                                onClick={() => setShowSettingsModal(true)}
                                startIcon={<Settings size={18} />}
                              >
                                Add to Preferences
                              </Button>
                            </Paper>
                          )}

                          <NewsItemContainer
                            headerTitle="Your Personalized AI News"
                            headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                            articles={getTabContent().slice(0, visibleItemsCount)}
                            contentType="blog"
                            showInteractions={true}
                            emptyMessage="No articles found. Try adjusting your preferences."
                            emptyIcon="📰"
                          />
                          {visibleItemsCount < getTabContent().length && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                              <CircularProgress size={24} />
                              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Loading more articles...</Typography>
                            </Box>
                          )}
                        </>
                      )}

                      {/* Audio Tab */}
                      {!showStatsModal && selectedTab === 'audio' && (
                        <>
                          {getTabContent().length === 0 && activeCategory !== 'All' && (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 6,
                                textAlign: 'center',
                                bgcolor: alpha(theme.palette.warning.main, 0.05),
                                borderRadius: 3,
                                border: '2px dashed',
                                borderColor: alpha(theme.palette.warning.main, 0.3),
                                mb: 3
                              }}
                            >
                              <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔔</Typography>
                              <Typography variant="h5" fontWeight={700} gutterBottom>
                                No podcasts from {activeCategory}
                              </Typography>
                              <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                                This category is not in your preferences. Add it to start seeing podcasts from {activeCategory}.
                              </Typography>
                              <Button
                                variant="contained"
                                onClick={() => setShowSettingsModal(true)}
                                startIcon={<Settings size={18} />}
                              >
                                Add to Preferences
                              </Button>
                            </Paper>
                          )}                        <NewsItemContainer
                            headerTitle="Your AI Podcasts"
                            headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                            articles={getTabContent().slice(0, visibleItemsCount)}
                            contentType="podcast"
                            showInteractions={true}
                            emptyMessage="No podcasts available. Try adjusting your preferences."
                            emptyIcon="🎧"
                          />
                          {visibleItemsCount < getTabContent().length && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                              <CircularProgress size={24} />
                              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Loading more podcasts...</Typography>
                            </Box>
                          )}
                        </>
                      )}

                      {/* Video Tab */}
                      {!showStatsModal && selectedTab === 'video' && (
                        <>
                          {getTabContent().length === 0 && activeCategory !== 'All' && (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 6,
                                textAlign: 'center',
                                bgcolor: alpha(theme.palette.warning.main, 0.05),
                                borderRadius: 3,
                                border: '2px dashed',
                                borderColor: alpha(theme.palette.warning.main, 0.3),
                                mb: 3
                              }}
                            >
                              <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔔</Typography>
                              <Typography variant="h5" fontWeight={700} gutterBottom>
                                No videos from {activeCategory}
                              </Typography>
                              <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                                This category is not in your preferences. Add it to start seeing videos from {activeCategory}.
                              </Typography>
                              <Button
                                variant="contained"
                                onClick={() => setShowSettingsModal(true)}
                                startIcon={<Settings size={18} />}
                              >
                                Add to Preferences
                              </Button>
                            </Paper>
                          )}
                          <NewsItemContainer
                            headerTitle="Your AI Videos"
                            headerSubtitle={activeCategory === 'All' ? 'All categories' : activeCategory}
                            articles={getTabContent().slice(0, visibleItemsCount)}
                            contentType="video"
                            showInteractions={true}
                            emptyMessage="No videos available. Try adjusting your preferences."
                            emptyIcon="📹"
                          />
                          {visibleItemsCount < getTabContent().length && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                              <CircularProgress size={24} />
                              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Loading more videos...</Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>

                    {/* Posts Tab */}
                    {!showStatsModal && selectedTab === 'posts' && (
                      <PostsTab />
                    )}

                    {/* Learning Tab */}
                    {!showStatsModal && selectedTab === 'courses' && (
                      <Box>
                        <CourseContainer
                          headerTitle="🎓 Your Learning Path"
                          headerSubtitle="Personalized courses and tutorials"
                          articles={getTabContent().slice(0, visibleItemsCount)}
                          showInteractions={true}
                          emptyMessage="No courses match your preferences yet"
                          emptyIcon="🎓"
                        />
                        {visibleItemsCount < getTabContent().length && (
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
                    {!showStatsModal && selectedTab === 'jobs' && (
                      <Box>
                        <JobContainer
                          headerTitle="💼 AI & ML Jobs"
                          headerSubtitle="Open positions in Gen AI, Machine Learning, and AI Infrastructure"
                          articles={getTabContent().slice(0, visibleItemsCount)}
                          showInteractions={true}
                          emptyMessage="No AI/ML job listings available yet"
                          emptyIcon="💼"
                        />
                        {visibleItemsCount < getTabContent().length && (
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
                    {!showStatsModal && selectedTab === 'events' && (
                      <Box>
                        <EventContainer
                          headerTitle="📅 AI & ML Events"
                          headerSubtitle="Conferences, workshops, and meetups in AI, Cloud, and Machine Learning"
                          articles={getTabContent().slice(0, visibleItemsCount)}
                          showInteractions={true}
                          emptyMessage="No AI/ML events available yet"
                          emptyIcon="📅"
                        />
                        {visibleItemsCount < getTabContent().length && (
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
                </Box>
              </Container>
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
            setSettingsChanged={() => { }}
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