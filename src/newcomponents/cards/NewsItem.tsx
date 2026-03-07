import React from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Stack,
  useTheme,
  Avatar,
  Card,
  CardContent,
  Rating,
  Divider,
  Button,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { 
  ThumbUpAltOutlined, 
  BookmarkBorderOutlined, 
  ShareOutlined,
  School,
  Timer,
  Person,
  AttachMoney,
  AccessTime,
  Category as CategoryIcon,
  Language,
  CalendarToday,
  OpenInNew,
  CheckCircle,
  TrendingUp,
  ThumbUp,
  Bookmark,
  Lock,
  Groups,
  WorkspacePremium,
  Work,
  LocationOn,
  Event as EventIcon,
  WifiTethering,
  StarOutline,
  BusinessCenter
} from '@mui/icons-material';
import type { Article } from '../../types/article';
import { formatTimeAgo } from '../../types/article';

interface NewsItemProps {
  article: Article;
  contentType?: string;
  onLike?: (articleId: number) => void;
  onBookmark?: (articleId: number) => void;
  onShare?: (articleId: number) => void;
  showInteractions?: boolean;
  onClick?: (article: Article) => void;
  onCardClick?: () => void;
}

const NewsItem: React.FC<NewsItemProps> = ({
  article,
  contentType,
  onLike,
  onBookmark,
  onShare,
  showInteractions = false,
  onClick,
  onCardClick,
}) => {
  const theme = useTheme();

  // ✅ Detect content type (unified logic)
  const isCourse = 
    contentType === 'course' ||
    article.content_type_label === 'Courses' || 
    article.content_type_name === 'Courses' ||  
    article.content_type === 'course' ||
    article.type === 'course' ||
    article.instructor !== undefined;

  const isPodcast = 
    contentType === 'podcast' ||
    article.content_type_label === 'Podcasts' ||
    article.content_type_name === 'Podcasts' ||  
    article.content_type === 'podcast' ||
    article.type === 'podcast';

  const isVideo = 
    contentType === 'video' ||
    article.content_type_label === 'Videos' ||
    article.content_type_name === 'Videos' ||  
    article.content_type === 'video' ||
    article.type === 'video';

  const isJob =
    contentType === 'job' ||
    article.content_type_label === 'Jobs' ||
    article.content_type_name === 'Jobs' ||
    article.content_type === 'job' ||
    article.type === 'job';

  const isEvent =
    contentType === 'event' ||
    article.content_type_label === 'Events' ||
    article.content_type_name === 'Events' ||
    article.content_type === 'event' ||
    article.type === 'event';

  const handleClick = () => {
    if (onClick) {
      onClick(article);
    } else {
      const meta = (article.metadata as Record<string, any>) || {};
      const targetUrl =
        (isCourse && article.enrollment_url) ? article.enrollment_url :
        (isJob && meta.application_url) ? meta.application_url :
        (isEvent && meta.registration_url) ? meta.registration_url :
        article.url;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleInteraction = (
    e: React.MouseEvent,
    action: 'like' | 'bookmark' | 'share'
  ) => {
    e.stopPropagation();
    const articleId = typeof article.id === 'number' ? article.id : parseInt(article.id as string, 10);
    
    switch (action) {
      case 'like':
        onLike?.(articleId);
        break;
      case 'bookmark':
        onBookmark?.(articleId);
        break;
      case 'share':
        onShare?.(articleId);
        break;
    }
  };

  // ✅ COURSE-SPECIFIC RENDERING (Only for courses)
  if (isCourse) {
    // Resolve all fields with fallback from article.metadata JSONB
    const meta = (article.metadata as Record<string, any>) || {};
    const instructor = article.instructor || meta.instructor;
    const provider = article.provider || meta.provider;
    const platform = article.platform || meta.platform;
    const difficulty = (article.difficulty || meta.difficulty) as 'Beginner' | 'Intermediate' | 'Advanced' | undefined;
    const durationHours = article.duration_hours ?? meta.duration_hours;
    const durationWeeks = article.duration_weeks ?? meta.duration_weeks;
    const rating = article.rating ?? meta.rating;
    const numReviews = article.num_reviews ?? meta.num_reviews;
    const numStudents = article.num_students ?? meta.num_students;
    const isFree = article.is_free ?? meta.is_free;
    const price = article.price ?? meta.price;
    const currency = article.currency || meta.currency || 'USD';
    const hasCertificate = article.has_certificate ?? meta.has_certificate;
    const courseType = article.course_type || meta.course_type;
    const language = meta.language || meta.course_language;
    const isSelfPaced = article.is_self_paced ?? meta.is_self_paced;
    const startDate = article.start_date || meta.start_date;
    const enrollmentOpen = article.enrollment_open ?? meta.enrollment_open;
    const completionRate = article.completion_rate ?? meta.completion_rate;
    const learningOutcomes: string[] = article.learning_outcomes || meta.learning_outcomes || [];
    const topicsCovered: string[] = article.topics_covered || meta.topics_covered || [];
    const prerequisites: string[] = article.prerequisites || meta.prerequisites || [];
    const recommendedFor = article.recommended_for || meta.recommended_for;
    const enrollmentUrl = article.enrollment_url || meta.enrollment_url || article.url;
    const thumbnail = article.image_url || article.thumbnail_url || meta.thumbnail_url;
    const difficultyColor = difficulty === 'Beginner' ? 'success' : difficulty === 'Intermediate' ? 'warning' : difficulty === 'Advanced' ? 'error' : 'default';
    const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

    return (
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: theme.shadows[12],
          },
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* ── Thumbnail ───────────────────────────────────────── */}
        <Box
          onClick={handleClick}
          sx={{
            position: 'relative',
            height: thumbnail ? 190 : 80,
            background: thumbnail
              ? `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65)), url(${thumbnail}) center/cover no-repeat`
              : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
            display: 'flex',
            alignItems: thumbnail ? 'flex-end' : 'center',
            justifyContent: thumbnail ? 'flex-start' : 'center',
            p: 1.5,
          }}
        >
          {!thumbnail && (
            <School sx={{ fontSize: 40, color: 'rgba(255,255,255,0.7)' }} />
          )}

          {/* Badges — top row */}
          <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {platform && (
              <Chip
                label={platform}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
              />
            )}
            {provider && provider !== platform && (
              <Chip
                label={provider}
                size="small"
                sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: 'white', fontWeight: 600, fontSize: '0.7rem', height: 22 }}
              />
            )}
          </Box>

          {/* Certificate badge — top right */}
          {hasCertificate && (
            <Tooltip title="Offers Certificate" arrow>
              <Box
                sx={{
                  position: 'absolute', top: 10, right: 10,
                  bgcolor: 'warning.main', borderRadius: '50%',
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 2,
                }}
              >
                <WorkspacePremium sx={{ fontSize: 18, color: 'white' }} />
              </Box>
            </Tooltip>
          )}

          {/* Price / Free — bottom left (only shown when thumbnail present) */}
          {thumbnail && (
            <Box sx={{ zIndex: 1 }}>
              {isFree ? (
                <Chip label="Free" size="small" sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 700, fontSize: '0.72rem' }} />
              ) : price !== undefined ? (
                <Chip
                  icon={<AttachMoney sx={{ fontSize: '14px !important' }} />}
                  label={`${currency === 'USD' ? '$' : currency}${price}`}
                  size="small"
                  sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700, fontSize: '0.72rem' }}
                />
              ) : null}
            </Box>
          )}

          {/* Enrollment status badge — bottom right */}
          {thumbnail && enrollmentOpen !== undefined && (
            <Chip
              label={enrollmentOpen ? '🟢 Enrollment Open' : '🔴 Closed'}
              size="small"
              sx={{
                position: 'absolute', bottom: 10, right: 10, zIndex: 1,
                bgcolor: enrollmentOpen ? 'rgba(46,125,50,0.9)' : 'rgba(183,28,28,0.9)',
                color: 'white', fontWeight: 600, fontSize: '0.68rem',
              }}
            />
          )}
        </Box>

        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, '&:last-child': { pb: 2.5 } }}>

          {/* ── Title ──────────────────────────────────────────── */}
          <Typography
            onClick={handleClick}
            variant="h6"
            fontWeight={700}
            gutterBottom
            sx={{
              cursor: 'pointer',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.35,
              mb: 1.5,
              '&:hover': { color: 'primary.main' },
            }}
          >
            {article.title}
          </Typography>

          {/* ── Instructor + Provider ─────────────────────────── */}
          {(instructor || provider) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
              {instructor && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Avatar sx={{ width: 22, height: 22, bgcolor: 'primary.main', fontSize: 12 }}>
                    <Person sx={{ fontSize: 14 }} />
                  </Avatar>
                  <Typography variant="body2" fontWeight={500} color="text.primary">
                    {instructor}
                  </Typography>
                </Box>
              )}
              {provider && instructor && (
                <Typography variant="body2" color="text.disabled">•</Typography>
              )}
              {provider && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <School sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{provider}</Typography>
                </Box>
              )}
            </Box>
          )}

          {/* ── Rating + Reviews + Students ───────────────────── */}
          {(rating || numStudents) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              {rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={rating} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" fontWeight={700} color="warning.dark">
                    {Number(rating).toFixed(1)}
                  </Typography>
                  {numReviews && (
                    <Typography variant="caption" color="text.secondary">
                      ({Number(numReviews).toLocaleString()} reviews)
                    </Typography>
                  )}
                </Box>
              )}
              {numStudents && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Groups sx={{ fontSize: 15, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {Number(numStudents).toLocaleString()} students
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* ── Summary ──────────────────────────────────────────── */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            {article.summary || article.description}
          </Typography>

          {/* ── Meta chips ───────────────────────────────────────── */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5, gap: 0.75 }}>
            {difficulty && (
              <Chip
                label={difficulty}
                size="small"
                color={difficultyColor as any}
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
              />
            )}
            {durationHours && (
              <Chip
                icon={<Timer sx={{ fontSize: '14px !important' }} />}
                label={`${durationHours}h`}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {durationWeeks && (
              <Chip
                icon={<CalendarToday sx={{ fontSize: '14px !important' }} />}
                label={`${durationWeeks} wk${durationWeeks > 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {isSelfPaced !== undefined && (
              <Chip
                label={isSelfPaced ? 'Self-paced' : 'Scheduled'}
                size="small"
                variant="outlined"
                color={isSelfPaced ? 'success' : 'default'}
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {language && (
              <Chip
                icon={<Language sx={{ fontSize: '14px !important' }} />}
                label={language}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {courseType && (
              <Chip
                label={courseType}
                size="small"
                variant="filled"
                sx={{ bgcolor: 'grey.100', fontSize: '0.7rem' }}
              />
            )}
            {isFree === false && price === undefined && (
              <Chip
                icon={<AttachMoney sx={{ fontSize: '14px !important' }} />}
                label="Paid"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {isFree && !thumbnail && (
              <Chip label="Free" size="small" color="success" sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
            )}
          </Stack>

          {/* ── Start date ───────────────────────────────────────── */}
          {formattedStartDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Starts {formattedStartDate}
              </Typography>
            </Box>
          )}

          {/* ── Recommended For ──────────────────────────────────── */}
          {recommendedFor && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 1.5 }}>
              <Person sx={{ fontSize: 14, color: 'text.secondary', mt: 0.2 }} />
              <Typography variant="caption" color="text.secondary">
                <Box component="span" fontWeight={600}>For: </Box>{recommendedFor}
              </Typography>
            </Box>
          )}

          {/* ── Prerequisites ────────────────────────────────────── */}
          {prerequisites.length > 0 && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                border: `1px solid ${theme.palette.divider}`,
                mb: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                <Lock sx={{ fontSize: 13, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Prerequisites
                </Typography>
              </Box>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {prerequisites.slice(0, 2).map((p, idx) => (
                  <Typography key={idx} component="li" variant="caption" color="text.secondary" sx={{ mb: 0.25 }}>
                    {p}
                  </Typography>
                ))}
                {prerequisites.length > 2 && (
                  <Typography variant="caption" color="text.disabled">+ {prerequisites.length - 2} more</Typography>
                )}
              </Box>
            </Box>
          )}

          {/* ── Learning Outcomes ────────────────────────────────── */}
          {learningOutcomes.length > 0 && (
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.50',
                border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.primary.dark : '#BBDEFB'}`,
                mb: 1.5,
              }}
            >
              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <CheckCircle sx={{ fontSize: 14 }} />
                What You'll Learn
              </Typography>
              <Stack spacing={0.5}>
                {learningOutcomes.slice(0, 4).map((outcome, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'primary.main', mt: '6px', flexShrink: 0 }} />
                    <Typography variant="caption" color={theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark'} sx={{ lineHeight: 1.5 }}>
                      {outcome}
                    </Typography>
                  </Box>
                ))}
                {learningOutcomes.length > 4 && (
                  <Typography variant="caption" color="primary.main" fontWeight={600}>
                    + {learningOutcomes.length - 4} more outcomes
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          {/* ── Topics Covered ───────────────────────────────────── */}
          {topicsCovered.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                <School sx={{ fontSize: 13, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Topics Covered
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
                {topicsCovered.slice(0, 5).map((topic, idx) => (
                  <Chip
                    key={idx}
                    label={topic}
                    size="small"
                    sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100', fontSize: '0.68rem', height: 22 }}
                  />
                ))}
                {topicsCovered.length > 5 && (
                  <Chip
                    label={`+${topicsCovered.length - 5}`}
                    size="small"
                    sx={{ bgcolor: 'grey.200', fontSize: '0.68rem', height: 22 }}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* ── Completion Rate ──────────────────────────────────── */}
          {completionRate !== undefined && completionRate !== null && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 13, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Completion Rate
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight={700} color="success.main">
                  {Math.round(completionRate)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(completionRate, 100)}
                sx={{ height: 5, borderRadius: 3 }}
                color="success"
              />
            </Box>
          )}

          {/* ── Footer: Enroll CTA + Interactions ───────────────── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', pt: 1.5 }}>
            <Button
              variant="contained"
              size="small"
              endIcon={<OpenInNew sx={{ fontSize: '14px !important' }} />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(enrollmentUrl, '_blank', 'noopener,noreferrer');
              }}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '0.78rem',
                flex: 1,
                bgcolor: enrollmentOpen === false ? 'grey.400' : undefined,
              }}
              disabled={enrollmentOpen === false}
            >
              {enrollmentOpen === false ? 'Closed' : isFree ? 'Enroll Free' : 'Enroll Now'}
            </Button>

            {showInteractions && (
              <Box sx={{ display: 'flex', gap: 0.25, ml: 'auto' }}>
                <Tooltip title={`${article.likes ?? 0} likes`} arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => handleInteraction(e, 'like')}
                    sx={{
                      color: article.is_liked ? 'primary.main' : 'text.secondary',
                      '&:hover': { bgcolor: 'primary.50', color: 'primary.main' },
                    }}
                  >
                    {article.is_liked ? <ThumbUp fontSize="small" /> : <ThumbUpAltOutlined fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={`${article.bookmarks ?? 0} bookmarks`} arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => handleInteraction(e, 'bookmark')}
                    sx={{
                      color: article.is_bookmarked ? 'warning.main' : 'text.secondary',
                      '&:hover': { bgcolor: 'warning.50', color: 'warning.main' },
                    }}
                  >
                    {article.is_bookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorderOutlined fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => handleInteraction(e, 'share')}
                    sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'success.50', color: 'success.main' } }}
                  >
                    <ShareOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // ✅ JOB CARD RENDERING
  if (isJob) {
    const meta = (article.metadata as Record<string, any>) || {};
    const jobTitle = meta.job_title || article.title;
    const company = meta.company || article.source || 'Unknown Company';
    const jobLocation = meta.job_location || (meta.is_remote ? 'Remote' : null);
    const isRemote = meta.is_remote ?? (article as any).is_remote ?? false;
    const employmentType = meta.employment_type || 'Full-time';
    const experienceLevel = meta.experience_level;
    const salaryRange = meta.salary_range;
    const skillsRequired: string[] = meta.skills_required || [];
    const aiDomain = meta.ai_domain;
    const applicationUrl = meta.application_url || article.url;

    return (
      <Card
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          borderRadius: 3,
          mb: 2,
          border: '1px solid',
          borderColor: theme.palette.divider,
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: 4, borderColor: 'primary.main', transform: 'translateY(-2px)' },
        }}
        elevation={0}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Company + AI Domain header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessCenter sx={{ color: 'text.secondary', fontSize: 18 }} />
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                {company}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {aiDomain && (
                <Chip label={aiDomain} size="small" color="primary" sx={{ fontSize: '0.7rem' }} />
              )}
              {isRemote && (
                <Chip label="Remote" size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              )}
            </Box>
          </Box>

          {/* Job title */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3 }}>
            {jobTitle}
          </Typography>

          {/* Summary */}
          {article.summary && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
            >
              {article.summary}
            </Typography>
          )}

          {/* Meta chips: location, employment type, experience, salary */}
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
            {jobLocation && (
              <Chip icon={<LocationOn sx={{ fontSize: '0.9rem !important' }} />} label={jobLocation} size="small" variant="outlined" />
            )}
            {employmentType && (
              <Chip icon={<Work sx={{ fontSize: '0.9rem !important' }} />} label={employmentType} size="small" variant="outlined" />
            )}
            {experienceLevel && (
              <Chip icon={<Person sx={{ fontSize: '0.9rem !important' }} />} label={`${experienceLevel} Level`} size="small" variant="outlined" />
            )}
            {salaryRange && (
              <Chip icon={<AttachMoney sx={{ fontSize: '0.9rem !important' }} />} label={salaryRange} size="small" color="success" variant="outlined" />
            )}
          </Stack>

          {/* Skills */}
          {skillsRequired.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
              {skillsRequired.slice(0, 6).map((skill, i) => (
                <Chip
                  key={i}
                  label={skill}
                  size="small"
                  sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100', fontSize: '0.7rem' }}
                />
              ))}
              {skillsRequired.length > 6 && (
                <Chip label={`+${skillsRequired.length - 6} more`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              )}
            </Stack>
          )}

          {/* Apply button + time */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {formatTimeAgo(article.published_date || (article as any).time || '')}
            </Typography>
            <Button
              variant="contained"
              size="small"
              endIcon={<OpenInNew fontSize="small" />}
              onClick={(e) => { e.stopPropagation(); window.open(applicationUrl, '_blank', 'noopener,noreferrer'); }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Apply Now
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // ✅ EVENT CARD RENDERING
  if (isEvent) {
    const meta = (article.metadata as Record<string, any>) || {};
    const eventName = meta.event_name || article.title;
    const eventDate = meta.event_date;
    const eventEndDate = meta.event_end_date;
    const eventLocation = meta.event_location || (meta.is_virtual ? 'Online' : null);
    const isVirtual = meta.is_virtual ?? false;
    const eventType = meta.event_type || 'Event';
    const eventFormat = meta.event_format;
    const eventHosts: string[] = meta.event_hosts || [];
    const aiTopics: string[] = meta.ai_topics || [];
    const ticketPrice = meta.ticket_price;
    const registrationUrl = meta.registration_url || article.url;

    return (
      <Card
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          borderRadius: 3,
          mb: 2,
          border: '1px solid',
          borderColor: theme.palette.divider,
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: 4, borderColor: 'secondary.main', transform: 'translateY(-2px)' },
        }}
        elevation={0}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Event type + virtual badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Chip label={eventType} size="small" color="secondary" sx={{ fontSize: '0.7rem' }} />
              {eventFormat && eventFormat !== eventType && (
                <Chip label={eventFormat} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              )}
            </Box>
            {isVirtual && (
              <Chip
                icon={<WifiTethering sx={{ fontSize: '0.9rem !important' }} />}
                label="Virtual"
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>

          {/* Event name */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3 }}>
            {eventName}
          </Typography>

          {/* Summary */}
          {article.summary && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
            >
              {article.summary}
            </Typography>
          )}

          {/* Date + Location + Price */}
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
            {eventDate && (
              <Chip
                icon={<CalendarToday sx={{ fontSize: '0.9rem !important' }} />}
                label={eventEndDate ? `${eventDate} – ${eventEndDate}` : eventDate}
                size="small"
                variant="outlined"
              />
            )}
            {eventLocation && (
              <Chip icon={<LocationOn sx={{ fontSize: '0.9rem !important' }} />} label={eventLocation} size="small" variant="outlined" />
            )}
            {ticketPrice && (
              <Chip
                label={ticketPrice}
                size="small"
                color={ticketPrice === 'Free' ? 'success' : 'default'}
                variant={ticketPrice === 'Free' ? 'filled' : 'outlined'}
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Stack>

          {/* Hosts */}
          {eventHosts.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Groups sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {eventHosts.slice(0, 3).join(' · ')}{eventHosts.length > 3 ? ` +${eventHosts.length - 3} more` : ''}
              </Typography>
            </Box>
          )}

          {/* AI Topics */}
          {aiTopics.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
              {aiTopics.slice(0, 5).map((topic, i) => (
                <Chip
                  key={i}
                  label={topic}
                  size="small"
                  sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100', fontSize: '0.7rem' }}
                />
              ))}
            </Stack>
          )}

          {/* Register button + time */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {formatTimeAgo(article.published_date || (article as any).time || '')}
            </Typography>
            <Button
              variant="contained"
              size="small"
              color="secondary"
              endIcon={<OpenInNew fontSize="small" />}
              onClick={(e) => { e.stopPropagation(); window.open(registrationUrl, '_blank', 'noopener,noreferrer'); }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Register
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // ✅ EXISTING LAYOUT FOR BLOGS/PODCASTS/VIDEOS (No changes)
  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
          transform: 'translateX(4px)',
        }
      }}
    >
      {/* Thumbnail for videos/podcasts/blogs */}
      {(isVideo || isPodcast || (!isCourse && !isJob && !isEvent)) && (article.thumbnail_url || article.image_url || article.image) && (
        <Box
          sx={{
            width: 120,
            height: 90,
            flexShrink: 0,
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
            bgcolor: 'grey.200'
          }}
        >
          <Box
            component="img"
            src={article.thumbnail_url || article.image_url || article.image}
            alt={article.title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = 'https://via.placeholder.com/120x90?text=No+Image';
            }}
          />
          {isVideo && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'rgba(0,0,0,0.7)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box
                sx={{
                  width: 0,
                  height: 0,
                  borderLeft: '12px solid white',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  ml: 0.5
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {article.source || 'Unknown Source'}
          </Typography>
          <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            <AccessTime sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
              {formatTimeAgo(article.published_date || article.created_date || article.time)}
          </Typography>
            {(article.category_label || article.category_name) && (
            <>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                <CategoryIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                {article.category_label || article.category_name}
              </Typography>
            </>
          )}
        </Box>

        {/* Title */}
        <Typography 
          variant="subtitle1" 
          fontWeight={600}
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.5,
            color: 'text.primary',
            '&:hover': { color: 'primary.main' }
          }}
        >
          {article.title}
        </Typography>

        {/* Author/Source */}
        {article.author && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            {article.author}
          </Typography>
        )}

        {/* Summary */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1
          }}
        >
          {article.summary}
        </Typography>

        {/* Footer with interactions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {(article.content_type_label || article.content_type_name) && (
            <Chip 
              label={article.content_type_label || article.content_type_name}
              size="small"
              variant="outlined"
              sx={{ height: 24 }}
            />
          )}
          
          {showInteractions && (
            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
              <IconButton 
                size="small" 
                onClick={(e) => handleInteraction(e, 'like')}
                sx={{ '&:hover': { bgcolor: 'primary.50', color: 'primary.main' }}}
              >
                <ThumbUpAltOutlined fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={(e) => handleInteraction(e, 'bookmark')}
                sx={{ '&:hover': { bgcolor: 'warning.50', color: 'warning.main' }}}
              >
                <BookmarkBorderOutlined fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={(e) => handleInteraction(e, 'share')}
                sx={{ '&:hover': { bgcolor: 'success.50', color: 'success.main' }}}
              >
                <ShareOutlined fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NewsItem;