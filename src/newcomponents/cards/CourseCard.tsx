import {
  alpha,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Award,
  Bookmark,
  ChevronRight,
  Clock,
  Heart,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareDialog from '../../components/ShareDialog';
import { useAuth } from '../../contexts/AuthContext';
import { ActionTypeId, apiService, SLUG_NAV_ENABLED } from '../../services/api';
import { trackArticleClick } from '../../utils/analytics';
import type { Article } from '../../types/article';

interface CourseCardProps {
  article: Article;
  onLike?: (id: number) => void;
  onBookmark?: (id: number) => void;
  showInteractions?: boolean;
}

const DIFFICULTY_META: Record<string, { color: string; progress: number; label: string }> = {
  Beginner: { color: '#22c55e', progress: 33, label: 'Beginner Friendly' },
  Intermediate: { color: '#f59e0b', progress: 66, label: 'Intermediate' },
  Advanced: { color: '#ef4444', progress: 100, label: 'Advanced' },
};

const renderStars = (rating: number, size = 11) => {
  const filled = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={size}
      style={{
        fill: i < filled ? '#facc15' : 'none',
        color: i < filled ? '#facc15' : 'rgba(255,255,255,0.3)',
      }}
    />
  ));
};

const CourseCard: React.FC<CourseCardProps> = ({
  article,
  onLike,
  onBookmark,
  showInteractions = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [imageError, setImageError] = useState(false);
  const [localLiked, setLocalLiked] = useState(article.is_liked || false);
  const [localBookmarked, setLocalBookmarked] = useState(article.is_bookmarked || false);
  const [localLikesCount, setLocalLikesCount] = useState(article.likes || article.likes_count || 0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const img = article.image || article.imageUrl || article.thumbnail_url;
  const difficulty = article.difficulty as string | undefined;
  const diffMeta = difficulty ? DIFFICULTY_META[difficulty] : null;

  const handleEnroll = () => {
    trackArticleClick(article.title, article.source ?? '', article.category ?? '');
    const url = article.enrollment_url || article.url;
    if (SLUG_NAV_ENABLED && article.slug) {
      navigate(`/article/${article.slug}`);
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    if (article.id) apiService.trackInteraction(String(article.id), 'view').catch(() => { });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/auth'); return; }
    if (!article.id) return;
    try {
      if (localLiked) {
        await apiService.removeInteraction(article.id, ActionTypeId.LIKE);
        setLocalLikesCount(prev => Math.max(0, prev - 1));
        setLocalLiked(false);
      } else {
        await apiService.createInteraction({ article_id: article.id!, action_type_id: ActionTypeId.LIKE });
        setLocalLikesCount(prev => prev + 1);
        setLocalLiked(true);
      }
      onLike?.(Number(article.id));
    } catch { /* silent */ }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/auth'); return; }
    if (!article.id) return;
    try {
      if (localBookmarked) {
        await apiService.removeInteraction(article.id, ActionTypeId.BOOKMARK);
        setLocalBookmarked(false);
      } else {
        await apiService.createInteraction({ article_id: article.id!, action_type_id: ActionTypeId.BOOKMARK });
        setLocalBookmarked(true);
      }
      onBookmark?.(Number(article.id));
    } catch { /* silent */ }
  };

  const overlayGradient = 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)';

  return (
    <>
      <Box
        onClick={handleEnroll}
        sx={{
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          cursor: 'pointer',
          height: { xs: 300, sm: 260 },
          transition: 'all 0.35s cubic-bezier(.4,0,.2,1)',
          '&:hover': {
            transform: 'scale(1.012)',
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.18)}`,
            '& .course-img': { transform: 'scale(1.08)' },
            '& .enroll-arrow': { transform: 'translateX(4px)', opacity: 1 },
          },
        }}
      >
        {/* Background Image */}
        {img && !imageError ? (
          <Box
            className="course-img"
            component="img"
            src={img}
            alt={article.title}
            onError={() => setImageError(true)}
            loading="lazy"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.6s cubic-bezier(.4,0,.2,1)',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.25)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem',
              opacity: 0.5,
            }}
          >
            🎓
          </Box>
        )}

        {/* Gradient Overlay */}
        <Box sx={{ position: 'absolute', inset: 0, background: overlayGradient }} />

        {/* Floating Price — top right */}
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
          {article.is_free ? (
            <Box sx={{
              px: 1.5, py: 0.4, borderRadius: 2,
              bgcolor: 'rgba(34,197,94,0.88)', backdropFilter: 'blur(8px)',
              color: '#fff', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 1,
            }}>
              FREE
            </Box>
          ) : article.price != null ? (
            <Box sx={{
              px: 1.5, py: 0.4, borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              color: '#fff', fontWeight: 800, fontSize: '0.75rem',
            }}>
              ${article.price}
            </Box>
          ) : null}
        </Box>

        {/* Floating Interactions — top left */}
        {showInteractions && (
          <Stack
            direction="row"
            spacing={0.5}
            onClick={(e) => e.stopPropagation()}
            sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}
          >
            <IconButton size="small" onClick={handleBookmark} sx={{
              bgcolor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
              color: localBookmarked ? '#60a5fa' : 'rgba(255,255,255,0.8)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' }, width: 30, height: 30,
            }}>
              <Bookmark size={14} fill={localBookmarked ? 'currentColor' : 'none'} />
            </IconButton>
            <IconButton size="small" onClick={handleLike} sx={{
              bgcolor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
              color: localLiked ? '#f87171' : 'rgba(255,255,255,0.8)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' }, width: 30, height: 30,
            }}>
              <Heart size={14} fill={localLiked ? 'currentColor' : 'none'} />
            </IconButton>
            {localLikesCount > 0 && (
              <Box sx={{
                bgcolor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', borderRadius: 2,
                px: 0.75, display: 'flex', alignItems: 'center',
                color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 600,
              }}>
                {localLikesCount}
              </Box>
            )}
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setShareDialogOpen(true); }} sx={{
              bgcolor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
              color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' }, width: 30, height: 30,
            }}>
              <Share2 size={14} />
            </IconButton>
          </Stack>
        )}

        {/* Bottom Content */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          p: { xs: 2, sm: 2.5 }, zIndex: 1,
          display: 'flex', flexDirection: 'column', gap: 0.6,
        }}>
          {/* Platform + Certificate */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
            {(article.platform || article.provider) && (
              <Typography variant="caption" sx={{
                fontWeight: 700, fontSize: '0.58rem', textTransform: 'uppercase',
                letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)',
              }}>
                {article.platform || article.provider}
              </Typography>
            )}
            {article.has_certificate && (
              <Chip icon={<Award size={9} />} label="Certificate" size="small" sx={{
                height: 17, fontSize: '0.55rem', fontWeight: 600,
                bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)',
                color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)',
                '& .MuiChip-icon': { width: 9, height: 9, color: '#fbbf24' },
              }} />
            )}
          </Stack>

          {/* Title */}
          <Typography sx={{
            fontWeight: 800, fontSize: { xs: '1rem', sm: '1.1rem' }, lineHeight: 1.3,
            color: '#fff', display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}>
            {article.title}
          </Typography>

          {/* Instructor */}
          {article.instructor && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '0.68rem' }}>
              {article.instructor}{article.provider && ` · ${article.provider}`}
            </Typography>
          )}

          {/* Meta Row */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.25 }}>
            {article.rating != null && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{
                  bgcolor: '#facc15', color: '#000', fontWeight: 800, fontSize: '0.62rem',
                  px: 0.65, py: 0.1, borderRadius: 0.6, lineHeight: 1.4,
                }}>
                  {article.rating.toFixed(1)}
                </Box>
                <Stack direction="row" spacing={0}>{renderStars(article.rating)}</Stack>
                {article.num_reviews && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.58rem' }}>
                    ({article.num_reviews.toLocaleString()})
                  </Typography>
                )}
              </Stack>
            )}
            {article.num_students && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <Users size={10} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.58rem' }}>
                  {article.num_students >= 1000 ? `${(article.num_students / 1000).toFixed(0)}k` : article.num_students}
                </Typography>
              </Stack>
            )}
            {(article.duration_hours || article.duration_weeks) && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <Clock size={10} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.58rem' }}>
                  {article.duration_hours ? `${article.duration_hours}h` : `${article.duration_weeks}w`}
                </Typography>
              </Stack>
            )}
            <Box sx={{ ml: 'auto !important' }}>
              <Box className="enroll-arrow" sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                color: '#fff', opacity: 0.6, transition: 'all 0.3s ease',
                fontSize: '0.68rem', fontWeight: 700,
              }}>
                <span>{article.enrollment_open === false ? 'View' : 'Enroll'}</span>
                <ChevronRight size={14} />
              </Box>
            </Box>
          </Stack>

          {/* Difficulty Bar */}
          {diffMeta && (
            <Box sx={{ mt: 0.25 }}>
              <Typography variant="caption" sx={{
                color: diffMeta.color, fontWeight: 600, fontSize: '0.55rem',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {diffMeta.label}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={diffMeta.progress}
                sx={{
                  height: 2.5, borderRadius: 2, mt: 0.25,
                  bgcolor: 'rgba(255,255,255,0.08)',
                  '& .MuiLinearProgress-bar': { bgcolor: diffMeta.color, borderRadius: 2 },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        articleId={typeof article.id === 'number' ? article.id : parseInt(String(article.id))}
        articleUrl={article.url}
        articleTitle={article.title}
        articleSlug={article.slug}
        preferOwnedArticleUrl={false}
        onShareTracked={() => { }}
      />
    </>
  );
};

export default CourseCard;
