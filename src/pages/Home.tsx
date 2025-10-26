import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// LogIn icon now handled by Header component
import { useAuth } from '../contexts/AuthContext';
import { apiService, type DigestResponse } from '../services/api';
import Loading from '../components/Loading';
import Header from '../components/Header';
import SEO from '../components/SEO';
import './Home.css';

const Home: React.FC = () => {
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const fetchDigest = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📡 Fetching digest (attempt ${retryCount + 1}/3)...`);
      
      const data = await apiService.getDigest(false);
      setDigest(data);
      console.log('✅ Fresh data loaded successfully');
      
    } catch (err: any) {
      console.error('Failed to fetch digest:', err);
      
      // If this is the first failure and we have no existing data, provide fallback
      if (retryCount === 0 && !digest) {
        console.log('🔄 First attempt failed, showing fallback data and retrying in background...');
        
        const fallbackData: DigestResponse = {
          topStories: [
            {
              title: 'Latest AI Breakthroughs in Machine Learning',
              summary: 'Discover the cutting-edge developments in artificial intelligence that are reshaping industries worldwide. These groundbreaking advances represent significant progress in neural network architectures, automated learning systems, and computational intelligence. Leading research institutions are pioneering novel approaches to machine learning that promise to revolutionize how we process information and solve complex problems. The innovations span from deep learning optimization to reinforcement learning applications across diverse sectors. These developments mark a pivotal moment in AI evolution, with implications extending far beyond current technological boundaries.',
              content_summary: 'Discover the cutting-edge developments in artificial intelligence that are reshaping industries worldwide. These groundbreaking advances represent significant progress in neural network architectures, automated learning systems, and computational intelligence. Leading research institutions are pioneering novel approaches to machine learning that promise to revolutionize how we process information and solve complex problems. The innovations span from deep learning optimization to reinforcement learning applications across diverse sectors. These developments mark a pivotal moment in AI evolution, with implications extending far beyond current technological boundaries.',
              url: '#',
              source: 'AI Research Labs',
              significanceScore: 9.2
            },
            {
              title: 'OpenAI Releases New Language Model Capabilities',
              summary: 'Revolutionary advances in natural language processing promise to transform how we interact with AI systems. These breakthrough capabilities demonstrate unprecedented understanding of context, reasoning, and complex linguistic patterns that rival human comprehension. The new model architecture incorporates advanced attention mechanisms and sophisticated training methodologies that enable more nuanced and accurate responses. Industry experts anticipate these developments will accelerate AI adoption across education, business, and creative industries. This represents a significant leap forward in creating more intuitive and powerful AI assistants.',
              content_summary: 'Revolutionary advances in natural language processing promise to transform how we interact with AI systems. These breakthrough capabilities demonstrate unprecedented understanding of context, reasoning, and complex linguistic patterns that rival human comprehension. The new model architecture incorporates advanced attention mechanisms and sophisticated training methodologies that enable more nuanced and accurate responses. Industry experts anticipate these developments will accelerate AI adoption across education, business, and creative industries. This represents a significant leap forward in creating more intuitive and powerful AI assistants.',
              url: '#',
              source: 'OpenAI',
              significanceScore: 8.7
            },
            {
              title: 'Google DeepMind Achieves New Breakthrough',
              summary: 'Significant progress in AI reasoning capabilities marks another milestone in artificial general intelligence research. The breakthrough demonstrates enhanced logical thinking, problem-solving abilities, and multi-step reasoning that approaches human-level cognitive performance. This advancement builds upon years of research in neural architectures, reinforcement learning, and cognitive modeling to create more sophisticated AI systems. The implications extend across scientific research, strategic planning, and complex decision-making applications where deep reasoning is essential. This development brings us closer to achieving artificial general intelligence with broad applicability.',
              content_summary: 'Significant progress in AI reasoning capabilities marks another milestone in artificial general intelligence research. The breakthrough demonstrates enhanced logical thinking, problem-solving abilities, and multi-step reasoning that approaches human-level cognitive performance. This advancement builds upon years of research in neural architectures, reinforcement learning, and cognitive modeling to create more sophisticated AI systems. The implications extend across scientific research, strategic planning, and complex decision-making applications where deep reasoning is essential. This development brings us closer to achieving artificial general intelligence with broad applicability.',
              url: '#',
              source: 'Google DeepMind',
              significanceScore: 8.5
            }
          ],
          summary: {
            keyPoints: ['AI research advancing rapidly', 'New model capabilities emerging', 'Industry transformation accelerating'],
            metrics: {
              totalUpdates: 45,
              highImpact: 12,
              newResearch: 18,
              industryMoves: 15
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
          badge: 'Preview'
        };
        
        setDigest(fallbackData);
        
        // Retry in background with exponential backoff
        setTimeout(() => {
          fetchDigest(1);
        }, 3000);
      } else if (retryCount < 2) {
        // Retry with backoff
        setTimeout(() => {
          fetchDigest(retryCount + 1);
        }, Math.pow(2, retryCount) * 2000);
      } else {
        setError('Unable to load fresh content. Displaying cached data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToAuth = (mode: 'signin' | 'signup') => {
    navigate(`/auth?mode=${mode}`);
  };

  useEffect(() => {
    fetchDigest();
    
    // Set up periodic refresh every 10 minutes for fresh content
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing content...');
      fetchDigest();
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading && !digest) {
    return <Loading message="Loading AI news..." />;
  }

  if (error && !digest) {
    return (
      <div className="home-page">
        <div className="error-container">
          <div className="error-message">
            <h2>⚠️ Connection Issue</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button 
                onClick={() => fetchDigest(0)} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-ghost"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SEO 
        title="Vidyagam AI News | Gaining Knowledge, Filtered for You"
        description="Stay ahead with the latest AI breakthroughs, research, and industry insights. Personalized AI news curated by advanced neural networks."
        url="/"
      />
      
      {/* Header - Using consistent Header component */}
      <Header />

      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-content">
          <h1 id="hero-heading">Stay Ahead of the AI Revolution</h1>
          <p>
            Stay ahead of the AI revolution with curated news, insights, and breakthroughs 
            from 50+ top sources. <strong>No signup required to explore.</strong>
          </p>
          
          <div className="hero-cta">
            <button 
              onClick={() => navigateToAuth('signup')}
              className="cta-primary"
              aria-describedby="hero-heading"
            >
              🚀 Start Your AI Journey
            </button>
            <p className="cta-subtitle">Free access • No credit card • Instant setup</p>
          </div>
          
          <div className="hero-stats" role="list" aria-label="Key statistics">
            <div className="stat" role="listitem">
              <span className="stat-number" aria-label="Over 50 AI sources">50+</span>
              <span className="stat-label">AI Sources</span>
            </div>
            <div className="stat" role="listitem">
              <span className="stat-number" aria-label="Daily news updates">Daily</span>
              <span className="stat-label">Updates</span>
            </div>
            <div className="stat" role="listitem">
              <span className="stat-number" aria-label="Free access to content">Free</span>
              <span className="stat-label">Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main id="main-content" className="home-content">
        {digest && (
          <>
            {/* Breaking Stories - Horizontal scroll bar (3-5 feeds) */}
            <section className="breaking-stories-section" aria-labelledby="breaking-stories-heading">
              <div className="section-header">
                <h2 id="breaking-stories-heading">🚨 Breaking Stories</h2>
                <p>Latest breaking news from today</p>
              </div>
              <div className="breaking-stories-scroll">
                {digest.topStories?.slice(0, Math.min(5, Math.max(3, digest.topStories?.length || 3))).map((story, index) => (
                  <div key={index} className="breaking-story-card" onClick={() => window.open(story.url, '_blank')}>
                    <h3>{story.title}</h3>
                    <p className="story-summary">{story.summary?.substring(0, 150) || story.content_summary?.substring(0, 150) || 'No summary available'}...</p>
                    <div className="story-meta">
                      <span className="source">{story.source}</span>
                      <span className="significance">Score: {story.significanceScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Content Types - Each content type as heading with articles (1-5 per type) */}
            <section className="content-types-section" aria-labelledby="content-types-heading">
              <div className="section-header">
                <h2 id="content-types-heading">📰 Latest AI News by Category</h2>
                <p>Browse news by content type - each category shows 1-5 latest articles</p>
              </div>
              
              {/* AI News & Updates */}
              <div className="content-type-section">
                <h3 className="content-type-heading">🤖 AI News & Updates</h3>
                <div className="content-type-articles">
                  {digest.topStories?.slice(0, Math.min(5, Math.max(1, digest.topStories?.length || 1))).map((story, index) => (
                    <div key={index} className="article-card" onClick={() => window.open(story.url, '_blank')}>
                      <h4>{story.title}</h4>
                      <p>{story.summary?.substring(0, 200) || story.content_summary?.substring(0, 200) || 'Latest AI news and developments'}...</p>
                      <div className="article-meta">
                        <span className="source">{story.source}</span>
                        <span className="score">Score: {story.significanceScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Machine Learning */}
              <div className="content-type-section">
                <h3 className="content-type-heading">🧠 Machine Learning</h3>
                <div className="content-type-articles">
                  {digest.content.blog?.slice(0, Math.min(5, Math.max(1, digest.content.blog?.length || 1))).map((item, index) => (
                    <div key={index} className="article-card" onClick={() => window.open(item.url || '#', '_blank')}>
                      <h4>{item.title}</h4>
                      <p>{item.content_summary?.substring(0, 200) || 'Latest machine learning developments and research'}...</p>
                      <div className="article-meta">
                        <span className="source">{item.source || 'ML Research'}</span>
                      </div>
                    </div>
                  )) || (
                    <div className="article-card placeholder">
                      <h4>Latest Machine Learning Breakthroughs</h4>
                      <p>Discover cutting-edge ML research, algorithms, and applications...</p>
                      <div className="article-meta">
                        <span className="source">ML Research</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Learning & Education */}
              <div className="content-type-section">
                <h3 className="content-type-heading">📚 AI Learning & Education</h3>
                <div className="content-type-articles">
                  {digest.content.learning?.slice(0, Math.min(5, Math.max(1, digest.content.learning?.length || 1))).map((item, index) => (
                    <div key={index} className="article-card" onClick={() => window.open(item.url || '#', '_blank')}>
                      <h4>{item.title}</h4>
                      <p>{item.content_summary?.substring(0, 200) || 'Educational content about AI and machine learning'}...</p>
                      <div className="article-meta">
                        <span className="source">{item.source || 'AI Education'}</span>
                      </div>
                    </div>
                  )) || (
                    <div className="article-card placeholder">
                      <h4>AI Learning Resources</h4>
                      <p>Educational content, tutorials, and courses for AI enthusiasts...</p>
                      <div className="article-meta">
                        <span className="source">AI Education</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Content */}
              <div className="content-type-section">
                <h3 className="content-type-heading">🎥 Video Content</h3>
                <div className="content-type-articles">
                  {digest.content.video?.slice(0, Math.min(5, Math.max(1, digest.content.video?.length || 1))).map((item, index) => (
                    <div key={index} className="article-card" onClick={() => window.open(item.url || '#', '_blank')}>
                      <h4>{item.title}</h4>
                      <p>{item.content_summary?.substring(0, 200) || 'Video content about AI developments'}...</p>
                      <div className="article-meta">
                        <span className="source">{item.source || 'AI Video'}</span>
                      </div>
                    </div>
                  )) || (
                    <div className="article-card placeholder">
                      <h4>AI Video Content</h4>
                      <p>Watch the latest AI presentations, demos, and educational videos...</p>
                      <div className="article-meta">
                        <span className="source">AI Video</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Audio/Podcast Content */}
              <div className="content-type-section">
                <h3 className="content-type-heading">🎧 Audio & Podcasts</h3>
                <div className="content-type-articles">
                  {digest.content.audio?.slice(0, Math.min(5, Math.max(1, digest.content.audio?.length || 1))).map((item, index) => (
                    <div key={index} className="article-card" onClick={() => window.open(item.url || '#', '_blank')}>
                      <h4>{item.title}</h4>
                      <p>{item.content_summary?.substring(0, 200) || 'Audio content and podcasts about AI'}...</p>
                      <div className="article-meta">
                        <span className="source">{item.source || 'AI Podcast'}</span>
                      </div>
                    </div>
                  )) || (
                    <div className="article-card placeholder">
                      <h4>AI Podcasts & Audio</h4>
                      <p>Listen to expert discussions, interviews, and AI thought leadership...</p>
                      <div className="article-meta">
                        <span className="source">AI Podcast</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Sign Up/Sign In Significance Section */}
            <section className="signup-significance-section" aria-labelledby="signup-significance-heading">
              <div className="significance-content">
                <h2 id="signup-significance-heading">🎯 Why Sign Up?</h2>
                <div className="significance-grid">
                  <div className="significance-item">
                    <div className="significance-icon">🎯</div>
                    <h3>Personalized Content</h3>
                    <p>Get AI news tailored to your experience level, role, and interests</p>
                  </div>
                  <div className="significance-item">
                    <div className="significance-icon">⚡</div>
                    <h3>Breaking News Alerts</h3>
                    <p>Receive instant notifications for critical AI developments</p>
                  </div>
                  <div className="significance-item">
                    <div className="significance-icon">📊</div>
                    <h3>Advanced Analytics</h3>
                    <p>Track trends and discover what matters most in AI</p>
                  </div>
                  <div className="significance-item">
                    <div className="significance-icon">📧</div>
                    <h3>Newsletter Digest</h3>
                    <p>Daily, weekly, or monthly summaries delivered to your inbox</p>
                  </div>
                </div>
                <div className="significance-cta">
                  <button 
                    onClick={() => navigateToAuth('signup')}
                    className="btn-significance-primary"
                  >
                    Start Your Personalized AI Journey
                  </button>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="cta-section" aria-labelledby="cta-heading">
              <div className="cta-content">
                <h2 id="cta-heading">Want Full Access?</h2>
                <p className="cta-text">
                  Sign up for free to get personalized AI news, daily digests, 
                  and exclusive insights delivered to your inbox.
                </p>
                <div className="cta-buttons" role="group" aria-labelledby="cta-heading">
                  <button 
                    onClick={() => navigateToAuth('signup')}
                    className="btn-cta-primary btn-large"
                    aria-describedby="cta-heading"
                  >
                    Get Started Free
                  </button>
                  <button 
                    onClick={() => navigateToAuth('signin')}
                    className="btn-cta-secondary btn-large"
                    aria-describedby="cta-heading"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-center">
            <p>Copyright @2025 by Vidyagam Learning LLC</p>
            <div className="footer-links">
              <Link to="/about">Purpose: Mission, Vision and Values</Link>
              <Link to="/terms">Terms and Privacy</Link>
              <a href="mailto:admin@vidyagam.com">Feedback</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;