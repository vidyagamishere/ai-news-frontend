import React, { useState, useEffect } from 'react';
import { Search, Settings, User, Archive, Bell, Filter, Home, Bookmark, Menu, X, Clock, Star, Play, Headphones, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface ContentItem {
  id: string;
  category: string;
  type: 'BLOGS' | 'VIDEOS' | 'PODCASTS';
  title: string;
  summary: string;
  content_summary?: string;
  sourceLink: string;
  publishDate: string;
  publisher: string;
  significance?: number;
  readTime?: string;
  complexity?: string;
  impact?: string;
  duration?: number;
  thumbnail_url?: string;
  rankingScore?: number;
  topics?: string[];
  topic_names?: string[];
}

interface UserProfile {
  name: string;
  role: string;
  aiExposure: 'Beginner' | 'Intermediate' | 'Expert';
  interests: string[];
  newsletterSubscription: boolean;
  selectedContentTypes: ('BLOGS' | 'VIDEOS' | 'PODCASTS')[];
  selectedPublishers: string[];
  timeFilter: string;
  currentSearchQuery: string;
}

const CompleteMobileDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'preferences' | 'settings' | 'archive'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  // User profile with real data from auth context
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Alex Johnson',
    role: 'Software Architect',
    aiExposure: 'Intermediate',
    interests: ['Generative AI', 'Cloud Computing', 'AI Start Ups'],
    newsletterSubscription: true,
    selectedContentTypes: ['BLOGS', 'VIDEOS', 'PODCASTS'],
    selectedPublishers: ['Google DeepMind', 'MIT Tech Review'],
    timeFilter: 'Last Week',
    currentSearchQuery: ''
  });

  // Available options for filters
  const [availableInterests, setAvailableInterests] = useState<string[]>([
    'Generative AI', 'Machine Learning', 'Deep Learning', 'Computer Vision', 
    'NLP', 'Robotics', 'AI Ethics', 'AI Applications', 'AI Start Ups'
  ]);
  const [availablePublishers, setAvailablePublishers] = useState<string[]>([
    'techcrunch', 'arxiv', 'venturebeat', 'airesearch', 'techreport', 'awsblog'
  ]);
  const timeFilters = ['Last 24 hours', 'Last Week', 'Last Month', 'All Time'];

  // Update user profile from authenticated user data
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        role: (user.preferences as any)?.professional_roles?.[0] || prev.role,
        aiExposure: (user.preferences?.experience_level as 'Beginner' | 'Intermediate' | 'Expert') || prev.aiExposure,
        interests: (user.preferences as any)?.categories_selected || prev.interests,
        selectedContentTypes: ((user.preferences as any)?.content_types_selected as ('BLOGS' | 'VIDEOS' | 'PODCASTS')[]) || prev.selectedContentTypes,
        selectedPublishers: (user.preferences as any)?.publishers_selected || prev.selectedPublishers,
        newsletterSubscription: user.preferences?.email_notifications || prev.newsletterSubscription
      }));
    }
  }, [isAuthenticated, user?.id]);

  // Load personalized feed - SINGLE API CALL
  useEffect(() => {
    if (!isAuthenticated || !user || currentScreen !== 'dashboard') return;

    const loadFeed = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📱 Loading personalized feed...');
        
        const filterRequest = {
          interests: userProfile.interests,
          content_types: userProfile.selectedContentTypes,
          publishers: userProfile.selectedPublishers,
          time_filter: userProfile.timeFilter,
          search_query: searchQuery,
          limit: 50
        };

        const response = await apiService.getPersonalizedFeed(filterRequest);
        
        // Convert grouped content to flat array with proper type mapping
        const flatContent: ContentItem[] = [];
        response.grouped_content?.forEach((group: any) => {
          group.items?.forEach((item: any) => {
            // Map API content types to our expected uppercase types
            const mapContentType = (apiType: string): 'BLOGS' | 'VIDEOS' | 'PODCASTS' => {
              const normalizedType = apiType?.toLowerCase();
              switch (normalizedType) {
                case 'blog':
                case 'blogs':
                case 'article':
                case 'articles':
                case 'post':
                case 'posts':
                  return 'BLOGS';
                case 'video':
                case 'videos':
                case 'youtube':
                case 'vimeo':
                  return 'VIDEOS';
                case 'podcast':
                case 'podcasts':
                case 'audio':
                case 'sound':
                  return 'PODCASTS';
                default:
                  console.warn('Unknown content type:', apiType, 'defaulting to BLOGS');
                  return 'BLOGS';
              }
            };

            flatContent.push({
              id: item.id?.toString() || Math.random().toString(),
              category: group.category,
              type: mapContentType(item.content_type_label || item.content_type || item.type || 'BLOGS'),
              title: item.title || 'Untitled',
              summary: item.summary || item.description || 'No description available',
              content_summary: item.content_summary,
              sourceLink: item.url || '#',
              publishDate: item.published_date || new Date().toISOString(),
              publisher: item.source || 'Unknown',
              significance: item.significance_score || 5,
              readTime: item.read_time || item.readTime || item.estimated_read_time,
              complexity: item.complexity || item.complexity_level,
              impact: item.impact || item.impact_level,
              duration: item.duration,
              thumbnail_url: item.thumbnail_url || item.thumbnail,
              rankingScore: item.ranking_score || item.rankingScore,
              topics: item.topics,
              topic_names: item.topic_names
            });
          });
        });
        
        setContent(flatContent);
        console.log('✅ Feed loaded successfully:', flatContent.length, 'items');
        console.log('📊 Content breakdown:', {
          total: flatContent.length,
          blogs: flatContent.filter(item => item.type === 'BLOGS').length,
          videos: flatContent.filter(item => item.type === 'VIDEOS').length,
          podcasts: flatContent.filter(item => item.type === 'PODCASTS').length,
          breakingNews: flatContent.filter(item => item.significance && item.significance >= 8).length,
          allUniqueTypes: [...new Set(flatContent.map(item => item.type))],
          rawApiData: response.grouped_content?.slice(0, 1),
          firstItem: flatContent[0],
          allItems: flatContent.map(item => ({ title: item.title, type: item.type, originalType: item }))
        });
        
      } catch (err) {
        console.error('❌ Error loading feed:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [isAuthenticated, user?.id, currentScreen, searchQuery]); // Simplified dependencies to prevent excessive re-renders

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BLOGS': return 'bg-blue-500';
      case 'VIDEOS': return 'bg-red-500';
      case 'PODCASTS': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BLOGS': return '📝';
      case 'VIDEOS': return <Play className="h-4 w-4 text-red-600" />;
      case 'PODCASTS': return <Headphones className="h-4 w-4 text-green-600" />;
      default: return '📄';
    }
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderBreakingNews = () => {
    const breakingNews = content.filter(item => item.significance && item.significance >= 8).slice(0, 3);
    
    if (breakingNews.length === 0) return null;

    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center mb-3">
          <Bell className="h-5 w-5 text-red-500 mr-2 animate-pulse" />
          <h2 className="text-lg font-bold text-red-800">🚨 Breaking News</h2>
        </div>
        <div className="space-y-3">
          {breakingNews.map((item) => (
            <div key={item.id} className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getTypeColor(item.type)}`}></span>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {item.category}
                </span>
                <span className="ml-auto text-xs text-gray-500">{formatDate(item.publishDate)}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{item.publisher}</span>
                <a 
                  href={item.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Read →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContentByType = (type: 'BLOGS' | 'VIDEOS' | 'PODCASTS') => {
    const typeContent = content.filter(item => item.type === type).slice(0, 8);
    
    console.log(`🔍 Rendering ${type}:`, {
      totalContent: content.length,
      typeContent: typeContent.length,
      availableTypes: content.map(item => item.type),
      sampleItems: content.slice(0, 2).map(item => ({ title: item.title, type: item.type }))
    });
    
    if (typeContent.length === 0) {
      console.log(`⚠️ No content found for type: ${type}`);
      return null;
    }

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getTypeIcon(type)}</span>
            <h2 className="text-xl font-bold text-gray-900">{type}</h2>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {typeContent.length} items
          </span>
        </div>
        
        <div className="grid gap-4">
          {typeContent.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden">
              {/* Thumbnail for videos */}
              {item.type === 'VIDEOS' && item.thumbnail_url && (
                <div className="relative">
                  <img 
                    src={item.thumbnail_url} 
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  {item.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(item.duration)}
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-4">
                {/* Header with metadata */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-medium text-gray-600">{item.publisher}</span>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(item.publishDate)}
                    </div>
                    {item.readTime && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{item.readTime}</span>
                      </>
                    )}
                    {item.duration && item.type === 'PODCASTS' && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{formatDuration(item.duration)}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item.type)}
                    {item.significance && (
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs border ${getImpactColor(item.impact)}`}>
                        <Star className="h-3 w-3 mr-1" />
                        <span>{item.significance.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base leading-tight hover:text-blue-600 transition-colors">
                  <a 
                    href={item.sourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start group"
                  >
                    {item.title}
                    <ExternalLink className="h-3 w-3 ml-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </h3>
                
                {/* Summary */}
                <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                  {item.content_summary || item.summary}
                  {item.content_summary && (
                    <span className="inline-block ml-1 text-xs" title="AI-generated summary">🤖</span>
                  )}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {item.category}
                    </span>
                    {item.complexity && (
                      <span className="text-xs text-gray-500">
                        {item.complexity} level
                      </span>
                    )}
                    {item.rankingScore && (
                      <span className="text-xs text-gray-500">
                        Rank: {item.rankingScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    {item.significance && item.significance >= 7 && (
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        🔥 HOT
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Topics */}
                {item.topic_names && item.topic_names.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-50">
                    <div className="flex flex-wrap gap-1">
                      {item.topic_names.slice(0, 3).map((topic, index) => (
                        <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {topic}
                        </span>
                      ))}
                      {item.topic_names.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{item.topic_names.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Audio player for podcasts */}
              {item.type === 'PODCASTS' && item.sourceLink && (
                <div className="px-4 pb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Headphones className="h-4 w-4 mr-2" />
                      <span>Audio content available</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-white border rounded-lg shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setShowFilters(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Time Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
          <div className="flex flex-wrap gap-2">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setUserProfile(prev => ({ ...prev, timeFilter: filter }))}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  userProfile.timeFilter === filter
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Content Types */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content Types</label>
          <div className="flex flex-wrap gap-2">
            {(['BLOGS', 'VIDEOS', 'PODCASTS'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  const isSelected = userProfile.selectedContentTypes.includes(type);
                  setUserProfile(prev => ({
                    ...prev,
                    selectedContentTypes: isSelected
                      ? prev.selectedContentTypes.filter(t => t !== type)
                      : [...prev.selectedContentTypes, type]
                  }));
                }}
                className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center ${
                  userProfile.selectedContentTypes.includes(type)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                <span className="mr-1">{getTypeIcon(type)}</span>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => {
                  const isSelected = userProfile.interests.includes(interest);
                  setUserProfile(prev => ({
                    ...prev,
                    interests: isSelected
                      ? prev.interests.filter(i => i !== interest)
                      : [...prev.interests, interest]
                  }));
                }}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  userProfile.interests.includes(interest)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading your personalized feed...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-red-600">
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (content.length === 0) {
      return (
        <div className="text-center py-12 text-gray-600">
          <p className="mb-4">No content available</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
        </div>
      );
    }

    console.log('🎯 Rendering dashboard with content:', {
      contentLength: content.length,
      hasContent: content.length > 0,
      firstFewItems: content.slice(0, 3).map(item => ({ title: item.title, type: item.type, category: item.category }))
    });

    return (
      <div className="space-y-6">
        {renderBreakingNews()}
        {renderContentByType('BLOGS')}
        {renderContentByType('VIDEOS')}
        {renderContentByType('PODCASTS')}
      </div>
    );
  };

  const renderHeader = () => (
    <div className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 text-gray-600 hover:text-gray-900 mr-2 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI News Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {userProfile.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Filter className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentScreen('settings')}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {currentScreen === 'dashboard' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles, topics, or publishers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="flex items-center justify-around py-2">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className={`flex flex-col items-center py-2 px-4 text-xs transition-colors ${
            currentScreen === 'dashboard' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <Home className="h-6 w-6 mb-1" />
          Dashboard
        </button>
        <button
          onClick={() => setCurrentScreen('preferences')}
          className={`flex flex-col items-center py-2 px-4 text-xs transition-colors ${
            currentScreen === 'preferences' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <User className="h-6 w-6 mb-1" />
          Profile
        </button>
        <button
          onClick={() => setCurrentScreen('archive')}
          className={`flex flex-col items-center py-2 px-4 text-xs transition-colors ${
            currentScreen === 'archive' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <Archive className="h-6 w-6 mb-1" />
          Archive
        </button>
        <button
          onClick={() => setCurrentScreen('settings')}
          className={`flex flex-col items-center py-2 px-4 text-xs transition-colors ${
            currentScreen === 'settings' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <Settings className="h-6 w-6 mb-1" />
          Settings
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {renderHeader()}
      <div className="px-4 py-6">
        {renderFilters()}
        {currentScreen === 'dashboard' && renderDashboard()}
        {currentScreen === 'preferences' && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Profile & Preferences</p>
            <p className="text-sm text-gray-500">Manage your account settings and content preferences</p>
          </div>
        )}
        {currentScreen === 'archive' && (
          <div className="text-center py-12">
            <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Saved Articles</p>
            <p className="text-sm text-gray-500">Access your bookmarked and archived content</p>
          </div>
        )}
        {currentScreen === 'settings' && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Settings</p>
            <p className="text-sm text-gray-500">Configure app preferences and notifications</p>
          </div>
        )}
      </div>
      {renderBottomNav()}
    </div>
  );
};

export default CompleteMobileDashboard;