import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
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
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Article } from '../services/api';
import type { LandingContent } from '../types/article';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { LandingSkeleton } from '../components/LoadingSkeleton';
import Header from './Header';
import { SearchProvider } from '../contexts/SearchContext';
import RightSection from './RightSection';
import CardContainer from './cards/CardContainer';
import { cacheService, CACHE_DURATION } from '../utils/cacheService';

// Context for sharing dashboard state with RightSection
interface DashboardContextType {
  content: Article[];
  selectedCategory: string;
  selectedTab: string;
  categories: string[];
}

const DashboardContext = createContext<DashboardContextType>({
  content: [],
  selectedCategory: 'All',
  selectedTab: 'news',
  categories: []
});

export const useDashboardContext = () => useContext(DashboardContext);

const NewDashboard: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
  const [dateFilter, setDateFilter] = useState<1 | 7 | 30 | 365>(7);
  const [error, setError] = useState<string | null>(null);
  
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
        const [categoriesRes, contentTypesRes, publishersRes] = await Promise.all([
          cacheService.get('available_categories', () => apiService.getAvailableCategories(), CACHE_DURATION.LONG),
          cacheService.get('available_content_types', () => apiService.getAvailableContentTypes(), CACHE_DURATION.LONG),
          cacheService.get('available_publishers', () => apiService.getAvailablePublishers(), CACHE_DURATION.MEDIUM)
        ]);

        setAvailableCategories(categoriesRes.categories || []);
        setAvailableContentTypes(contentTypesRes.content_types || []);
        setAvailablePublishers(publishersRes.publishers || []);
        
        // Once options are loaded, fetch personalized content
        if (categoriesRes.categories && contentTypesRes.content_types && publishersRes.publishers) {
          loadPersonalizedFeed();
        }
      } catch (err) {
        console.error('Error loading options:', err);
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

  const dashboardContextValue: DashboardContextType = {
    content: getTabContent(),
    selectedCategory: activeCategory,
    selectedTab,
    categories: availableCategories.map(cat => cat.name)
  };

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
            />
            
            <Stack spacing={2} direction="row" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
              <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>

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
                  <CardContainer
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
                  <CardContainer
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
                  <CardContainer
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
              </Container>

              {/* Right Sidebar */}
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
          </>
        )}
      </DashboardContext.Provider>
    </SearchProvider>
  );
};

export default NewDashboard;
