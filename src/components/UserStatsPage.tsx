import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Stack,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import { Trophy, TrendingUp, Heart, Bookmark, Share2, MessageCircle, Eye } from 'lucide-react';
import { apiService, UserStats } from '../services/api';
import { useTheme, alpha } from '@mui/material';

const UserStatsPage: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiService.getUserStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) return null;

  const levelProgress = (stats.points.current_level_points / stats.points.next_level_threshold) * 100;

  const actionIcons: Record<string, React.ReactNode> = {
    'view': <Eye size={20} />,
    'like': <Heart size={20} />,
    'bookmark': <Bookmark size={20} />,
    'share': <Share2 size={20} />,
    'comment': <MessageCircle size={20} />
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <Trophy size={32} color={theme.palette.primary.main} />
        <Typography variant="h4" fontWeight={700}>Your Stats</Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* Level Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Trophy size={24} color={theme.palette.primary.main} />
                <Typography variant="h6">Level {stats.points.level}</Typography>
              </Stack>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{stats.points.current_level_points} / {stats.points.next_level_threshold} pts</Typography>
                  <Typography variant="body2" color="primary">{Math.round(levelProgress)}%</Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={levelProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary">Total Points</Typography>
                <Typography variant="h4" fontWeight={700}>{stats.points.total_points}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Streak Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUp size={24} color={theme.palette.success.main} />
                <Typography variant="h6">Reading Streak</Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Current Streak</Typography>
                    <Typography variant="h3" fontWeight={700} color="success.main">
                      {stats.streak.current_streak}
                    </Typography>
                    <Typography variant="caption">days</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Longest Streak</Typography>
                    <Typography variant="h3" fontWeight={700}>
                      {stats.streak.longest_streak}
                    </Typography>
                    <Typography variant="caption">days</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary">Total Active Days</Typography>
                <Typography variant="h5" fontWeight={600}>{stats.streak.total_days_active}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Actions Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>Activity Breakdown</Typography>
            
            <Grid container spacing={2}>
              {stats.actions_breakdown.map(action => (
                <Grid item xs={6} md={2.4} key={action.action_type}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: 1,
                      borderColor: alpha(theme.palette.primary.main, 0.1)
                    }}
                  >
                    <Box mb={1}>
                      {actionIcons[action.action_type]}
                    </Box>
                    <Typography variant="h5" fontWeight={700}>{action.count}</Typography>
                    <Typography variant="caption" textTransform="capitalize">{action.action_type}s</Typography>
                    <Chip 
                      label={`${action.total_points} pts`}
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Points Config Reference */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <Typography variant="subtitle2" mb={2}>How Points Work</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {Object.entries(stats.points_config).map(([action, points]) => (
                <Chip
                  key={action}
                  icon={actionIcons[action] as any}
                  label={`${action}: ${points} pts`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserStatsPage;