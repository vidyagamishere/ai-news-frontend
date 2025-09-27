import { useState, useEffect } from 'react';
import { apiService, type TopStory } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../Loading';
import SmartImage from '../SmartImage';
import './ContentTabs.css';

interface ContentType {
  name: string;
  description: string;
  icon: string;
}

interface ContentResponse {
  content_type: string;
  content_info: ContentType;
  articles: any[];
  total: number;
  sources_available: number;
  user_tier: string;
  featured_sources: Array<{name: string, website: string}>;
  topic_summary?: string;
}

interface ContentTypesResponse {
  content_types: Record<string, ContentType>;
}

interface ContentTabsProps {
  userTier: string;
  topStories?: TopStory[];
  isArchive?: boolean;
  archiveContent?: Record<string, any[]>;
  previewMode?: boolean;
  onSignUpPrompt?: () => void;
  digestContent?: Record<string, any[]>;
}

export default function ContentTabs({ userTier, topStories = [], isArchive = false, archiveContent, previewMode = false, onSignUpPrompt, digestContent }: ContentTabsProps) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all_sources');
  const [contentTypes, setContentTypes] = useState<Record<string, ContentType>>({});
  const [content, setContent] = useState<Record<string, ContentResponse>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [contentTypesLoaded, setContentTypesLoaded] = useState(false);

  const getTopicSummary = (contentType: string, contentInfo: ContentType): string => {
    const summaries: Record<string, string> = {
      'all_sources': 'Comprehensive coverage of AI developments from trusted industry publications, research institutions, and thought leaders. This curated feed aggregates the most significant breakthroughs, trends, and insights across the entire artificial intelligence landscape.',
      'blogs': 'In-depth analysis and expert perspectives from leading AI practitioners, researchers, and industry veterans. These blog posts offer detailed explanations of complex concepts, practical implementations, and strategic insights into AI adoption.',
      'podcasts': 'Audio conversations with AI pioneers, startup founders, and technology leaders discussing emerging trends, challenges, and opportunities. Perfect for staying informed while commuting or multitasking.',
      'videos': 'Visual learning content including conference talks, technical tutorials, product demos, and expert interviews. Ideal for understanding complex AI concepts through demonstrations and visual explanations.',
      'events': 'Upcoming conferences, workshops, webinars, and networking opportunities in the AI community. Stay connected with the latest gatherings where breakthrough research and industry developments are first announced.',
      'learning': 'Educational resources including courses, tutorials, research papers, and certification programs. Structured learning paths for advancing your AI knowledge from beginner to expert level.',
      'demos': 'Interactive demonstrations, live product showcases, and hands-on examples of AI applications in action. Experience cutting-edge AI tools and platforms through real-world demonstrations and proof-of-concepts.'
    };
    
    return summaries[contentType] || contentInfo.description || 'Discover the latest content in this category.';
  };

  const generateArticleSummary = (article: any, contentType: string): string => {
    const title = article.title || '';
    const source = article.source || '';
    
    if (title.length < 10) return 'This article provides detailed insights and analysis on the latest developments. Click to read comprehensive coverage of key topics, expert perspectives, and industry implications that will enhance your understanding of the subject matter.';
    
    const summaryTemplates: Record<string, (title: string, source: string) => string> = {
      'all_sources': (title, source) => `This comprehensive article from ${source} explores "${title}" and the latest developments in AI technology. The piece provides detailed analysis and expert insights into emerging trends and their potential impact on the industry. Readers will gain valuable understanding of current innovations and future implications. The content offers practical perspectives that help contextualize recent advancements. Essential reading for staying informed about the rapidly evolving AI landscape.`,
      'blogs': (title, source) => `This expert analysis from ${source} titled "${title}" delves deep into artificial intelligence applications and emerging technological implementations. The article provides comprehensive insights into industry trends and practical applications of AI systems. Readers will discover detailed explanations of complex concepts and their real-world implications. The content offers valuable perspectives from industry professionals and researchers. Perfect for understanding both technical aspects and strategic considerations in AI development.`,
      'podcasts': (title, source) => `This engaging audio discussion from ${source} on "${title}" features expert insights on current AI developments and future predictions. Listeners will hear in-depth conversations about industry perspectives and professional experiences in the field. The podcast explores emerging trends and their potential impact on various sectors. Expert guests share valuable knowledge about challenges and opportunities in AI implementation. Ideal for gaining diverse viewpoints on the evolving artificial intelligence landscape.`,
      'videos': (title, source) => `This informative video content from ${source} about "${title}" provides detailed explanations and visual demonstrations of key AI concepts and applications. Viewers will see comprehensive coverage of technological implementations and practical use cases. The content includes expert commentary and real-world examples that illustrate complex topics. Visual learners will appreciate the clear presentations and step-by-step guidance provided. Essential viewing for understanding both theoretical foundations and practical applications.`,
      'events': (title, source) => `This upcoming event "${title}" hosted by ${source} offers valuable opportunities to connect with the AI community and learn from industry leaders at this significant gathering. Attendees will participate in discussions about cutting-edge developments and network with professionals across the field. The event features presentations from experts and researchers sharing their latest findings. Participants will gain insights into emerging trends and future directions in artificial intelligence. An excellent opportunity for professional development and industry networking.`,
      'learning': (title, source) => `This educational resource from ${source} on "${title}" provides structured learning opportunities designed to advance understanding of AI concepts and practical applications. The content covers essential topics with comprehensive explanations and guided instruction. Learners will develop both theoretical knowledge and practical skills through well-designed curriculum. The resource includes examples and exercises that reinforce key concepts and principles. Perfect for building expertise in artificial intelligence technologies and methodologies.`,
      'demos': (title, source) => `This interactive demonstration from ${source} titled "${title}" showcases practical AI applications and live product capabilities through hands-on examples and real-world use cases. Viewers will experience cutting-edge AI tools in action and see step-by-step implementations of advanced technologies. The demo provides tangible insights into AI capabilities and their practical applications across various industries. Perfect for understanding how theoretical AI concepts translate into working solutions and marketable products.`
    };
    
    const generator = summaryTemplates[contentType] || summaryTemplates['all_sources'];
    return generator(title, source);
  };

  const filterOutTopStories = (articles: any[]): any[] => {
    if (!topStories || topStories.length === 0) return articles;
    
    const topStoryUrls = new Set(topStories.slice(0, 5).map(story => story.url));
    const topStoryTitles = new Set(topStories.slice(0, 5).map(story => story.title.toLowerCase()));
    
    return articles.filter(article => {
      if (topStoryUrls.has(article.url)) return false;
      if (topStoryTitles.has(article.title?.toLowerCase())) return false;
      return true;
    });
  };

  const generatePreviewContent = (contentType: string) => {
    const previewData = {
      'all_sources': [
        { title: 'Google DeepMind Announces Breakthrough in AI Reasoning', source: 'Google DeepMind', url: 'https://deepmind.google/discover/blog/', published_date: new Date().toISOString() },
        { title: 'OpenAI Releases Advanced Language Model Capabilities', source: 'OpenAI', url: 'https://openai.com/index/gpt-4/', published_date: new Date(Date.now() - 86400000).toISOString() },
        { title: 'Microsoft AI Research Lab Unveils New Framework', source: 'Microsoft Research', url: 'https://www.microsoft.com/en-us/research/blog/', published_date: new Date(Date.now() - 172800000).toISOString() }
      ],
      'blogs': [
        { title: 'The Future of Artificial General Intelligence: Expert Analysis', source: 'AI Research Blog', url: 'https://ai.googleblog.com/', published_date: new Date().toISOString() },
        { title: 'Building Scalable AI Systems: Lessons from Industry Leaders', source: 'Tech Insights', url: 'https://blog.openai.com/', published_date: new Date(Date.now() - 86400000).toISOString() },
        { title: 'Neural Network Architectures: A Deep Dive', source: 'ML Weekly', url: 'https://research.google/blog/', published_date: new Date(Date.now() - 172800000).toISOString() }
      ],
      'podcasts': [
        { title: 'AI Pioneers: Conversations with Leading Researchers', source: 'AI Podcast Network', url: 'https://podcasts.apple.com/us/podcast/ai-podcast/', published_date: new Date().toISOString() },
        { title: 'The Ethics of Artificial Intelligence', source: 'Tech Talk Radio', url: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL', published_date: new Date(Date.now() - 86400000).toISOString() },
        { title: 'Machine Learning in Healthcare', source: 'Health Tech Podcast', url: 'https://podcasts.google.com/', published_date: new Date(Date.now() - 172800000).toISOString() }
      ],
      'videos': [
        { title: 'Understanding Transformer Architecture: Visual Guide', source: 'AI Education Channel', url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY', published_date: new Date().toISOString() },
        { title: 'Live Demo: GPT-4 Advanced Features', source: 'Tech Demos', url: 'https://www.youtube.com/watch?v=outcGtbnMuQ', published_date: new Date(Date.now() - 86400000).toISOString() },
        { title: 'Conference Talk: The State of AI in 2025', source: 'AI Conference', url: 'https://www.youtube.com/watch?v=5p248yoa3oE', published_date: new Date(Date.now() - 172800000).toISOString() }
      ],
      'events': [
        { title: 'AI Summit 2025: Global Intelligence Conference', source: 'AI Events Inc', url: 'https://www.eventbrite.com/e/artificial-intelligence-conference-tickets', published_date: new Date(Date.now() + 2592000000).toISOString() },
        { title: 'Machine Learning Workshop: Hands-on Training', source: 'Tech Academy', url: 'https://www.meetup.com/topics/machine-learning/', published_date: new Date(Date.now() + 1728000000).toISOString() },
        { title: 'Neural Networks Meetup: Local Chapter', source: 'AI Meetups', url: 'https://www.meetup.com/topics/artificial-intelligence/', published_date: new Date(Date.now() + 864000000).toISOString() }
      ],
      'learning': [
        { title: 'Complete Guide to Neural Networks: Beginner to Expert', source: 'AI Learning Hub', url: 'https://www.coursera.org/learn/neural-networks-deep-learning', published_date: new Date().toISOString() },
        { title: 'Advanced Machine Learning Certification Program', source: 'Tech University', url: 'https://www.edx.org/course/introduction-to-artificial-intelligence-ai', published_date: new Date(Date.now() - 86400000).toISOString() },
        { title: 'Python for AI: Comprehensive Tutorial Series', source: 'Code Academy', url: 'https://www.codecademy.com/learn/machine-learning', published_date: new Date(Date.now() - 172800000).toISOString() }
      ],
      'demos': [
        { title: 'GPT-4 Live Demo: Advanced Language Understanding', source: 'OpenAI Showcase', url: 'https://openai.com/index/gpt-4/', published_date: new Date().toISOString() },
        { title: 'Interactive Computer Vision Demo: Real-time Object Detection', source: 'Google AI', url: 'https://teachablemachine.withgoogle.com/', published_date: new Date(Date.now() - 86400000).toISOString() },
        { title: 'AI Code Generation Demo: From Natural Language to Code', source: 'GitHub Copilot', url: 'https://github.com/features/copilot', published_date: new Date(Date.now() - 172800000).toISOString() }
      ]
    };
    
    return previewData[contentType as keyof typeof previewData] || previewData.all_sources;
  };

  // Define tab order based on user preferences
  const getFilteredTabOrder = (): string[] => {
    const defaultTabOrder = ['all_sources', 'blogs', 'podcasts', 'videos', 'events', 'learning', 'demos'];
    
    // Always show all_sources first
    const baseOrder = ['all_sources'];
    
    // Get user's content type preferences
    const userContentTypes = user?.preferences?.content_types || ['blogs', 'podcasts', 'videos'];
    
    // Add user's preferred content types in order
    const orderedPreferences = defaultTabOrder.filter(tab => 
      tab !== 'all_sources' && userContentTypes.includes(tab as any)
    );
    
    // Add any missing defaults (blogs, podcasts, videos are mandatory)
    const mandatoryTypes = ['blogs', 'podcasts', 'videos'];
    const missingMandatory = mandatoryTypes.filter(type => 
      !orderedPreferences.includes(type)
    );
    
    console.log('🎯 Dashboard Content Filtering:', {
      userContentTypes,
      orderedPreferences,
      missingMandatory,
      finalOrder: [...baseOrder, ...orderedPreferences, ...missingMandatory]
    });
    
    return [...baseOrder, ...orderedPreferences, ...missingMandatory];
  };
  
  const tabOrder = getFilteredTabOrder();
  const premiumTabs: string[] = []; // All tabs are now available to all users
  
  const isTabAccessible = (tabKey: string): boolean => {
    if (!premiumTabs.includes(tabKey)) return true;
    return userTier === 'premium';
  };

  // Update active tab when user preferences change
  useEffect(() => {
    const currentTabOrder = getFilteredTabOrder();
    // If current active tab is not in user's preferences, switch to first available
    if (!currentTabOrder.includes(activeTab) && currentTabOrder.length > 0) {
      setActiveTab(currentTabOrder[0]);
    }
  }, [user?.preferences?.content_types]);

  // Load available content types on mount with delay for better initial performance
  useEffect(() => {
    const timer = setTimeout(() => {
      loadContentTypes();
    }, 100); // Small delay to prioritize main content loading
    
    return () => clearTimeout(timer);
  }, []);

  // Load content for active tab (prioritize digest content for authenticated users)
  useEffect(() => {
    if (isArchive && archiveContent) {
      // Use archive content directly
      const archiveResponse = {
        content_type: activeTab,
        content_info: contentTypes[activeTab] || { name: activeTab.replace('_', ' ').toUpperCase(), description: '', icon: '📄' },
        articles: archiveContent[activeTab === 'all_sources' ? 'blog' : activeTab] || [],
        total: archiveContent[activeTab === 'all_sources' ? 'blog' : activeTab]?.length || 0,
        sources_available: 1,
        user_tier: userTier,
        featured_sources: []
      };
      setContent(prev => ({ ...prev, [activeTab]: archiveResponse }));
    } else if (digestContent && isAuthenticated && activeTab && contentTypesLoaded) {
      // Use digest content for authenticated users (already filtered by preferences)
      console.log(`📊 Using digest content for ${activeTab} - Articles available:`, digestContent);
      
      let articles: any[] = [];
      if (activeTab === 'all_sources') {
        // For all_sources, combine all content types
        articles = [
          ...(digestContent.blog || []),
          ...(digestContent.audio || []),
          ...(digestContent.video || []),
          ...(digestContent.events || []),
          ...(digestContent.learning || []),
          ...(digestContent.demos || [])
        ];
      } else if (activeTab === 'blogs') {
        articles = digestContent.blog || [];
      } else if (activeTab === 'podcasts') {
        articles = digestContent.audio || [];
      } else if (activeTab === 'videos') {
        articles = digestContent.video || [];
      } else if (activeTab === 'events') {
        articles = digestContent.events || [];
      } else if (activeTab === 'learning') {
        articles = digestContent.learning || [];
      } else if (activeTab === 'demos') {
        articles = digestContent.demos || [];
      }
      
      const digestResponse = {
        content_type: activeTab,
        content_info: contentTypes[activeTab] || { name: activeTab.replace('_', ' ').toUpperCase(), description: '', icon: '📄' },
        articles: articles,
        total: articles.length,
        sources_available: articles.length > 0 ? Math.max(1, Math.floor(articles.length / 3)) : 0,
        user_tier: userTier,
        featured_sources: []
      };
      
      console.log(`✅ Digest content loaded for ${activeTab}:`, articles.length, 'articles');
      setContent(prev => ({ ...prev, [activeTab]: digestResponse }));
    } else if (!isArchive && activeTab && !content[activeTab] && !loading[activeTab] && contentTypesLoaded) {
      // Only load content via API after content types are loaded and when tab is actively selected
      // This is fallback for non-authenticated users or when digest content is not available
      loadContent(activeTab);
    }
  }, [activeTab, isArchive, archiveContent, digestContent, isAuthenticated, contentTypes, contentTypesLoaded]);

  const loadContentTypes = async () => {
    try {
      const response: ContentTypesResponse = await apiService.get('content-types');
      setContentTypes(response.content_types);
      setContentTypesLoaded(true);
    } catch (err) {
      console.error('Failed to load content types:', err);
      setError('Failed to load content types');
      setContentTypesLoaded(true); // Still mark as loaded to prevent retries
    }
  };

  const loadContent = async (contentType: string) => {
    // In preview mode, show limited mock content
    if (previewMode) {
      const mockResponse: ContentResponse = {
        content_type: contentType,
        content_info: contentTypes[contentType] || { name: contentType.replace('_', ' ').toUpperCase(), description: '', icon: '📄' },
        articles: generatePreviewContent(contentType),
        total: 12, // Mock total showing more content available
        sources_available: 5,
        user_tier: 'preview',
        featured_sources: [{ name: 'OpenAI', website: 'openai.com' }, { name: 'DeepMind', website: 'deepmind.com' }]
      };
      setContent(prev => ({ ...prev, [contentType]: mockResponse }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [contentType]: true }));
      setError(null);

      console.log(`📡 Loading ${contentType} content - Authenticated: ${isAuthenticated}`);
      
      // Use authenticated endpoint for signed-in users to get personalized content
      let response: ContentResponse;
      if (isAuthenticated) {
        // For authenticated users, use the callEndpoint method with auth
        response = await apiService.callEndpoint(`content/${contentType}`, 'GET', {}, true);
        console.log(`✅ Authenticated content loaded for ${contentType}:`, response.articles?.length || 0, 'articles');
      } else {
        // For non-authenticated users, use general endpoint
        response = await apiService.get(`content/${contentType}`);
        console.log(`📊 General content loaded for ${contentType}:`, response.articles?.length || 0, 'articles');
      }
      
      // Sort articles by date (latest first)
      if (response.articles && response.articles.length > 0) {
        response.articles.sort((a, b) => {
          const dateA = new Date(a.published_date || a.date || 0).getTime();
          const dateB = new Date(b.published_date || b.date || 0).getTime();
          return dateB - dateA;
        });
      }
      
      setContent(prev => ({ ...prev, [contentType]: response }));
    } catch (err: any) {
      console.error(`Failed to load ${contentType} content:`, err);
      
      // Provide specific error messages based on error type
      let errorMessage = `Failed to load ${contentType} content`;
      
      if (err.message?.includes('timeout')) {
        if (contentType === 'all_sources') {
          errorMessage = 'Loading all sources is taking longer than usual. The server is processing content from 45+ sources. Please wait a moment and try again.';
        } else {
          errorMessage = `Loading ${contentType} content timed out. Please try again.`;
        }
      } else if (err.message?.includes('Network Error')) {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. The content service may be temporarily unavailable.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, [contentType]: false }));
    }
  };

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  const handleRefresh = () => {
    loadContent(activeTab);
  };

  // All content types are available to all users, ordered professionally
  const availableContentTypes = tabOrder
    .map(key => [key, contentTypes?.[key]] as [string, ContentType | undefined])
    .filter(([, info]) => info && info.name); // Only include defined content types with required properties

  const currentContent = content[activeTab];
  const isLoading = loading[activeTab];

  return (
    <div className="content-tabs">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-list">
          {availableContentTypes.map(([key, info]) => (
            <button
              key={key}
              className={`tab-button ${activeTab === key ? 'active' : ''} ${!isTabAccessible(key) ? 'premium-locked' : ''}`}
              onClick={() => isTabAccessible(key) ? handleTabClick(key) : null}
              disabled={!isTabAccessible(key)}
              title={!isTabAccessible(key) ? 'Upgrade to Premium to access this content' : ''}
            >
              <span className="tab-icon">{info?.icon || '📄'}</span>
              <span className="tab-name">{info?.name || key}</span>
              {!isTabAccessible(key) && <span className="premium-lock">🔒</span>}
            </button>
          ))}
        </div>
        
      </div>

      {/* Content Display */}
      <div className="tab-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {isLoading ? (
          <Loading message={
            activeTab === 'all_sources' 
              ? 'Loading all sources... This may take up to 20 seconds as we scrape 45+ AI news sources.' 
              : `Loading ${contentTypes[activeTab]?.name || activeTab}...`
          } />
        ) : currentContent ? (
          <>
            {/* Content Header */}
            <div className="content-header">
              <div className="content-title">
                <span className="content-icon">{currentContent.content_info?.icon || '📄'}</span>
                <h2>{currentContent.content_info?.name || 'Content'}</h2>
                <span className="content-count">
                  {currentContent.total} {currentContent.total === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="content-actions">
                <button onClick={handleRefresh} className="refresh-button">
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div className="topic-summary">
              <p className="content-description">{getTopicSummary(activeTab, currentContent.content_info)}</p>
            </div>

            {/* Content Stats */}
            <div className="content-stats">
              <div className="stat">
                <span className="stat-value">{currentContent.sources_available}</span>
                <span className="stat-label">Sources</span>
              </div>
              <div className="stat">
                <span className="stat-value">{currentContent.total}</span>
                <span className="stat-label">Articles</span>
              </div>
              <div className="stat">
                <span className="stat-value">{currentContent.user_tier}</span>
                <span className="stat-label">Tier</span>
              </div>
            </div>

            {/* Featured Sources */}
            {currentContent.featured_sources && currentContent.featured_sources.length > 0 && (
              <div className="featured-sources">
                <h3>Featured Sources</h3>
                <div className="sources-grid">
                  {currentContent.featured_sources.map((source, index) => (
                    <div key={index} className="source-card">
                      <a href={source.website} target="_blank" rel="noopener noreferrer">
                        {source.name}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articles with SEO optimization */}
            {currentContent.articles && currentContent.articles.length > 0 ? (
              <div className={`articles-list ${previewMode ? 'preview-mode' : ''}`}>
                <div className="content-header-row">
                  <h3>Latest Content</h3>
                  {previewMode && (
                    <div className="preview-badge">
                      <span>Preview Mode</span>
                      <button 
                        onClick={() => onSignUpPrompt?.()}
                        className="signup-prompt-btn"
                      >
                        Sign Up for Full Access
                      </button>
                    </div>
                  )}
                </div>
                
                {(activeTab === 'all_sources' ? filterOutTopStories(currentContent.articles) : currentContent.articles).map((article, index) => (
                  <article 
                    key={index} 
                    className="article-card clickable-article" 
                    itemScope 
                    itemType="https://schema.org/Article"
                    onClick={() => {
                      if (article.url && article.url !== '#') {
                        try {
                          window.open(article.url, '_blank', 'noopener,noreferrer');
                        } catch (error) {
                          console.warn('Failed to open article URL:', article.url, error);
                        }
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (article.url && article.url !== '#') {
                          try {
                            window.open(article.url, '_blank', 'noopener,noreferrer');
                          } catch (error) {
                            console.warn('Failed to open article URL:', article.url, error);
                          }
                        }
                      }
                    }}
                    style={{ cursor: (article.url && article.url !== '#') ? 'pointer' : 'default' }}
                  >
                    <h4 itemProp="headline">{article.title || 'Untitled'}</h4>
                    
                    {(article.imageUrl || article.thumbnail_url) && (
                      <SmartImage
                        src={article.imageUrl || article.thumbnail_url}
                        alt={article.title || 'Article image'}
                        className="article-image-smart"
                        fallbackType="placeholder"
                        aspectRatio="16/9"
                        maxWidth="350px"
                        lazy={true}
                      />
                    )}
                    
                    <div className="article-summary" itemProp="description">
                      {article.ai_summary || article.summary || generateArticleSummary(article, activeTab)}
                      <span className="llm-summary-badge" title="Enhanced 5-sentence AI summary">🤖</span>
                    </div>
                    
                    <p className="article-source">
                      <span itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                        <span itemProp="name">{article.source || 'Unknown Source'}</span>
                      </span>
                      {article.published_date && (
                        <span className="article-date">
                          • {new Date(article.published_date).toLocaleDateString()}
                        </span>
                      )}
                      {article.url && (
                        <span className="external-link-indicator" title="Click anywhere to open article">🔗</span>
                      )}
                    </p>
                    
                    <meta itemProp="url" content={article.url || ''} />
                    <meta itemProp="datePublished" content={article.published_date || new Date().toISOString()} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="no-content">
                <div className="no-content-icon">📭</div>
                <h3>No {currentContent.content_info?.name?.toLowerCase() || 'content'} available</h3>
                <p>
                  We're working to bring you the latest {currentContent.content_info?.name?.toLowerCase() || 'content'}. 
                  Check back soon or try refreshing.
                </p>
                <button onClick={handleRefresh} className="refresh-button">
                  🔄 Check Again
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="loading-state">
            <p>Select a tab to view content</p>
          </div>
        )}
      </div>
    </div>
  );
}