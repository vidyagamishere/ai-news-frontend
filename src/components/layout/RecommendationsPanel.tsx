import React from 'react';
import '../../styles/recommendations-panel.css';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface TrendingArticle {
  id: number;
  title: string;
  readCount?: number;
  timeAgo: string;
}

interface RecommendationsPanelProps {
  categories: Category[];
  trendingArticles?: TrendingArticle[];
  onCategoryClick: (categoryId: number) => void;
  onTrendingClick?: (articleId: number) => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
  isAuthenticated?: boolean;
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  categories,
  trendingArticles = [],
  onCategoryClick,
  onTrendingClick,
  onSignIn,
  onSignUp,
  isAuthenticated = false
}) => {
  return (
    <div className="recommendations-panel">
      {/* Auth Section - Only show if not authenticated */}
      {!isAuthenticated && (
        <>
          <section className="auth-card">
            <div className="auth-card-icon">🔥</div>
            <h3 className="auth-card-title">Log in or sign up</h3>
            <p className="auth-card-description">
              Join to get personalized AI news, bookmark articles, and access exclusive content.
            </p>
            <button onClick={onSignUp} className="auth-card-btn-primary">
              Get Started
            </button>
            <button onClick={onSignIn} className="auth-card-btn-secondary">
              Sign in
            </button>
          </section>
          <div className="recommendations-divider" />
        </>
      )}
      
      {/* Recommended Categories Section */}
      <section className="recommendations-section">
        <h3 className="recommendations-title">Recommended for you</h3>
        <div className="category-pills">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className="category-pill"
            >
              <span className="category-pill-icon">{category.icon}</span>
              <span className="category-pill-name">{category.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending Today Section */}
      {trendingArticles.length > 0 && (
        <>
          <div className="recommendations-divider" />
          <section className="recommendations-section">
            <h3 className="recommendations-title">Trending in AI</h3>
            <div className="trending-list">
              {trendingArticles.slice(0, 5).map((article, index) => (
                <button
                  key={article.id}
                  onClick={() => onTrendingClick?.(article.id)}
                  className="trending-item"
                >
                  <span className="trending-number">{index + 1}</span>
                  <div className="trending-content">
                    <h4 className="trending-title">{article.title}</h4>
                    <p className="trending-meta">
                      {article.readCount && `${article.readCount} readers • `}
                      {article.timeAgo}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Future: Who to Follow Section */}
      {/* <div className="recommendations-divider" />
      <section className="recommendations-section">
        <h3 className="recommendations-title">Who to follow</h3>
        ...
      </section> */}
    </div>
  );
};

export default RecommendationsPanel;
