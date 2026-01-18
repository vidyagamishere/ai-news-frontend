import React, { useState } from 'react';
import { motion, type PanInfo, useAnimation } from 'framer-motion';
import { ExternalLink, Bookmark, Share2, Clock, Heart, MessageCircle } from 'lucide-react';
import { apiService } from '../../services/api';

interface SwipeableNewsCardProps {
  article: {
    id: string;
    title: string;
    summary?: string;
    url: string;
    source_name: string;
    published_date?: string;
    content_type_name: 'BLOGS' | 'VIDEOS' | 'PODCASTS';
    thumbnail_url?: string;
    significance: number;
    category_name: string;
    readTime?: string;
  };
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  onLike?: () => void;
  isLiked?: boolean;
  likesCount?: number;
}

const SwipeableNewsCard: React.FC<SwipeableNewsCardProps> = ({
  article,
  onSwipeLeft,
  onSwipeRight,
  onBookmark,
  isBookmarked = false,
  onLike,
  isLiked = false,
  likesCount = 0
}) => {
  const [exitX, setExitX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      setExitX(1000);
      onSwipeRight?.();
    } else if (info.offset.x < -threshold) {
      setExitX(-1000);
      onSwipeLeft?.();
    } else {
      controls.start({ x: 0, opacity: 1 });
    }
  };

  const getTypeInfo = (content_type_name: string) => {
    switch (content_type_name) {
      case 'VIDEOS':
        return { icon: '🎥', color: '#ef4444', bgColor: '#fee2e2', label: 'Video' };
      case 'PODCASTS':
        return { icon: '🎧', color: '#10b981', bgColor: '#d1fae5', label: 'Podcast' };
      default:
        return { icon: '📰', color: '#3b82f6', bgColor: '#dbeafe', label: 'Article' };
    }
  };

  const typeInfo = getTypeInfo(article.content_type_name);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: 0.95, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      exit={{ x: exitX, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="swipeable-card-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'pan-y',
        userSelect: 'none'
      }}
    >
      <div className="swipeable-card">
        {/* Thumbnail */}
        {article.thumbnail_url && (
          <div className="card-thumbnail">
            <img src={article.thumbnail_url} alt={article.title} />
            <div className="thumbnail-gradient" />
            
            {/* Type Badge */}
            <div 
              className="type-badge"
              style={{
                backgroundColor: typeInfo.bgColor,
                color: typeInfo.color
              }}
            >
              <span>{typeInfo.icon}</span>
              <span>{typeInfo.label}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="card-content">
          {/* source_name & Time */}
          <div className="card-meta">
            <span className="source_name">{article.source_name}</span>
            <span className="separator">•</span>
            <div className="read-time">
              <Clock size={14} />
              <span>{article.readTime || '5 min read'}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="card-title">{article.title}</h3>

          {/* Summary */}
          <p className="card-summary">{article.summary}</p>

          {/* Tags */}
          <div className="card-tags">
            <span className="tag category-tag">{article.category_name}</span>
            <span className="tag significance-tag">
              ⭐ {article.significance}/10
            </span>
          </div>

          {/* Engagement Stats */}
          <div className="engagement-stats">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className={`stat-button ${isLiked ? 'active' : ''}`}
            >
              <Heart size={16} fill={isLiked ? '#ef4444' : 'none'} />
              <span>{likesCount}</span>
            </button>
            <button className="stat-button">
              <MessageCircle size={16} />
              <span>0</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="card-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.();
              }}
              className={`action-btn bookmark-btn ${isBookmarked ? 'active' : ''}`}
            >
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            <button className="action-btn share-btn">
              <Share2 size={18} />
              <span>Share</span>
            </button>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn read-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Track view interaction (only for authenticated users)
                const token = localStorage.getItem('authToken');
                if (token && article.id) {
                  apiService.trackInteraction(article.id, 'view').catch(err => {
                    console.error('Failed to track article view:', err);
                  });
                }
              }}
            >
              <ExternalLink size={18} />
              <span>Read</span>
            </a>
          </div>
        </div>

        {/* Swipe Indicators */}
        <div className="swipe-indicator left">👎</div>
        <div className="swipe-indicator right">💾</div>
      </div>

      {/* Swipe Hint */}
      <div className="swipe-hint">
        ← Swipe to skip • Swipe to save →
      </div>
    </motion.div>
  );
};

export default SwipeableNewsCard;