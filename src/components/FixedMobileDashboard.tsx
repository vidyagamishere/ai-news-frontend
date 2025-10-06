import React, { useState, useEffect } from 'react';
import { Search, Settings, User, Archive, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface ContentItem {
  id: string;
  category: string;
  type: 'BLOGS' | 'VIDEOS' | 'PODCASTS';
  title: string;
  summary: string;
  sourceLink: string;
  publishDate: string;
  publisher: string;
  significance?: number;
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

const FixedMobileDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'preferences' | 'settings' | 'archive'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Load personalized feed
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
        
        // Convert grouped content to flat array
        const flatContent: ContentItem[] = [];
        response.grouped_content?.forEach((group: any) => {
          group.items?.forEach((item: any) => {
            flatContent.push({
              id: item.id?.toString() || Math.random().toString(),
              category: group.category,
              type: (item.content_type_label as 'BLOGS' | 'VIDEOS' | 'PODCASTS') || 'BLOGS',
              title: item.title || 'Untitled',
              summary: item.summary || item.description || 'No description available',
              sourceLink: item.url || '#',
              publishDate: item.published_date || new Date().toISOString(),
              publisher: item.source || 'Unknown',
              significance: item.significance_score || 5
            });
          });
        });
        
        setContent(flatContent);
        console.log('✅ Feed loaded successfully:', flatContent.length, 'items');
        
      } catch (err) {
        console.error('❌ Error loading feed:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [isAuthenticated, user?.id, currentScreen, userProfile.interests, userProfile.selectedContentTypes, userProfile.selectedPublishers, userProfile.timeFilter, searchQuery]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BLOGS': return '#3B82F6';
      case 'VIDEOS': return '#EF4444';
      case 'PODCASTS': return '#10B981';
      default: return '#6B7280';
    }
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

  const groupContentByCategory = (content: ContentItem[]) => {
    const grouped: { [key: string]: ContentItem[] } = {};
    content.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const renderBreakingNews = () => {
    const breakingNews = content.filter(item => item.significance && item.significance >= 8).slice(0, 3);
    
    if (breakingNews.length === 0) return null;

    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-center mb-3">
          <Bell className="h-5 w-5 text-red-500 mr-2" />
          <h2 className="text-lg font-bold text-red-800">Breaking News</h2>
        </div>
        <div className="space-y-3">
          {breakingNews.map((item) => (
            <div key={item.id} className="bg-white p-3 rounded border">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{item.publisher}</span>
                <span>{formatDate(item.publishDate)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContentByType = (type: 'BLOGS' | 'VIDEOS' | 'PODCASTS') => {
    const typeContent = content.filter(item => item.type === type).slice(0, 5);
    
    if (typeContent.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <span 
            className="w-3 h-3 rounded-full mr-3"
            style={{ backgroundColor: getTypeColor(type) }}
          ></span>
          <h2 className="text-lg font-bold text-gray-900">{type}</h2>
          <span className="ml-auto text-sm text-gray-500">{typeContent.length} items</span>
        </div>
        
        <div className="space-y-4">
          {typeContent.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {item.category}
                </span>
                <span className="text-xs text-gray-500">{formatDate(item.publishDate)}</span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                {item.title}
              </h3>
              
              <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                {item.summary}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.publisher}</span>
                <a 
                  href={item.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  Read More →
                </a>
              </div>
            </div>
          ))}
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    if (content.length === 0) {
      return (
        <div className="text-center py-12 text-gray-600">
          <p>No content available</p>
        </div>
      );
    }

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
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI News Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {userProfile.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentScreen('settings')}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentScreen('archive')}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Archive className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {currentScreen === 'dashboard' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
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
          className={`flex flex-col items-center py-2 px-4 text-xs ${
            currentScreen === 'dashboard' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <div className="h-6 w-6 mb-1 bg-current opacity-20 rounded"></div>
          Dashboard
        </button>
        <button
          onClick={() => setCurrentScreen('preferences')}
          className={`flex flex-col items-center py-2 px-4 text-xs ${
            currentScreen === 'preferences' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <User className="h-6 w-6 mb-1" />
          Preferences
        </button>
        <button
          onClick={() => setCurrentScreen('archive')}
          className={`flex flex-col items-center py-2 px-4 text-xs ${
            currentScreen === 'archive' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <Archive className="h-6 w-6 mb-1" />
          Archive
        </button>
        <button
          onClick={() => setCurrentScreen('settings')}
          className={`flex flex-col items-center py-2 px-4 text-xs ${
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
        {currentScreen === 'dashboard' && renderDashboard()}
        {currentScreen === 'preferences' && (
          <div className="text-center py-12">
            <p className="text-gray-600">Preferences screen - Coming soon</p>
          </div>
        )}
        {currentScreen === 'archive' && (
          <div className="text-center py-12">
            <p className="text-gray-600">Archive screen - Coming soon</p>
          </div>
        )}
        {currentScreen === 'settings' && (
          <div className="text-center py-12">
            <p className="text-gray-600">Settings screen - Coming soon</p>
          </div>
        )}
      </div>
      {renderBottomNav()}
    </div>
  );
};

export default FixedMobileDashboard;