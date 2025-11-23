import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, Menu, X, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, type Article } from '../services/api';
import Footer from './Footer';
import SEO from './SEO';
import { DashboardSkeleton } from './LoadingSkeleton';
import { useNavigate } from 'react-router-dom';
import SettingsFullScreen from './SettingsFullScreen';
import '../styles/design-tokens.css';
import '../styles/components.css';
import '../styles/dashboard.css';
import SwipeableFeed from './feeds/SwipeableFeed';
import InfiniteFeed from './feeds/InfiniteFeed';

const CompleteMobileDashboard: React.FC = () => {
  const { user, isAuthenticated, updatePreferences, logout } = useAuth();
  const navigate = useNavigate();
  
  const [content, setContent] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'Last 24 Hours' | 'Last Week' | 'Last Month' | 'This Year'>('Last Week');
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'swipe' | 'infinite'>('list');
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());
  const [contentCounts, setContentCounts] = useState<any>(null);
  const hasLoadedContent = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'categories' | 'settings'>('dashboard');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [menuItems, setMenuItems] = useState<Array<{id: string, name: string, icon: string, description: string}>>([
    { id: 'home', name: 'Home', icon: '🏠', description: 'All Categories Overview' }
  ]);
  const [activeMenu, setActiveMenu] = useState<string>('home');
  
  const [userPreferences, setUserPreferences] = useState({
    experience_level: user?.preferences?.experience_level || 'intermediate',
    professional_roles: (user?.preferences as any)?.professional_roles || ['enthusiast'],
    categories_selected: (user?.preferences as any)?.category_ids_selected || [],
    content_types_selected: (user?.preferences as any)?.content_type_ids_selected || [],
    publishers_selected: (user?.preferences as any)?.publisher_ids_selected || []
  });

  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<any[]>([]);
  const [availablePublishers, setAvailablePublishers] = useState<any[]>([]);

  const timeFilterOptions: Array<'Last 24 Hours' | 'Last Week' | 'Last Month' | 'This Year'> = [
    'Last 24 Hours',
    'Last Week',
    'Last Month',
    'This Year'
  ];

  const getTimeFilterIcon = () => {
    switch (timeFilter) {
      case 'Last 24 Hours': return '⏰';
      case 'Last Week': return '📅';
      case 'Last Month': return '🗓️';
      case 'This Year': return '📆';
      default: return '⏰';
    }
  };

  // Load available options for settings
  useEffect(() => {
    let isMounted = true;
    
    const loadOptions = async () => {
      console.log('🔄 [loadOptions] Loading available options...');
      
      try {
        const [categoriesRes, contentTypesRes, publishersRes] = await Promise.all([
          apiService.getAvailableCategories(),
          apiService.getAvailableContentTypes(),
          apiService.getAvailablePublishers()
        ]);
        
        if (isMounted) {
          console.log('✅ [loadOptions] Categories:', categoriesRes.categories?.length || 0);
          console.log('✅ [loadOptions] Content types:', contentTypesRes.content_types?.length || 0);
          console.log('✅ [loadOptions] Publishers:', publishersRes.publishers?.length || 0);
          
          setAvailableCategories(categoriesRes.categories || []);
          setAvailableContentTypes(contentTypesRes.content_types || []);
          setAvailablePublishers(publishersRes.publishers || []);
          
          console.log('✅ [loadOptions] All lookup data loaded successfully');
        }
      } catch (err) {
        if (isMounted) {
          console.error('❌ [loadOptions] Error loading options:', err);
          setAvailableCategories([]);
          setAvailableContentTypes([]);
          setAvailablePublishers([]);
        }
      }
    };
    
    loadOptions();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load bookmarks
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        console.log('📚 Loading user bookmarks...');
        const bookmarks = await apiService.getBookmarks();
        const bookmarkIds = new Set(
          bookmarks.articles.map(a => a.id?.toString() || '')
        );
        setSavedArticles(bookmarkIds);
        console.log('✅ Loaded', bookmarkIds.size, 'bookmarks');
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          console.log('⚠️ Bookmarks feature not available yet - using empty state');
          setSavedArticles(new Set());
        } else {
          console.error('❌ Failed to load bookmarks:', error);
        }
      }
    };
    
    loadBookmarks();
  }, [isAuthenticated, user]);

  // Load feed
  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📱 Loading personalized feed...');
        
        if (availableCategories.length === 0 || availableContentTypes.length === 0 || availablePublishers.length === 0) {
          console.log('⏳ Waiting for lookup data...');
          setLoading(false);
          return;
        }

        if (hasLoadedContent.current && !searchQuery) {
          console.log('⏭️ Skipping duplicate load - content already loaded');
          setLoading(false);
          return;
        }
        
        const categoryNames = userPreferences.categories_selected
          .map((id: any) => availableCategories.find(cat => cat.id === id)?.name)
          .filter(Boolean) as string[];
        
        const contentTypeNames = userPreferences.content_types_selected
          .map((id: any) => availableContentTypes.find(ct => ct.id === id)?.name)
          .filter(Boolean) as string[];
        
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
          time_filter: timeFilter,
          search_query: searchQuery,
          limit: 500
        };

        console.log('📤 Sending feed request:', filterRequest);
        
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
              thumbnail_url: item.thumbnail_url || item.thumbnail,
              thumbnail: item.thumbnail_url || item.thumbnail,
              imageUrl: item.thumbnail_url || item.thumbnail,
              ranking_score: item.ranking_score || item.rankingScore,
              rankingScore: item.ranking_score || item.rankingScore,
              topics: item.topics ? item.topics.map((t: any) => ({
                id: 0,
                name: typeof t === 'string' ? t : t.name,
                category: '',
                significance_weight: 1
              })) : undefined,
              topic_names: item.topic_names,
              is_bookmarked: savedArticles.has(item.id?.toString() || ''),
              is_liked: false,
              likes_count: 0,
              views_count: 0,
              bookmarks_count: 0,
              engagement_score: 0
            });
          });
        });
        
        setContent(articles);
        hasLoadedContent.current = true;
        
        console.log('✅ Feed loaded successfully:', articles.length, 'items');
        
      } catch (err) {
        console.error('❌ Error loading feed:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [
    isAuthenticated,
    user?.id,
    searchQuery,
    timeFilter,
    JSON.stringify(userPreferences.categories_selected),
    JSON.stringify(userPreferences.content_types_selected),
    JSON.stringify(userPreferences.publishers_selected),
    availableCategories.length,
    availableContentTypes.length,
    availablePublishers.length,
    savedArticles
  ]);

  // Reset load flag when filters change
  useEffect(() => {
    hasLoadedContent.current = false;
  }, [timeFilter, userPreferences.categories_selected, userPreferences.content_types_selected, userPreferences.publishers_selected]);

  // Fetch content counts
  useEffect(() => {
    const fetchContentCounts = async () => {
      try {
        const countsResponse = await apiService.getContentCounts(
          selectedCategory === 'All' ? 'all' : selectedCategory,
          timeFilter
        );
        setContentCounts(countsResponse);
      } catch (error) {
        console.error('❌ Failed to fetch content counts:', error);
      }
    };

    if (availableCategories.length > 0) {
      fetchContentCounts();
    }
  }, [selectedCategory, timeFilter, availableCategories.length]);

  const handleArticleAction = async (articleId: string, action: 'like' | 'bookmark' | 'skip' | 'view') => {
    try {
      switch (action) {
        case 'bookmark':
          await handleBookmark(articleId);
          break;
        case 'skip':
          await apiService.trackInteraction(articleId, 'skip');
          break;
        case 'view':
          await apiService.trackInteraction(articleId, 'read');
          break;
      }
    } catch (error) {
      console.error('❌ Failed to handle article action:', error);
    }
  };

  const handleBookmark = async (articleId: string) => {
    const isCurrentlyBookmarked = savedArticles.has(articleId);
    
    try {
      if (isCurrentlyBookmarked) {
        await apiService.removeBookmark(articleId);
        setSavedArticles(prev => {
          const next = new Set(prev);
          next.delete(articleId);
          return next;
        });
      } else {
        await apiService.bookmarkArticle(articleId);
        setSavedArticles(prev => new Set([...prev, articleId]));
      }
    } catch (error) {
      console.error('❌ Failed to toggle bookmark:', error);
    }
  };

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
  
  const ArticleCard = ({ article }: { article: Article }) => {
    const getContentTypeInfo = (type: string) => {
      const normalizedType = type?.toLowerCase();
      switch (normalizedType) {
        case 'podcast':
        case 'podcasts':
          return { label: 'PODCAST', bgColor: '#dcfce7', textColor: '#15803d' };
        case 'video':
        case 'videos':
          return { label: 'VIDEO', bgColor: '#fee2e2', textColor: '#dc2626' };
        default:
          return { label: 'ARTICLE', bgColor: '#dbeafe', textColor: '#1e40af' };
      }
    };
    
    const typeInfo = getContentTypeInfo(article.type || article.content_type_name || 'blog');

    return (
      <article
        onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
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
          {article.significanceScore && (
            <span style={{ 
              backgroundColor: '#fef3c7', 
              color: '#92400e', 
              padding: '4px 8px', 
              borderRadius: '6px', 
              fontSize: '12px', 
              fontWeight: '500' 
            }}>
              Score: {article.significanceScore}
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
          {article.summary || article.description || article.content_summary}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: 'auto' }}>
          <span style={{ fontWeight: '500' }}>{article.source || article.source_name || 'Unknown'}</span>
          <span>{formatTimeAgo(article.published_date || article.time)}</span>
        </div>
      </article>
    );
  };

  const renderContentByType = () => {
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

    let filteredContent = content;
    if (selectedCategory && selectedCategory !== 'All') {
      filteredContent = content.filter(item => 
        item.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        item.category_name?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    const contentByType: { [key: string]: Article[] } = {
      blog: [],
      podcast: [],
      video: []
    };

    filteredContent.forEach(item => {
      const normalizedType = (item.type || item.content_type_name || 'blog').toLowerCase();
      
      if (normalizedType.includes('podcast')) {
        contentByType.podcast.push(item);
      } else if (normalizedType.includes('video')) {
        contentByType.video.push(item);
      } else {
        contentByType.blog.push(item);
      }
    });

    let realCounts = {
      blogs: contentByType.blog.length,
      podcasts: contentByType.podcast.length,
      videos: contentByType.video.length
    };

    if (contentCounts) {
      if (selectedCategory === 'All') {
        realCounts = {
          blogs: contentCounts.total_blogs || contentCounts.total_articles || contentByType.blog.length,
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
            blogs: categoryCounts.blogs || categoryCounts.articles || contentByType.blog.length,
            podcasts: categoryCounts.podcasts || contentByType.podcast.length,
            videos: categoryCounts.videos || contentByType.video.length
          };
        }
      }
    }

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
          >
            View All Categories
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '-24px' }}>
          <h1 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '6px' }}>
            {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
          </h1>
          
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            margin: '0 auto' 
          }}>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '6px', padding: '6px 12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{realCounts.blogs}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Blogs</div>
            </div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '6px', padding: '6px 12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{realCounts.podcasts}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Podcasts</div>
            </div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '6px', padding: '6px 12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{realCounts.videos}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Videos</div>
            </div>
          </div>
        </div>

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
                cursor: 'pointer'
              }}
            >
              Clear Filter
            </button>
          </div>
        )}

        {contentByType.blog.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#dbeafe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#3b82f6', fontSize: '18px' }}>📖</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                Latest Blogs
              </h2>
              <span style={{ backgroundColor: '#dbeafe', color: '#1e3a8a', padding: '6px 16px', borderRadius: '20px', fontSize: '15px', fontWeight: '700' }}>
                {realCounts.blogs}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {contentByType.blog.map((article, index) => (
                <ArticleCard key={index} article={article} />
              ))}
            </div>
          </section>
        )}

        {contentByType.podcast.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#16a34a', fontSize: '18px' }}>🎧</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                Featured Podcasts
              </h2>
              <span style={{ backgroundColor: '#dcfce7', color: '#14532d', padding: '6px 16px', borderRadius: '20px', fontSize: '15px', fontWeight: '700' }}>
                {realCounts.podcasts}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {contentByType.podcast.map((article, index) => (
                <ArticleCard key={index} article={article} />
              ))}
            </div>
          </section>
        )}

        {contentByType.video.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#fee2e2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#dc2626', fontSize: '18px' }}>🎥</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                Latest Videos
              </h2>
              <span style={{ backgroundColor: '#fee2e2', color: '#7f1d1d', padding: '6px 16px', borderRadius: '20px', fontSize: '15px', fontWeight: '700' }}>
                {realCounts.videos}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {contentByType.video.map((article, index) => (
                <ArticleCard key={index} article={article} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
      
      setSettingsChanged(false);
      setCurrentView('dashboard');
      hasLoadedContent.current = false;
      
      alert('✅ Settings saved successfully! Reloading your personalized feed...');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Failed to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

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

  useEffect(() => {
    if (availableCategories.length > 0 && userPreferences.categories_selected.length > 0) {
      const userCategories = availableCategories.filter(cat => 
        userPreferences.categories_selected.includes(cat.id)
      );
      
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

      setMenuItems(newMenuItems);
    }
  }, [availableCategories, userPreferences.categories_selected]);

  const handleMenuSelection = async (menuId: string) => {
    setActiveMenu(menuId);
    setMenuOpen(false);
    
    if (menuId === 'home') {
      setSelectedCategory('All');
      try {
        const countsResponse = await apiService.getContentCounts('all');
        setContentCounts(countsResponse);
      } catch (error) {
        console.error('❌ Failed to fetch content counts:', error);
      }
    } else {
      const menuItem = menuItems.find(item => item.id === menuId);
      if (menuItem && menuItem.name !== 'Home') {
        setSelectedCategory(menuItem.name);
        try {
          const countsResponse = await apiService.getContentCounts(menuItem.name);
          setContentCounts(countsResponse);
        } catch (error) {
          console.error('❌ Failed to fetch content counts:', error);
        }
      }
    }
    
    hasLoadedContent.current = false;
  };

  return (
    <>
      <SEO 
        title="AI News Dashboard | Vidyagam"
        description="Your personalized AI news dashboard"
        keywords="AI news, dashboard, artificial intelligence"
      />
      
      <div className="landing-page">
        {/* ✅ RESTORED: HEADER */}
        <header style={{
          position: 'sticky', 
          top: 0,
          zIndex: 1000,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s'
                }}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                Vidyagam
              </h1>
            </div>

            {/* Header Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                style={{
                  padding: '10px',
                  backgroundColor: isSearchOpen ? '#f3f4f6' : 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Search size={20} />
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setCurrentView('settings')}
                style={{
                  padding: '10px',
                  backgroundColor: currentView === 'settings' ? '#f3f4f6' : 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Settings size={20} />
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#dc2626',
                  transition: 'all 0.2s'
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* ✅ RESTORED: SEARCH BAR */}
          {isSearchOpen && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <input
                type="text"
                placeholder="Search articles, podcasts, videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </header>

        {/* ✅ RESTORED: HAMBURGER MENU */}
        {menuOpen && (
          <div style={{
            position: 'fixed',
            top: '73px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setMenuOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '300px',
                height: '100%',
                backgroundColor: '#ffffff',
                boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
                overflowY: 'auto',
                padding: '24px'
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
                Categories
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuSelection(item.id)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: activeMenu === item.id ? '#eff6ff' : 'transparent',
                      border: activeMenu === item.id ? '1px solid #bfdbfe' : '1px solid transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: activeMenu === item.id ? '600' : '400',
                      color: activeMenu === item.id ? '#1e40af' : '#374151',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span>{item.name}</span>
                      {item.description && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {item.description}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ✅ RESTORED: FILTERS & VIEW MODE */}
        {currentView === 'dashboard' && (
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#ffffff'
          }}>
            <div style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {/* Time Filter */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <Clock size={16} />
                  <span>{getTimeFilterIcon()} {timeFilter}</span>
                </button>

                {isTimeFilterOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    minWidth: '200px'
                  }}>
                    {timeFilterOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => {
                          setTimeFilter(option);
                          setIsTimeFilterOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: timeFilter === option ? '#f3f4f6' : 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: timeFilter === option ? '600' : '400'
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '4px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px'
              }}>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: viewMode === 'list' ? '#111827' : '#6b7280',
                    boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  📋 List
                </button>
                <button
                  onClick={() => setViewMode('swipe')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: viewMode === 'swipe' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: viewMode === 'swipe' ? '#111827' : '#6b7280',
                    boxShadow: viewMode === 'swipe' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  👆 Swipe
                </button>
                <button
                  onClick={() => setViewMode('infinite')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: viewMode === 'infinite' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: viewMode === 'infinite' ? '#111827' : '#6b7280',
                    boxShadow: viewMode === 'infinite' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  ∞ Feed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings View */}
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

        {/* Content */}
        {currentView === 'dashboard' && (
          <>
            {loading ? (
              <div className="p-4"><DashboardSkeleton /></div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Retry
                </button>
              </div>
            ) : content.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <p style={{ color: '#6b7280' }}>No content found. Try adjusting your search or settings.</p>
              </div>
            ) : (
              <>
                {viewMode === 'swipe' ? (
                  <SwipeableFeed
                    content={content}
                    onRefresh={() => {
                      hasLoadedContent.current = false;
                      setContent([]);
                    }}
                    loading={loading}
                    onArticleAction={handleArticleAction}
                  />
                ) : viewMode === 'infinite' ? (
                  <InfiniteFeed
                    initialContent={content}
                    feedType="personalized"
                    onArticleAction={handleArticleAction}
                  />
                ) : (
                  renderContentByType()
                )}
              </>
            )}
          </>
        )}

        <Footer />
      </div>
    </>
  );
};

export default CompleteMobileDashboard;