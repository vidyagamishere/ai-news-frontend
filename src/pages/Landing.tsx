import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const Landing: React.FC = () => {
  return (
    <div className="app landing-app">
      <SEO 
        title="Vidyagam AI News | Intelligence at Light Speed"
        description="Get personalized AI news, events, and learning resources curated by AI. Daily digest of artificial intelligence breakthroughs, conferences, courses, and industry insights."
        keywords="AI news, artificial intelligence, machine learning, AI events, AI courses, AI conferences, AI learning, tech news, AI industry updates, personalized news"
        url="/"
      />
      <Header 
        onRefresh={() => {}}
        onManualScrape={() => {}}
        isLoading={false}
        lastUpdated={undefined}
      />
      
      <div className="landing-hero">
        <div className="hero-content">
          <h1>Stay Ahead in AI</h1>
          <p className="hero-subtitle">
            Get personalized AI news, insights, and updates delivered to your inbox. 
            Choose from curated topics and premium features.
          </p>
          
          <div className="hero-features">
            <div className="feature">
              <div className="feature-icon">📰</div>
              <h3>Curated Content</h3>
              <p>Hand-picked AI news from trusted sources</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3>Personalized Topics</h3>
              <p>Choose what matters most to you</p>
            </div>
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <h3>Daily Updates</h3>
              <p>Never miss important AI developments</p>
            </div>
          </div>

          <div className="hero-cta">
            <div className="cta-buttons">
              <Link to="/auth?mode=signup" className="btn btn-primary btn-large">
                Get Started Free
              </Link>
              <Link to="/auth?mode=signin" className="btn btn-ghost btn-large">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Landing;