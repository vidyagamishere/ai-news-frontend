import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeableNewsCard from '../cards/SwipeableNewsCard';
import { RefreshCw, Filter, TrendingUp, Loader2 } from 'lucide-react';

interface SwipeableFeedProps {
  content: any[];
  onRefresh?: () => void;
  loading?: boolean;
  onArticleAction?: (articleId: string, action: 'like' | 'bookmark' | 'skip') => void;
}

const SwipeableFeed: React.FC<SwipeableFeedProps> = ({ 
  content, 
  onRefresh, 
  loading,
  onArticleAction 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());

  const currentArticle = content[currentIndex];

  const handleSwipeLeft = () => {
    setDirection(-1);
    const nextIndex = Math.min(currentIndex + 1, content.length - 1);
    setCurrentIndex(nextIndex);
    if (currentArticle) {
      onArticleAction?.(currentArticle.id?.toString(), 'skip');
    }
  };

  const handleSwipeRight = () => {
    setDirection(1);
    const nextIndex = Math.min(currentIndex + 1, content.length - 1);
    if (currentArticle) {
      const articleId = currentArticle.id?.toString();
      setBookmarkedArticles(prev => new Set([...prev, articleId]));
      onArticleAction?.(articleId, 'bookmark');
    }
    setCurrentIndex(nextIndex);
  };

  const handleBookmark = () => {
    if (!currentArticle) return;
    const articleId = currentArticle.id?.toString();
    setBookmarkedArticles(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
        onArticleAction?.(articleId, 'bookmark');
      }
      return next;
    });
  };

  const handleLike = () => {
    if (!currentArticle) return;
    const articleId = currentArticle.id?.toString();
    setLikedArticles(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
        onArticleAction?.(articleId, 'like');
      }
      return next;
    });
  };

  const handleRefresh = () => {
    setCurrentIndex(0);
    setBookmarkedArticles(new Set());
    setLikedArticles(new Set());
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className="feed-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading fresh content...</p>
      </div>
    );
  }

  if (!currentArticle) {
    return (
      <div className="feed-empty">
        <TrendingUp size={64} className="empty-icon" />
        <h3>You're All Caught Up! 🎉</h3>
        <p>No more articles in your feed. Check back later for fresh content!</p>
        <button onClick={handleRefresh} className="refresh-btn">
          <RefreshCw size={18} />
          Refresh Feed
        </button>
      </div>
    );
  }

  const articleId = currentArticle.id?.toString();
  const isBookmarked = bookmarkedArticles.has(articleId);
  const isLiked = likedArticles.has(articleId);

  return (
    <div className="swipeable-feed">
      {/* Progress Indicator */}
      <div className="feed-progress">
        <span className="progress-text">
          {currentIndex + 1} / {content.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <motion.div
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / content.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card Stack */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          initial={{ x: direction > 0 ? 1000 : -1000, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? -1000 : 1000, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <SwipeableNewsCard
            article={{
              id: articleId,
              title: currentArticle.title,
              summary: currentArticle.summary || currentArticle.description || currentArticle.content_summary,
              url: currentArticle.url || currentArticle.sourceLink,                    // ✅ Correct property
              source_name: currentArticle.source_name || currentArticle.source || currentArticle.publisher,  // ✅ Correct
              published_date: currentArticle.published_date || currentArticle.time || currentArticle.publishDate,  // ✅ Correct
              content_type_name: (currentArticle.content_type_name || currentArticle.type || 'BLOGS') as any,  // ✅ Correct
              thumbnail_url: currentArticle.thumbnail_url || currentArticle.imageUrl,
              significance: currentArticle.significanceScore || currentArticle.significance || 5,
              category_name: currentArticle.category_name || currentArticle.category || 'AI News',  // ✅ Correct
              readTime: currentArticle.readTime || '5 min'
            }}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onBookmark={handleBookmark}
            isBookmarked={isBookmarked}
            onLike={handleLike}
            isLiked={isLiked}
            likesCount={0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons (for desktop/tablet) */}
      <div className="feed-navigation">
        <button
          onClick={handleSwipeLeft}
          disabled={currentIndex >= content.length - 1}
          className="nav-btn skip-btn"
        >
          Skip →
        </button>
        <button
          onClick={handleSwipeRight}
          disabled={currentIndex >= content.length - 1}
          className="nav-btn save-btn"
        >
          💾 Save
        </button>
      </div>
    </div>
  );
};

export default SwipeableFeed;