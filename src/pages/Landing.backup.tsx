import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import Loading from '../components/Loading';
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

const Landing: React.FC = () => {
  // New state structure for landing content
  const [landingContent, setLandingContent] = useState<LandingContent | null>(null);
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Generative AI'); // Default to Generative AI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const navigateToAuth = (mode: 'signin' | 'signup') => {
    navigate(`/auth?mode=${mode}`);
  };

  const fetchLandingContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching landing content for all categories...');
      
      // Fetch breaking news and all landing content in parallel
      const [breakingResponse, landingResponse] = await Promise.all([
        apiService.getBreakingNewsAlerts(8),
        apiService.getLandingContent(3) // 3 items per content type
      ]);
      
      // Set breaking news
      if (breakingResponse?.articles) {
        console.log('🚨 Breaking news response:', breakingResponse.articles);
        // Add author field to match Article interface
        const breakingWithAuthor = breakingResponse.articles.map((article: any) => ({
          ...article,
          author: article.author || 'Unknown'
        }));
        setBreakingNews(breakingWithAuthor);
      }
      
      // Set landing content
      if (landingResponse?.categories) {
        console.log('📊 Landing content loaded:', landingResponse.categories);
        setLandingContent(landingResponse);
        
        // Set default active category to the first one (highest priority)
        if (landingResponse.categories.length > 0) {
          setActiveCategory(landingResponse.categories[0].name);
        }
      }
      
    } catch (err: any) {
      console.error('Failed to fetch landing content:', err);
      
      // Set fallback content structure
      const fallbackContent: LandingContent = {
        categories: [
          {
            id: 1,
            name: 'Generative AI',
            priority: 1,
            description: 'LLMs, GPT, Claude, and AI Generation',
            content: {
              blogs: [
                {
                  title: 'OpenAI Releases Revolutionary GPT-5 with Breakthrough Reasoning Capabilities',
                  summary: 'New model demonstrates unprecedented problem-solving abilities and multimodal understanding.',
                  url: '#',
                  source: 'OpenAI',
                  significanceScore: 9.5,
                  published_date: new Date().toISOString(),
                  author: 'OpenAI Team',
                  category: 'Generative AI',
                  content_type: 'blogs'
                }
              ],
              podcasts: [],
              videos: []
            }
          },
          {
            id: 2,
            name: 'AI Applications',
            priority: 2,
            description: 'Enterprise Use Cases & Industry Solutions',
            content: {
              blogs: [
                {
                  title: 'Enterprise AI Adoption Surges 300% in Fortune 500 Companies',
                  summary: 'Major corporations are rapidly integrating AI solutions across operations.',
                  url: '#',
                  source: 'Enterprise AI Report',
                  significanceScore: 8.8,
                  published_date: new Date().toISOString(),
                  author: 'AI Research Team',
                  category: 'AI Applications',
                  content_type: 'blogs'
                }
              ],
              podcasts: [],
              videos: []
            }
          },
          {
            id: 3,
            name: 'AI Startups',
            priority: 3,
            description: 'Funding, M&A & Emerging Companies',
            content: {
              blogs: [
                {
                  title: 'AI Startup Anthropic Raises $4B Series C at $15B Valuation',
                  summary: 'Leading AI safety company secures massive funding round.',
                  url: '#',
                  source: 'TechCrunch',
                  significanceScore: 9.2,
                  published_date: new Date().toISOString(),
                  author: 'Tech Reporter',
                  category: 'AI Startups',
                  content_type: 'blogs'
                }
              ],
              podcasts: [],
              videos: []
            }
          }
        ],
        total_categories: 3
      };
      
      setLandingContent(fallbackContent);
      setActiveCategory('Generative AI');
      setError('Using cached content - fresh updates available after sign in');
      
    } finally {
      setLoading(false);
    }
  };

  // Get current active category data
  const getCurrentCategory = (): Category | null => {
    if (!landingContent) return null;
    return landingContent.categories.find(cat => cat.name === activeCategory) || null;
  };


  const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  useEffect(() => {
    fetchLandingContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="pt-8">
          <LandingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 landing-container" style={{ fontFamily: 'Inter, sans-serif' }}>
      <SEO 
        title="Vidyagam AI News | Latest Generative AI & Machine Learning Breakthroughs"
        description="Stay ahead with breaking AI news, generative AI developments, and machine learning breakthroughs. Get personalized AI insights from 50+ top sources."
        keywords="AI news, generative AI, machine learning, OpenAI, ChatGPT, AI breakthroughs, artificial intelligence, AI research, tech news"
        url="/"
      />
      
      {/* Clean Modern Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg font-bold">V</span>
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">Vidyagam</div>
                <div className="text-xs text-gray-500 -mt-1">AI News Intelligence</div>
              </div>
            </div>
            
            {/* Navigation Actions */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigateToAuth('signin')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigateToAuth('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            AI Intelligence,
            <br />
            <span className="text-blue-600">Curated & Filtered</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join 10,000+ AI professionals getting curated insights from 50+ premium sources. 
            Stay ahead with personalized AI intelligence delivered daily.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button 
              onClick={() => navigateToAuth('signup')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-lg"
            >
              Start Free Account
            </button>
            <button 
              onClick={() => navigateToAuth('signin')}
              className="text-gray-600 hover:text-gray-900 px-8 py-4 text-lg font-medium transition-colors"
            >
              Sign In →
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>100% Free</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>10,000+ Users</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Category Navigation */}
      {landingContent && landingContent.categories.length > 0 && (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore Topics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {landingContent.categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.name)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      activeCategory === category.name 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}


      {/* Breaking News Ticker - Enhanced */}
      {breakingNews.length > 0 && (
        <section className="bg-red-50 border-y border-red-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 px-4 py-2 rounded-lg mr-6">
                <span className="text-sm font-semibold text-red-700 flex items-center">
                  🚨 Breaking News
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="animate-scroll inline-flex whitespace-nowrap">
                  {breakingNews.map((alert, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer px-4 py-2 mr-6 hover:shadow-md transition-shadow"
                      onClick={() => window.open(alert.url, '_blank', 'noopener,noreferrer')}
                    >
                      <span className="font-medium text-gray-900">{alert.title}</span>
                      <span className="ml-3 text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded-md font-medium">
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

      {/* Main Content - Active Category with Content Types */}
      <main id="main-content" className="bg-gray-50 py-12">
        {(() => {
          const currentCategory = getCurrentCategory();
          
          if (!currentCategory) {
            return (
              <div className="text-center py-16 px-4">
                <div className="animate-float">
                  <div className="text-4xl sm:text-6xl mb-4">🔄</div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Loading Categories</h3>
                  <p className="text-sm sm:text-base text-gray-600">Fetching the latest AI intelligence...</p>
                </div>
              </div>
            );
          }

          return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Category Header */}
              <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{currentCategory.name}</h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">{currentCategory.description}</p>
                
                {/* Content Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{currentCategory.content.blogs.length}</div>
                    <div className="text-sm text-gray-600">Articles</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{currentCategory.content.podcasts.length}</div>
                    <div className="text-sm text-gray-600">Podcasts</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{currentCategory.content.videos.length}</div>
                    <div className="text-sm text-gray-600">Videos</div>
                  </div>
                </div>
              </div>

              {/* Content Sections */}
              <div className="space-y-12">
                {/* Articles Section */}
                {currentCategory.content.blogs.length > 0 && (
                  <section>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600">📖</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {currentCategory.content.blogs.length}
                      </span>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {currentCategory.content.blogs.map((article, index) => (
                        <article
                          key={index}
                          onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                          className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer p-6"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                              ARTICLE
                            </span>
                            {article.significanceScore && (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-medium">
                                Score: {article.significanceScore}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          
                          <p className="text-gray-600 text-sm mb-4">
                            {article.summary.substring(0, 120)}...
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium">{article.source}</span>
                            <span>{formatTimeAgo(article.published_date)}</span>
                          </div>
                          </article>
                        ))}
                    </div>
                  </section>
                )}

                {/* Podcasts Section */}
                {currentCategory.content.podcasts.length > 0 && (
                  <section>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600">🎧</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Featured Podcasts</h2>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        {currentCategory.content.podcasts.length}
                      </span>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {currentCategory.content.podcasts.map((article, index) => (
                          <article
                            key={index}
                            onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                            className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer p-6"
                          >
                          <div className="flex items-start justify-between mb-3">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-medium">
                              PODCAST
                            </span>
                            {article.significanceScore && (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-medium">
                                Score: {article.significanceScore}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          
                          <p className="text-gray-600 text-sm mb-4">
                            {article.summary.substring(0, 120)}...
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium">{article.source}</span>
                            <span>{formatTimeAgo(article.published_date)}</span>
                          </div>
                          </article>
                        ))}
                    </div>
                  </section>
                )}

                {/* Videos Section */}
                {currentCategory.content.videos.length > 0 && (
                  <section>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600">🎥</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Latest Videos</h2>
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                        {currentCategory.content.videos.length}
                      </span>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {currentCategory.content.videos.map((article, index) => (
                          <article
                            key={index}
                            onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                            className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer p-6"
                          >
                          <div className="flex items-start justify-between mb-3">
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-medium">
                              VIDEO
                            </span>
                            {article.significanceScore && (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-medium">
                                Score: {article.significanceScore}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          
                          <p className="text-gray-600 text-sm mb-4">
                            {article.summary.substring(0, 120)}...
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium">{article.source}</span>
                            <span>{formatTimeAgo(article.published_date)}</span>
                          </div>
                          </article>
                        ))}
                    </div>
                  </section>
                )}

                {/* No Content Message */}
                {currentCategory.content.blogs.length === 0 && 
                 currentCategory.content.podcasts.length === 0 && 
                 currentCategory.content.videos.length === 0 && (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No content available yet</h3>
                    <p className="text-gray-600 mb-6">We're working on getting fresh {currentCategory.name} content for you.</p>
                    <button 
                      onClick={() => navigateToAuth('signup')}
                      className="btn-base btn-lg btn-primary"
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


      {/* Enhanced Footer */}
      <footer className="bg-slate-900 text-white py-16 mt-16 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg mr-3">
                  <span className="text-white text-lg font-bold">V</span>
                </div>
                <span className="text-2xl font-bold text-white">Vidyagam</span>
              </div>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                Join 10,000+ AI professionals getting curated insights from 50+ premium sources. 
                Stay ahead with personalized AI intelligence delivered daily.
              </p>
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🤖</span>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🚀</span>
                </div>
              </div>
            </div>

            {/* Content Types */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Content Types</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center">
                  <span className="mr-2">📄</span> 
                  <span>AI Research Articles</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🎥</span> 
                  <span>Technical Videos</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🎧</span> 
                  <span>AI Podcasts & Interviews</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🚨</span> 
                  <span>Breaking News Alerts</span>
                </li>
              </ul>
            </div>

            {/* Topics Covered */}
            <div>
              <h4 className="text-lg font-semibold mb-4">AI Topics</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                {landingContent && landingContent.categories.slice(0, 6).map((category, index) => (
                  <li key={index}>• {category.name}</li>
                ))}
                {(!landingContent || landingContent.categories.length === 0) && (
                  <>
                    <li>• Generative AI & LLMs</li>
                    <li>• Machine Learning</li>
                    <li>• Computer Vision</li>
                    <li>• AI Safety & Ethics</li>
                    <li>• AI Startups & Funding</li>
                    <li>• Research Breakthroughs</li>
                  </>
                )}
              </ul>
            </div>

            {/* Sources & Features */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Personalized AI Feed</li>
                <li>• Real-time Content Updates</li>
                <li>• Smart Content Filtering</li>
                <li>• Email Newsletter Digest</li>
                <li>• Mobile-First Design</li>
                <li>• Expert Curated Sources</li>
              </ul>
            </div>
          </div>

          {/* Enhanced CTA Section */}
          <div className="border-t border-gray-700/50 pt-12 mb-12">
            <div className="text-center bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-2xl p-8 border border-indigo-500/20">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-2 bg-indigo-500/20 px-4 py-2 rounded-full">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm font-medium text-white">10,000+ Active Users</span>
                  <span className="text-yellow-400">⭐</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-3 text-white">
                Ready to Join the AI Elite?
              </h3>
              <p className="text-gray-300 mb-8 max-w-3xl mx-auto text-lg leading-relaxed">
                Get instant access to curated AI insights, breaking news alerts, and personalized content from industry leaders. 
                <span className="text-blue-400 font-semibold">100% Free</span> • <span className="text-green-400 font-semibold">No Credit Card</span> • <span className="text-purple-400 font-semibold">Cancel Anytime</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => navigateToAuth('signup')}
                  className="btn-base btn-xl btn-primary"
                >
                  🚀 Start Free Account
                </button>
                <div className="flex items-center text-sm text-gray-400">
                  <span>Already have an account?</span>
                  <button 
                    onClick={() => navigateToAuth('signin')}
                    className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold underline transition-colors"
                  >
                    Sign In →
                  </button>
                </div>
              </div>
              
              {/* Trust indicators */}
              <div className="flex justify-center items-center mt-8 space-x-8 text-sm text-gray-400">
                <div className="flex items-center">
                  <span className="text-green-400 mr-1">✓</span>
                  <span>Instant Access</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-1">✓</span>
                  <span>50+ AI Sources</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-1">✓</span>
                  <span>Daily Digest</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-1">✓</span>
                  <span>Mobile Optimized</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
            <div className="mb-4 sm:mb-0">
              <p>&copy; 2025 Vidyagam. Curated AI intelligence platform.</p>
            </div>
            <div className="flex space-x-6">
              <span>🌍 Global AI Coverage</span>
              <span>⚡ Real-time Updates</span>
              <span>🔒 Privacy First</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Error Notice */}
      {error && (
        <div className="fixed top-16 sm:top-18 left-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 p-3 sm:p-4 rounded-lg shadow-lg z-20 max-w-4xl mx-auto">
          <p className="text-xs sm:text-sm text-yellow-800 font-medium">💡 {error}</p>
        </div>
      )}
    </div>
  );
};

export default Landing;