import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, User, Archive, Bell, Filter, Home, Bookmark, Menu, X, Clock, Star, Play, Headphones, ExternalLink, LogOut, Save, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import Header from './Header';
import Footer from './Footer';
import SEO from './SEO';
import { DashboardSkeleton } from './LoadingSkeleton';
import { useNavigate } from 'react-router-dom';
import SettingsFullScreen from './SettingsFullScreen';
import '../styles/design-tokens.css';
import '../styles/components.css';
import '../styles/dashboard.css';

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

const CompleteMobileDashboard: React.FC = () => {
  const { user, isAuthenticated, updatePreferences, logout } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Add content counts state (similar to Landing.tsx)
  const [contentCounts, setContentCounts] = useState<any>(null);

  const hasLoadedContent = useRef(false);
  // Hamburger Menu State
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'categories' | 'settings'>('dashboard');
  
  // Settings State
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  
  // Add menu items state similar to Landing.tsx
  const [menuItems, setMenuItems] = useState<Array<{id: string, name: string, icon: string, description: string}>>([
    { id: 'home', name: 'Home', icon: '🏠', description: 'All Categories Overview' }
  ]);
  
  // Add active menu state
  const [activeMenu, setActiveMenu] = useState<string>('home');
  
  // User Preferences (editable in settings)
  const [userPreferences, setUserPreferences] = useState({
    experience_level: user?.preferences?.experience_level || 'intermediate',
    professional_roles: (user?.preferences as any)?.professional_roles || ['enthusiast'],
    categories_selected: (user?.preferences as any)?.category_ids_selected || [],
    content_types_selected: (user?.preferences as any)?.content_type_ids_selected || [],
    publishers_selected: (user?.preferences as any)?.publisher_ids_selected || []
  });

  // Available options for settings
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<any[]>([]);
  const [availablePublishers, setAvailablePublishers] = useState<any[]>([]);
  
  const EXPERIENCE_LEVELS = [
    { id: 'beginner', name: 'Beginner', icon: '🌱', description: 'New to AI' },
    { id: 'intermediate', name: 'Intermediate', icon: '🚀', description: 'Some AI knowledge' },
    { id: 'advanced', name: 'Advanced', icon: '⚡', description: 'AI professional' },
    { id: 'expert', name: 'Expert', icon: '🎯', description: 'AI researcher/leader' }
  ];

  const ROLE_TYPES = [
    { id: 'student', name: 'Student', icon: '🎓' },
    { id: 'developer', name: 'Developer', icon: '💻' },
    { id: 'researcher', name: 'Researcher', icon: '🔬' },
    { id: 'enthusiast', name: 'Enthusiast', icon: '❤️' },
    { id: 'executive', name: 'Executive', icon: '👔' },
    { id: 'entrepreneur', name: 'Entrepreneur', icon: '🚀' }
  ];

  // Helper function to get category icon (same as Landing.tsx)
  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: { [key: string]: string } = {
      'Generative AI': '🤖',
      'Machine Learning': '🧠',
      'AI Applications': '💼',
      'AI Infrastructure': '💬',
      'AI Safety And Governance': '💬',
      'Robotics': '🤖',
      'Quantum AI': '🔬',
      'AI StartUps': '🛠️',
      'Cloud Computing': '⚖️',
      'Deep Learning': '🧠',
      'Internet Of Things (IoT)': '🧠',
      'Future Technology': '🕸️'
    };
    return iconMap[categoryName.toLowerCase()] || '🤖';
  };

  // Load available options for settings
  useEffect(() => {
    const loadOptions = async () => {
      console.log('🔄 [loadOptions] Loading available options...');
      
      try {
        console.log('📡 [loadOptions] Fetching categories, content types, and publishers...');
        
        const [categoriesRes, contentTypesRes, publishersRes] = await Promise.all([
          apiService.getAvailableCategories(),
          apiService.getAvailableContentTypes(),
          apiService.getAvailablePublishers()
        ]);
        
        console.log('✅ [loadOptions] Categories:', categoriesRes.categories?.length || 0);
        console.log('✅ [loadOptions] Content types:', contentTypesRes.content_types?.length || 0);
        console.log('✅ [loadOptions] Publishers:', publishersRes.publishers?.length || 0);
        
        setAvailableCategories(categoriesRes.categories || []);
        setAvailableContentTypes(contentTypesRes.content_types || []);
        setAvailablePublishers(publishersRes.publishers || []);
        
        console.log('✅ [loadOptions] All lookup data loaded successfully');
      } catch (err) {
        console.error('❌ [loadOptions] Error loading options:', err);
        // Set empty arrays as fallback
        setAvailableCategories([]);
        setAvailableContentTypes([]);
        setAvailablePublishers([]);
      }
    };
    
    loadOptions();
    }, []);
  // Load available options for settings
  useEffect(() => {
  if (!isAuthenticated || !user) return;

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📱 Loading personalized feed...');
      
      // WAIT for lookup data to be available - CHECK THIS FIRST
      if (availableCategories.length === 0 || availableContentTypes.length === 0 || availablePublishers.length === 0) {
        console.log('⏳ Waiting for lookup data...', {
          categories: availableCategories.length,
          contentTypes: availableContentTypes.length,
          publishers: availablePublishers.length
        });
        setLoading(false);
        return;
      }

      // NOW check if already loaded (after lookup data is available)
      if (hasLoadedContent.current && !searchQuery) {
        console.log('⏭️ Skipping duplicate load - content already loaded');
        setLoading(false);
        return;
      }
      
      // Convert IDs to names for API request
      const categoryNames = userPreferences.categories_selected
        .map(id => availableCategories.find(cat => cat.id === id)?.name)
        .filter(Boolean) as string[];
      
      const contentTypeNames = userPreferences.content_types_selected
        .map(id => availableContentTypes.find(ct => ct.id === id)?.name)
        .filter(Boolean) as string[];
      
      // Handle publishers - 'all' or convert IDs to names
      let publisherNames: string[];
      if (userPreferences.publishers_selected.includes('all')) {
        publisherNames = ['all'];
      } else {
        publisherNames = userPreferences.publishers_selected
          .map(id => {
            if (typeof id === 'number') {
              return availablePublishers.find(pub => pub.id === id)?.name;
            }
            return id; // Already a string
          })
          .filter(Boolean) as string[];
      }
      
      const filterRequest = {
        interests: categoryNames.length > 0 ? categoryNames : ['Generative AI', 'Machine Learning'],
        content_types: contentTypeNames.length > 0 ? contentTypeNames : ['blog', 'video', 'podcast'],
        publishers: publisherNames.length > 0 ? publisherNames : ['all'],
        time_filter: 'Last Week',
        search_query: searchQuery,
        limit: 50
      };

      console.log('📤 Sending feed request:', filterRequest);
      
      const response = await apiService.getPersonalizedFeed(filterRequest);
      
      // Convert grouped content to flat array with proper type mapping
      const flatContent: ContentItem[] = [];
      response.grouped_content?.forEach((group: any) => {
        group.items?.forEach((item: any) => {
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
      hasLoadedContent.current = true; // Mark as loaded AFTER successful load
      
      console.log('✅ Feed loaded successfully:', flatContent.length, 'items');
      console.log('📊 Content breakdown:', {
        total: flatContent.length,
        blogs: flatContent.filter(item => item.type === 'BLOGS').length,
        videos: flatContent.filter(item => item.type === 'VIDEOS').length,
        podcasts: flatContent.filter(item => item.type === 'PODCASTS').length
      });
      
    } catch (err) {
      console.error('❌ Error loading feed:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  loadFeed();
}, [isAuthenticated, user?.id, searchQuery, 
    JSON.stringify(userPreferences.categories_selected),
    JSON.stringify(userPreferences.content_types_selected), 
    JSON.stringify(userPreferences.publishers_selected),
    availableCategories.length,
    availableContentTypes.length,
    availablePublishers.length
]);
  // Reset load flag when preferences change
  useEffect(() => { 
    hasLoadedContent.current = false;
  }, [userPreferences.categories_selected, userPreferences.content_types_selected, userPreferences.publishers_selected]);

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      return `${Math.floor(diffInHours / 24)}d ago`;
    } catch {
      return 'Unknown';
    }
  };
  
  const ArticleCard = ({ article, contentType }: { article: any; contentType: string }) => {
    const getContentTypeInfo = (type: string) => {
      switch (type.toLowerCase()) {
        case 'podcast':
          return { label: 'PODCAST', bgColor: '#dcfce7', textColor: '#15803d' };
        case 'video':
          return { label: 'VIDEO', bgColor: '#fee2e2', textColor: '#dc2626' };
        default:
          return { label: 'ARTICLE', bgColor: '#dbeafe', textColor: '#1e40af' };
      }
    };
    const typeInfo = getContentTypeInfo(contentType);

    return (
      <article
        onClick={() => window.open(article.sourceLink || article.url, '_blank', 'noopener,noreferrer')}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          minHeight: '400px',
          maxHeight: '400px',
          height: '400px',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <span style={{ 
            backgroundColor: typeInfo.bgColor, 
            color: typeInfo.textColor, 
            padding: '4px 8px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            fontWeight: '500' 
          }}>
            {typeInfo.label}
          </span>
          {(article.significanceScore || article.significance) && (
            <span style={{ 
              backgroundColor: '#fef3c7', 
              color: '#92400e', 
              padding: '4px 8px', 
              borderRadius: '6px', 
              fontSize: '12px', 
              fontWeight: '500' 
            }}>
              Score: {article.significanceScore || article.significance}
            </span>
          )}
        </div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#111827', 
          marginBottom: '8px',
          lineHeight: '1.4',
          flex: '0 0 auto',
          minHeight: '44px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {article.title}
        </h3>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '13px', 
          marginBottom: '16px',
          lineHeight: '1.5',
          flex: '1',
          overflow: 'auto'
        }}>
          {article.summary || article.content_summary}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: 'auto' }}>
          <span style={{ fontWeight: '500' }}>{article.publisher || article.source || 'Unknown'}</span>
          <span>{formatTimeAgo(article.publishDate || article.published_date)}</span>
        </div>
      </article>
    );
  };

  const renderContentByType = () => {
    console.log('🎨 renderContentByType called, content state:', content);
    console.log('🎨 Content length:', content?.length || 0);
    console.log('🎨 Selected category:', selectedCategory);
    console.log('🎨 Content counts:', contentCounts);

    if (!content || content.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '64px 16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            No content available
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
            We're fetching personalized content for you. Please check back soon!
          </p>
        </div>
      );
    }

    // Filter content by selected category (similar to Landing.tsx getCurrentCategory logic)
    let filteredContent = content;
    if (selectedCategory && selectedCategory !== 'All') {
      console.log('🔍 Filtering content by category:', selectedCategory);
      filteredContent = content.filter(item => {
        const categoryMatch = item.category.toLowerCase() === selectedCategory.toLowerCase();
        console.log(`Item: ${item.title}, Category: ${item.category}, Match: ${categoryMatch}`);
        return categoryMatch;
      });
      console.log('🔍 Filtered content length:', filteredContent.length);
    }

    // Calculate real counts from filtered content
    const contentByType: { [key: string]: any[] } = {
      blog: [],
      podcast: [],
      video: []
    };

    filteredContent.forEach(item => {
      let type: string;
      switch (item.type) {
        case 'BLOGS':
          type = 'blog';
          break;
        case 'VIDEOS':
          type = 'video';
          break;
        case 'PODCASTS':
          type = 'podcast';
          break;
        default:
          type = 'blog';
      }
      if (contentByType[type]) {
        contentByType[type].push(item);
      } else {
        contentByType.blog.push(item);
      }
    });

    // Get real counts (similar to Landing.tsx)
    let realCounts = {
      blogs: contentByType.blog.length,
      podcasts: contentByType.podcast.length,
      videos: contentByType.video.length
    };

    // If we have API counts, use those for display
    if (contentCounts) {
      if (selectedCategory === 'All') {
        realCounts = {
          blogs: contentCounts.total_blogs || contentByType.blog.length,
          podcasts: contentCounts.total_podcasts || contentByType.podcast.length,
          videos: contentCounts.total_videos || contentByType.video.length
        };
      } else if (contentCounts.by_category) {
        const categoryKey = Object.keys(contentCounts.by_category).find(key => 
          key.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (categoryKey) {
          const categoryCounts = contentCounts.by_category[categoryKey];
          realCounts = {
            blogs: categoryCounts.blogs || contentByType.blog.length,
            podcasts: categoryCounts.podcasts || contentByType.podcast.length,
            videos: categoryCounts.videos || contentByType.video.length
          };
        }
      }
    }

    console.log('📊 Content grouped by type:', contentByType);
    console.log('📊 Real counts:', realCounts);

    // Show message if no content after filtering
    if (filteredContent.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '64px 16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            No content found for "{selectedCategory}"
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
            Try selecting a different category or adjust your settings.
          </p>
          <button
            onClick={() => {
              setActiveMenu('home');
              setSelectedCategory('All');
            }}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dbeafe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            View All Categories
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '16px' }}>
        {/* Category Header with Stats (similar to Landing.tsx) */}
        <div style={{ textAlign: 'center', marginBottom: '-24px' }}>
          <h1 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '6px' }}>
            {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
          </h1>
          
          {/* Content Stats */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            margin: '0 auto' 
          }}>
            <div style={{ 
              backgroundColor: '#f9fafb', 
              borderRadius: '6px', 
              padding: '6px 12px', 
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {realCounts.blogs}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Blogs</div>
            </div>
            <div style={{ 
              backgroundColor: '#f9fafb', 
              borderRadius: '6px', 
              padding: '6px 12px', 
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {realCounts.podcasts}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Podcasts</div>
            </div>
            <div style={{ 
              backgroundColor: '#f9fafb', 
              borderRadius: '6px', 
              padding: '6px 12px', 
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {realCounts.videos}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Videos</div>
            </div>
          </div>
        </div>

        {/* Category Filter Indicator */}
        {selectedCategory && selectedCategory !== 'All' && (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🎯</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  Filtered by: {selectedCategory}
                </div>
                <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                  Showing {filteredContent.length} items
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveMenu('home');
                setSelectedCategory('All');
              }}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#1f2937',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dbeafe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Display ALL blogs (no limit) */}
        {contentByType.blog.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#dbeafe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#3b82f6' }}>📖</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Latest Blogs</h2>
              <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500' }}>
                {realCounts.blogs}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Display ALL blogs, not just first 3 */}
              {contentByType.blog.map((article, index) => (
                <ArticleCard key={index} article={article} contentType="blog" />
              ))}
            </div>
          </section>
        )}

        {/* Display ALL podcasts (no limit) */}
        {contentByType.podcast.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#16a34a' }}>🎧</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Featured Podcasts</h2>
              <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500' }}>
                {realCounts.podcasts}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Display ALL podcasts, not just first 3 */}
              {contentByType.podcast.map((article, index) => (
                <ArticleCard key={index} article={article} contentType="podcast" />
              ))}
            </div>
          </section>
        )}

        {/* Display ALL videos (no limit) */}
        {contentByType.video.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#fee2e2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#dc2626' }}>🎥</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Latest Videos</h2>
              <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500' }}>
                {realCounts.videos}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Display ALL videos, not just first 3 */}
              {contentByType.video.map((article, index) => (
                <ArticleCard key={index} article={article} contentType="video" />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('dashboard');
    setMenuOpen(false);
    hasLoadedContent.current = false;
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Save settings - Following onboarding logic
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      // Get category names from selected category IDs
      const selectedCategoryNames = availableCategories
        .filter(category => userPreferences.categories_selected.includes(category.id))
        .map(category => category.name);

      // Get content type names from selected content type IDs
      const selectedContentTypeNames = availableContentTypes
        .filter(contentType => userPreferences.content_types_selected.includes(contentType.id))
        .map(contentType => contentType.name);

      // Get publisher names from selected publisher IDs
      const selectedPublisherNames = availablePublishers
        .filter(publisher => userPreferences.publishers_selected.includes(publisher.id))
        .map(publisher => publisher.name);

      const preferences = {
        // Core user_preferences table fields
        experience_level: userPreferences.experience_level,
        professional_roles: userPreferences.professional_roles,
        
        // Name-based arrays (backward compatibility)
        categories_selected: selectedCategoryNames,
        content_types_selected: selectedContentTypeNames,
        publishers_selected: selectedPublisherNames,
        
        // ID-based arrays (preferred for filtering) - SEND IDs TO BACKEND
        category_ids_selected: userPreferences.categories_selected,
        content_type_ids_selected: userPreferences.content_types_selected,
        publisher_ids_selected: userPreferences.publishers_selected,
        
        // Additional preference fields
        newsletter_frequency: "weekly",
        email_notifications: true,
        breaking_news_alerts: false,
        onboarding_completed: true
      };

      console.log('🔍 Saving preferences:', JSON.stringify(preferences, null, 2));
      await updatePreferences(preferences);
      
      setSettingsChanged(false);
      setCurrentView('dashboard');
      
      // Reset content load flag to reload with new preferences
      hasLoadedContent.current = false;
      
      // Show success message
      alert('✅ Settings saved successfully! Reloading your personalized feed...');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Failed to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Add useEffect to update menu items when categories are loaded
  useEffect(() => {
    console.log('🔄 [menuItems useEffect] Checking if we should update menu items...', {
      availableCategoriesLength: availableCategories.length,
      userCategoriesSelectedLength: userPreferences.categories_selected.length
    });

    if (availableCategories.length > 0 && userPreferences.categories_selected.length > 0) {
      // Get user's selected categories
      const userCategories = availableCategories.filter(cat => 
        userPreferences.categories_selected.includes(cat.id)
      );
      
      console.log('📋 [menuItems useEffect] User selected categories:', userCategories);
      
      // Create menu items from user's selected categories (WITHOUT ICONS)
      const categoryMenus = userCategories.map(cat => ({
        id: cat.name.toLowerCase().replace(/\s+/g, '-'),
        name: cat.name,
        icon: '',
        description: cat.description || ''
      }));
      
      const newMenuItems = [
        { id: 'home', name: 'Home', icon: '', description: 'All Categories Overview' },
        ...categoryMenus
      ];

      console.log('✅ [menuItems useEffect] Setting menu items:', newMenuItems);
      setMenuItems(newMenuItems);
    }
  }, [availableCategories, userPreferences.categories_selected]);

  // Add menu selection handler
  const handleMenuSelection = async (menuId: string) => {
    console.log('🎯 [handleMenuSelection] Menu selected:', menuId);
    setActiveMenu(menuId);
    setMenuOpen(false);
    
    if (menuId === 'home') {
      setSelectedCategory('All');
      // Get counts for all categories (similar to Landing.tsx)
      try {
        const countsResponse = await apiService.getContentCounts('all');
        setContentCounts(countsResponse);
        console.log('✅ Content counts loaded for All:', countsResponse);
      } catch (error) {
        console.error('Failed to fetch content counts:', error);
      }
    } else {
      // Find the category name from menuItems
      const menuItem = menuItems.find(item => item.id === menuId);
      if (menuItem && menuItem.name !== 'Home') {
        console.log('🎯 [handleMenuSelection] Setting category filter:', menuItem.name);
        setSelectedCategory(menuItem.name);
        // Get counts for specific category
        try {
          const countsResponse = await apiService.getContentCounts(menuItem.name);
          setContentCounts(countsResponse);
          console.log('✅ Content counts loaded for', menuItem.name, ':', countsResponse);
        } catch (error) {
          console.error('Failed to fetch content counts:', error);
        }
      }
    }
    
    // Reset content load flag to reload with new filter
    hasLoadedContent.current = false;
  };

  // Render Hamburger Menu (with Landing.tsx styling)
  const renderHamburgerMenu = () => {
    return (
      <>
        {/* Overlay */}
        {menuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Sidebar Menu */}
        <div 
          className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: isMobile ? '100vw' : '320px', overflowY: 'auto' }}
        >
          <div className="flex flex-col h-full">
            {/* Menu Header - Same layout as Landing.tsx */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                {/* Left: Close Button */}
                <button 
                  onClick={() => setMenuOpen(false)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  }}
                >
                  <X size={24} />
                </button>

                {/* Center: Logo + Subtitle */}
                <div className="flex flex-col items-center flex-1 mx-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Vidyagam
                    </h1>
                  </div>
                  <span 
                    className="text-xs mt-1" 
                    style={{ 
                      color: '#6b7280',
                      fontSize: '12px',
                      fontWeight: '400',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    AI Latest, Curated and Filtered for you
                  </span>
                </div>

                {/* Right: User Avatar */}
                <div className="flex items-center">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-pink-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-200">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>

              {/* Menu Items */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Categories</h3>
                <nav className="space-y-1">
                  {menuItems.map((menu) => (
                    <button
                      key={menu.id}
                      onClick={() => handleMenuSelection(menu.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '700',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: activeMenu === menu.id ? '#dbeafe' : '#f9fafb',
                        color: '#1f2937',
                        boxShadow: activeMenu === menu.id ? '0 2px 4px rgba(59,130,246,0.15)' : '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        if (activeMenu !== menu.id) {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                          e.currentTarget.style.color = '#1f2937';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeMenu !== menu.id) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.color = '#1f2937';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                        }
                      }}
                    >
                      {menu.name}
                    </button>
                  ))}
                </nav>

                {/* Settings & Logout */}
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setCurrentView('settings');
                      setMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: '#f9fafb',
                      color: '#000000'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                    }}
                  >
                    <Settings size={16} style={{ display: 'inline', marginRight: '12px' }} />
                    Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: '2px solid #dc2626',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: '#ffffff',
                      color: '#dc2626'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                  >
                    <LogOut size={16} style={{ display: 'inline', marginRight: '12px' }} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Breaking News Section
  const renderBreakingNews = () => {
    let breakingNews = content.filter(item => item.significance && item.significance >= 8);
    
    if (selectedCategory !== 'All') {
      breakingNews = breakingNews.filter(item => item.category === selectedCategory);
    }
    
    breakingNews = breakingNews.slice(0, 8);
    
    if (breakingNews.length === 0) return null;

    const scrollingNews = [...breakingNews, ...breakingNews];

    return (
      <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '100%', margin: '0', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              backgroundColor: '#dbeafe', 
              padding: '6px 12px', 
              borderRadius: '6px',
              flexShrink: 0
            }}>
              <span style={{ alignItems: 'left', fontSize: '12px', fontWeight: '600', color: '#1e40af' }}>
                🔥 Latest in AI
              </span>
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ 
                display: 'flex', 
                gap: '16px',
                animation: 'scroll 30s linear infinite',
                whiteSpace: 'nowrap',
                justifyContent: 'flex-start'
              }}>
                {scrollingNews.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    onClick={() => window.open(item.sourceLink, '_blank')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '6px 10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {item.significance}/10
                    </span>
                    
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937',
                      maxWidth: '400px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.title}
                    </span>
                    
                    <span style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      flexShrink: 0
                    }}>
                      • {item.publisher}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <style>
          {`
            @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}
        </style>
      </section>
    );
  };

  // Add isMobile state detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <SEO 
        title="AI News Dashboard | Vidyagam"
        description="Your personalized AI news dashboard"
        keywords="AI news, dashboard, artificial intelligence"
      />
      
      <div className="landing-page">
        {/* Header with Hamburger Menu */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              
              {/* Left: Hamburger Menu Button */}
              <div className="flex items-center">
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  }}
                  aria-label="Menu"
                >
                  <Menu size={24} className="text-gray-700" />
                </button>
              </div>

              {/* Center: Logo with AI Intelligence Icon and Subtitle */}
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Vidyagam
                  </h1>
                </div>
                <span 
                  className="text-xs mt-1" 
                  style={{ 
                    color: '#6b7280',
                    fontSize: '12px',
                    fontWeight: '400',
                    whiteSpace: 'nowrap'
                  }}
                >
                  AI Latest, Curated and Filtered for you
                </span>
              </div>

              {/* Right: Sign Out Button Only */}
              <div className="flex items-center">
                <button 
                  onClick={handleLogout}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#dc2626',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  }}
                  aria-label="Sign Out"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline text-sm font-medium">Sign Out</span>
                </button>
              </div>

            </div>
          </div>
        </header>

        {/* Horizontal Navigation Menu */}
        {menuItems.length > 0 && (
          <section style={{ 
            background: '#ffffff',
            borderBottom: 'none',
            paddingTop: '16px',
            paddingBottom: '16px'
          }}>
            <div className="max-w-7xl mx-auto px-4">
              <div className="horizontal-nav flex items-center justify-center h-12">
                {/* Center: Category Menu Items */}
                <div className="flex items-center space-x-4 overflow-x-auto">
                  {menuItems.map((menu) => (
                    <button
                      key={menu.id}
                      onClick={() => {
                        setCurrentView('dashboard');
                        handleMenuSelection(menu.id);
                      }}
                      style={{
                        padding: '8px 16px',
                        margin: '0 4px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        backgroundColor: activeMenu === menu.id ? '#dbeafe' : '#f3f4f6',
                        color: '#1f2937',
                        boxShadow: activeMenu === menu.id ? '0 2px 8px rgba(59,130,246,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        if (activeMenu !== menu.id) {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                          e.currentTarget.style.color = '#1f2937';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeMenu !== menu.id) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.color = '#1f2937';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                        }
                      }}
                    >
                      {menu.name}
                    </button>
                  ))}
                </div>

                {/* Right: Search Icon - Positioned absolutely */}
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  }}
                  aria-label="Search"
                  title="Search"
                >
                  <Search size={20} className="text-gray-700" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Render Hamburger Menu */}
        {renderHamburgerMenu()}

        {/* Render Settings Full Screen */}
        {currentView === 'settings' && (
          <SettingsFullScreen
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
            availableCategories={availableCategories}
            availableContentTypes={availableContentTypes}
            availablePublishers={availablePublishers}
            onClose={() => {
              setCurrentView('dashboard');
              setSettingsChanged(false);
            }}
            onSave={handleSaveSettings}
            savingSettings={savingSettings}
            setSettingsChanged={setSettingsChanged}
          />
        )}

        {/* Breaking News */}
        {renderBreakingNews()}

        {/* Search Section - Inline below breaking news */}
        {isSearchOpen && (
          <section style={{
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            padding: '24px 0',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <div className="max-w-3xl mx-auto px-4">
              {/* Search Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Search size={20} style={{ color: '#6366f1' }} />
                  Search AI News
                </h2>
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '4px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: '#6b7280',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.color = '#111827';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Input */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search for AI topics, research papers, tutorials... (Press Enter to search)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      hasLoadedContent.current = false;
                      setIsSearchOpen(false);
                    } else if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '16px 48px 16px 48px',
                    fontSize: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: '#ffffff',
                    color: '#111827'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  autoFocus
                />
                <Search 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }} 
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '4px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#f3f4f6',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                  >
                    <X size={16} style={{ color: '#6b7280' }} />
                  </button>
                )}
              </div>

              {/* Quick Suggestions */}
              <div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Popular searches:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Latest GPT-4 updates', 'AI ethics', 'Machine learning tutorials', 'AI startups'].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        hasLoadedContent.current = false;
                        setIsSearchOpen(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        color: '#374151',
                        transition: 'all 0.2s',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#6366f1';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.borderColor = '#6366f1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hint */}
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #dbeafe'
              }}>
                <p style={{ fontSize: '12px', color: '#1e40af', margin: 0 }}>
                  💡 <strong>Tip:</strong> Press <kbd style={{ 
                    padding: '2px 6px', 
                    backgroundColor: '#ffffff', 
                    borderRadius: '4px',
                    border: '1px solid #bfdbfe',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}>Enter</kbd> to search or <kbd style={{ 
                    padding: '2px 6px', 
                    backgroundColor: '#ffffff', 
                    borderRadius: '4px',
                    border: '1px solid #bfdbfe',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}>Esc</kbd> to close
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        {loading ? (
          <div className="p-4"><DashboardSkeleton /></div>
        ) : error ? (
          <div className="content-notice">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn-base btn-md btn-primary">
              Retry
            </button>
          </div>
        ) : content.length === 0 ? (
          <div className="content-notice">
            <p>No content found. Try adjusting your search or settings.</p>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <>
                {renderContentByType()}
              </>
            )}
            
            {currentView === 'categories' && (
              <section className="hero-section">
                <div className="hero-content text-center">
                  <h2 className="section-title">📚 My Categories</h2>
                  <p className="section-subtitle">Your personalized AI topic preferences</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                    {availableCategories
                      .filter(cat => userPreferences.categories_selected.includes(cat.id))
                      .map(category => (
                        <div key={category.id} className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        <Footer />
      </div>

      {/* Add responsive styles */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .horizontal-nav {
            scrollbar-width: none;
            -ms-overflow-style: none;
            position: relative;
          }
          
          .horizontal-nav::-webkit-scrollbar {
            display: none;
          }
          
          @media (max-width: 768px) {
            .horizontal-nav { overflow-x: auto !important; padding: 0 8px !important; }
            .horizontal-nav button { font-size: 10px !important; padding: 6px 8px !important; }
            .horizontal-nav > button[aria-label="Search"] { position: absolute !important; right: 8px !important; }
          }

          @media (max-width: 640px) {
            .text-2xl { font-size: 1.25rem !important; }
            .text-sm { font-size: 0.75rem !important; }
          }
        `}
      </style>
    </>
  );
};

export default CompleteMobileDashboard;