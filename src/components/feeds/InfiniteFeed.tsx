import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeableNewsCard from '../cards/SwipeableNewsCard';
import { Loader2, TrendingUp, Filter, RefreshCw, Sparkles } from 'lucide-react';
import { apiService } from '../../services/api';
import { type Article } from '../../services/api';

// Import the CSS file
import '../../styles/infinite-feed.css';

interface InfiniteFeedProps {
  initialContent?: Article[];
  feedType?: 'personalized' | 'trending' | 'category' | 'following';
  category?: string;
  onArticleAction?: (articleId: string, action: 'like' | 'bookmark' | 'skip' | 'view') => void;
}

interface FeedState {
  articles: Article[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

const InfiniteFeed: React.FC<InfiniteFeedProps> = ({
  initialContent = [],
  feedType = 'personalized',
  category,
  onArticleAction
}) => {
  const [feedState, setFeedState] = useState<FeedState>({
    articles: initialContent,
    page: 1,
    hasMore: true,
    loading: false,
    error: null
  });

  const [viewMode, setViewMode] = useState<'swipe' | 'scroll'>('swipe');
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());
  const [viewedArticles, setViewedArticles] = useState<Set<string>>(new Set());

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // FETCH MORE ARTICLES
  // =====================================================
  const fetchMoreArticles = useCallback(async () => {
    if (feedState.loading || !feedState.hasMore) return;

    setFeedState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let response;

      // Fetch based on feed type using getSwipeableFeed for all cases
      switch (feedType) {
        case 'personalized':
          response = await apiService.getSwipeableFeed({ 
            limit: 20, 
            page: feedState.page,
            feed_type: 'personalized',
            exclude_viewed: true
          });
          break;

        case 'trending':
          response = await apiService.getSwipeableFeed({ 
            limit: 20, 
            page: feedState.page,
            feed_type: 'trending' 
          });
          break;

        case 'category':
          if (category) {
            // ✅ FIXED: Don't pass feed_type when using category
            response = await apiService.getSwipeableFeed({ 
              limit: 20, 
              page: feedState.page,
              category 
            });
          } else {
            throw new Error('Category is required for category feed type');
          }
          break;

        case 'following':
          response = await apiService.getSwipeableFeed({ 
            limit: 20, 
            page: feedState.page,
            feed_type: 'following' 
          });
          break;

        default:
          // ✅ FIXED: Use getSwipeableFeed instead of non-existent getArticles
          response = await apiService.getSwipeableFeed({ 
            limit: 20, 
            page: feedState.page
          });
      }

      const newArticles = response.articles || [];
      const hasMore = response.has_more ?? (newArticles.length >= 20);

      // Filter out duplicates
      const existingIds = new Set(feedState.articles.map(a => a.id));
      const uniqueArticles = newArticles.filter(a => !existingIds.has(a.id));

      setFeedState(prev => ({
        ...prev,
        articles: [...prev.articles, ...uniqueArticles],
        page: prev.page + 1,
        hasMore,
        loading: false
      }));

      // Preload images
      uniqueArticles.forEach(article => {
        if (article.thumbnail_url) {
          const img = new Image();
          img.src = article.thumbnail_url;
        }
      });

    } catch (error) {
      console.error('Error fetching more articles:', error);
      setFeedState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load more articles. Please try again.'
      }));
    }
  }, [feedState.loading, feedState.hasMore, feedState.page, feedState.articles, feedType, category]);

  // =====================================================
  // INFINITE SCROLL OBSERVER
  // =====================================================
  useEffect(() => {
    if (viewMode !== 'scroll') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedState.hasMore && !feedState.loading) {
          fetchMoreArticles();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [viewMode, feedState.hasMore, feedState.loading, fetchMoreArticles]);

  // =====================================================
  // SWIPE MODE - AUTO-LOAD NEXT BATCH
  // =====================================================
  useEffect(() => {
    if (viewMode !== 'swipe') return;

    const articlesLeft = feedState.articles.length - currentSwipeIndex;
    if (articlesLeft <= 5 && feedState.hasMore && !feedState.loading) {
      fetchMoreArticles();
    }
  }, [currentSwipeIndex, feedState.articles.length, feedState.hasMore, feedState.loading, viewMode, fetchMoreArticles]);

  // =====================================================
  // ARTICLE ACTION HANDLERS
  // =====================================================
  // Fix handleSwipeLeft (around line 184-190)
  const handleSwipeLeft = useCallback((article: Article) => {
    const articleId = article.id?.toString() || '';
    setCurrentSwipeIndex(prev => prev + 1);
    onArticleAction?.(articleId, 'skip');
    
    if (article.id) {
      apiService.trackInteraction(article.id.toString(), 'skip').catch(console.error);
    }
  }, [onArticleAction]);

  // Fix handleSwipeRight (around line 192-200)
  const handleSwipeRight = useCallback((article: Article) => {
    const articleId = article.id?.toString() || '';
    setBookmarkedArticles(prev => new Set([...prev, articleId]));
    setCurrentSwipeIndex(prev => prev + 1);
    onArticleAction?.(articleId, 'bookmark');
    
    if (article.id) {
      // ✅ FIXED: Added parentheses ()
      apiService.bookmarkArticle(article.id.toString()).catch(console.error);
      apiService.trackInteraction(article.id.toString(), 'save').catch(console.error);
    }
  }, [onArticleAction]);

  // Fix handleBookmark (around line 202-217)
  const handleBookmark = useCallback((article: Article) => {
    const articleId = article.id?.toString() || '';
    if (!article.id) return;
    
    setBookmarkedArticles(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
        // ✅ FIXED: Added ! non-null assertion
        apiService.removeBookmark(article.id!.toString()).catch(console.error);
      } else {
        next.add(articleId);
        // ✅ FIXED: Added ! non-null assertion
        apiService.bookmarkArticle(article.id!.toString()).catch(console.error);
        onArticleAction?.(articleId, 'bookmark');
      }
      return next;
    });
  }, [onArticleAction]);

  // Fix handleLike (around line 219-236)
  const handleLike = useCallback((article: Article) => {
    const articleId = article.id?.toString() || '';
    if (!article.id) return;
    
    setLikedArticles(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
        // ✅ FIXED: Added ! non-null assertion
        apiService.removeInteraction(article.id!, 'like').catch(console.error);
      } else {
        next.add(articleId);
        // ✅ FIXED: Added ! non-null assertion
        apiService.createInteraction({
          article_id: article.id!,
          interaction_type: 'like'
        }).catch(console.error);
        onArticleAction?.(articleId, 'like');
      }
      return next;
    });
  }, [onArticleAction]);

  // Fix handleArticleView (around line 238-245)
  const handleArticleView = useCallback((article: Article) => {
    const articleId = article.id?.toString() || '';
    if (!article.id || viewedArticles.has(articleId)) return;
    
    setViewedArticles(prev => new Set([...prev, articleId]));
    onArticleAction?.(articleId, 'view');
    // ✅ FIXED: Added ! non-null assertion
    apiService.trackInteraction(article.id!.toString(), 'read').catch(console.error);
  }, [viewedArticles, onArticleAction]);

  const handleRefresh = useCallback(() => {
    setFeedState({
      articles: [],
      page: 1,
      hasMore: true,
      loading: false,
      error: null
    });
    setCurrentSwipeIndex(0);
    fetchMoreArticles();
  }, [fetchMoreArticles]);

  // =====================================================
  // RENDER SWIPE MODE
  // =====================================================
  const renderSwipeMode = () => {
    if (feedState.loading && feedState.articles.length === 0) {
      return (
        <div className="infinite-feed-loading">
          <Loader2 className="infinite-feed-spinner" size={40} />
          <p>Loading your personalized feed...</p>
        </div>
      );
    }

    const currentArticle = feedState.articles[currentSwipeIndex];

    if (!currentArticle) {
      return (
        <div className="infinite-feed-empty">
          <TrendingUp size={64} className="infinite-feed-empty-icon" />
          <h3>You're All Caught Up! 🎉</h3>
          <p>You've seen all available articles. Check back later for fresh content!</p>
          <button onClick={handleRefresh} className="infinite-feed-refresh-btn">
            <RefreshCw size={18} />
            Refresh Feed
          </button>
        </div>
      );
    }

    const articleId = currentArticle.id?.toString() || '';

    return (
      <div className="infinite-feed-swipe-container">
        <div className="infinite-feed-progress">
          <div className="infinite-feed-progress-info">
            <span className="infinite-feed-progress-text">
              {currentSwipeIndex + 1} / {feedState.articles.length}
            </span>
            {feedState.hasMore && (
              <span className="infinite-feed-more-badge">
                <Sparkles size={14} />
                More coming
              </span>
            )}
          </div>
        </div>

        <div className="infinite-feed-progress-bar-container">
          <motion.div
            className="infinite-feed-progress-bar"
            initial={{ width: 0 }}
            animate={{ 
              width: `${((currentSwipeIndex + 1) / feedState.articles.length) * 100}%` 
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSwipeIndex}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <SwipeableNewsCard
              article={{
                id: articleId,
                title: currentArticle.title,
                summary: currentArticle.summary,
                url: currentArticle.url,
                source_name: currentArticle.source_name || currentArticle.source,
                published_date: currentArticle.published_date || currentArticle.time,
                content_type_name: (currentArticle.content_type_name || currentArticle.type || 'BLOGS') as any,
                thumbnail_url: currentArticle.thumbnail_url,
                significance: currentArticle.significance || currentArticle.significance_score || 5,
                category_name: currentArticle.category_name || currentArticle.category || 'AI News',
                readTime: currentArticle.read_time || '5 min'
              }}
              onSwipeLeft={() => handleSwipeLeft(currentArticle)}
              onSwipeRight={() => handleSwipeRight(currentArticle)}
              onBookmark={() => handleBookmark(currentArticle)}
              isBookmarked={bookmarkedArticles.has(articleId)}
              onLike={() => handleLike(currentArticle)}
              isLiked={likedArticles.has(articleId)}
              likesCount={currentArticle.likes_count || 0}
            />
          </motion.div>
        </AnimatePresence>

        <div className="infinite-feed-navigation">
          <button
            onClick={() => handleSwipeLeft(currentArticle)}
            disabled={currentSwipeIndex >= feedState.articles.length - 1}
            className="infinite-feed-nav-btn infinite-feed-skip-btn"
          >
            Skip →
          </button>
          <button
            onClick={() => handleSwipeRight(currentArticle)}
            disabled={currentSwipeIndex >= feedState.articles.length - 1}
            className="infinite-feed-nav-btn infinite-feed-save-btn"
          >
            💾 Save
          </button>
        </div>

        {feedState.loading && (
          <div className="infinite-feed-loading-next">
            <Loader2 className="infinite-feed-spinner-small" size={20} />
            <span>Loading more...</span>
          </div>
        )}
      </div>
    );
  };

  // =====================================================
  // RENDER SCROLL MODE
  // =====================================================
  const renderScrollMode = () => {
    return (
      <div className="infinite-feed-scroll-container">
        <div className="infinite-feed-articles-grid">
          {feedState.articles.map((article, index) => {
            const articleId = article.id?.toString() || index.toString();
            
            return (
              <motion.div
                key={articleId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onViewportEnter={() => handleArticleView(article)}
              >
                <SwipeableNewsCard
                  article={{
                    id: articleId,
                    title: article.title,
                    summary: article.summary || article.description || article.content_summary,  // ✅ Use "article"
                    url: article.url,                            // ✅ Use "article"
                    source_name: article.source_name || article.source,  // ✅ Use "article"
                    published_date: article.published_date || article.time,  // ✅ Use "article"
                    content_type_name: (article.content_type_name || article.type || 'BLOGS') as any,  // ✅ Use "article"
                    thumbnail_url: article.thumbnail_url || article.imageUrl,  // ✅ Use "article"
                    significance: article.significance || article.significance_score || 5,  // ✅ Use "article"
                    category_name: article.category_name || article.category || 'AI News',  // ✅ Use "article"
                    readTime: article.read_time || '5 min'        // ✅ Use "article"
                  }}
                  onBookmark={() => handleBookmark(article)}
                  isBookmarked={bookmarkedArticles.has(articleId)}
                  onLike={() => handleLike(article)}
                  isLiked={likedArticles.has(articleId)}
                  likesCount={article.likes_count || 0}
                />
              </motion.div>
            );
          })}
        </div>

        <div ref={loadMoreRef} className="infinite-feed-load-trigger">
          {feedState.loading && (
            <div className="infinite-feed-loading-more">
              <Loader2 className="infinite-feed-spinner" size={32} />
              <p>Loading more articles...</p>
            </div>
          )}
          {feedState.error && (
            <div className="infinite-feed-error">
              <p>{feedState.error}</p>
              <button onClick={fetchMoreArticles} className="infinite-feed-retry-btn">
                Retry
              </button>
            </div>
          )}
          {!feedState.hasMore && feedState.articles.length > 0 && (
            <div className="infinite-feed-end">
              <p>🎉 You've reached the end!</p>
              <button onClick={handleRefresh} className="infinite-feed-refresh-btn">
                <RefreshCw size={18} />
                Refresh Feed
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================
  return (
    <div className="infinite-feed-container">
      <div className="infinite-feed-view-toggle">
        <button
          onClick={() => setViewMode('swipe')}
          className={`infinite-feed-mode-btn ${viewMode === 'swipe' ? 'active' : ''}`}
        >
          📱 Swipe Mode
        </button>
        <button
          onClick={() => setViewMode('scroll')}
          className={`infinite-feed-mode-btn ${viewMode === 'scroll' ? 'active' : ''}`}
        >
          📜 Scroll Mode
        </button>
      </div>

      {viewMode === 'swipe' ? renderSwipeMode() : renderScrollMode()}
    </div>
  );
};

export default InfiniteFeed;