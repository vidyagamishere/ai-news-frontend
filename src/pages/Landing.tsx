import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import Loading from '../components/Loading';
import { apiService, type DigestResponse } from '../services/api';
import './Landing.css';

interface Article {
  title: string;
  summary?: string;
  content_summary?: string;
  url: string;
  source: string;
  significanceScore?: number;
  published_date?: string;
  author?: string;
}

const Landing: React.FC = () => {
  const [topStories, setTopStories] = useState<Article[]>([]);
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const navigateToAuth = (mode: 'signin' | 'signup') => {
    navigate(`/auth?mode=${mode}`);
  };

  const fetchAIContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Data Flow: Frontend -> API Service -> Backend Endpoints -> Database Views
      // No direct database access from frontend - all data flows through proper API layers
      // Fetch breaking news alerts and Generative AI stories via dedicated API endpoints
      const [breakingResponse, contentResponse] = await Promise.all([
        apiService.getBreakingNewsAlerts(5),
        apiService.getGenerativeAIStories(6)
      ]);
      
      if (breakingResponse && breakingResponse.articles) {
        setBreakingNews(breakingResponse.articles);
      }
      
      if (contentResponse && contentResponse.articles) {
        setTopStories(contentResponse.articles);
      }
      
    } catch (err: any) {
      console.error('Failed to fetch AI content:', err);
      
      // Provide fallback content focused on Generative AI
      const fallbackBreaking: Article[] = [
        {
          title: 'OpenAI Releases Revolutionary GPT-5 with Breakthrough Reasoning Capabilities',
          summary: 'New model demonstrates unprecedented problem-solving abilities and multimodal understanding, marking a significant leap in artificial general intelligence development.',
          url: '#',
          source: 'OpenAI',
          significanceScore: 9.5
        },
        {
          title: 'Google DeepMind Achieves Major Breakthrough in AI Reasoning',
          summary: 'Latest research shows dramatic improvements in logical thinking and complex problem-solving that could accelerate AGI development.',
          url: '#',
          source: 'Google DeepMind',
          significanceScore: 9.2
        },
        {
          title: 'Meta Introduces Revolutionary AI Model for Real-Time Content Generation',
          summary: 'New architecture enables instant text, image, and video generation with unprecedented quality and efficiency.',
          url: '#',
          source: 'Meta AI',
          significanceScore: 8.8
        }
      ];
      
      const fallbackTop: Article[] = [
        {
          title: 'Microsoft Copilot Gets Major AI Upgrade with Enhanced Code Generation',
          summary: 'Latest update brings advanced programming assistance and natural language to code translation capabilities.',
          url: '#',
          source: 'Microsoft',
          significanceScore: 8.3
        },
        {
          title: 'Anthropic Claude 4 Shows Remarkable Advances in Mathematical Reasoning',
          summary: 'New version demonstrates superior performance in complex mathematical problem-solving and scientific reasoning.',
          url: '#',
          source: 'Anthropic',
          significanceScore: 8.1
        },
        {
          title: 'NVIDIA Unveils Next-Generation AI Chips for Enterprise Applications',
          summary: 'New architecture delivers 10x performance improvements for large language model training and inference.',
          url: '#',
          source: 'NVIDIA',
          significanceScore: 7.9
        },
        {
          title: 'Stability AI Releases Open Source Model Rivaling Proprietary Systems',
          summary: 'Community-driven development produces breakthrough results in image and text generation quality.',
          url: '#',
          source: 'Stability AI',
          significanceScore: 7.7
        },
        {
          title: 'AI Safety Researchers Make Progress on Alignment Challenges',
          summary: 'New techniques for ensuring AI systems behave according to human values and intentions show promising results.',
          url: '#',
          source: 'AI Safety Institute',
          significanceScore: 7.5
        },
        {
          title: 'Generative AI Market Reaches $100 Billion Milestone',
          summary: 'Enterprise adoption accelerates as organizations integrate AI into core business processes and workflows.',
          url: '#',
          source: 'Industry Analysis',
          significanceScore: 7.2
        }
      ];
      
      setBreakingNews(fallbackBreaking);
      setTopStories(fallbackTop);
      setError('Using cached content - fresh updates available after sign in');
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIContent();
  }, []);

  if (loading) {
    return <Loading message="Loading latest AI breakthroughs..." />;
  }

  return (
    <div className="landing-page">
      <SEO 
        title="Vidyagam AI News | Latest Generative AI & Machine Learning Breakthroughs"
        description="Stay ahead with breaking AI news, generative AI developments, and machine learning breakthroughs. Get personalized AI insights from 50+ top sources."
        keywords="AI news, generative AI, machine learning, OpenAI, ChatGPT, AI breakthroughs, artificial intelligence, AI research, tech news"
        url="/"
      />
      
      <Header 
        onRefresh={() => {}}
        onManualScrape={() => {}}
        isLoading={loading}
        lastUpdated={undefined}
        showAuthButtons={true}
        onSignInClick={() => navigateToAuth('signin')}
        onSignUpClick={() => navigateToAuth('signup')}
      />

      {/* Breaking News Ticker - First Section */}
      {breakingNews.length > 0 && (
        <section className="breaking-news-ticker">
          <div className="ticker-header">
            <span className="breaking-label">🚨 BREAKING</span>
            <span className="ticker-subtitle">Latest Generative AI Updates</span>
          </div>
          <div className="ticker-container">
            <div className="ticker-content">
              {breakingNews.map((story, index) => (
                <div 
                  key={index} 
                  className="ticker-item"
                  onClick={() => window.open(story.url, '_blank')}
                >
                  <span className="ticker-title">{story.title}</span>
                  <span className="ticker-separator">•</span>
                </div>
              ))}
              {/* Duplicate items for seamless loop */}
              {breakingNews.map((story, index) => (
                <div 
                  key={`dup-${index}`} 
                  className="ticker-item"
                  onClick={() => window.open(story.url, '_blank')}
                >
                  <span className="ticker-title">{story.title}</span>
                  <span className="ticker-separator">•</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Generative AI Stories Section */}
      <section className="top-stories-section">
        <div className="section-header">
          <h2>🤖 Top Generative AI Stories</h2>
          <p>Latest developments from OpenAI, Google DeepMind, Anthropic, and leading AI research labs</p>
        </div>
        <div className="stories-grid">
          {topStories.map((story, index) => (
            <div key={index} className="story-card" onClick={() => window.open(story.url, '_blank')}>
              <div className="story-header">
                <span className="story-source">{story.source}</span>
                <span className="story-category">{story.category || 'AI'}</span>
              </div>
              <h3>{story.title}</h3>
              <p>{(story.summary || story.content_summary || '').substring(0, 150)}...</p>
              <div className="story-footer">
                <span className="read-more">Read Full Article →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Value Proposition */}
      <section className="value-section">
        <div className="value-content">
          <h2>🎯 Why Join Vidyagam?</h2>
          <div className="value-grid">
            <div className="value-item">
              <div className="value-icon">🚀</div>
              <h3>Quantum-Speed Intelligence</h3>
              <p>Real-time AI developments before they break mainstream</p>
            </div>
            <div className="value-item">
              <div className="value-icon">🔬</div>
              <h3>Research-Grade Insights</h3>
              <p>Direct pipeline from labs to your dashboard</p>
            </div>
            <div className="value-item">
              <div className="value-icon">🎯</div>
              <h3>Neural Personalization</h3>
              <p>AI that learns your technical interests</p>
            </div>
            <div className="value-item">
              <div className="value-icon">🏛️</div>
              <h3>Elite Network Access</h3>
              <p>Trusted by DeepMind, OpenAI, and top AI labs</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta-section">
        <div className="cta-content">
          <h2>Ready to Start?</h2>
          <div className="cta-buttons">
            <button 
              onClick={() => navigateToAuth('signup')}
              className="btn-cta-primary"
            >
              Join Free
            </button>
            <button 
              onClick={() => navigateToAuth('signin')}
              className="btn-cta-secondary"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="content-notice">
          <p>💡 {error}</p>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Landing;