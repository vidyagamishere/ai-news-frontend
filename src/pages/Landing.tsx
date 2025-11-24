import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import SEO from '../components/SEO';
import { LandingSkeleton } from '../components/LoadingSkeleton';
import { apiService } from '../services/api';

interface Article {
  title: string;
  summary: string;
  url: string;
  source: string;
  significanceScore: number;
  published_date: string | null;
  author: string;
  category: string;
  content_type: string;
}

interface Category {
  id: number;
  name: string;
  priority: number;
  description: string;
  content: {
    blogs: Article[];
    podcasts: Article[];
    videos: Article[];
  };
}

interface LandingContent {
  categories: Category[];
  total_categories: number;
}

interface MenuItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const Landing: React.FC = () => {
  const [landingContent, setLandingContent] = useState<LandingContent | null>(null);
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [contentCounts, setContentCounts] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<string>('home');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Menu items with Home as default
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 'home', name: 'Home', icon: '🏠', description: 'All Categories Overview' }
  ]);

  // Helper function to get category icon
  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: { [key: string]: string } = {
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
    return iconMap[categoryName.toLowerCase()] || '🤖';
  };

  // Reusable Article Card Component
  const ArticleCard = ({ article, contentType }: { article: Article; contentType: string }) => {
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
        onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
        className="article-card"
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
          {article.summary}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: 'auto' }}>
          <span style={{ fontWeight: '500' }}>{article.source}</span>
          <span>{formatTimeAgo(article.published_date)}</span>
        </div>
      </article>
    );
  };

  // Update the ContentTypeCTA component to be more informative
  const ContentTypeCTA = ({ contentType, count }: { contentType: string; count: number }) => {
    const getCtaText = (type: string) => {
      const remainingCount = count > 10 ? count - 10 : 0;
      switch (type.toLowerCase()) {
        case 'podcast':
          return {
            title: remainingCount > 0 ? `${remainingCount} More AI Podcasts Available` : 'More AI Podcasts Available',
            description: `Access expert discussions, insider interviews, and deep-dive analysis from AI industry leaders.`,
            icon: '🎧',
            action: 'Unlock Audio Content'
          };
        case 'video':
          return {
            title: remainingCount > 0 ? `${remainingCount} More AI Videos Available` : 'More AI Videos Available',
            description: `Watch visual tutorials, conference talks, and live demonstrations from top AI researchers.`,
            icon: '🎥',
            action: 'Unlock Video Content'
          };
        default:
          return {
            title: remainingCount > 0 ? `${remainingCount} More AI Blogs Available` : 'More AI Blogs Available',
            description: `Read comprehensive analysis, breaking research, and expert insights from leading AI publications.`,
            icon: '📖',
            action: 'Unlock All Blogs'
          };
      }
    };

    const ctaInfo = getCtaText(contentType);

    if (count <= 10) return null;

    return (
      <div style={{
        marginTop: '32px',
        padding: '24px',
        backgroundColor: '#f8fafc',
        border: '2px dashed #e2e8f0',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}>{ctaInfo.icon}</span>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a202c', marginBottom: '6px' }}>
            {ctaInfo.title}
          </h3>
          <p style={{ color: '#718096', fontSize: '13px', marginBottom: '18px', lineHeight: '1.4' }}>
            {ctaInfo.description}
          </p>
        </div>
        <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigateToAuth('signup')}
            style={{
              color: '#1a202c',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '600',
              border: '2px solid #1a202c',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1a202c';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#1a202c';
            }}
          >
            🚀 {ctaInfo.action}
          </button>
          <button 
            onClick={() => navigateToAuth('signin')}
            style={{
              color: '#718096',
              padding: '10px 20px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#718096';
              e.currentTarget.style.color = '#1a202c';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#718096';
            }}
          >
            Sign In Instead
          </button>
        </div>
      </div>
    );
  };

  // Monitor window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigateToAuth = (mode: 'signin' | 'signup') => {
    navigate(`/auth?mode=${mode}`);
  };

  // Handle menu selection
  const handleMenuSelection = async (menuId: string) => {
    setActiveMenu(menuId);
    setMenuOpen(false);
    
    if (menuId === 'home') {
      setActiveCategory('');
      // Get counts for all categories
      try {
        const countsResponse = await apiService.getContentCounts('all');
        setContentCounts(countsResponse);
      } catch (error) {
        console.error('Failed to fetch content counts:', error);
      }
    } else {
      // Find the category name from menuItems
      const menuItem = menuItems.find(item => item.id === menuId);
      if (menuItem && menuItem.name !== 'Home') {
        setActiveCategory(menuItem.name);
        // Get counts for specific category
        try {
          const countsResponse = await apiService.getContentCounts(menuItem.name);
          setContentCounts(countsResponse);
        } catch (error) {
          console.error('Failed to fetch content counts:', error);
        }
      }
    }
  };

  const fetchLandingContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 DEBUG: Starting fetchLandingContent...');
      
      const [breakingResponse, landingResponse, countsResponse] = await Promise.all([
        apiService.getBreakingNewsAlerts(10),
        apiService.getLandingContent(10),
        apiService.getContentCounts('all')
      ]);
      
      console.log('🚨 DEBUG: Breaking News Response:', breakingResponse);
      console.log('📊 DEBUG: Content Counts Response:', countsResponse);
      console.log('📰 DEBUG: Landing Response:', landingResponse);
      
      if (breakingResponse?.articles) {
        const breakingWithAuthor = breakingResponse.articles.map((article: any) => ({
          ...article,
          author: article.author || 'Unknown'
        }));
        console.log('✅ DEBUG: Setting breaking news:', breakingWithAuthor);
        setBreakingNews(breakingWithAuthor);
      } else {
        console.log('❌ DEBUG: No breaking news articles found');
      }
      
      if (countsResponse) {
        console.log('✅ DEBUG: Setting content counts:', countsResponse);
        setContentCounts(countsResponse);
      } else {
        console.log('❌ DEBUG: No content counts found');
      }
      
      if (landingResponse?.categories) {
        setLandingContent(landingResponse);
        
        // Create menu items from categories (WITHOUT ICONS)
        const categoryMenus: MenuItem[] = landingResponse.categories.map((cat: Category) => ({
          id: cat.name.toLowerCase().replace(/\s+/g, '-'),
          name: cat.name,
          icon: '',
          description: cat.description || ''
        }));
        
        setMenuItems([
          { id: 'home', name: 'Home', icon: '', description: 'All Categories Overview' },
          ...categoryMenus
        ]);
      }
      
    } catch (err: any) {
      console.error('Failed to fetch landing content:', err);
      setError('Unable to load content. Using sample data.');
      
      // Add fallback breaking news for testing
      const fallbackBreakingNews = [
        {
          title: 'OpenAI Announces GPT-5 Release',
          summary: 'Revolutionary AI model with unprecedented capabilities',
          url: '#',
          source: 'OpenAI',
          significanceScore: 9.5,
          published_date: new Date().toISOString(),
          author: 'Sam Altman',
          category: 'AI Research',
          content_type: 'article'
        },
        {
          title: 'Google DeepMind Breakthrough in Quantum AI',
          summary: 'New quantum computing advances for AI training',
          url: '#',
          source: 'Google',
          significanceScore: 9.0,
          published_date: new Date().toISOString(),
          author: 'Demis Hassabis',
          category: 'AI Research',
          content_type: 'article'
        }
      ];
      
      // Add fallback content counts for testing
      const fallbackContentCounts = {
        total_blogs: 156,
        total_podcasts: 89,
        total_videos: 67,
        by_category: {
          'Generative AI': { blogs: 45, podcasts: 23, videos: 19 },
          'Machine Learning': { blogs: 38, podcasts: 21, videos: 15 },
          'AI Research': { blogs: 73, podcasts: 45, videos: 33 }
        }
      };
      
      console.log('🔧 DEBUG: Setting fallback data for testing');
      setBreakingNews(fallbackBreakingNews);
      setContentCounts(fallbackContentCounts);
      
      // Fallback content
      const fallbackContent: LandingContent = {
        categories: [
          {
            id: 1,
            name: 'Generative AI',
            priority: 1,
            description: 'Latest developments in LLMs, GPT, Claude, and AI Generation technologies',
            content: {
              blogs: [
                {
                  title: 'OpenAI Releases GPT-5 with Revolutionary Capabilities',
                  summary: 'The latest breakthrough in AI demonstrates unprecedented reasoning and multimodal understanding.',
                  url: '#',
                  source: 'OpenAI',
                  significanceScore: 9.5,
                  published_date: new Date().toISOString(),
                  author: 'Sam Altman',
                  category: 'Generative AI',
                  content_type: 'article'
                }
              ],
              podcasts: [
                {
                  title: 'AI Podcast: The Future of Language Models',
                  summary: 'Expert discussion on the evolution of large language models.',
                  url: '#',
                  source: 'AI Podcast',
                  significanceScore: 8.5,
                  published_date: new Date().toISOString(),
                  author: 'Lex Fridman',
                  category: 'Generative AI',
                  content_type: 'podcast'
                }
              ],
              videos: [
                {
                  title: 'Demonstrating GPT-5 Capabilities',
                  summary: 'Live demonstration of the latest AI model features.',
                  url: '#',
                  source: 'OpenAI YouTube',
                  significanceScore: 9.0,
                  published_date: new Date().toISOString(),
                  author: 'OpenAI Team',
                  category: 'Generative AI',
                  content_type: 'video'
                }
              ]
            }
          }
        ],
        total_categories: 1
      };
      setLandingContent(fallbackContent);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandingContent();
  }, []);

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

  const getCurrentCategory = () => {
    if (!landingContent) return null;
    
    if (activeMenu === 'home') {
      // For home, create a virtual category combining all content
      const allBlogs: Article[] = [];
      const allPodcasts: Article[] = [];
      const allVideos: Article[] = [];
      
      landingContent.categories.forEach(cat => {
        allBlogs.push(...cat.content.blogs);
        allPodcasts.push(...cat.content.podcasts);
        allVideos.push(...cat.content.videos);
      });
      
      return {
        id: 0,
        name: 'All Categories',
        priority: 1,
        description: 'Latest content from all AI categories - your comprehensive overview',
        content: {
          blogs: allBlogs.slice(0, 10),
          podcasts: allPodcasts.slice(0, 10),
          videos: allVideos.slice(0, 10)
        },
        realCounts: contentCounts ? {
          blogs: contentCounts.total_blogs || allBlogs.length,
          podcasts: contentCounts.total_podcasts || allPodcasts.length,
          videos: contentCounts.total_videos || allVideos.length
        } : {
          blogs: allBlogs.length,
          podcasts: allPodcasts.length,
          videos: allVideos.length
        }
      };
    } else {
      const category = landingContent.categories.find(cat => cat.name === activeCategory);
      if (category && contentCounts?.by_category) {
        const categoryKey = Object.keys(contentCounts.by_category).find(key => 
          key.toLowerCase() === activeCategory.toLowerCase()
        );
        if (categoryKey) {
          const categoryCounts = contentCounts.by_category[categoryKey];
          return {
            ...category,
            content: {
              blogs: category.content.blogs.slice(0, 10),
              podcasts: category.content.podcasts.slice(0, 10),
              videos: category.content.videos.slice(0, 10)
            },
            realCounts: {
              blogs: categoryCounts.blogs || category.content.blogs.length,
              podcasts: categoryCounts.podcasts || category.content.podcasts.length,
              videos: categoryCounts.videos || category.content.videos.length
            }
          };
        }
      }
      return {
        ...category,
        content: {
          blogs: category?.content.blogs.slice(0, 10) || [],
          podcasts: category?.content.podcasts.slice(0, 10) || [],
          videos: category?.content.videos.slice(0, 10) || []
        },
        realCounts: {
          blogs: category?.content.blogs.length || 0,
          podcasts: category?.content.podcasts.length || 0,
          videos: category?.content.videos.length || 0
        }
      };
    }
  };

  // Debug logging
  console.log('🔍 DEBUG: Component render state:', {
    breakingNewsLength: breakingNews.length,
    contentCounts,
    activeMenu,
    activeCategory,
    loading,
    error
  });

  if (loading) {
    return <LandingSkeleton />;
  }

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <SEO
        title="Vidyagam AI | Curated AI Insights, Filtered for You"
        description="Get personalized AI updates, events, and learning resources curated by AI. Daily digest of artificial intelligence breakthroughs, conferences, courses, and industry insights."
        keywords="AI updates, generative AI, machine learning, OpenAI, ChatGPT, AI breakthroughs, artificial intelligence, AI research, tech news"
        url="/"
      />
      
      {/* Modern Header */}
  <header className="landing-header bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center h-16">
        
        {/* Left: Hamburger menu button */}
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
            <svg style={{ height: '24px', width: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Center: Logo with AI Intelligence Icon and subtitle */}
        <div className="landing-logo-section flex flex-col items-center flex-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="landing-title text-2xl font-bold text-gray-900">
              Vidyagam
            </h1>
          </div>
          <span 
            className="landing-subtitle text-xs mt-1" 
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

        {/* Right: Auth Buttons - Desktop text, Mobile/Tablet icons */}
        <div className="landing-auth-buttons flex items-center space-x-2">
          <button 
            onClick={() => navigateToAuth('signin')}
            className="landing-signin-btn"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s, border-color 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
            aria-label="Sign In"
            title="Sign In"
          >
            <LogIn size={18} />
            <span className="landing-btn-text">Sign In</span>
          </button>
          
          {/* ✅ FIXED: Get Started button - No black hover, proper alignment */}
          <button 
            onClick={() => navigateToAuth('signup')}
            className="landing-signup-btn"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              border: '2px solid #000000',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s, color 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: '120px', // ✅ Fixed width prevents jumping
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'; // ✅ Light gray instead of black
              e.currentTarget.style.color = '#000000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#000000';
            }}
            aria-label="Get Started"
            title="Get Started"
          >
            <UserPlus size={18} />
            <span className="landing-btn-text">Get Started</span>
          </button>
        </div>

      </div>
    </div>
  </header>
        
  {/* Vertical Sidebar Menu */}
  {menuOpen && (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setMenuOpen(false)}
      />
      
      {/* Sidebar */}
      <div 
        className="fixed top-0 left-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300"
        style={{ width: isMobile ? '100vw' : '480px', overflowY: 'auto' }}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            {/* Header Layout - Same as dashboard */}
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
                aria-label="Close menu"
              >
                <svg style={{ height: '24px', width: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Center: Logo + Subtitle */}
              <div className="flex flex-col items-center flex-1 mx-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="hamburger-menu-title text-2xl font-bold text-gray-900">
                    Vidyagam
                  </h1>
                </div>
                <span 
                  className="hamburger-menu-subtitle text-xs mt-1" 
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

              {/* Right: Auth Icons (Mobile: icons only, Desktop: text) */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    navigateToAuth('signin');
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    padding: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  aria-label="Sign In"
                  title="Sign In"
                >
                  <LogIn size={18} />
                </button>
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    navigateToAuth('signup');
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    padding: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: '2px solid #000000',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#000000';
                  }}
                  aria-label="Get Started"
                  title="Get Started"
                >
                  <UserPlus size={18} />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Categories</h3>
              <nav className="space-y-1">
                {menuItems.map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => {
                      handleMenuSelection(menu.id);
                      setMenuOpen(false);
                    }}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Horizontal Navigation Menu */}
      {menuItems.length > 0 && (
        <section 
          className="horizontal-menu-section"
          style={{ 
            background: '#ffffff',
            borderBottom: 'none',
            paddingTop: '16px',
            paddingBottom: '16px'
          }}>
          <div className="max-w-7xl mx-auto px-4">
            {/* ✅ FIXED: Added consistent vertical padding */}
            <div className="horizontal-nav flex items-center justify-center space-x-4 overflow-x-auto" style={{ minHeight: '48px', paddingTop: '4px', paddingBottom: '4px' }}>
              {menuItems.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => handleMenuSelection(menu.id)}
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
                    backdropFilter: 'blur(10px)',
                    // ✅ FIXED: Consistent height to prevent jumping
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
          </div>
        </section>
      )}

      {/* Breaking News */}
      {(breakingNews.length > 0 || contentCounts?.total_blogs > 0) && (
        <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '100%', margin: '0', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                backgroundColor: '#dbeafe', 
                padding: '6px 12px', 
                borderRadius: '6px',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af' }}>
                  🚨 Breaking News
                </span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '16px',
                  animation: 'scroll 15s linear infinite',
                  whiteSpace: 'nowrap',
                  justifyContent: 'flex-start'
                }}>
                  {(breakingNews.length > 0 ? breakingNews : [
                    { title: `${contentCounts?.total_blogs || 0} Latest AI Blogs Available`, source: 'Vidyagam AI', url: '#' },
                    { title: 'Generative AI, Machine Learning & More', source: 'All Categories', url: '#' },
                    { title: 'Join 10,000+ AI Professionals', source: 'Get Started', url: '#' }
                  ] as any).concat(breakingNews.length > 0 ? breakingNews : [
                    { title: `${contentCounts?.total_blogs || 0} Latest AI Blogs Available`, source: 'Vidyagam AI', url: '#' },
                    { title: 'Generative AI, Machine Learning & More', source: 'All Categories', url: '#' },
                    { title: 'Join 10,000+ AI Professionals', source: 'Get Started', url: '#' }
                  ] as any).map((alert: any, index: number) => (
                    <div 
                      key={index}
                      onClick={() => window.open(alert.url, '_blank', 'noopener,noreferrer')}
                      style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{ fontWeight: '500', color: '#111827', fontSize: '13px' }}>
                        {alert.title}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        color: '#3b82f6', 
                        backgroundColor: '#dbeafe', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        {alert.source}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main style={{ backgroundColor: '#f9fafb', padding: '48px 0' }}>
        {(() => {
          const currentCategory = getCurrentCategory();
          
          if (!currentCategory) {
            return (
              <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
                <div style={{ padding: '64px 0' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    No content available
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                    We're working on getting fresh content for you.
                  </p>
                  <button 
                    onClick={() => navigateToAuth('signup')}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Get Notified When Available
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
              {/* Category Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h1 className="hero-title" style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '6px' }}>
                  {currentCategory.name}
                </h1>
                <p className="hero-subtitle" style={{ fontSize: '11px', color: '#6b7280', maxWidth: '768px', margin: '0 auto 12px auto', lineHeight: '1.4' }}>
                  {currentCategory.description}
                </p>
                
                {/* ✅ NEW: Content Stats with Auth Prompt */}
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '0 auto',
                  maxWidth: '600px'
                }}>
                  {/* Stats Row */}
                  <div className="content-stats" style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
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
                        {currentCategory.realCounts?.blogs || 0}
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
                        {currentCategory.realCounts?.podcasts || 0}
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
                        {currentCategory.realCounts?.videos || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Videos</div>
                    </div>
                  </div>

                  {/* ✅ NEW: Auth Prompt - Responsive */}

                </div>
              </div>

              {/* Content Sections */}
              <div className="section-gap" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {/* Blogs */}
                {currentCategory.content.blogs.length > 0 && (
                  <section>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      marginBottom: '24px'
                    }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        backgroundColor: '#dbeafe', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ color: '#3b82f6', fontSize: '18px' }}>📖</span>
                      </div>
                      <h2 className="section-title" style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#111827',
                        margin: 0,
                        lineHeight: '32px'
                      }}>
                        Latest Blogs
                      </h2>
                      {/* ✅ UPDATED: Light background with dark text */}
                      <span style={{ 
                        backgroundColor: '#dbeafe',
                        color: '#1e3a8a', 
                        padding: '6px 16px', 
                        borderRadius: '20px', 
                        fontSize: '15px', 
                        fontWeight: '700',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                        border: '2px solid #bfdbfe'
                      }}>
                        {currentCategory.realCounts?.blogs || 0}
                      </span>
                    </div>
                    <div className="content-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '24px' 
                    }}>
                      {currentCategory.content.blogs.slice(0, 10).map((article, index) => (
                        <ArticleCard key={index} article={article} contentType="article" />
                      ))}
                    </div>
                    
                    <ContentTypeCTA 
                      contentType="article" 
                      count={currentCategory.realCounts?.blogs || 0} 
                    />
                  </section>
                )}

                {/* Podcasts */}
                {currentCategory.content.podcasts.length > 0 && (
                  <section>
                    {/* ✅ FIXED: Aligned icon, heading, and count */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      marginBottom: '24px'
                    }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        backgroundColor: '#dcfce7', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ color: '#16a34a', fontSize: '18px' }}>🎧</span>
                      </div>
                      <h2 className="section-title" style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#111827',
                        margin: 0,
                        lineHeight: '32px'
                      }}>
                        Featured Podcasts
                      </h2>
                      {/* ✅ UPDATED: Light background with dark text */}
                      <span style={{ 
                        backgroundColor: '#dcfce7',
                        color: '#14532d', 
                        padding: '6px 16px', 
                        borderRadius: '20px', 
                        fontSize: '15px', 
                        fontWeight: '700',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.2)',
                        border: '2px solid #bbf7d0'
                      }}>
                        {currentCategory.realCounts?.podcasts || 0}
                      </span>
                    </div>
                    <div className="content-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '24px' 
                    }}>
                      {currentCategory.content.podcasts.slice(0, 10).map((article, index) => (
                        <ArticleCard key={index} article={article} contentType="podcast" />
                      ))}
                    </div>
                    
                    <ContentTypeCTA contentType="podcast" count={currentCategory.realCounts?.podcasts || 0} />
                  </section>
                )}

                {/* Videos */}
                {currentCategory.content.videos.length > 0 && (
                  <section>
                    {/* ✅ FIXED: Aligned icon, heading, and count */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      marginBottom: '24px'
                    }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        backgroundColor: '#fee2e2', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ color: '#dc2626', fontSize: '18px' }}>🎥</span>
                      </div>
                      <h2 className="section-title" style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#111827',
                        margin: 0,
                        lineHeight: '32px'
                      }}>
                        Latest Videos
                      </h2>
                      {/* ✅ UPDATED: Light background with dark text */}
                      <span style={{ 
                        backgroundColor: '#fee2e2',
                        color: '#7f1d1d', 
                        padding: '6px 16px', 
                        borderRadius: '20px', 
                        fontSize: '15px', 
                        fontWeight: '700',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)',
                        border: '2px solid #fecaca'
                      }}>
                        {currentCategory.realCounts?.videos || 0}
                      </span>
                    </div>
                    <div className="content-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '24px' 
                    }}>
                      {currentCategory.content.videos.slice(0, 10).map((article, index) => (
                        <ArticleCard key={index} article={article} contentType="video" />
                      ))}
                    </div>
                    
                    <ContentTypeCTA contentType="video" count={currentCategory.realCounts?.videos || 0} />
                  </section>
                )}
                
                {/* No Content Message */}
                {currentCategory.content.blogs.length === 0 && 
                 currentCategory.content.podcasts.length === 0 && 
                 currentCategory.content.videos.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                      No content available yet
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                      We're working on getting fresh {currentCategory.name} content for you.
                    </p>
                    <button 
                      onClick={() => navigateToAuth('signup')}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Get Notified When Available
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1f2937', color: '#ffffff', padding: '64px 0', marginTop: '64px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px', marginBottom: '48px' }}>
            {/* Company Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>V</span>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Vidyagam</span>
              </div>
              <p style={{ color: '#d1d5db', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
                Join 10,000+ AI professionals getting curated insights from 50+ premium sources. 
                Stay ahead with personalized AI intelligence delivered daily.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#3730a3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '16px' }}>🤖</span>
                </div>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                </div>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#059669', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '16px' }}>🚀</span>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div style={{ textAlign: 'center', padding: '32px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px 16px', borderRadius: '20px' }}>
                  <span style={{ color: '#fbbf24' }}>⭐</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>10,000+ Active Users</span>
                  <span style={{ color: '#fbbf24' }}>⭐</span>
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>
                Ready to Join the AI Elite?
              </h3>
              <p style={{ color: '#d1d5db', marginBottom: '32px', fontSize: '18px', lineHeight: '1.6' }}>
                Get instant access to curated AI insights, breaking news alerts, and personalized content from industry leaders. 
                <span style={{ color: '#60a5fa', fontWeight: '600' }}> 100% Free</span> • 
                <span style={{ color: '#34d399', fontWeight: '600' }}> No Credit Card</span> • 
                <span style={{ color: '#a78bfa', fontWeight: '600' }}> Cancel Anytime</span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <button 
                  onClick={() => navigateToAuth('signup')}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
                >
                  🚀 Start Free Account
                </button>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  <span>Already have an account? </span>
                  <button 
                    onClick={() => navigateToAuth('signin')}
                    style={{
                      color: '#60a5fa',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Sign in here
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ borderTop: '1px solid #374151', paddingTop: '32px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', fontSize: '14px' }}>
              <span>🌍 Global AI Coverage</span>
              <span>⚡ Real-time Updates</span>
              <span>🔒 Privacy First</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Error Notice */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '16px',
          right: '16px',
          backgroundColor: '#fef3c7',
          borderLeft: '4px solid #f59e0b',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxWidth: '1024px',
          margin: '0 auto'
        }}>
          <p style={{ fontSize: '14px', color: '#92400e', fontWeight: '500', margin: 0 }}>
            💡 {error}
          </p>
        </div>
      )}

      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          
          /* Mobile responsiveness - Header */
          @media (max-width: 768px) {
            .landing-title { font-size: 18px !important; }
            .landing-subtitle { font-size: 10px !important; }
            .hamburger-menu-title { font-size: 18px !important; }
            .hamburger-menu-subtitle { fontSize: 10px !important; }
            .landing-logo-section { margin: 0 !important; }
            .landing-auth-buttons { gap: 4px !important; }
            .landing-auth-buttons button { padding: 8px !important; min-width: unset !important; }
            .landing-btn-text { display: none !important; }
            .horizontal-menu-section { display: none !important; }
            .hero-title { fontSize: 22px !important; }
            .hero-subtitle { fontSize: 14px !important; }
            .section-title { fontSize: 18px !important; }
            .hero-buttons { flexDirection: column !important; gap: 12px !important; }
            .category-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
            .content-grid { grid-template-columns: 1fr !important; }
            .content-stats { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
            .content-stats > div { padding: 12px !important; }
            .section-gap { gap: 32px !important; }
            .article-card { padding: 16px !important; }
            .cta-buttons { flex-direction: column !important; }
            /* ✅ NEW: Auth prompt mobile */
            .auth-prompt { 
              padding: 10px 12px !important;
              gap: 6px !important;
            }
            .auth-prompt > div:first-child {
              fontSize: 11px !important;
            }
            .auth-prompt button {
              fontSize: 11px !important;
              padding: 5px 12px !important;
              min-width: 80px !important;
              max-width: 120px !important;
            }
          }
          
          /* Tablet responsiveness */
          @media (max-width: 1024px) and (min-width: 769px) {
            .landing-title { font-size: 20px !important; }
            .landing-subtitle { font-size: 11px !important; }
            .hamburger-menu-title { font-size: 20px !important; }
            .hamburger-menu-subtitle { fontSize: 11px !important; }
            .landing-btn-text { display: none !important; }
            .landing-auth-buttons { gap: 4px !important; }
            .landing-auth-buttons button { padding: 8px !important; min-width: unset !important; }
            .horizontal-menu-section { display: none !important; }
            .content-grid { grid-template-columns: repeat(2, 1fr) !important; }
            /* ✅ NEW: Auth prompt tablet */
            .auth-prompt {
              max-width: 400px !important;
            }
          }
          
          /* Small mobile devices */
          @media (max-width: 480px) {
            .category-grid { grid-template-columns: 1fr !important; }
            .content-stats { grid-template-columns: 1fr !important; gap: 8px !important; }
            .breaking-news-scroll { flex-direction: column !important; align-items: stretch !important; }
            .cta-buttons button { width: 100% !important; }
            .hero-title { font-size: 20px !important; }
            .section-title { font-size: 16px !important; }
            .horizontal-nav button { font-size: 12px !important; padding: 8px 4px !important; }
            /* ✅ NEW: Auth prompt small mobile - stacked buttons */
            .auth-prompt button {
              flex: 1 1 100% !important;
              max-width: 100% !important;
            }
          }
          
          /* Navigation specific styles */
          .horizontal-nav {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .horizontal-nav::-webkit-scrollbar {
            display: none;
          }
          
          /* Focus styles for accessibility */
          .horizontal-nav button:focus,
          button:focus {
            outline: 2px solid #000000;
            outline-offset: 2px;
          }
        `}
      </style>
    </div>
  );
};

export default Landing;
