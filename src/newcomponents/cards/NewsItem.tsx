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
import InlineComments from '../../components/InlineComments';
import ShareDialog from '../../components/ShareDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const articleImage = article.image || article.imageUrl || article.thumbnail_url;
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(article.likes || article.likes_count || 0);
  const [localBookmarksCount, setLocalBookmarksCount] = useState(article.bookmarks || article.bookmarks_count || 0);
  const [localCommentsCount, setLocalCommentsCount] = useState(article.comments || article.comments_count || 0);
  const [localSharesCount, setLocalSharesCount] = useState(article.shares || article.share_count || 0);
  const [localLiked, setLocalLiked] = useState(article.is_liked || false);
  const [localBookmarked, setLocalBookmarked] = useState(article.is_bookmarked || false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Track view interaction (works for both authenticated and anonymous users)
    console.log('🖱️ Article clicked:', { id: article.id, url: article.url, title: article.title });
    // Open URL first (this is the main action)
    if (article.url && article.url !== '#') {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    } else {
      console.error('❌ No valid URL for article:', article);
      return;
    }
    if (article.id) {
      const articleId = String(article.id);  // Convert to string
      apiService.trackInteraction(articleId, 'view').catch(err => {
        console.error('Failed to track article view:', err);
      });
    }
  };

// Replace existing handleLike/handleBookmark with these (around line 65-110):
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    try {
      if (!article.id) return;
      if (localLiked) {
        await apiService.removeInteraction(article.id, ActionTypeId.LIKE);
        setLocalLikesCount(prev => Math.max(0, prev - 1));
        setLocalLiked(false);
      } else {
        await apiService.createInteraction({
          article_id: article.id!,
          action_type_id: ActionTypeId.LIKE
        });
        setLocalLikesCount(prev => prev + 1);
        setLocalLiked(true);
      }
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    try {
      if (!article.id) return;
      if (localBookmarked) {
        await apiService.removeInteraction(article.id, ActionTypeId.BOOKMARK);
        setLocalBookmarksCount(prev => Math.max(0, prev - 1));
        setLocalBookmarked(false);
      } else {
        await apiService.createInteraction({
          article_id: article.id,
          action_type_id: ActionTypeId.BOOKMARK
        });
        setLocalBookmarksCount(prev => prev + 1);
        setLocalBookmarked(true);
      }
    } catch (error) {
      console.error('Bookmark failed:', error);
    }
  };

  const handleComment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setCommentDialogOpen(true);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareDialogOpen(true);
  };

// Track view when article card is rendered (optional)
  useEffect(() => {
    if (!article.id) return;  // Add this line
    const trackView = async () => {
      try {
        await apiService.createInteraction({
          article_id: article.id!,
          action_type_id: ActionTypeId.VIEW  // Use ID instead of 'view'
        });
      } catch (err) {
        // Silent fail for view tracking
      }
    };
    
    // Track after 2 seconds of viewing
    const timer = setTimeout(trackView, 2000);
    return () => clearTimeout(timer);
  }, [article.id]);  

  // Calculate read time (rough estimate: 200 words per minute)
  const getReadTime = () => {
    const summary = getArticleSummary(article);
    const wordCount = summary.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 50));
    return `${readTime} min read`;
  };

  return (
  <>
    <Box
      onClick={handleCardClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
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
                onClick={handleLike}
                sx={{
                  color: localLiked ? 'error.main' : 'text.secondary',
                  '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                }}
              >
                <Heart size={18} fill={localLiked ? 'currentColor' : 'none'} />
                {localLikesCount > 0 && (
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {localLikesCount}
                  </Typography>
                )}
              </IconButton>

              <IconButton
                size="small"
                onClick={handleComment}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <MessageCircle size={18} />
                {localCommentsCount > 0 && (
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {localCommentsCount}
                  </Typography>
                )}
              </IconButton>

              <IconButton
                size="small"
                onClick={handleBookmark}
                sx={{
                  color: localBookmarked ? 'primary.main' : 'text.secondary',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <Bookmark size={18} fill={localBookmarked ? 'currentColor' : 'none'} />
              </IconButton>

              <IconButton
                size="small"
                onClick={handleShare}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <Share2 size={18} />
                {localSharesCount > 0 && (
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {localSharesCount}
                  </Typography>
                )}
              </IconButton>

              <Box sx={{ mx: 1, color: 'text.disabled' }}>•</Box>
              <Typography variant="caption" color="text.secondary">{getReadTime()}</Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(article.published_date || null)}
              </Typography>
              <Box sx={{ color: 'text.disabled' }}>•</Box>
              <Typography variant="caption" color="text.secondary">
                {getReadTime()}
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Thumbnail Image */}
      {articleImage && !imageError && (
        <Box
          component="img"
          sx={{
            width: { xs: 60, sm: 80 },
            height: { xs: 60, sm: 80 },
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
          {/* Add at the end, before closing return */}
    <InlineComments
      open={commentDialogOpen}
      onClose={() => {
        setCommentDialogOpen(false);
      }}
      articleId={typeof article.id === 'number' ? article.id : parseInt(String(article.id))}
      onCommentAdded={() => setLocalCommentsCount(prev => prev + 1)}
    />

    <ShareDialog
      open={shareDialogOpen}
      onClose={() => setShareDialogOpen(false)}
      articleId={typeof article.id === 'number' ? article.id : parseInt(String(article.id))}
      articleUrl={article.url}
      articleTitle={article.title}
      onShareTracked={() => {
        setLocalSharesCount(prev => prev + 1);
      }}
    />
  </>    
  );
};

export default NewsItem;
