import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Zap, Users, Target, Shield, Sparkles } from 'lucide-react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <SEO 
        title="About Vidyagam | Intelligence at Light Speed"
        description="Learn how Vidyagam aggregates AI news from 500+ sources to provide personalized insights for professionals and enthusiasts."
        url="/about"
      />
      <div className="about-container">
        <div className="about-header">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <div className="about-hero">
            <h1>About Vidyagam</h1>
            <p className="hero-subtitle">Your single source of truth for everything happening in the AI universe</p>
          </div>
        </div>

        <div className="about-content">
          <section className="mission-section">
            <div className="section-icon">
              <Globe size={48} />
            </div>
            <h2>The Need for One Source of Truth</h2>
            <p>
              The artificial intelligence landscape is expanding at breakneck speed. Every day, groundbreaking research emerges from universities, 
              startups announce revolutionary products, tech giants release game-changing models, and policy makers shape the future of AI governance. 
              This information is scattered across hundreds of sources - research papers, tech blogs, news sites, social media, conference proceedings, 
              and industry reports.
            </p>
            <p>
              <strong>The problem?</strong> Staying informed requires monitoring dozens of sources, consuming hours daily, 
              and risking information overload or missing critical developments. Most professionals and enthusiasts resort to fragmented 
              news consumption, leading to incomplete understanding and missed opportunities.
            </p>
          </section>

          <section className="solution-section">
            <div className="section-icon">
              <Zap size={48} />
            </div>
            <h2>Our Unique Solution</h2>
            <div className="features-grid">
              <div className="feature-card">
                <Target size={32} />
                <h3>Intelligent Aggregation</h3>
                <p>Our AI-powered system monitors 500+ sources across research institutions, tech companies, startups, and industry publications, automatically identifying and ranking the most significant developments.</p>
              </div>
              
              <div className="feature-card">
                <Sparkles size={32} />
                <h3>Personalized Intelligence</h3>
                <p>Unlike generic news feeds, we tailor content based on your industry, expertise level, and specific AI interests - from machine learning breakthroughs to business applications.</p>
              </div>
              
              <div className="feature-card">
                <Users size={32} />
                <h3>Expert Curation</h3>
                <p>Each story is analyzed for impact, relevance, and credibility. We don't just aggregate - we curate, ensuring you receive signal, not noise.</p>
              </div>
              
              <div className="feature-card">
                <Shield size={32} />
                <h3>Verified Sources</h3>
                <p>All content is sourced from verified, authoritative sources with proper attribution and links to original publications, ensuring accuracy and credibility.</p>
              </div>
            </div>
          </section>

          <section className="value-prop-section">
            <h2>What Makes Us Different</h2>
            <div className="value-props">
              <div className="value-prop">
                <div className="prop-number">01</div>
                <div className="prop-content">
                  <h3>Comprehensive Coverage</h3>
                  <p>From academic research to industry applications, from ethical considerations to technical breakthroughs - we cover the entire AI ecosystem in one place.</p>
                </div>
              </div>
              
              <div className="value-prop">
                <div className="prop-number">02</div>
                <div className="prop-content">
                  <h3>Smart Personalization</h3>
                  <p>Our algorithms learn from your reading patterns, career background, and expertise level to surface the most relevant content for your professional and personal growth.</p>
                </div>
              </div>
              
              <div className="value-prop">
                <div className="prop-number">03</div>
                <div className="prop-content">
                  <h3>Time Efficiency</h3>
                  <p>Reduce your daily AI news consumption from hours to minutes while staying more informed than ever before.</p>
                </div>
              </div>
              
              <div className="value-prop">
                <div className="prop-number">04</div>
                <div className="prop-content">
                  <h3>Actionable Insights</h3>
                  <p>Beyond just news, we provide context, analysis, and implications to help you make informed decisions and stay ahead in your field.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="audience-section">
            <h2>Built For AI Professionals & Enthusiasts</h2>
            <div className="audience-grid">
              <div className="audience-card">
                <h3>AI Researchers & Scientists</h3>
                <p>Stay current with cutting-edge research, paper releases, and academic breakthroughs across all AI disciplines.</p>
              </div>
              
              <div className="audience-card">
                <h3>Software Engineers & Developers</h3>
                <p>Track new frameworks, tools, APIs, and development practices shaping the future of AI application development.</p>
              </div>
              
              <div className="audience-card">
                <h3>Business Leaders & Product Managers</h3>
                <p>Understand AI trends, market opportunities, competitive landscapes, and strategic implications for business growth.</p>
              </div>
              
              <div className="audience-card">
                <h3>Students & Learners</h3>
                <p>Access beginner-friendly explanations, learning resources, and career guidance in the rapidly evolving AI field.</p>
              </div>
            </div>
          </section>

          <section className="vision-section">
            <div className="vision-content">
              <h2>Our Vision</h2>
              <p>
                To democratize access to AI knowledge and create a global community of informed AI practitioners. 
                We believe that when everyone has access to comprehensive, accurate, and timely AI information, 
                we accelerate innovation, promote responsible development, and ensure AI benefits all of humanity.
              </p>
              
              <div className="cta-section">
                <h3>Join thousands of AI professionals staying ahead</h3>
                <div className="cta-buttons">
                  <Link to="/auth?mode=signup" className="btn btn-primary btn-large">
                    Start Your AI Journey
                  </Link>
                  <Link to="/auth?mode=signin" className="btn btn-ghost btn-large">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;