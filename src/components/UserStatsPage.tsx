import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import { Trophy, TrendingUp, Heart, Bookmark, Share2, MessageCircle, Eye } from 'lucide-react';
import { apiService, type UserStats } from '../services/api';
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

  const levelProgress = (stats.total_points / stats.points_to_next_level) * 100;

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

      <Stack spacing={3}>
        {/* Level Card */}
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Trophy size={24} color={theme.palette.primary.main} />
              <Typography variant="h6">Level {stats.current_level}</Typography>
              <Chip label={stats.level_name} size="small" color="primary" />
            </Stack>
            
            <Box>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2">{stats.total_points} / {stats.points_to_next_level} pts</Typography>
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
              <Typography variant="h4" fontWeight={700}>{stats.total_points}</Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.points_to_next_level - stats.total_points} points to next level
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Actions Breakdown */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={3}>Activity Breakdown</Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(5, 1fr)'
              },
              gap: 2
            }}
          >
            {stats.actions_breakdown.map((action: any) => (
              <Paper 
                key={action.action_type}
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
                  {actionIcons[action.action_type] || <TrendingUp size={20} />}
                </Box>
                <Typography variant="h5" fontWeight={700}>{action.count}</Typography>
                <Typography variant="caption" textTransform="capitalize">
                  {action.action_type}s
                </Typography>
                <Chip 
                  label={`${action.points} pts`}
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Paper>
            ))}
          </Box>
        </Paper>

        {/* Recent Activities (if available) */}
        {stats.recent_activities && stats.recent_activities.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Recent Activity</Typography>
            <Stack spacing={1}>
              {stats.recent_activities.slice(0, 5).map((activity: any, index: number) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    {actionIcons[activity.action_type] || <TrendingUp size={16} />}
                    <Typography variant="body2">
                      {activity.action_type.charAt(0).toUpperCase() + activity.action_type.slice(1)}
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