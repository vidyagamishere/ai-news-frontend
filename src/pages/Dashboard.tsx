import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, type DigestResponse } from '../services/api';
import Header from '../components/Header';
import TopStories from '../components/TopStories';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

// Lazy load heavy components
const MetricsDashboard = lazy(() => import('../components/MetricsDashboard'));
const ContentTabs = lazy(() => import('../components/content/ContentTabs'));
const ComprehensiveOnboarding = lazy(() => import('../components/onboarding/ComprehensiveOnboarding'));
const AdUnit = lazy(() => import('../components/ads/AdUnit'));

const Dashboard: React.FC = () => {
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [digestLoading, setDigestLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Check for force onboarding URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const forceOnboarding = urlParams.get('force-onboarding') === 'true';

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to home');
      navigate('/');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchDigest = async (refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
      } else {
        setDigestLoading(true);
      }
      setError(null);
      
      // Add timeout with fallback data
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
      );
      
      // For authenticated users, get personalized digest to include auth token
      // Fall back to general digest if personalized fails
      const dataPromise = isAuthenticated 
        ? apiService.getPersonalizedDigest(refresh)
        : apiService.getDigest(refresh);
      
      try {
        const data = await Promise.race([dataPromise, timeoutPromise]) as DigestResponse;
        setDigest(data);
        setLastRefresh(new Date());
        
        console.log('✅ Fresh data loaded successfully');
        
        // Log personalization status
        if ((data as any).personalized) {
          console.log('✅ Personalized content loaded for authenticated user');
        } else if (isAuthenticated) {
          console.log('⚠️ Authenticated user but received general content');
        }
        
        // Log enhanced backend features
        if ((data as any).admin_features) {
          console.log('✅ Enhanced backend with admin validation active');
        }
        if ((data as any).enhanced) {
          console.log('✅ Enhanced scraping with free AI sources active');
        }
      } catch (dataError: any) {
        // If personalized digest fails for authenticated users, fall back to general digest
        if (isAuthenticated && dataError && !dataError.message?.includes('timeout')) {
          console.warn('⚠️ Personalized digest failed, falling back to general digest:', dataError);
          try {
            const fallbackData = await apiService.getDigest(refresh);
            setDigest(fallbackData);
            setLastRefresh(new Date());
            console.log('✅ Fallback to general digest successful');
            return;
          } catch (fallbackError) {
            console.error('❌ Both personalized and general digest failed:', fallbackError);
          }
        }
        
        // Handle timeout and other errors
        if (dataError?.message?.includes('timeout')) {
          console.log('API timeout, loading fallback data...');
          // Provide personalized fallback data
          const fallbackData: DigestResponse = {
          topStories: [
            {
              title: 'Latest Advances in Machine Learning Research',
              summary: 'Breakthrough developments in neural network architectures and deep learning algorithms are reshaping the AI landscape. Researchers have made significant progress in model efficiency, training optimization, and real-world applications across various domains.',
              url: '#',
              source: 'AI Research Labs',
              significanceScore: 8.5
            },
            {
              title: 'OpenAI Releases New Model Capabilities',
              summary: 'Revolutionary improvements in language understanding and generation demonstrate unprecedented performance in complex reasoning tasks. The latest model shows enhanced capabilities in code generation, mathematical problem solving, and creative writing.',
              url: '#',
              source: 'OpenAI',
              significanceScore: 8.2
            },
            {
              title: 'Google DeepMind Breakthrough in Protein Folding',
              summary: 'Significant advances in protein structure prediction using AI have potential applications in drug discovery and disease treatment. The new model demonstrates improved accuracy and computational efficiency compared to previous approaches.',
              url: '#',
              source: 'Google DeepMind',
              significanceScore: 7.9
            }
          ],
          summary: {
            keyPoints: ['Loading AI news from 45+ sources...'],
            metrics: {
              totalUpdates: 0,
              highImpact: 0,
              newResearch: 0,
              industryMoves: 0
            }
          },
          content: {
            blog: [],
            audio: [],
            video: [],
            events: [],
            learning: [],
            demos: []
          },
          timestamp: new Date().toISOString(),
          badge: 'Loading'
        };
        
        setDigest(fallbackData);
        // Don't show error message for cached content
        
          // Continue trying to load real data in background
          const backgroundPromise = isAuthenticated 
            ? apiService.getPersonalizedDigest(refresh)
            : apiService.getDigest(refresh);
            
          backgroundPromise.then(realData => {
            setDigest(realData);
            setError(null);
            setLastRefresh(new Date());
            console.log('Real data loaded after fallback:', realData);
          }).catch(() => {
            // Keep fallback data if real data fails
            console.log('Continuing with fallback data');
            setError(null); // Clear any error when using fallback
          });
        } else {
          // For non-timeout errors, show the error
          throw dataError;
        }
      }
    } catch (err) {
      console.error('Failed to fetch digest:', err);
      setError('Unable to load content. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setDigestLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDigest(true);
  };

  const handleManualScrape = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const scrapeResult = await apiService.triggerScrape();
      console.log('Manual scrape result:', scrapeResult);
      
      setTimeout(() => {
        fetchDigest(false);
      }, 2000);
      
    } catch (err) {
      console.error('Failed to trigger manual scrape:', err);
      setError('Failed to update sources. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Skip email verification check for now to avoid redirect loops
      // if (!user.emailVerified && new Date(user.createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000)) {
      //   navigate('/verify-email?email=' + encodeURIComponent(user.email));
      //   return;
      // }

      // For verified users, check onboarding status
      // Only check the backend flag - localStorage can be stale
      const hasCompletedOnboarding = user.preferences?.onboarding_completed === true;
      
      // Check if user has meaningful personalization data (actual topic/role selections)
      // Default settings don't count as "user data" - only custom selections do
      const hasPersonalizationData = (user.preferences?.topics?.length || 0) > 0 ||
                                     (user.preferences?.user_roles?.length || 0) > 0;
      
      // Show onboarding for users without personalization data OR if forced via URL parameter
      const needsOnboarding = forceOnboarding || (!hasCompletedOnboarding && !hasPersonalizationData);
      
      // Debug logging for onboarding decision
      console.log('🧪 Onboarding decision debug:', {
        forceOnboarding,
        hasCompletedOnboarding,
        hasPersonalizationData,
        needsOnboarding,
        onboarding_completed: user.preferences?.onboarding_completed,
        topics_length: user.preferences?.topics?.length,
        user_roles_length: user.preferences?.user_roles?.length,
        topics_array: user.preferences?.topics,
        user_roles_array: user.preferences?.user_roles,
        showOnboarding_state: showOnboarding
      });
      
      if (needsOnboarding) {
        console.log('✅ Setting showOnboarding to true');
        setShowOnboarding(true);
        return;
      } else {
        console.log('❌ Skipping onboarding - user has completed or has data');
        setShowOnboarding(false);
      }
    }
    
    // Start loading digest immediately, prioritize top stories
    fetchDigest(false);
    
    // Preload content types in background for faster tab switching
    setTimeout(() => {
      apiService.get('/api/content-types').catch(() => {
        // Silently fail, will be retried when tab is clicked
      });
    }, 2000);
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      // Only show welcome for truly new users who haven't completed onboarding
      const isNewUser = new Date(user.createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      const hasCompletedOnboarding = user.preferences?.onboarding_completed === true;
      
      if (isNewUser && !showOnboarding && !hasCompletedOnboarding) {
        setShowWelcome(true);
      }
    }
  }, [user]);

  // Show loading while authentication is being determined
  if (authLoading) {
    return <Loading message="Checking authentication..." />;
  }

  // If not authenticated, the useEffect will redirect to home
  if (!isAuthenticated) {
    return <Loading message="Loading..." />;
  }

  if (showOnboarding) {
    return (
      <div className="app onboarding-app">
        <Suspense fallback={<Loading message="Loading onboarding..." />}>
          <ComprehensiveOnboarding 
            onComplete={() => {
              setShowOnboarding(false);
              setShowWelcome(false);
              // Clear force-onboarding parameter from URL
              if (forceOnboarding) {
                const newUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, newUrl);
              }
            }}
          />
        </Suspense>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <div className="app">
        <div className="welcome-overlay">
          <div className="welcome-modal">
            <h2>Welcome to AI News Digest!</h2>
            <p>Let's customize your experience</p>
            <div className="welcome-actions">
              <button 
                onClick={() => {
                  setShowWelcome(false);
                  setShowOnboarding(true);
                }}
                className="btn btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading only for initial page load, not for digest updates
  if (digestLoading && !digest) {
    return <Loading message="Loading latest AI news..." />;
  }

  if (error && !digest) {
    return (
      <div className="app">
        <Header 
          onRefresh={handleRefresh}
          onManualScrape={handleManualScrape}
          isLoading={loading}
          lastUpdated={lastRefresh?.toISOString()}
        />
        <div className="error-container">
          <div className="error-message">
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={() => fetchDigest(false)} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="app">
        <Header 
          onRefresh={handleRefresh}
          onManualScrape={handleManualScrape}
          isLoading={loading}
          lastUpdated={lastRefresh?.toISOString()}
        />
        <div className="error-container">
          <div className="error-message">
            <h2>📰 No News Available</h2>
            <p>No digest data available at the moment.</p>
            <button onClick={() => fetchDigest(true)} className="btn btn-primary">
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app authenticated-app">
      <SEO 
        title="Vidyagam AI News Dashboard | Intelligence at Light Speed"
        description="Your personalized AI news dashboard with latest breakthroughs, industry insights, and research updates."
        url="/dashboard"
      />
      <Header 
        onRefresh={handleRefresh}
        onManualScrape={handleManualScrape}
        isLoading={loading}
        lastUpdated={lastRefresh?.toISOString()}
      />
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      
      <main className="main-content">
        <div className="main-content-contained">
          
          <div className="dashboard-layout">
            <div className="dashboard-main">
              <div className="section-header">
                <div className="section-header-main">
                  <h2 id="dashboard-top-stories">🔥 Top Stories</h2>
                  {digest?.personalized && (
                    <span className="personalized-badge" title="Content personalized based on your preferences">
                      ✨ Personalized
                    </span>
                  )}
                </div>
                <p>
                  {digest?.personalized && digest?.summary?.personalization_note
                    ? digest.summary.personalization_note
                    : "Latest AI breakthroughs and developments from leading sources"
                  }
                </p>
                {digest?.summary?.personalized_greeting && (
                  <div className="personalized-greeting">
                    {digest.summary.personalized_greeting}
                  </div>
                )}
              </div>
              <TopStories stories={digest.topStories?.slice(0, 3) || []} />
              
              {import.meta.env.VITE_ENABLE_ADS === 'true' && digest.topStories && digest.topStories.length > 0 && (
                <Suspense fallback={<div style={{height: '90px', background: '#f5f5f5', borderRadius: '8px'}} />}>
                  <AdUnit 
                    adSlot="1234567890"
                    adFormat="horizontal"
                    className="header-ad"
                  />
                </Suspense>
              )}
              
              <Suspense fallback={<Loading message="Loading content tabs..." />}>
                <ContentTabs 
                  userTier={user?.subscriptionTier || 'free'} 
                  topStories={digest.topStories}
                  digestContent={digest.content}
                />
              </Suspense>
              
              <div className="metrics-section">
                <Suspense fallback={<div style={{height: '200px', background: '#f5f5f5', borderRadius: '8px'}} />}>
                  <MetricsDashboard 
                    metrics={digest.summary?.metrics || {
                      totalUpdates: digest.topStories?.length || 0,
                      highImpact: Math.floor((digest.topStories?.length || 0) * 0.3),
                      newResearch: Math.floor((digest.topStories?.length || 0) * 0.4),
                      industryMoves: Math.floor((digest.topStories?.length || 0) * 0.3)
                    }}
                  />
                </Suspense>
              </div>
            </div>
            
            <div className="dashboard-sidebar">
              {import.meta.env.VITE_ENABLE_ADS === 'true' && digest.topStories && digest.topStories.length > 0 && (
                <Suspense fallback={<div style={{height: '250px', background: '#f5f5f5', borderRadius: '8px'}} />}>
                  <AdUnit 
                    adSlot="2345678901"
                    adFormat="rectangle"
                    className="sidebar-ad"
                  />
                </Suspense>
              )}

              {user?.subscriptionTier === 'free' && (
                <div className="sidebar-upgrade">
                  <div className="upgrade-card">
                    <div className="upgrade-header">
                      <Crown size={24} className="upgrade-icon" />
                      <h3>Upgrade to Premium</h3>
                    </div>
                    <div className="upgrade-features">
                      <div className="feature-item">✨ Daily AI digests</div>
                      <div className="feature-item">🎯 Personalized content</div>
                      <div className="feature-item">📱 Mobile access</div>
                    </div>
                    <button className="upgrade-btn">
                      Upgrade Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {import.meta.env.VITE_ENABLE_ADS === 'true' && digest.topStories && digest.topStories.length > 0 && (
        <Suspense fallback={<div style={{height: '90px', background: '#f5f5f5', borderRadius: '8px'}} />}>
          <AdUnit 
            adSlot="3456789012"
            adFormat="horizontal"
            className="footer-ad"
          />
        </Suspense>
      )}
      
      <footer className="footer modern-footer">
        <div className="footer-content">
          <div className="footer-center">
            <p>Copyright @2025 by Vidyagam Learning LLC</p>
            <div className="footer-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/about">About</Link>
              <a 
                href="/admin-validation" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#667eea', fontSize: '12px' }}
                title="Admin Panel (requires admin key)"
              >
                🛠️ Admin
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {loading && (
        <div className="loading-overlay">
          <Loading message="Updating content..." />
        </div>
      )}
    </div>
  );
};

export default Dashboard;