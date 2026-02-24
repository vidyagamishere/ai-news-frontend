import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { Bookmark, BookOpen, Clock, Eye, Flame, Heart, MessageCircle, Share2, TrendingUp, Trophy } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { apiService, type UserStats } from '../services/api';

type ReadingStats = {
  total_articles_read: number;
  total_minutes_read: number;
  avg_articles_per_active_day: number;
  active_days_last_30: number;
  daily_stats: Array<{ date: string; day_label: string; articles_read: number; minutes_read: number }>;
  weekly_stats: Array<{ week_start: string; week_label: string; articles_read: number; minutes_read: number }>;
};

// Pure SVG bar chart — no library needed
const BarChart: React.FC<{
  data: Array<{ label: string; value: number; tooltip: string }>;
  color: string;
  height?: number;
}> = ({ data, color, height = 160 }) => {
  const theme = useTheme();
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / (data.length * 2 - 1); // percentage width per bar
  const gap = barWidth; // equal gap

  return (
    <Box sx={{ width: '100%', userSelect: 'none' }}>
      {/* Bars */}
      <Box sx={{ position: 'relative', height, display: 'flex', alignItems: 'flex-end', gap: `${gap}%`, px: 0.5 }}>
        {data.map((d, i) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          return (
            <Tooltip key={i} title={d.tooltip} arrow placement="top">
              <Box
                sx={{
                  flex: 1,
                  height: `${Math.max(pct, d.value > 0 ? 4 : 0)}%`,
                  minHeight: d.value > 0 ? 4 : 0,
                  bgcolor: d.value > 0 ? color : alpha(theme.palette.text.disabled, 0.15),
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.4s ease',
                  cursor: 'default',
                  '&:hover': {
                    opacity: 0.8,
                    filter: 'brightness(1.15)',
                  },
                  position: 'relative',
                }}
              >
                {d.value > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: -18,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      color: color,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.value}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* X-axis labels */}
      <Box sx={{ display: 'flex', gap: `${gap}%`, px: 0.5, mt: 0.5 }}>
        {data.map((d, i) => (
          <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              {d.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const UserStatsPage: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<'articles' | 'minutes'>('articles');
  const [chartRange, setChartRange] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    Promise.all([
      apiService.getUserStats().catch(() => null),
      apiService.getUserReadingStats().catch(() => null),
    ]).then(([s, r]) => {
      setStats(s);
      setReadingStats(r);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const levelProgress = stats ? Math.min((stats.total_points / stats.points_to_next_level) * 100, 100) : 0;

  const actionIcons: Record<string, React.ReactNode> = {
    'view': <Eye size={18} />,
    'like': <Heart size={18} />,
    'bookmark': <Bookmark size={18} />,
    'share': <Share2 size={18} />,
    'comment': <MessageCircle size={18} />
  };

  // Build chart data
  const chartData = (() => {
    if (!readingStats) return [];
    const source = chartRange === 'daily' ? readingStats.daily_stats : readingStats.weekly_stats;
    return source.map(d => ({
      label: chartRange === 'daily' ? (d as any).day_label : (d as any).week_label,
      value: chartMetric === 'articles' ? d.articles_read : d.minutes_read,
      tooltip: chartRange === 'daily'
        ? `${(d as any).day_label}: ${d.articles_read} article${d.articles_read !== 1 ? 's' : ''}, ${formatDuration(d.minutes_read)}`
        : `${(d as any).week_label}: ${d.articles_read} article${d.articles_read !== 1 ? 's' : ''}, ${formatDuration(d.minutes_read)}`,
    }));
  })();

  const accentColor = theme.palette.primary.main;

  return (
    <Box sx={{ pt: 1 }}>
      <Stack spacing={3}>

        {/* ── Reading Summary Cards ── */}
        {readingStats && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {[
              {
                icon: <BookOpen size={22} color={accentColor} />,
                value: readingStats.total_articles_read,
                label: 'Articles Read',
              },
              {
                icon: <Clock size={22} color={theme.palette.success.main} />,
                value: formatDuration(readingStats.total_minutes_read),
                label: 'Total Read Time',
                color: theme.palette.success.main,
              },
              {
                icon: <TrendingUp size={22} color={theme.palette.warning.main} />,
                value: readingStats.avg_articles_per_active_day,
                label: 'Avg / Active Day',
                color: theme.palette.warning.main,
              },
              {
                icon: <Flame size={22} color={theme.palette.error.main} />,
                value: readingStats.active_days_last_30,
                label: 'Active Days (30d)',
                color: theme.palette.error.main,
              },
            ].map(({ icon, value, label, color }) => (
              <Paper
                key={label}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Box sx={{ mb: 0.5 }}>{icon}</Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: color ?? accentColor, lineHeight: 1.1 }}>
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* ── Weekly / Daily Timeline Chart ── */}
        {readingStats && (
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${alpha(theme.palette.divider, 0.8)}`, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
              <Typography variant="h6" fontWeight={600}>Reading Activity</Typography>
              <Stack direction="row" spacing={1}>
                <ToggleButtonGroup
                  size="small"
                  value={chartRange}
                  exclusive
                  onChange={(_, v) => v && setChartRange(v)}
                  sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, textTransform: 'none', fontSize: '0.75rem' } }}
                >
                  <ToggleButton value="daily">7 Days</ToggleButton>
                  <ToggleButton value="weekly">8 Weeks</ToggleButton>
                </ToggleButtonGroup>
                <ToggleButtonGroup
                  size="small"
                  value={chartMetric}
                  exclusive
                  onChange={(_, v) => v && setChartMetric(v)}
                  sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, textTransform: 'none', fontSize: '0.75rem' } }}
                >
                  <ToggleButton value="articles">Articles</ToggleButton>
                  <ToggleButton value="minutes">Minutes</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>

            {chartData.every(d => d.value === 0) ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No reading activity yet in this range.
                </Typography>
              </Box>
            ) : (
              <BarChart
                data={chartData}
                color={chartMetric === 'articles' ? accentColor : theme.palette.success.main}
                height={160}
              />
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {chartMetric === 'articles' ? 'Number of articles read' : 'Estimated minutes read'} per {chartRange === 'daily' ? 'day' : 'week'}
            </Typography>
          </Paper>
        )}

        {/* ── Level & Points ── */}
        {stats && (
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${alpha(theme.palette.divider, 0.8)}`, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Trophy size={22} color={accentColor} />
                <Typography variant="h6" fontWeight={600}>Level {stats.current_level}</Typography>
                <Chip label={stats.level_name} size="small" color="primary" />
              </Stack>

              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.75}>
                  <Typography variant="body2" color="text.secondary">
                    {stats.total_points.toLocaleString()} pts
                  </Typography>
                  <Typography variant="body2" color="primary">
                    {stats.points_to_next_level.toLocaleString()} pts to next level
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={levelProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Stack>
          </Paper>
        )}

        {/* ── Activity Breakdown ── */}
        {stats && stats.actions_breakdown.length > 0 && (
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${alpha(theme.palette.divider, 0.8)}`, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Activity Breakdown</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(5, 1fr)'
                },
                gap: 1.5,
              }}
            >
              {stats.actions_breakdown.map((action: any) => (
                <Paper
                  key={action.action_type}
                  elevation={0}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: alpha(accentColor, 0.05),
                    border: `1px solid ${alpha(accentColor, 0.12)}`,
                    borderRadius: 2,
                  }}
                >
                  <Box mb={0.75} sx={{ color: accentColor }}>
                    {actionIcons[action.action_type] ?? <TrendingUp size={18} />}
                  </Box>
                  <Typography variant="h5" fontWeight={700}>{action.count}</Typography>
                  <Typography variant="caption" textTransform="capitalize" color="text.secondary">
                    {action.action_type}s
                  </Typography>
                  <Box mt={0.75}>
                    <Chip label={`${action.points} pts`} size="small" color="primary" />
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        )}

        {/* ── Recent Activity ── */}
        {stats && stats.recent_activities && stats.recent_activities.length > 0 && (
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${alpha(theme.palette.divider, 0.8)}`, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Recent Activity</Typography>
            <Stack spacing={1}>
              {stats.recent_activities.slice(0, 5).map((activity: any, index: number) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    borderRadius: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                    {actionIcons[activity.action_type] ?? <TrendingUp size={16} />}
                    <Typography variant="body2" textTransform="capitalize">
                      {activity.action_type}
                    </Typography>
                  </Stack>
                  <Chip label={`+${activity.points} pts`} size="small" />
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

      </Stack>
    </Box>
  );
};

export default UserStatsPage;