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
  Clock,
  Heart,
  MapPin,
  Monitor,
  Radio,
  Share2,
  Ticket,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareDialog from '../../components/ShareDialog';
import { useAuth } from '../../contexts/AuthContext';
import { ActionTypeId, apiService, SLUG_NAV_ENABLED } from '../../services/api';
import { trackArticleClick } from '../../utils/analytics';
import type { Article } from '../../types/article';

interface EventCardProps {
  article: Article;
  onLike?: (id: number) => void;
  onBookmark?: (id: number) => void;
  showInteractions?: boolean;
}

type EventTypeKey = 'Conference' | 'Workshop' | 'Webinar' | 'Meetup' | 'Hackathon' | 'Summit';

const EVENT_GRADIENTS: Record<EventTypeKey, string> = {
  Conference: 'linear-gradient(135deg, #7c3aed, #2563eb)',
  Workshop: 'linear-gradient(135deg, #2563eb, #0891b2)',
  Webinar: 'linear-gradient(135deg, #059669, #10b981)',
  Meetup: 'linear-gradient(135deg, #ea580c, #f59e0b)',
  Hackathon: 'linear-gradient(135deg, #dc2626, #ec4899)',
  Summit: 'linear-gradient(135deg, #7c3aed, #ec4899)',
};

function parseEventDate(dateStr?: string) {
  console.log('🔍 parseEventDate called with:', dateStr, 'Type:', typeof dateStr);
  
  if (!dateStr) {
    console.log('❌ No dateStr provided');
    return null;
  }
  
  try {
    const d = new Date(dateStr);
    console.log('📅 Created Date object:', d);
    console.log('⏰ getTime():', d.getTime());
    console.log('🔢 isNaN check:', isNaN(d.getTime()));
    
    if (isNaN(d.getTime())) {
      console.log('❌ Invalid date - isNaN returned true');
      return null;
    }
    
    const result = {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      full: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
    
    console.log('✅ Successfully parsed date:', result);
    return result;
  } catch (error) {
    console.error('❌ Parse error:', error);
    return null;
  }
}

function daysUntil(dateStr?: string): number | null {
  console.log('🔍 daysUntil called with:', dateStr);
  
  if (!dateStr) {
    console.log('❌ No dateStr provided to daysUntil');
    return null;
  }
  
  try {
    const eventDate = new Date(dateStr);
    const now = Date.now();
    const diff = eventDate.getTime() - now;
    
    console.log('📊 daysUntil calculation:', {
      eventDate: eventDate.toISOString(),
      now: new Date(now).toISOString(),
      diff,
      diffInDays: diff / (1000 * 60 * 60 * 24)
    });
    
    if (diff < 0) {
      console.log('⏰ Event is in the past');
      return null;
    }
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    console.log('✅ Days until event:', days);
    return days;
  } catch (error) {
    console.error('❌ daysUntil error:', error);
    return null;
  }
}

const EventCard: React.FC<EventCardProps> = ({
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

  // 🔍 DEBUG: Log all event-related data
  console.group(`🎫 EventCard Debug: ${article.title?.substring(0, 40)}...`);
  console.log('📦 Full article object:', article);
  console.log('📅 article.event_date:', article.event_date);
  console.log('🗂️ article.metadata:', article.metadata);
  console.log('📅 article.metadata?.event_date:', article.metadata?.event_date);
  
  const eventDate = article.event_date || article.metadata?.event_date;
  console.log('✅ Final eventDate value:', eventDate);
  console.log('🔢 Type of eventDate:', typeof eventDate);
  
  const location = article.event_location || article.metadata?.event_location;
  const isVirtual = article.is_virtual ?? article.metadata?.is_virtual;
  const eventType: string = article.event_type || article.metadata?.event_type || '';
  const regUrl = article.registration_url || article.url;
  const hosts: string[] = article.event_hosts || article.metadata?.event_hosts || [];

  const parsed = useMemo(() => {
    const result = parseEventDate(eventDate);
    console.log('🗓️ Parsed date result:', result);
    return result;
  }, [eventDate]);
  
  const remaining = useMemo(() => {
    const days = daysUntil(eventDate);
    console.log('⏱️ Days until event:', days);
    return days;
  }, [eventDate]);
  
  const upcoming = remaining !== null;
  
  console.log('📊 Summary:', {
    eventDate,
    parsed,
    remaining,
    upcoming,
    location,
    isVirtual,
    eventType
  });
  console.groupEnd();

  const eventKey = Object.keys(EVENT_GRADIENTS).find((k) =>
    eventType.toLowerCase().includes(k.toLowerCase())
  ) as EventTypeKey | undefined;
  const gradient = eventKey
    ? EVENT_GRADIENTS[eventKey]
    : 'linear-gradient(135deg, #6366f1, #8b5cf6)';

  const handleRegister = () => {
    trackArticleClick(article.title, article.source ?? '', article.category ?? '');
    if (SLUG_NAV_ENABLED && article.slug) {
      navigate(`/article/${article.slug}`);
    } else if (regUrl) {
      window.open(regUrl, '_blank', 'noopener,noreferrer');
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
        onClick={handleRegister}
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
            boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.08)',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
            '& .register-cta': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {/* Calendar Block — left */}
        <Box
          sx={{
            width: { xs: 72, sm: 80 },
            flexShrink: 0,
            background: gradient,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            color: '#fff',
            py: 2,
          }}
        >
          {parsed ? (
            <>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, opacity: 0.8, textTransform: 'uppercase' }}>
                {parsed.month}
              </Typography>
              <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1.1 }}>
                {parsed.day}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.7, mt: 0.25 }}>
                {parsed.weekday}
              </Typography>
            </>
          ) : (
            <>
              {console.log('📌 Rendering TBD because parsed is:', parsed)}
              {console.log('📌 eventDate was:', eventDate)}
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, opacity: 0.8 }}>
                DATE
              </Typography>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, opacity: 0.6 }}>
                TBD
              </Typography>
            </>
          )}

          {/* Live/Upcoming badge */}
          {isVirtual && upcoming && (
            <Box
              sx={{
                position: 'absolute',
                top: 6,
                right: -4,
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                px: 0.5,
                py: 0.15,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Radio size={7} style={{ color: '#fff' }} />
              <Typography sx={{ fontSize: '0.45rem', fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
                LIVE
              </Typography>
            </Box>
          )}
        </Box>

        {/* Card Body */}
        <Box sx={{ flex: 1, p: { xs: 1.75, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0 }}>
          {/* Header row: type + countdown */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
              {eventType && (
                <Typography variant="caption" sx={{
                  fontWeight: 700, fontSize: '0.58rem', textTransform: 'uppercase',
                  letterSpacing: 1, color: isDark ? alpha('#a78bfa', 0.9) : '#7c3aed',
                }}>
                  {eventType}
                </Typography>
              )}
              {isVirtual ? (
                <Chip icon={<Monitor size={9} />} label="Virtual" size="small" sx={{
                  height: 17, fontSize: '0.55rem', fontWeight: 600,
                  bgcolor: isDark ? alpha('#3b82f6', 0.12) : '#eff6ff',
                  color: '#2563eb',
                  '& .MuiChip-icon': { ml: 0.5, width: 9 },
                }} />
              ) : location && (
                <Chip icon={<Ticket size={9} />} label="In-Person" size="small" sx={{
                  height: 17, fontSize: '0.55rem', fontWeight: 600,
                  bgcolor: isDark ? alpha('#f59e0b', 0.12) : '#fffbeb',
                  color: '#d97706',
                  '& .MuiChip-icon': { ml: 0.5, width: 9 },
                }} />
              )}
            </Stack>

            {remaining !== null && (
              <Box sx={{
                px: 1, py: 0.25, borderRadius: 1.5,
                bgcolor: remaining <= 7
                  ? isDark ? alpha('#ef4444', 0.15) : alpha('#ef4444', 0.08)
                  : isDark ? alpha('#22c55e', 0.12) : alpha('#22c55e', 0.06),
                border: '1px solid',
                borderColor: remaining <= 7
                  ? alpha('#ef4444', 0.2) : alpha('#22c55e', 0.15),
              }}>
                <Typography sx={{
                  fontSize: '0.58rem', fontWeight: 700,
                  color: remaining <= 7 ? '#ef4444' : '#16a34a',
                }}>
                  {remaining === 0 ? 'Today!' : remaining === 1 ? 'Tomorrow' : `${remaining}d away`}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Title */}
          <Typography sx={{
            fontWeight: 800,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'text.primary',
          }}>
            {article.title}
          </Typography>

          {/* Meta */}
          <Stack spacing={0.4}>
            {parsed?.time && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Clock size={11} style={{ color: theme.palette.text.disabled, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                  {parsed.time}
                </Typography>
              </Stack>
            )}
            {location && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <MapPin size={11} style={{ color: theme.palette.text.disabled, flexShrink: 0 }} />
                <Typography variant="caption" sx={{
                  color: 'text.secondary', fontSize: '0.68rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {location}
                </Typography>
              </Stack>
            )}
            {hosts.length > 0 && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Users size={11} style={{ color: theme.palette.text.disabled, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                  {hosts.slice(0, 2).join(', ')}{hosts.length > 2 && ` +${hosts.length - 2}`}
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Description */}
          {(article.description || article.summary || article.content_summary) && (
            <Typography variant="caption" sx={{
              color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {article.description || article.summary || article.content_summary}
            </Typography>
          )}

          {/* Footer */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 'auto', pt: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Register CTA */}
            <Box
              className="register-cta"
              onClick={handleRegister}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5, py: 0.5,
                borderRadius: 2,
                background: upcoming ? gradient : 'transparent',
                border: upcoming ? 'none' : '1px solid',
                borderColor: 'divider',
                color: upcoming ? '#fff' : 'text.secondary',
                fontWeight: 700,
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: upcoming ? `0 4px 16px ${alpha('#7c3aed', 0.3)}` : 'none',
                },
              }}
            >
              {upcoming ? 'Register' : 'View Event'}
              <ArrowUpRight size={13} />
            </Box>

            {/* Interactions */}
            {showInteractions && (
              <Stack direction="row" spacing={0.25} alignItems="center">
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
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>
                    {localLikesCount}
                  </Typography>
                )}
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setShareDialogOpen(true); }} sx={{
                  color: 'text.disabled', width: 28, height: 28,
                }}>
                  <Share2 size={14} />
                </IconButton>
              </Stack>
            )}
          </Stack>
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

export default EventCard;
