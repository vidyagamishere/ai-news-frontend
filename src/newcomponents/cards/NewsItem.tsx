import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  IconButton,
  Chip,
  Stack,
  alpha,
  useTheme
} from '@mui/material';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Clock
} from 'lucide-react';
import type { Article } from '../../types/article';
import { formatTimeAgo, getArticleSummary, getArticleSource } from '../../types/article';
import { apiService, ActionTypeId } from '../../services/api';

interface NewsItemProps {
  article: Article;
  contentType: string;
  onLike?: (articleId: number) => void;
  onBookmark?: (articleId: number) => void;
  onShare?: (articleId: number) => void;
  showInteractions?: boolean;
}

const NewsItem: React.FC<NewsItemProps> = ({
  article,
  contentType,
  onLike,
  onBookmark,
  onShare,
  showInteractions = false
}) => {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const articleImage = article.image || article.imageUrl || article.thumbnail_url;

  const handleCardClick = () => {
    // Track view interaction (works for both authenticated and anonymous users)
    if (article.id) {
      const articleId = typeof article.id === 'string' ? article.id : article.id.toString();
      apiService.trackInteraction(articleId, ActionTypeId.View).catch(err => {
        console.error('Failed to track article view:', err);
      });
    }
    
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleInteraction = (e: React.MouseEvent, action?: (id: number) => void, toggleState?: () => void) => {
    e.stopPropagation();
    if (toggleState) toggleState();
    if (action && article.id) {
      const id = typeof article.id === 'string' ? parseInt(article.id, 10) : article.id;
      action(id);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      if (localLiked) {
        await apiService.removeInteraction(article.id, ActionTypeId.LIKE);  // Use ID
        setLocalLikesCount(prev => Math.max(0, prev - 1));
        setLocalLiked(false);
      } else {
        await apiService.createInteraction({
          article_id: article.id,
          action_type_id: ActionTypeId.LIKE  // Use ID instead of 'like'
        });
        setLocalLikesCount(prev => prev + 1);
        setLocalLiked(true);
      }
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

// ✅ UPDATED: Bookmark handler
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      if (localBookmarked) {
        await apiService.removeInteraction(article.id, ActionTypeId.BOOKMARK);  // Use ID
        setLocalBookmarked(false);
      } else {
        await apiService.createInteraction({
          article_id: article.id,
          action_type_id: ActionTypeId.BOOKMARK  // Use ID instead of 'bookmark'
        });
        setLocalBookmarked(true);
      }
    } catch (error) {
      console.error('Bookmark failed:', error);
    }
  };

// Track view when article card is rendered (optional)
  useEffect(() => {
    const trackView = async () => {
      try {
        await apiService.createInteraction({
          article_id: article.id,
          action_type_id: ActionTypeId.VIEW  // Use ID instead of 'view'
        });
      } catch (err) {
        // Silent fail for view tracking
      }
    };
    
    // Track after 2 seconds of viewing
    const timer = setTimeout(trackView, 2000);
    return () => clearTimeout(timer);
  }, [article.id, apiService]);  

  // Calculate read time (rough estimate: 200 words per minute)
  const getReadTime = () => {
    const summary = getArticleSummary(article);
    const wordCount = summary.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 50));
    return `${readTime} min read`;
  };

  return (
    <Box
      onClick={handleCardClick}
      sx={{
        display: 'flex',
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        py: 2,
        '&:hover': {
          '& .article-title': {
            color: 'primary.main'
          }
        }
      }}
    >
      <Box sx={{ flex: 1, pr: 2 }}>
        {/* Publisher/Source Name */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: '0.625rem',
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {getArticleSource(article)}
          </Typography>
        </Stack>

        {/* Title */}
        <Typography
          variant="h6"
          component="h3"
          className="article-title"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1rem', sm: '1.5rem' },
            lineHeight: 1.4,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'text.primary',
            transition: 'color 0.2s ease'
          }}
        >
          {article.title}
        </Typography>

        {/* Summary - Display only if exists */}
        {getArticleSummary(article) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6
            }}
          >
            {getArticleSummary(article)}
          </Typography>
        )}

        {/* Metadata and Interactions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {showInteractions ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                size="small"
                onClick={(e) => handleInteraction(e, onLike, () => setLiked(!liked))}
                sx={{
                  color: liked ? 'error.main' : 'text.secondary',
                  '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                }}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              </IconButton>
              <Typography variant="caption" color="text.secondary">
                {(article.likes_count || 0) + (liked ? 1 : 0)}
              </Typography>

              <IconButton
                size="small"
                onClick={(e) => handleInteraction(e)}
                sx={{
                  color: 'text.secondary',
                  ml: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <MessageCircle size={16} />
              </IconButton>
              <Typography variant="caption" color="text.secondary">
                {article.comments_count || 0}
              </Typography>

              <IconButton
                size="small"
                onClick={(e) => handleInteraction(e, onBookmark, () => setBookmarked(!bookmarked))}
                sx={{
                  color: bookmarked ? 'primary.main' : 'text.secondary',
                  ml: 1,
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
              </IconButton>

              <IconButton
                size="small"
                onClick={(e) => handleInteraction(e, onShare)}
                sx={{
                  color: 'text.secondary',
                  ml: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <Share2 size={16} />
              </IconButton>

              <Box sx={{ mx: 1, color: 'text.disabled' }}>•</Box>
              <Chip
                icon={<Clock size={12} />}
                label={getReadTime()}
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(article.published_date || null)}
              </Typography>
              <Box sx={{ color: 'text.disabled' }}>•</Box>
              <Chip
                icon={<Clock size={12} />}
                label={getReadTime()}
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            </Stack>
          )}
        </Box>
      </Box>

      {/* Thumbnail Image */}
      {articleImage && !imageError && (
        <Box
          component="img"
          sx={{
            width: { xs: 60, sm: 100 },
            height: { xs: 60, sm: 100 },
            objectFit: 'cover',
            flexShrink: 0,
            borderRadius: 1
          }}
          src={articleImage}
          alt={article.title}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}
    </Box>
  );
};

export default NewsItem;
