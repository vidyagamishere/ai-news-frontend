import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { apiService, type Article } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { renderingStateManager } from '../utils/renderingStateManager';

// Global instance guard to prevent duplicate component initialization
let globalInstanceInitialized = false;

// Types
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

// Mock data fallbacks (removed unused variables)

const mockContent: ContentItem[] = [
  {
    id: '1',
    category: 'Generative AI',
    type: 'BLOGS',
    title: 'Tensor Core Architecture Doubles LLM Training Speed',
    summary: 'Research details a novel hardware acceleration technique that achieves a 2.1x throughput increase for sparse attention models, reducing training costs significantly.',
    sourceLink: 'https://vidyagam.tech/article/tensor-cores',
    publishDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    publisher: 'Google DeepMind',
    significance: 9
  },
  {
    id: '2',
    category: 'Generative AI',
    type: 'VIDEOS',
    title: 'Quantum Computing Explained in 5 Minutes',
    summary: 'This video demystifies the concepts of superposition and entanglement, using simple, visual analogies. Outlines which industries will see earliest breakthroughs.',
    sourceLink: 'https://vidyagam.tech/video/quantum-explained',
    publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    publisher: 'MIT Tech Review',
    significance: 7
  },
  {
    id: '3',
    category: 'Cloud Computing',
    type: 'PODCASTS',
    title: 'Security Best Practices for Serverless Deployments',
    summary: 'This podcast segment analyzes common pitfalls in serverless architecture security, focusing on function permissions and environment variable injection prevention.',
    sourceLink: 'https://vidyagam.tech/audio/serverless-security',
    publishDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    publisher: 'AWS Blog',
    significance: 6
  }
];

const MobileDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [renderingSessionId, setRenderingSessionId] = useState<string | null>(null);
  
  // Advanced rendering state management with global session control
  useEffect(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const componentName = 'MobileDashboard';
    
    console.log(`📱 [${timestamp}] MobileDashboard: Component mounting attempt:`, {
      globalInstanceInitialized,
      userId: user?.id,
      isAuthenticated,
      currentSession: renderingStateManager.getCurrentSession()?.sessionId
    });
    
    // Check if this is a duplicate render of the same component
    if (renderingStateManager.isDuplicateRender(componentName)) {
      console.warn(`🚨 [${timestamp}] MobileDashboard: DUPLICATE render detected - blocked by rendering state manager`);
      return;
    }
    
    // Check if another component is currently rendering
    if (renderingStateManager.isBlocked(componentName)) {
      console.warn(`🚫 [${timestamp}] MobileDashboard: Blocked by active rendering session: ${renderingStateManager.getCurrentSession()?.component}`);
      return;
    }
    
    // Start new rendering session
    const sessionResult = renderingStateManager.startSession(componentName, user?.id);
    if (!sessionResult.success) {
      console.warn(`🚨 [${timestamp}] MobileDashboard: Failed to start rendering session`);
      return;
    }
    
    const sessionId = sessionResult.sessionId!;
    setRenderingSessionId(sessionId);
    globalInstanceInitialized = true;
    
    console.log(`✅ [${timestamp}] MobileDashboard: Started rendering session ${sessionId}`);
    
    return () => {
      const cleanupTimestamp = new Date().toISOString().split('T')[1].split('.')[0];
      globalInstanceInitialized = false;
      
      if (renderingSessionId) {
        renderingStateManager.completeSession(renderingSessionId);
        console.log(`🔄 [${cleanupTimestamp}] MobileDashboard: Completed session ${renderingSessionId} and cleaned up`);
      } else {
        console.log(`🔄 [${cleanupTimestamp}] MobileDashboard: Cleaned up (no active session)`);
      }
    };
  }, [user?.id, isAuthenticated, renderingSessionId]); // Add required dependencies
  // Initialize screen based on authentication and onboarding status
  const [currentScreen, setCurrentScreen] = useState<'preview' | 'preferences' | 'dashboard' | 'settings'>(() => {
    if (isAuthenticated && user?.preferences?.onboarding_completed) {
      return 'dashboard';
    }
    return 'preview';
  });
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
  
  const [realContent, setRealContent] = useState<ContentItem[]>([]);
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [availablePublishers, setAvailablePublishers] = useState<string[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadParams = React.useRef<string>('');

  // Update user profile from authenticated user data
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use setTimeout to debounce rapid updates
      const timeoutId = setTimeout(() => {
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
        
        // If user has completed onboarding, go directly to dashboard
        if (user.preferences?.onboarding_completed) {
          setCurrentScreen('dashboard');
        }
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user?.id, user?.name, user?.preferences?.onboarding_completed]); // Remove navigateToScreen dependency

  // Function to load available options only when user opens preferences/settings
  const loadAvailableOptionsForPreferences = useCallback(async () => {
    try {
      console.log('📱 Loading available options for preferences screen...');
      const [interestsRes, publishersRes] = await Promise.all([
        apiService.getAvailableInterests(),
        apiService.getAvailablePublishers()
      ]);
      
      // Handle new categories structure from ai_categories_master
      const interests = (interestsRes as any).categories ? 
        (interestsRes as any).categories.map((cat: any) => cat.name) : 
        ((interestsRes as any).interests || []);
      setAvailableInterests(interests);
      setAvailablePublishers((publishersRes as any).publishers || []);
      
      // Get content types from the same ai-topics endpoint that has both categories and content_types
      const contentTypes = (interestsRes as any).content_types ? 
        (interestsRes as any).content_types.map((ct: any) => ct.name) : 
        ['BLOGS', 'VIDEOS', 'PODCASTS'];
      setAvailableContentTypes(contentTypes);
      
      console.log('✅ Available options loaded for preferences');
    } catch (err) {
      console.error('Error loading available options for preferences:', err);
    }
  }, []);

  // Helper function to handle screen transitions with appropriate data loading
  const navigateToScreen = useCallback(async (screen: 'preview' | 'preferences' | 'dashboard' | 'settings') => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`📱 [${timestamp}] MobileDashboard: Navigating from '${currentScreen}' to '${screen}' screen (session: ${renderingSessionId})`);
    
    // Only proceed if we have a valid rendering session
    if (!renderingSessionId) {
      console.warn(`📱 [${timestamp}] MobileDashboard: Navigation blocked - no active rendering session`);
      return;
    }
    
    // Load available options only when navigating to preferences or settings
    if ((screen === 'preferences' || screen === 'settings') && currentScreen !== 'preferences' && currentScreen !== 'settings') {
      console.log(`📱 [${timestamp}] MobileDashboard: Loading available options for preferences/settings...`);
      await loadAvailableOptionsForPreferences();
    }
    
    console.log(`📱 [${timestamp}] MobileDashboard: Screen transition complete - now on '${screen}'`);
    setCurrentScreen(screen);
  }, [currentScreen, loadAvailableOptionsForPreferences, renderingSessionId]);

  // Initialize available options with fallback values (no API calls on mount)
  // These will only be loaded when user actually opens preferences/settings
  useEffect(() => {
    if (!globalInstanceInitialized) return;
    
    console.log('📱 MobileDashboard: Setting fallback available options (no API calls)');
    // Set fallback values without API calls - these are only needed when user changes preferences
    setAvailableInterests(['Generative AI', 'Cloud Computing', 'AI Start Ups', 'Machine Learning', 'Data Engineering', 'Cyber Security']);
    setAvailablePublishers(['Google DeepMind', 'AWS Blog', 'MIT Tech Review', 'The Verge', 'TechCrunch', 'IEEE Spectrum']);
    setAvailableContentTypes(['BLOGS', 'VIDEOS', 'PODCASTS']);
  }, []);

  const loadPersonalizedFeed = useCallback(async () => {
    const filterRequest = {
      interests: userProfile.interests,
      content_types: userProfile.selectedContentTypes,
      publishers: userProfile.selectedPublishers,
      time_filter: userProfile.timeFilter,
      search_query: userProfile.currentSearchQuery,
      limit: 50
    };
    
    // Create a unique key for this request to prevent duplicate calls
    const requestKey = JSON.stringify(filterRequest);
    if (lastLoadParams.current === requestKey && !loading) {
      return; // Skip if same request is already processed
    }
    lastLoadParams.current = requestKey;
    
    setLoading(true);
    setError(null);
    
    try {
      
      const response = await apiService.getPersonalizedFeed(filterRequest);
      
      // Convert grouped content back to flat array for compatibility
      const flatContent: ContentItem[] = [];
      response.grouped_content?.forEach((group: { 
      category: string; 
      category_id: number; 
      items: Article[];  // ✅ Use Article type directly
    }) => {
        group.items?.forEach((item) => {
          flatContent.push({
            id: item.id?.toString() || Math.random().toString(),
            category: group.category,
            type: (item.content_type_label as 'BLOGS' | 'VIDEOS' | 'PODCASTS') || 'COURSES' || 'POSTS' ,
            title: item.title || 'Untitled',  
            summary: item.summary || item.description || 'No description available',
            sourceLink: item.url || '#',
            publishDate: item.published_date || item.time || new Date().toISOString(),
            publisher: item.source || 'Unknown',
            significance: item.significance_score || 5
          });
        });
      });
      
      setRealContent(flatContent);
    } catch (err) {
      console.error('Error loading personalized feed:', err);
      setError('Failed to load content. Using sample data.');
      // Keep using mock data as fallback
    } finally {
      setLoading(false);
    }
  }, [userProfile.interests, userProfile.selectedContentTypes, userProfile.selectedPublishers, userProfile.timeFilter, userProfile.currentSearchQuery, loading]);

  // Load personalized feed when screen changes to dashboard and user is authenticated
  useEffect(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`📱 [${timestamp}] MobileDashboard: Feed loading trigger:`, {
      currentScreen,
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      renderingSessionId,
      shouldLoad: currentScreen === 'dashboard' && isAuthenticated && user && renderingSessionId
    });
    
    // Only load if we have an active rendering session and meet all conditions
    if (currentScreen === 'dashboard' && isAuthenticated && user && renderingSessionId) {
      
      // Check if we're still allowed to proceed with this session
      const currentSession = renderingStateManager.getCurrentSession();
      if (!currentSession || currentSession.sessionId !== renderingSessionId) {
        console.warn(`📱 [${timestamp}] MobileDashboard: Feed loading blocked - invalid session ${renderingSessionId}`);
        return;
      }
      
      // Mark session as ongoing before starting API call
      renderingStateManager.setOngoing(renderingSessionId);
      
      // Debounce the feed loading to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        const loadTimestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`📱 [${loadTimestamp}] MobileDashboard: LOADING personalized feed for session ${renderingSessionId}`);
        
        // Load feed and complete session when done
        loadPersonalizedFeed().finally(() => {
          if (renderingSessionId) {
            renderingStateManager.completeSession(renderingSessionId);
            console.log(`📱 [${loadTimestamp}] MobileDashboard: Feed loaded, session ${renderingSessionId} completed`);
          }
        });
      }, 300);
      
      return () => {
        console.log(`📱 [${timestamp}] MobileDashboard: Feed loading timeout cleared`);
        clearTimeout(timeoutId);
      };
    } else {
      console.log(`📱 [${timestamp}] MobileDashboard: Feed loading skipped (conditions not met or no session)`);
    }
  }, [currentScreen, loadPersonalizedFeed, isAuthenticated, user?.id, renderingSessionId, user]); // Include user and renderingSessionId

  // Filter functions
  const checkTimeFilter = (timeFilter: string, contentDateString: string): boolean => {
    if (timeFilter === 'All Time') return true;

    const today = new Date();
    const contentDate = new Date(contentDateString);
    const diffTime = Math.abs(today.getTime() - contentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (timeFilter) {
      case 'Last 24 hours': return diffDays <= 1;
      case 'Last Week': return diffDays <= 7;
      case 'Last Month': return diffDays <= 30;
      case 'Last Year': return diffDays <= 365;
      default: return false;
    }
  };

  // Helper function to map significance to AI level
  const getAILevel = (significance: number): string => {
    if (significance >= 8) return 'Advanced';
    if (significance >= 6) return 'Complex';
    if (significance >= 4) return 'Intermediate';
    return 'Simple';
  };

  const filterContentByAllCriteria = (content: ContentItem[], profile: UserProfile): ContentItem[] => {
    // Use real content if available, fallback to mock content
    const contentToFilter = realContent.length > 0 ? realContent : content;
    const lowerQuery = profile.currentSearchQuery.toLowerCase();
    
    // Debug: contentToFilter has realContent.length articles
    
    // If we have real content from API, only apply search filter (backend already filtered by preferences)
    if (realContent.length > 0) {
      return contentToFilter.filter(item => {
        // Only apply search query filter for real content
        let searchQueryMatch = true;
        if (lowerQuery) {
          searchQueryMatch = 
            item.title.toLowerCase().includes(lowerQuery) ||
            item.summary.toLowerCase().includes(lowerQuery) ||
            item.category.toLowerCase().includes(lowerQuery) ||
            item.publisher.toLowerCase().includes(lowerQuery);
        }
        return searchQueryMatch;
      });
    }
    
    // For mock content, apply all filters
    return contentToFilter.filter(item => {
      // Preference filters for mock content
      const isInterestMatch = profile.interests.includes(item.category);
      const isTypeMatch = profile.selectedContentTypes.includes(item.type);
      const isPublisherMatch = profile.selectedPublishers.includes(item.publisher);
      const isTimeMatch = checkTimeFilter(profile.timeFilter, item.publishDate);
      
      const preferenceMatch = isInterestMatch && isTypeMatch && isPublisherMatch && isTimeMatch;

      // Search query filter
      let searchQueryMatch = true;
      if (lowerQuery) {
        searchQueryMatch = 
          item.title.toLowerCase().includes(lowerQuery) ||
          item.summary.toLowerCase().includes(lowerQuery) ||
          item.category.toLowerCase().includes(lowerQuery) ||
          item.publisher.toLowerCase().includes(lowerQuery);
      }
      
      return preferenceMatch && searchQueryMatch;
    });
  };

  // Update functions
  const updateProfile = (field: keyof UserProfile, value: string | string[] | boolean) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setUserProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleContentType = (type: 'BLOGS' | 'VIDEOS' | 'PODCASTS') => {
    setUserProfile(prev => ({
      ...prev,
      selectedContentTypes: prev.selectedContentTypes.includes(type)
        ? prev.selectedContentTypes.filter(t => t !== type)
        : [...prev.selectedContentTypes, type]
    }));
  };

  const togglePublisher = (publisher: string) => {
    setUserProfile(prev => ({
      ...prev,
      selectedPublishers: prev.selectedPublishers.includes(publisher)
        ? prev.selectedPublishers.filter(p => p !== publisher)
        : [...prev.selectedPublishers, publisher]
    }));
  };

  const handleSearch = (query: string) => {
    setUserProfile(prev => ({ ...prev, currentSearchQuery: query.trim() }));
  };

  // Utility functions for content rendering
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BLOGS': return 'bg-blue-100 text-blue-800 border-blue-500';
      case 'VIDEOS': return 'bg-red-100 text-red-800 border-red-500';
      case 'PODCASTS': return 'bg-green-100 text-green-800 border-green-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  // Content card renderer
  const renderContentCard = (item: ContentItem) => {

    const getActionText = (type: string) => {
      switch (type) {
        case 'BLOGS': return 'Read Article';
        case 'VIDEOS': return 'Watch Video';
        case 'PODCASTS': return 'Listen';
        default: return 'View';
      }
    };

    const typeColors = getTypeColor(item.type);
    const borderClass = item.type === 'BLOGS' ? 'border-blue-500' : 
                       item.type === 'VIDEOS' ? 'border-red-500' : 
                       item.type === 'PODCASTS' ? 'border-green-500' : 'border-gray-500';
    
    return (
      <div key={item.id} className={`bg-white p-4 rounded-xl shadow transition duration-200 hover:shadow-lg border-l-4 ${borderClass}`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full uppercase ${typeColors}`}>
            {item.type}
          </span>
          <span className="text-xs text-gray-500 font-medium">{item.publisher}</span>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
        <p className="text-gray-600 text-sm mb-4 leading-snug">{item.summary}</p>
        
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span className="italic">Published: {new Date(item.publishDate).toLocaleDateString()}</span>
          <a 
            href={item.sourceLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-3 rounded-lg shadow-md transition duration-200"
          >
            <span>{getActionText(item.type)}</span>
          </a>
        </div>
      </div>
    );
  };

  // Render dashboard content
  const renderDashboardContent = () => {
    const isSearching = !!userProfile.currentSearchQuery.trim();
    const filteredContent = filterContentByAllCriteria(mockContent, userProfile);

    // Group content by interests
    const groupedContent: { [key: string]: ContentItem[] } = {};
    userProfile.interests.forEach(interest => {
      const contentForInterest = filteredContent.filter(item => item.category === interest);
      if (contentForInterest.length > 0) {
        groupedContent[interest] = contentForInterest;
      }
    });

    // Include search results that don't match primary interests
    if (isSearching) {
      const uncategorizedContent = filteredContent.filter(item => !userProfile.interests.includes(item.category));
      if (uncategorizedContent.length > 0) {
        groupedContent['Other Relevant Results'] = uncategorizedContent;
      }
    }

    // Group content by content type for organized display
    const contentByType: { [key: string]: ContentItem[] } = {
      'BLOGS': filteredContent.filter(item => item.type === 'BLOGS'),
      'VIDEOS': filteredContent.filter(item => item.type === 'VIDEOS'),
      'PODCASTS': filteredContent.filter(item => item.type === 'PODCASTS')
    };

    const allCategories = Object.keys(groupedContent);
    const topBreakingStories = filteredContent
      .sort((a, b) => (b.significance || 5) - (a.significance || 5))
      .slice(0, 3);

    return (
      <div className="space-y-6">
        {/* Welcome message */}
        {isSearching ? (
          <div className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800">Showing results for: "{userProfile.currentSearchQuery}"</p>
            <p className="text-xs text-yellow-700">Results are filtered by your preferences and {userProfile.timeFilter}</p>
          </div>
        ) : (
          <div className="p-4 mb-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg">
            <p className="text-sm font-semibold text-indigo-700">Welcome back, {userProfile.name}!</p>
            <p className="text-xs text-indigo-600">AI Experience: {userProfile.aiExposure} | Showing: {userProfile.timeFilter}</p>
          </div>
        )}

        {/* Breaking Stories Section - Horizontal scroll */}
        {topBreakingStories.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <span className="text-lg font-bold text-red-600 mr-2">🚨</span>
              <h2 className="text-lg font-bold text-gray-800">Breaking Stories</h2>
            </div>
            <div className="flex overflow-x-scroll pb-3 space-x-3 scrollbar-hide">
              {topBreakingStories.map((story) => (
                <div key={story.id} className="flex-none w-72 bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full uppercase ${getTypeColor(story.type)}`}>
                      {story.type}
                    </span>
                    <span className="text-xs text-red-600 font-bold">Score: {story.significance}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">{story.title}</h3>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{story.summary.substring(0, 100)}...</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{story.publisher}</span>
                    <span>{new Date(story.publishDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Types Sections */}
        <div className="space-y-6">
          {/* Blogs Section */}
          {contentByType['BLOGS'].length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">📰</span>
                <h3 className="text-lg font-bold text-gray-800">AI News & Articles</h3>
                <span className="ml-2 text-sm text-gray-500">({contentByType['BLOGS'].length})</span>
              </div>
              <div className="flex overflow-x-scroll pb-3 space-x-3 scrollbar-hide">
                {contentByType['BLOGS'].slice(0, 5).map((item) => (
                  <div key={item.id} className="flex-none w-64 bg-white p-3 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        BLOGS
                      </span>
                      <span className="text-xs text-gray-500">Score: {item.significance}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">{item.title}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.summary.substring(0, 80)}...</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{item.publisher}</span>
                      <span>{new Date(item.publishDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {contentByType['VIDEOS'].length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">🎥</span>
                <h3 className="text-lg font-bold text-gray-800">Video Content</h3>
                <span className="ml-2 text-sm text-gray-500">({contentByType['VIDEOS'].length})</span>
              </div>
              <div className="flex overflow-x-scroll pb-3 space-x-3 scrollbar-hide">
                {contentByType['VIDEOS'].slice(0, 5).map((item) => (
                  <div key={item.id} className="flex-none w-64 bg-white p-3 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800">
                        VIDEOS
                      </span>
                      <span className="text-xs text-gray-500">Score: {item.significance}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">{item.title}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.summary.substring(0, 80)}...</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{item.publisher}</span>
                      <span>{new Date(item.publishDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Podcasts Section */}
          {contentByType['PODCASTS'].length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">🎧</span>
                <h3 className="text-lg font-bold text-gray-800">Audio & Podcasts</h3>
                <span className="ml-2 text-sm text-gray-500">({contentByType['PODCASTS'].length})</span>
              </div>
              <div className="flex overflow-x-scroll pb-3 space-x-3 scrollbar-hide">
                {contentByType['PODCASTS'].slice(0, 5).map((item) => (
                  <div key={item.id} className="flex-none w-64 bg-white p-3 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
                        PODCASTS
                      </span>
                      <span className="text-xs text-gray-500">Score: {item.significance}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">{item.title}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.summary.substring(0, 80)}...</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{item.publisher}</span>
                      <span>{new Date(item.publishDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Categories Section - Traditional grouping */}
        {allCategories.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">🏷️</span>
              <h3 className="text-lg font-bold text-gray-800">By Your Interests</h3>
            </div>
            {allCategories.map(category => (
              <div key={category}>
                <h4 className="text-md font-semibold text-gray-700 mb-3 uppercase">{category}</h4>
                <div className="flex overflow-x-scroll pb-3 space-x-3 scrollbar-hide">
                  {groupedContent[category].map((item) => (
                    <div key={item.id} className="flex-none w-64 bg-white p-3 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                      <span className="text-xs text-gray-500 font-semibold mb-1 uppercase block">
                        AI Level: {getAILevel(item.significance || 5)}
                      </span>
                      <h4 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">{item.title}</h4>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{item.publisher}</span>
                        <span>{new Date(item.publishDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No content fallback */}
        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No content found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms to see more results.</p>
          </div>
        )}
      </div>
    );
  };

  // Screen components
  const PreviewScreen = () => (
    <div className="h-full flex flex-col">
      <header className="h-16 bg-indigo-600 flex items-center justify-center">
        <span className="text-2xl font-extrabold text-white">Vidyagam</span>
      </header>
      
      <main className="flex-1 bg-gray-50 p-4 space-y-6 overflow-y-auto">
        <div className="text-center pt-4">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Gaining Knowledge, Filtered for You.</h2>
          <p className="text-gray-600">Focus only on the technical domains and content types that matter to you.</p>
        </div>

        {/* Preview cards */}
        <div className="bg-white rounded-xl shadow-lg p-4 border-t-4 border-indigo-500">
          <p className="text-xs text-indigo-600 font-semibold mb-1 uppercase">Preview: Generative AI</p>
          <h3 className="text-lg font-bold text-gray-900 leading-snug">New Benchmark Achieved in LLM Efficiency</h3>
          <p className="text-sm text-gray-500 mt-2">Content Type: Article | Publisher: Google DeepMind | 1h ago</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <p className="text-xs text-red-600 font-semibold mb-1 uppercase">Preview: Cloud Computing</p>
          <h3 className="text-lg font-bold text-gray-900 leading-snug">Serverless Containers Explained (Video)</h3>
          <p className="text-sm text-gray-500 mt-2">Content Type: Video | Publisher: MIT Tech Review | 5h ago</p>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 p-4">
        <button 
          onClick={() => navigateToScreen('preferences')}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
        >
          Start Personalizing Feed & Sign In
        </button>
      </footer>
    </div>
  );

  const PreferencesScreen = () => (
    <div className="h-full flex flex-col">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-start px-4">
        <h1 className="text-xl font-extrabold text-indigo-600">Setup Your Profile & Feed</h1>
      </header>

      <main className="flex-1 bg-gray-50 p-4 space-y-6 overflow-y-auto">
        {/* Profile Details */}
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-base font-bold text-indigo-600 mb-3">1. Profile Details</h3>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Your Name"
              value={userProfile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
            <input 
              type="text" 
              placeholder="Your Role/Industry"
              value={userProfile.role}
              onChange={(e) => updateProfile('role', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* AI Exposure Level */}
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-base font-bold text-indigo-600 mb-3">2. AI Exposure Level</h3>
          <select 
            value={userProfile.aiExposure}
            onChange={(e) => updateProfile('aiExposure', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="Beginner">Beginner (Just starting)</option>
            <option value="Intermediate">Intermediate (Working knowledge)</option>
            <option value="Expert">Expert (Deep experience)</option>
          </select>
        </div>

        {/* Content Types */}
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-base font-bold text-indigo-600 mb-3">3. Content Types</h3>
          <div className="flex gap-2">
            {availableContentTypes.map(type => (
              <button
                key={type}
                onClick={() => toggleContentType(type as 'BLOGS' | 'VIDEOS' | 'PODCASTS')}
                className={`px-3 py-1 text-sm rounded-lg transition flex-1 ${
                  userProfile.selectedContentTypes.includes(type as 'BLOGS' | 'VIDEOS' | 'PODCASTS')
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Technical Interests */}
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-base font-bold text-indigo-600 mb-3">4. Technical Interests</h3>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map(interest => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 text-sm rounded-full transition ${
                  userProfile.interests.includes(interest)
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Publishers */}
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-base font-bold text-indigo-600 mb-3">5. Preferred Publishers</h3>
          <div className="flex flex-wrap gap-2">
            {availablePublishers.map(publisher => (
              <button
                key={publisher}
                onClick={() => togglePublisher(publisher)}
                className={`px-4 py-2 text-sm rounded-full transition ${
                  userProfile.selectedPublishers.includes(publisher)
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {publisher}
              </button>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-base font-bold text-indigo-600 mb-3">6. Notifications</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Subscribe to Weekly Newsletter</label>
            <input 
              type="checkbox"
              checked={userProfile.newsletterSubscription}
              onChange={(e) => updateProfile('newsletterSubscription', e.target.checked)}
              className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 p-4">
        <button 
          onClick={() => navigateToScreen('dashboard')}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
        >
          Save Preferences & Go to Dashboard
        </button>
      </footer>
    </div>
  );

  const DashboardScreen = () => (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header - Clean design matching mockup */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10">
        <span className="text-xl font-extrabold text-indigo-600">Vidyagam</span>
        <div className="flex space-x-3">
          {/* Filter Icon */}
          <button className="text-gray-500 hover:text-indigo-600 p-1 rounded-full bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v7l-4-4v-3.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
          </button>
          {/* Search Icon */}
          <button className="text-gray-500 hover:text-indigo-600">
            <Search className="w-6 h-6" />
          </button>
          {/* Settings Icon */}
          <button className="text-gray-500 hover:text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.526.323 1.157.485 1.788.485z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-6">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading content...</span>
          </div>
        )}
        {error && (
          <div className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}
        {!loading && renderDashboardContent()}
      </main>
    </div>
  );

  // Web Screen Components
  const WebPreviewScreen = () => (
    <div className="flex h-full">
      <div className="w-1/2 bg-indigo-600 p-12 flex flex-col justify-center">
        <h1 className="text-5xl font-extrabold text-white mb-6">Vidyagam</h1>
        <h2 className="text-3xl font-light text-indigo-200 leading-snug">
          The signal-to-noise ratio in technical content, perfected.
        </h2>
        <p className="text-indigo-100 mt-4">
          Focus only on the technical domains and content types that matter to your expertise.
        </p>
      </div>
      <div className="w-1/2 p-12 flex flex-col justify-center bg-gray-50">
        <h3 className="text-3xl font-bold text-gray-800 mb-6">Get Started</h3>
        <div className="space-y-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-indigo-500">
            <h4 className="font-bold text-gray-900 mb-2">AI & Machine Learning</h4>
            <p className="text-gray-600 text-sm">Latest breakthroughs in generative AI, LLMs, and neural networks</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
            <h4 className="font-bold text-gray-900 mb-2">Cloud & Infrastructure</h4>
            <p className="text-gray-600 text-sm">Serverless, containers, and cloud-native architecture updates</p>
          </div>
        </div>
        <button 
          onClick={() => navigateToScreen('preferences')}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
        >
          Personalize Your Feed
        </button>
      </div>
    </div>
  );

  const WebPreferencesScreen = () => (
    <div className="p-8 flex-col h-full overflow-y-auto">
      <header className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-3xl font-extrabold text-indigo-600">Setup Your Profile & Interests</h1>
        <p className="text-gray-600 mt-2">Customize your content feed to match your technical expertise and interests</p>
      </header>
      
      <main className="flex-1 overflow-y-auto space-y-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-8">
          {/* Column 1: Profile Details */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-indigo-700 border-b pb-2">Your Profile</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Your Name"
                value={userProfile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input 
                type="text" 
                placeholder="Your Role/Industry"
                value={userProfile.role}
                onChange={(e) => updateProfile('role', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div>
                <label className="block text-gray-700 font-medium mb-2">AI Exposure Level</label>
                <select 
                  value={userProfile.aiExposure}
                  onChange={(e) => updateProfile('aiExposure', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner (Just starting)</option>
                  <option value="Intermediate">Intermediate (Working knowledge)</option>
                  <option value="Expert">Expert (Deep experience)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column 2: Technical Interests */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-indigo-700 border-b pb-2">Technical Interests</h3>
            <p className="text-gray-600 text-sm">Select the domains you want to follow closely.</p>
            <div className="flex flex-wrap gap-3">
              {availableInterests.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 text-sm rounded-full transition ${
                    userProfile.interests.includes(interest)
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          
          {/* Column 3: Content & Publisher Filters */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-indigo-700 border-b pb-2">Content & Publishers</h3>
            
            <div>
              <p className="text-gray-700 font-medium mb-3">Content Types to Enable:</p>
              <div className="flex gap-2 mb-6">
                {availableContentTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleContentType(type as 'BLOGS' | 'VIDEOS' | 'PODCASTS')}
                    className={`px-3 py-2 text-sm rounded-lg transition flex-1 ${
                      userProfile.selectedContentTypes.includes(type as 'BLOGS' | 'VIDEOS' | 'PODCASTS')
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-gray-700 font-medium mb-3">Preferred Publishers:</p>
              <div className="flex flex-wrap gap-3 mb-6">
                {availablePublishers.map(publisher => (
                  <button
                    key={publisher}
                    onClick={() => togglePublisher(publisher)}
                    className={`px-4 py-2 text-sm rounded-full transition ${
                      userProfile.selectedPublishers.includes(publisher)
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {publisher}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Weekly Newsletter Subscription</label>
                <input 
                  type="checkbox"
                  checked={userProfile.newsletterSubscription}
                  onChange={(e) => updateProfile('newsletterSubscription', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="mt-8 pt-6 border-t border-gray-200">
        <button 
          onClick={() => navigateToScreen('dashboard')}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-xl hover:bg-green-700 transition-colors"
        >
          Save Preferences & Go to Dashboard
        </button>
      </footer>
    </div>
  );

  const WebDashboardScreen = () => (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Your Curated Feed</h1>
            <p className="text-gray-500 mt-2">Personalized content based on your interests and expertise level</p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-gray-700 font-medium">Filter by Time:</label>
            <select 
              value={userProfile.timeFilter}
              onChange={(e) => updateProfile('timeFilter', e.target.value)}
              className="text-base border border-gray-300 rounded-lg p-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Last 24 hours">Last 24 hours</option>
              <option value="Last Week">Last Week</option>
              <option value="Last Month">Last Month</option>
              <option value="Last Year">Last Year</option>
              <option value="All Time">All Time</option>
            </select>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <input 
            type="search"
            placeholder="Search for specific updates (e.g., 'new AI models' or 'AWS security patches')"
            value={userProfile.currentSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </header>

      <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-4 text-gray-600 text-lg">Loading content...</span>
          </div>
        )}
        {error && (
          <div className="p-6 mb-8 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg shadow-sm">
            <p className="text-yellow-800 font-semibold">{error}</p>
          </div>
        )}
        {!loading && renderWebDashboardContent()}
      </main>
    </div>
  );

  const WebSettingsScreen = () => (
    <div className="p-8 h-full overflow-y-auto">
      <header className="border-b border-gray-200 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-indigo-600">Settings & Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences and content settings</p>
      </header>

      <main className="space-y-8 max-w-4xl">
        {/* Profile Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-6">Profile Details</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 font-semibold">Name:</label>
                <p className="text-gray-900 text-lg">{userProfile.name}</p>
              </div>
              <div>
                <label className="text-gray-700 font-semibold">Role/Industry:</label>
                <p className="text-gray-900 text-lg">{userProfile.role}</p>
              </div>
            </div>
            <div>
              <label className="text-gray-700 font-semibold">AI Exposure Level:</label>
              <p className="text-indigo-600 font-bold text-xl">{userProfile.aiExposure}</p>
            </div>
          </div>
        </div>

        {/* Content Preferences */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-6">Content Preferences</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-gray-700 font-semibold mb-3">Following Interests ({userProfile.interests.length}):</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {userProfile.interests.map(interest => (
                  <span key={interest} className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-800">
                    {interest}
                  </span>
                ))}
              </div>
              
              <h4 className="text-gray-700 font-semibold mb-3">Following Publishers ({userProfile.selectedPublishers.length}):</h4>
              <div className="flex flex-wrap gap-2">
                {userProfile.selectedPublishers.map(publisher => (
                  <span key={publisher} className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800">
                    {publisher}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-gray-700 font-semibold mb-3">Enabled Content Types:</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {userProfile.selectedContentTypes.map(type => (
                  <span key={type} className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                    {type}
                  </span>
                ))}
              </div>
              
              <h4 className="text-gray-700 font-semibold mb-3">Newsletter Subscription:</h4>
              <p className={`font-semibold ${userProfile.newsletterSubscription ? 'text-green-600' : 'text-red-600'}`}>
                {userProfile.newsletterSubscription ? 'Subscribed' : 'Not Subscribed'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-6">Account Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigateToScreen('preferences')}
              className="text-left bg-gray-50 p-4 rounded-lg border hover:bg-gray-100 transition group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-900">Edit Profile & Preferences</h4>
                  <p className="text-gray-600 text-sm">Update your interests, content types, and publishers</p>
                </div>
                <span className="text-indigo-500 group-hover:text-indigo-700">→</span>
              </div>
            </button>
            
            <button className="text-left bg-gray-50 p-4 rounded-lg border hover:bg-gray-100 transition group">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-900">Export Data</h4>
                  <p className="text-gray-600 text-sm">Download your preferences and reading history</p>
                </div>
                <span className="text-indigo-500 group-hover:text-indigo-700">↓</span>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );

  // Enhanced web dashboard content renderer
  const renderWebDashboardContent = () => {
    const isSearching = !!userProfile.currentSearchQuery.trim();
    const filteredContent = filterContentByAllCriteria(mockContent, userProfile);

    // Group content by interests
    const groupedContent: { [key: string]: ContentItem[] } = {};
    userProfile.interests.forEach(interest => {
      const contentForInterest = filteredContent.filter(item => item.category === interest);
      if (contentForInterest.length > 0) {
        groupedContent[interest] = contentForInterest;
      }
    });

    // Include search results that don't match primary interests
    if (isSearching) {
      const uncategorizedContent = filteredContent.filter(item => !userProfile.interests.includes(item.category));
      if (uncategorizedContent.length > 0) {
        groupedContent['Other Relevant Results'] = uncategorizedContent;
      }
    }

    const allCategories = Object.keys(groupedContent);

    return (
      <div className="space-y-10">
        {/* Welcome message */}
        {isSearching ? (
          <div className="p-6 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg shadow-sm">
            <p className="text-xl font-bold text-yellow-800">Refined Search Active: "{userProfile.currentSearchQuery}"</p>
            <p className="text-yellow-700">Results are highly specific, matching your query and your preferences.</p>
          </div>
        ) : (
          <div className="p-6 bg-white shadow-sm border-l-4 border-green-500 rounded-lg">
            <p className="text-xl font-bold text-gray-800">Hello, {userProfile.name}.</p>
            <p className="text-gray-500">Your feed is personalized for a {userProfile.aiExposure} in AI.</p>
          </div>
        )}

        {/* Content groups */}
        {allCategories.length > 0 ? (
          allCategories.map(category => (
            <div key={category} className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-extrabold text-indigo-700 border-b-2 border-indigo-200 pb-4 mb-6">
                {category} ({groupedContent[category].length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupedContent[category].map(item => (
                  <div key={item.id} className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                    {renderContentCard(item)}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-600 mb-4">No content found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms to see more results.</p>
          </div>
        )}
      </div>
    );
  };

  const SettingsScreen = () => (
    <div className="h-full flex flex-col">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-start px-4">
        <h1 className="text-xl font-extrabold text-indigo-600">Settings</h1>
      </header>

      <main className="flex-1 p-4 space-y-6 overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Profile Details</h3>
        <div className="space-y-3 p-3 bg-white rounded-lg shadow-sm">
          <p className="text-gray-700"><strong>Name:</strong> {userProfile.name}</p>
          <p className="text-gray-700"><strong>Role:</strong> {userProfile.role}</p>
          <p className="text-gray-700"><strong>AI Exposure:</strong> <span className="font-semibold text-indigo-600">{userProfile.aiExposure}</span></p>
        </div>

        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Content Preferences</h3>
        <div className="space-y-3 p-3 bg-white rounded-lg shadow-sm">
          <p className="text-gray-700"><strong>Interests ({userProfile.interests.length}):</strong></p>
          <div className="flex flex-wrap gap-2 mb-4">
            {userProfile.interests.map(interest => (
              <span key={interest} className="px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">{interest}</span>
            ))}
          </div>
          <p className="text-gray-700"><strong>Publishers ({userProfile.selectedPublishers.length}):</strong></p>
          <div className="flex flex-wrap gap-2 mb-4">
            {userProfile.selectedPublishers.map(publisher => (
              <span key={publisher} className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800">{publisher}</span>
            ))}
          </div>
          <p className="text-gray-700"><strong>Content Types:</strong></p>
          <div className="flex flex-wrap gap-2 mb-4">
            {userProfile.selectedContentTypes.map(type => (
              <span key={type} className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">{type}</span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button 
            onClick={() => navigateToScreen('preferences')}
            className="w-full text-left bg-white p-4 rounded-lg shadow flex justify-between items-center hover:bg-gray-50"
          >
            <span>Edit Profile & Preferences</span>
            <span className="text-indigo-500">→</span>
          </button>
        </div>
      </main>
    </div>
  );

  // Tab navigation
  const showTabControls = ['dashboard', 'settings'].includes(currentScreen);

  // Web Layout Component
  const WebLayout = () => (
    <div className="hidden lg:flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <nav className="w-64 xl:w-72 bg-gray-900 text-white flex flex-col p-4 lg:p-6">
        <div className="text-2xl lg:text-3xl font-extrabold text-indigo-400 mb-6 lg:mb-8">Vidyagam</div>
        <ul className="space-y-2 lg:space-y-3 flex-1">
          <li 
            className={`p-2 lg:p-3 rounded-lg cursor-pointer transition ${
              currentScreen === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-gray-700'
            }`}
            onClick={() => navigateToScreen('dashboard')}
          >
            <span className="font-bold text-sm lg:text-base">Dashboard</span>
          </li>
          <li 
            className={`p-2 lg:p-3 rounded-lg cursor-pointer transition ${
              currentScreen === 'settings' ? 'bg-indigo-600' : 'hover:bg-gray-700'
            }`}
            onClick={() => navigateToScreen('settings')}
          >
            <span className="font-bold text-sm lg:text-base">Settings</span>
          </li>
          <li 
            className={`p-2 lg:p-3 rounded-lg cursor-pointer transition ${
              currentScreen === 'preferences' ? 'bg-indigo-600' : 'hover:bg-gray-700'
            }`}
            onClick={() => navigateToScreen('preferences')}
          >
            <span className="font-bold text-sm lg:text-base">Preferences</span>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {currentScreen === 'preview' && <WebPreviewScreen />}
        {currentScreen === 'preferences' && <WebPreferencesScreen />}
        {currentScreen === 'dashboard' && <WebDashboardScreen />}
        {currentScreen === 'settings' && <WebSettingsScreen />}
      </main>
    </div>
  );

  // Tablet Layout Component
  const TabletLayout = () => (
    <div className="hidden md:flex lg:hidden h-screen bg-gray-50 flex-col">
      {/* Top Navigation for Tablet */}
      <nav className="bg-gray-900 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-extrabold text-indigo-400">Vidyagam</div>
          <div className="flex space-x-4">
            <button 
              onClick={() => navigateToScreen('dashboard')}
              className={`px-4 py-2 rounded-lg transition ${
                currentScreen === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigateToScreen('settings')}
              className={`px-4 py-2 rounded-lg transition ${
                currentScreen === 'settings' ? 'bg-indigo-600' : 'hover:bg-gray-700'
              }`}
            >
              Settings
            </button>
            <button 
              onClick={() => navigateToScreen('preferences')}
              className={`px-4 py-2 rounded-lg transition ${
                currentScreen === 'preferences' ? 'bg-indigo-600' : 'hover:bg-gray-700'
              }`}
            >
              Preferences
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {currentScreen === 'preview' && <TabletPreviewScreen />}
        {currentScreen === 'preferences' && <TabletPreferencesScreen />}
        {currentScreen === 'dashboard' && <TabletDashboardScreen />}
        {currentScreen === 'settings' && <TabletSettingsScreen />}
      </main>
    </div>
  );

  // Mobile Layout Component
  const MobileLayout = () => (
    <div className="md:hidden max-w-md mx-auto h-screen bg-white flex flex-col relative border-4 sm:border-8 border-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
      {/* Screen content */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'preview' && <PreviewScreen />}
        {currentScreen === 'preferences' && <PreferencesScreen />}
        {currentScreen === 'dashboard' && <DashboardScreen />}
        {currentScreen === 'settings' && <SettingsScreen />}
      </div>

      {/* Tab Controls */}
      {showTabControls && (
        <div className="bg-gray-100 p-2 flex space-x-2">
          <button 
            onClick={() => navigateToScreen('dashboard')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
              currentScreen === 'dashboard' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-white text-indigo-600 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigateToScreen('settings')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
              currentScreen === 'settings' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-white text-indigo-600 hover:bg-gray-50'
            }`}
          >
            Settings
          </button>
        </div>
      )}
    </div>
  );

  // Tablet Screen Components (similar to web but with adjusted layouts)
  const TabletPreviewScreen = () => <WebPreviewScreen />;
  const TabletPreferencesScreen = () => (
    <div className="p-6 h-full overflow-y-auto">
      <header className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-indigo-600">Setup Your Profile & Interests</h1>
        <p className="text-gray-600 mt-2">Customize your content feed</p>
      </header>
      
      <main className="space-y-8">
        {/* Profile and AI Exposure in a single row */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-indigo-700 border-b pb-2">Your Profile</h3>
            <input 
              type="text" 
              placeholder="Your Name"
              value={userProfile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input 
              type="text" 
              placeholder="Your Role/Industry"
              value={userProfile.role}
              onChange={(e) => updateProfile('role', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-indigo-700 border-b pb-2">AI Exposure Level</h3>
            <select 
              value={userProfile.aiExposure}
              onChange={(e) => updateProfile('aiExposure', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Interests */}
        <div>
          <h3 className="text-lg font-bold text-indigo-700 border-b pb-2 mb-4">Technical Interests</h3>
          <div className="flex flex-wrap gap-3">
            {availableInterests.map(interest => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 text-sm rounded-full transition ${
                  userProfile.interests.includes(interest)
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Types and Publishers */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-indigo-700 border-b pb-2 mb-4">Content Types</h3>
            <div className="flex gap-2">
              {availableContentTypes.map(type => (
                <button
                  key={type}
                  onClick={() => toggleContentType(type as 'BLOGS' | 'VIDEOS' | 'PODCASTS')}
                  className={`px-3 py-2 text-sm rounded-lg transition flex-1 ${
                    userProfile.selectedContentTypes.includes(type as 'BLOGS' | 'VIDEOS' | 'PODCASTS')
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-indigo-700 border-b pb-2 mb-4">Publishers</h3>
            <div className="flex flex-wrap gap-2">
              {availablePublishers.map(publisher => (
                <button
                  key={publisher}
                  onClick={() => togglePublisher(publisher)}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    userProfile.selectedPublishers.includes(publisher)
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {publisher}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Newsletter */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-700">Weekly Newsletter</label>
            <input 
              type="checkbox"
              checked={userProfile.newsletterSubscription}
              onChange={(e) => updateProfile('newsletterSubscription', e.target.checked)}
              className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>
        </div>
      </main>
      
      <footer className="mt-8 pt-6 border-t border-gray-200">
        <button 
          onClick={() => navigateToScreen('dashboard')}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
        >
          Save Preferences & Go to Dashboard
        </button>
      </footer>
    </div>
  );

  // Tablet Dashboard and Settings screens (reuse web versions)
  const TabletDashboardScreen = () => <WebDashboardScreen />;
  const TabletSettingsScreen = () => <WebSettingsScreen />;

  return (
    <div className="min-h-screen">
      <WebLayout />
      <TabletLayout />
      <MobileLayout />
      <footer className="mobile-dashboard-footer" style={{textAlign: 'center', padding: '1rem', background: '#f9f9f9'}}>
        <p style={{ color: '#111' }}>Vidyagam @ 2025 - All Rights Reserved</p>
      </footer>
    </div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
// Since MobileDashboard has no props and manages its own state via useAuth,
// we can safely prevent all prop-based re-renders
const areEqual = () => true;

export default React.memo(MobileDashboard, areEqual);