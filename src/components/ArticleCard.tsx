import React from 'react';
import { ExternalLink, Clock, Star, Play, Headphones } from 'lucide-react';
import type { Article } from '../services/api';
import SmartImage from './SmartImage';
import TopicLabels from './TopicLabels';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'impact-high';
      case 'medium': return 'impact-medium';
      case 'low': return 'impact-low';
      default: return 'impact-medium';
    }
  };

  const getTypeIcon = () => {
    switch (article.type) {
      case 'video':
        return <Play className="type-icon" />;
      case 'audio':
        return <Headphones className="type-icon" />;
      default:
        return null;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`article-card ${article.type}`}>
      {article.type === 'video' && article.thumbnail_url && (
        <div className="article-thumbnail-container">
          <SmartImage
            src={article.thumbnail_url}
            alt={article.title}
            className="article-thumbnail-smart"
            fallbackType="placeholder"
            aspectRatio="16/9"
            maxWidth="400px"
            lazy={true}
          />
          <div className="play-overlay">
            <Play />
          </div>
          {article.duration && (
            <div className="duration">{formatDuration(article.duration)}</div>
          )}
        </div>
      )}
      
      <div className="article-content">
        <div className="article-header">
          <div className="article-meta">
            <span className="source">{article.source}</span>
            <span className="separator">•</span>
            <span className="time">
              <Clock className="time-icon" />
              {article.time}
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
            <div className={`impact-badge ${getImpactColor(article.impact)}`}>
              <Star className="star-icon" />
              <span>{article.significanceScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        <h3 className="article-title">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="article-link"
          >
            {article.title}
            <ExternalLink className="external-icon" />
          </a>
        </h3>
        
        <p className="article-description">
          {article.content_summary || article.description}
          {article.content_summary && (
            <span className="llm-summary-badge" title="AI-generated summary">🤖</span>
          )}
        </p>
        
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