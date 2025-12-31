import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  Alert
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Article } from '../services/api';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import RightSection from './RightSection';
import HorizontalArticleCard from './cards/HorizontalArticleCard';
import CardContainer from './cards/CardContainer';
import { cacheService, CACHE_DURATION } from '../utils/cacheService';
import { SearchProvider } from '../contexts/SearchContext';

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
  const { user, isAuthenticated, updatePreferences, logout } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTab, setSelectedTab] = useState<'news' | 'audio' | 'video' | 'posts' | 'learning'>('news');
  const [dateFilter, setDateFilter] = useState<1 | 7 | 30 | 365>(7);
  const [contentCounts, setContentCounts] = useState<{
    blogs: number;
    podcasts: number;
    videos: number;
  } | null>(null);

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
      } catch (err) {
        console.error('Error loading options:', err);
      }
    };

    loadOptions();
  }, []);

  // Load feed
  useEffect(() => {
    if (availableCategories.length === 0 || availableContentTypes.length === 0 || availablePublishers.length === 0) {
      setLoading(false);
      return;
    }

    const loadFeed = async () => {
      setLoading(true);
      setError(null);

      try {
        let categoryNames: string[];
        if (selectedCategory === 'All' || !selectedCategory) {
          categoryNames = userPreferences.categories_selected
            .map((id: any) => availableCategories.find(cat => cat.id === id)?.name)
            .filter(Boolean) as string[];
        } else {
          categoryNames = [selectedCategory];
        }

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
          contentTypeNames = [selectedContentType];
        } else {
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
          search_query: '',
          limit: 500
        };

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
              is_bookmarked: false,
              is_liked: false,
              likes_count: 0,
              views_count: 0,
              bookmarks_count: 0,
              engagement_score: 0
            });
          });
        });

        setContent(articles);

        const counts = {
          blogs: articles.filter(a => ['blog', 'blogs', 'article'].includes(a.content_type?.toLowerCase() || '')).length,
          podcasts: articles.filter(a => ['podcast', 'podcasts'].includes(a.content_type?.toLowerCase() || '')).length,
          videos: articles.filter(a => ['video', 'videos'].includes(a.content_type?.toLowerCase() || '')).length
        };
        setContentCounts(counts);
      } catch (err) {
        console.error('Error loading feed:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [
    dateFilter,
    selectedCategory,
    selectedTab,
    JSON.stringify(userPreferences.categories_selected),
    JSON.stringify(userPreferences.content_types_selected),
    JSON.stringify(userPreferences.publishers_selected),
    availableCategories.length,
    availableContentTypes.length,
    availablePublishers.length
  ]);

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
    let filteredContent = content;

    if (selectedCategory !== 'All') {
      filteredContent = filteredContent.filter(item =>
        item.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (query: string) => {
    // TODO: Implement search logic for Dashboard
    console.log('Search query:', query);
    // You can filter content or navigate to search results
  };

  const dashboardContextValue: DashboardContextType = {
    content,
    selectedCategory,
    selectedTab,
    categories: availableCategories.map(cat => cat.name)
  };

  return (
    <SearchProvider
      onSearch={handleSearch}
      categoryId={selectedCategory === 'All' ? undefined : availableCategories.find(cat => cat.name === selectedCategory)?.id}
      showSearch={true}
    >
      <DashboardContext.Provider value={dashboardContextValue}>
      <SEO
        title="AI News Dashboard | Vidyagam"
        description="Your personalized AI news dashboard"
        keywords="AI news, dashboard, artificial intelligence"
      />

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Main Content */}
        <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
          {/* Controls */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Time Filter</InputLabel>
              <Select
                value={dateFilter}
                label="Time Filter"
                onChange={(e: SelectChangeEvent<number>) => setDateFilter(e.target.value as 1 | 7 | 30 | 365)}
              >
                <MenuItem value={1}>Last 24 hours</MenuItem>
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={365}>Last year</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => navigate('/preferences')}
            >
              Preferences
            </Button>

            <Button
              variant="outlined"
              startIcon={<LogOut />}
              onClick={handleLogout}
              color="error"
            >
              Sign Out
            </Button>
          </Box>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`📰 News${contentCounts?.blogs ? ` (${contentCounts.blogs})` : ''}`} value="news" />
            <Tab label={`🎙️ Podcasts${contentCounts?.podcasts ? ` (${contentCounts.podcasts})` : ''}`} value="audio" />
            <Tab label={`🎥 Videos${contentCounts?.videos ? ` (${contentCounts.videos})` : ''}`} value="video" />
            <Tab label="💬 Posts" value="posts" disabled />
            <Tab label="🎓 Learning" value="learning" disabled />
          </Tabs>

          {/* Content */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
              <Button onClick={() => window.location.reload()} sx={{ ml: 2 }}>
                Retry
              </Button>
            </Alert>
          ) : (
            <CardContainer
              headerTitle={
                selectedTab === 'news' ? 'Latest AI News' :
                selectedTab === 'audio' ? 'AI Podcasts' :
                'AI Videos'
              }
              headerSubtitle={selectedCategory === 'All' ? 'All categories' : selectedCategory}
              articles={getTabContent().slice(0, 20)}
              contentType={selectedTab === 'news' ? 'blog' : selectedTab}
              showInteractions={false}
              emptyMessage="No content found"
              emptyIcon={
                selectedTab === 'news' ? '📰' :
                selectedTab === 'audio' ? '🎧' :
                '📹'
              }
            />
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
      </Box>
    </DashboardContext.Provider>
    </SearchProvider>
  );
};

export default NewDashboard;
