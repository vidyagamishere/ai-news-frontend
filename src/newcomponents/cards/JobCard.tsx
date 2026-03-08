import {
  alpha,
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ArrowUpRight,
  Bookmark,
  Briefcase,
  DollarSign,
  Globe,
  Heart,
  MapPin,
  Share2,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareDialog from '../../components/ShareDialog';
import { useAuth } from '../../contexts/AuthContext';
import { ActionTypeId, apiService } from '../../services/api';
import type { Article } from '../../types/article';
import { formatTimeAgo } from '../../types/article';

interface JobCardProps {
  article: Article;
  onLike?: (id: number) => void;
  onBookmark?: (id: number) => void;
  showInteractions?: boolean;
}

// Gradient accent bars keyed by seniority
const LEVEL_ACCENTS: Record<string, string> = {
  Junior: 'linear-gradient(180deg, #22c55e, #16a34a)',
  Mid: 'linear-gradient(180deg, #3b82f6, #2563eb)',
  Senior: 'linear-gradient(180deg, #f59e0b, #d97706)',
  Lead: 'linear-gradient(180deg, #a855f7, #7c3aed)',
  Staff: 'linear-gradient(180deg, #a855f7, #7c3aed)',
  Principal: 'linear-gradient(180deg, #ec4899, #db2777)',
  Director: 'linear-gradient(180deg, #ef4444, #dc2626)',
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isNewJob(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff < 3 * 24 * 60 * 60 * 1000; // 3 days
  } catch { return false; }
}

const JobCard: React.FC<JobCardProps> = ({
  article,
  onLike,
  onBookmark,
  showInteractions = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [localLiked, setLocalLiked] = useState(article.is_liked || false);
  const [localBookmarked, setLocalBookmarked] = useState(article.is_bookmarked || false);
  const [localLikesCount, setLocalLikesCount] = useState(article.likes || article.likes_count || 0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const company = article.company || article.metadata?.company || article.source_name || article.source;
  const jobTitle = article.job_title || article.metadata?.job_title || article.title;
  const location = article.job_location || article.metadata?.job_location;
  const isRemote = article.is_remote ?? article.metadata?.is_remote;
  const jobType = article.job_type || article.metadata?.job_type;
  const salaryRange = article.salary_range || article.metadata?.salary_range;
  const experienceLevel = article.experience_level || article.metadata?.experience_level;
  const skills: string[] = article.skills_required || article.metadata?.skills_required || [];
  const applyUrl = article.application_url || article.url;
  const isNew = isNewJob(article.published_date || article.time);

  const levelKey = Object.keys(LEVEL_ACCENTS).find((k) =>
    experienceLevel?.toLowerCase().includes(k.toLowerCase())
  );
  const accentGradient = levelKey
    ? LEVEL_ACCENTS[levelKey]
    : 'linear-gradient(180deg, #64748b, #475569)';

  const handleApply = () => {
    if (applyUrl) window.open(applyUrl, '_blank', 'noopener,noreferrer');
    if (article.id) apiService.trackInteraction(String(article.id), 'view').catch(() => { });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/auth'); return; }
    if (!article.id) return;
    try {
      if (localLiked) {
        await apiService.removeInteraction(article.id, ActionTypeId.LIKE);
        setLocalLikesCount((prev) => Math.max(0, prev - 1));
        setLocalLiked(false);
      } else {
        await apiService.createInteraction({ article_id: article.id!, action_type_id: ActionTypeId.LIKE });
        setLocalLikesCount((prev) => prev + 1);
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

  return (
    <>
      <Box
        onClick={handleApply}
        sx={{
          display: 'flex',
          borderRadius: 3,
          overflow: 'hidden',
          cursor: 'pointer',
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'background.paper',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
          '&:hover': {
            transform: 'translateX(4px)',
            boxShadow: isDark
              ? `0 8px 30px rgba(0,0,0,0.4)`
              : `0 8px 30px rgba(0,0,0,0.08)`,
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            '& .apply-cta': { opacity: 1, transform: 'translateX(0)' },
          },
        }}
      >
        {/* Left Accent Bar */}
        <Box
          sx={{
            width: 5,
            flexShrink: 0,
            background: accentGradient,
          }}
        />

        {/* Card Body */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {/* Top Row */}
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            {/* Company Monogram */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: accentGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: 0.5,
                boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`,
              }}
            >
              {getInitials(company || 'Co')}
            </Box>

            <Box flex={1} minWidth={0}>
              {/* Title Row */}
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    color: 'text.primary',
                  }}
                >
                  {jobTitle}
                </Typography>
                {isNew && (
                  <Chip
                    icon={<Zap size={9} />}
                    label="NEW"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      bgcolor: isDark ? alpha('#22c55e', 0.15) : '#dcfce7',
                      color: '#16a34a',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.7 },
                      },
                      '& .MuiChip-icon': { width: 9, ml: 0.5, color: '#16a34a' },
                    }}
                  />
                )}
              </Stack>

              {/* Company + Time */}
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.8rem' }}>
                  {company}
                </Typography>
                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                  {formatTimeAgo(article.published_date || article.time || null)}
                </Typography>
              </Stack>
            </Box>

            {/* Apply CTA */}
            <Box
              className="apply-cta"
              onClick={(e) => { e.stopPropagation(); handleApply(); }}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 0.5,
                pl: 1.5, pr: 1, py: 0.5,
                borderRadius: 2,
                bgcolor: isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
                fontWeight: 700,
                fontSize: '0.72rem',
                opacity: 0,
                transform: 'translateX(8px)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
              }}
            >
              Apply <ArrowUpRight size={13} />
            </Box>
          </Stack>

          {/* Salary Callout */}
          {salaryRange && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                alignSelf: 'flex-start',
                px: 1.25,
                py: 0.4,
                borderRadius: 1.5,
                bgcolor: isDark ? alpha('#22c55e', 0.1) : alpha('#22c55e', 0.06),
                border: '1px solid',
                borderColor: isDark ? alpha('#22c55e', 0.2) : alpha('#22c55e', 0.15),
              }}
            >
              <DollarSign size={13} style={{ color: '#22c55e' }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#16a34a' }}>
                {salaryRange}
              </Typography>
            </Box>
          )}

          {/* Badges */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
            {jobType && (
              <Chip
                icon={<Briefcase size={10} />}
                label={jobType}
                size="small"
                sx={{
                  height: 22, fontSize: '0.62rem', fontWeight: 600,
                  bgcolor: isDark ? alpha(theme.palette.info.main, 0.12) : alpha(theme.palette.info.main, 0.08),
                  color: 'info.main',
                  '& .MuiChip-icon': { ml: 0.5, width: 10 },
                }}
              />
            )}
            {isRemote && (
              <Chip
                icon={<Globe size={10} />}
                label="Remote"
                size="small"
                sx={{
                  height: 22, fontSize: '0.62rem', fontWeight: 600,
                  bgcolor: isDark ? alpha('#22c55e', 0.12) : '#f0fdf4',
                  color: '#16a34a',
                  '& .MuiChip-icon': { ml: 0.5, width: 10 },
                }}
              />
            )}
            {experienceLevel && (
              <Chip
                label={experienceLevel}
                size="small"
                sx={{
                  height: 22, fontSize: '0.62rem', fontWeight: 700,
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: 'text.secondary',
                }}
              />
            )}
            {location && (
              <Chip
                icon={<MapPin size={10} />}
                label={location}
                size="small"
                sx={{
                  height: 22, fontSize: '0.62rem', fontWeight: 500,
                  bgcolor: 'transparent', color: 'text.secondary',
                  '& .MuiChip-icon': { ml: 0.5, width: 10 },
                }}
              />
            )}
          </Stack>

          {/* Description */}
          {(article.description || article.summary || article.content_summary) && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.55,
                fontSize: '0.72rem',
              }}
            >
              {article.description || article.summary || article.content_summary}
            </Typography>
          )}

          {/* Skills row */}
          {skills.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
              {skills.slice(0, 5).map((s) => (
                <Box
                  key={s}
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  {s}
                </Box>
              ))}
              {skills.length > 5 && (
                <Typography variant="caption" color="text.disabled" alignSelf="center" sx={{ fontSize: '0.6rem' }}>
                  +{skills.length - 5}
                </Typography>
              )}
            </Stack>
          )}

          {/* Footer interactions */}
          {showInteractions && (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ mt: 'auto', pt: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton size="small" onClick={handleBookmark} sx={{
                color: localBookmarked ? 'primary.main' : 'text.disabled', width: 28, height: 28,
              }}>
                <Bookmark size={14} fill={localBookmarked ? 'currentColor' : 'none'} />
              </IconButton>
              <IconButton size="small" onClick={handleLike} sx={{
                color: localLiked ? 'error.main' : 'text.disabled', width: 28, height: 28,
              }}>
                <Heart size={14} fill={localLiked ? 'currentColor' : 'none'} />
              </IconButton>
              {localLikesCount > 0 && (
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                  {localLikesCount}
                </Typography>
              )}
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setShareDialogOpen(true); }}
                sx={{ color: 'text.disabled', width: 28, height: 28 }}
              >
                <Share2 size={14} />
              </IconButton>
            </Stack>
          )}
        </Box>
      </Box>

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        articleId={typeof article.id === 'number' ? article.id : parseInt(String(article.id))}
        articleUrl={article.url}
        articleTitle={article.title}
        onShareTracked={() => { }}
      />
    </>
  );
};

export default JobCard;
