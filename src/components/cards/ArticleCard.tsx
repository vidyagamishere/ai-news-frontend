import React from 'react';
import { ExternalLink, Clock, Star, Play, Headphones, BookOpen, Users, Award, DollarSign } from 'lucide-react';
import type { 
  Article
} from '../../types/article';
import { 
  getContentTypeInfo,
  formatTimeAgo,
  formatDuration,
  getArticleSummary
} from '../../types/article';
import SmartImage from '../SmartImage';
import TopicLabels from '../TopicLabels';
import { apiService } from '../../services/api';
import '../../styles/article-card.css';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {

  const isCourse = 
      article.content_type_name === 'Courses' || 
      article.content_type === 'course' ||
      article.type === 'course' ||
      article.instructor !== undefined;  
  
      const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'impact-high';
      case 'medium': return 'impact-medium';
      case 'low': return 'impact-low';
      default: return 'impact-medium';
    }
  };

  const typeInfo = getContentTypeInfo(article.type || 'article');

  const getTypeIcon = () => {
    switch (article.type) {
      case 'video':
        return <Play className="type-icon" />;
      case 'audio':
        return <Headphones className="type-icon" />;
      case 'course':  // ✅ ADD course icon
        return <BookOpen className="type-icon" />;
      default:
        return null;
    }
  };

  const handleArticleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Track view interaction (only for authenticated users)
    if (article.id) {
      const token = localStorage.getItem('authToken');
      if (token) {
        const articleId = typeof article.id === 'string' ? article.id : article.id.toString();
        apiService.trackInteraction(articleId, 'view').catch(err => {
          console.error('Failed to track article view:', err);
        });
      }
    }
  };

  const renderCourseMetadata = () => {
    if (!isCourse) return null;

    return (
      <div className="course-metadata">
        {/* Instructor */}
        {article.instructor && (
          <div className="course-meta-item">
            <span className="icon">👨‍🏫</span>
            <span className="text">{article.instructor}</span>
          </div>
        )}

        {/* Rating and Students */}
        <div className="course-stats">
          {article.rating && (
            <div className="course-stat">
              <Star className="star-icon filled" size={16} />
              <span className="rating">{article.rating.toFixed(1)}</span>
              {article.num_reviews && (
                <span className="reviews">({article.num_reviews.toLocaleString()})</span>
              )}
            </div>
          )}
          {article.num_students && (
            <div className="course-stat">
              <Users size={16} />
              <span>{article.num_students.toLocaleString()} students</span>
            </div>
          )}
        </div>

        {/* Course Tags */}
        <div className="course-tags">
          {article.difficulty && (
            <span className={`tag difficulty-${article.difficulty.toLowerCase()}`}>
              {article.difficulty}
            </span>
          )}
          {article.duration_hours && (
            <span className="tag duration">
              <Clock size={12} />
              {article.duration_hours}h
            </span>
          )}
          {article.has_certificate && (
            <span className="tag certificate">
              <Award size={12} />
              Certificate
            </span>
          )}
          {article.is_free ? (
            <span className="tag free">🆓 Free</span>
          ) : article.price !== undefined && (
            <span className="tag price">
              <DollarSign size={12} />
              {article.price}
            </span>
          )}
        </div>

        {/* Topics Covered */}
        {article.topics_covered && article.topics_covered.length > 0 && (
          <div className="course-topics">
            <div className="topics-header">
              <BookOpen size={14} />
              <span>Topics:</span>
            </div>
            <div className="topics-list">
              {article.topics_covered.slice(0, 4).map((topic, idx) => (
                <span key={idx} className="topic-tag">{topic}</span>
              ))}
              {article.topics_covered.length > 4 && (
                <span className="topic-tag more">+{article.topics_covered.length - 4} more</span>
              )}
            </div>
          </div>
        )}

        {/* Learning Outcomes */}
        {article.learning_outcomes && article.learning_outcomes.length > 0 && (
          <div className="course-outcomes">
            <div className="outcomes-header">🎯 What You'll Learn:</div>
            <ul className="outcomes-list">
              {article.learning_outcomes.slice(0, 3).map((outcome, idx) => (
                <li key={idx}>{outcome}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className={`article-card ${article.type} ${isCourse ? 'course-card' : ''}`}>
      {/* Thumbnail for videos and courses */}
      {(article.type === 'video' || isCourse) && (article.thumbnail_url || article.image_url) && (
        <div className="article-thumbnail-container">
          <SmartImage
            src={article.thumbnail_url || article.image_url || ''}
            alt={article.title}
            className="article-thumbnail-smart"
            fallbackType="placeholder"
            aspectRatio="16/9"
            maxWidth="400px"
            lazy={true}
          />
          {article.type === 'video' && (
            <div className="play-overlay">
              <Play />
            </div>
          )}
          {/* Platform badge for courses */}
          {isCourse && article.platform && (
            <div className="platform-badge">{article.platform}</div>
          )}
          {article.duration && (
            <div className="duration">{formatDuration(article.duration)}</div>
          )}
        </div>
      )}
      
      <div className="article-content">
        <div className="article-header">
          <div className="article-meta">
            <span className="source">{article.source || article.platform}</span>
            <span className="separator">•</span>
            <span className="time">
              <Clock className="time-icon" />
              {formatTimeAgo(article.published_date || article.time)}
            </span>
            {article.duration && article.type === 'audio' && (
              <>
                <span className="separator">•</span>
                <span className="duration">{formatDuration(article.duration)}</span>
              </>
            )}
          </div>
          
          <div className="article-indicators">
            {getTypeIcon()}
            <div className={`impact-badge ${getImpactColor(article.impact || 'medium')}`}>
              <Star className="star-icon" />
              <span>{article.significanceScore?.toFixed(1) || '—'}</span>
            </div>
          </div>
        </div>
        
        <h3 className="article-title">
          <a 
            href={isCourse && article.enrollment_url ? article.enrollment_url : article.url}
            target="_blank" 
            rel="noopener noreferrer"
            className="article-link"
            onClick={handleArticleClick}
          >
            {article.title}
            <ExternalLink className="external-icon" />
          </a>
        </h3>
        
        <p className="article-description">
          {getArticleSummary(article)}
          {article.content_summary && (
            <span className="llm-summary-badge" title="AI-generated summary">🤖</span>
          )}
        </p>

        {/* ✅ ADD: Course-specific metadata section */}
        {isCourse && renderCourseMetadata()}
        
        <div className="article-footer">
          <div className="article-footer-meta">
            <span className="read-time">{article.readTime}</span>
            {article.rankingScore && (
              <span className="ranking-score">
                Ranking: {article.rankingScore.toFixed(1)}
              </span>
            )}
          </div>
          <TopicLabels 
            topics={article.topics}
            topic_names={article.topic_names}
            topic_categories={article.topic_categories}
            maxTopics={3}
            size="small"
          />
        </div>
      </div>
      
      {article.type === 'audio' && article.audio_url && (
        <div className="audio-player">
          <audio controls>
            <source src={article.audio_url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default ArticleCard;