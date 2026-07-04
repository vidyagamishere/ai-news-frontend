import React, { useState } from 'react';
import type { Article } from '../../types/article';
import { formatTimeAgo, getArticleSummary, getArticleSource } from '../../types/article';
import { apiService, SLUG_NAV_ENABLED } from '../../services/api';
import { trackArticleClick } from '../../utils/analytics';
import '../../styles/horizontal-card.css';

interface HorizontalArticleCardProps {
  article: Article;
  contentType: string;
  onLike?: (articleId: number) => void;
  onBookmark?: (articleId: number) => void;
  onShare?: (articleId: number) => void;
  showInteractions?: boolean;
}

const HorizontalArticleCard: React.FC<HorizontalArticleCardProps> = ({
  article,
  contentType,
  onLike,
  onBookmark,
  onShare,
  showInteractions = false
}) => {
  const [imageError, setImageError] = useState(false);
  const articleImage = article.image || article.imageUrl || article.thumbnail_url;

  const handleCardClick = () => {
    // Track view interaction (only for authenticated users)
    trackArticleClick(article.title, article.source ?? '', article.category ?? '');
    if (article.id) {
      const token = localStorage.getItem('authToken');
      if (token) {
        const articleId = typeof article.id === 'string' ? article.id : article.id.toString();
        apiService.trackInteraction(articleId, 'view').catch(err => {
          console.error('Failed to track article view:', err);
        });
      }
    }
    if (SLUG_NAV_ENABLED && article.slug) {
      window.location.href = `/article/${article.slug}`;
    } else {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleInteraction = (e: React.MouseEvent, action?: (id: number) => void) => {
    e.stopPropagation();
    if (action && article.id) {
      const id = typeof article.id === 'string' ? parseInt(article.id, 10) : article.id;
      action(id);
    }
  };

  // Calculate read time (rough estimate: 200 words per minute)
  const getReadTime = () => {
    const summary = getArticleSummary(article);
    const wordCount = summary.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 50)); // Adjusted for summary
    return `${readTime} min read`;
  };

  return (
    <article onClick={handleCardClick} className="horizontal-card">
      <div className="horizontal-card-content">
        {/* Publisher/Source Name */}
        <div className="horizontal-card-publisher">
          <span className="publisher-name">{getArticleSource(article)}</span>
        </div>

        {/* Title */}
        <h3 className="horizontal-card-title">{article.title}</h3>

        {/* Summary - Display only if exists */}
        {getArticleSummary(article) && (
          <p className="horizontal-card-summary">
            {getArticleSummary(article)}
          </p>
        )}

        {/* Metadata and Interactions */}
        <div className="horizontal-card-footer">
          {showInteractions ? (
            <div className="horizontal-card-interactions">
              <button
                onClick={(e) => handleInteraction(e, onLike)}
                className="interaction-btn"
                aria-label="Like"
              >
                <span className="interaction-icon">♡</span>
                <span className="interaction-count">{article.likes_count || 0}</span>
              </button>
              
              <button
                onClick={(e) => handleInteraction(e)}
                className="interaction-btn"
                aria-label="Comment"
              >
                <span className="interaction-icon">💬</span>
                <span className="interaction-count">{article.comments_count || 0}</span>
              </button>
              
              <button
                onClick={(e) => handleInteraction(e, onBookmark)}
                className="interaction-btn"
                aria-label="Bookmark"
              >
                <span className="interaction-icon">🔖</span>
              </button>
              
              <button
                onClick={(e) => handleInteraction(e, onShare)}
                className="interaction-btn"
                aria-label="Share"
              >
                <span className="interaction-icon">⋯</span>
              </button>

              <span className="interaction-divider">•</span>
              <span className="read-time">{getReadTime()}</span>
            </div>
          ) : (
            <div className="horizontal-card-meta">
              <span>{formatTimeAgo(article.published_date || null)}</span>
              <span className="meta-divider">•</span>
              <span>{getReadTime()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Image */}
      {articleImage && !imageError && (
        <div className="horizontal-card-image">
          <img
            src={articleImage}
            alt={article.title}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
      )}
    </article>
  );
};

export default HorizontalArticleCard;
