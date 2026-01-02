import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Stack,
  Divider,
  useTheme,
  IconButton,
  Button
} from '@mui/material';
import { TrendingUp, Sparkles, EditIcon } from 'lucide-react';
import { useDashboardContext } from './Dashboard';
import { Edit, Settings } from '@mui/icons-material';
import {
  Avatar,
  Badge,
  useMediaQuery,
  Container,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Search,
  Bell,
  Menu as MenuIcon,
  User,
  LogOut,
  BookmarkPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import { useSearch } from '../contexts/SearchContext';
import { useAuth } from '../contexts/AuthContext';

interface Topic {
  id: string;
  label: string;
  count?: number;
}

const RightSection: React.FC = () => {
  const theme = useTheme();
  const { content, selectedCategory, categories } = useDashboardContext();
  const { user, isAuthenticated, logout } = useAuth();
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  // Extract trending topics from actual content
  const trendingTopics = useMemo(() => {
    const topicCounts = new Map<string, number>();

    content.forEach(article => {
      article.topics?.forEach(topic => {
        const name = topic.name;
        topicCounts.set(name, (topicCounts.get(name) || 0) + 1);
      });

      // Also consider category names
      if (article.category_name) {
        topicCounts.set(article.category_name, (topicCounts.get(article.category_name) || 0) + 1);
      }
    });

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({
        id: label.toLowerCase().replace(/\s+/g, '-'),
        label,
        count
      }));
  }, [content]);

  // Get category-based article counts for recommendations
  const categoryStats = useMemo(() => {
    const stats = new Map<string, number>();

    content.forEach(article => {
      const category = article.category_name || article.category || 'Other';
      stats.set(category, (stats.get(category) || 0) + 1);
    });

    return stats;
  }, [content]);

  const recommendedTopics: Topic[] = useMemo(() => {
    // Use actual categories from dashboard with article counts
    const topics = categories.map(category => ({
      id: category.toLowerCase().replace(/\s+/g, '-'),
      label: category,
      count: categoryStats.get(category) || 0
    }));

    // Sort by count and return top 7
    return topics.sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 7);
  }, [categories, categoryStats]);

  const fallbackRecommendedTopics: Topic[] = [
    { id: 'generative-ai', label: 'Generative AI', count: 245 },
    { id: 'ai-applications', label: 'AI Applications', count: 182 },
    { id: 'machine-learning', label: 'Machine Learning', count: 156 },
    { id: 'nlp', label: 'Natural Language Processing', count: 134 },
    { id: 'computer-vision', label: 'Computer Vision', count: 98 },
    { id: 'robotics', label: 'Robotics', count: 87 },
    { id: 'ai-ethics', label: 'AI Ethics', count: 76 }
  ];

  const displayRecommendedTopics = recommendedTopics.length > 0 ? recommendedTopics : fallbackRecommendedTopics;
  const displayTrendingTopics = trendingTopics.length > 0 ? trendingTopics : [
    { id: 'gpt-4', label: 'GPT-4', count: 0 },
    { id: 'dalle', label: 'DALL-E', count: 0 },
    { id: 'claude', label: 'Claude AI', count: 0 },
    { id: 'midjourney', label: 'Midjourney', count: 0 },
    { id: 'llm', label: 'Large Language Models', count: 0 }
  ];


  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };


    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };


  return (
    <Box sx={{ p: 2, width: '100%', boxSizing: 'border-box' }}>
      {/* Center Section: User Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, pb: 3 }}>
        {/* Preferences Button - Only show when not authenticated */}
        {!isAuthenticated && (
          <IconButton
            color="inherit"
            onClick={() => navigate('/preferences')}
            size="small"
            title="Preferences"
          >
            <Settings fontSize="small" />
          </IconButton>
        )}

        {!isAuthenticated ? (
          <>
            <Button
              startIcon={<Edit fontSize="small" />}
              variant="text"
              onClick={() => navigate('/write')}
              sx={{
                textTransform: 'none',
                display: { xs: 'none', sm: 'flex' },
                color: 'text.secondary'
              }}
            >
              Write
            </Button>

            <IconButton
              color="inherit"
              onClick={() => navigate('/write')}
              sx={{ display: { xs: 'flex', sm: 'none' } }}
            >
              <EditIcon size={20} />
            </IconButton>

            <IconButton
              color="inherit"
              onClick={handleNotificationOpen}
              size="small"
            >
              <Badge badgeContent={3} color="error">
                <Bell size={20} />
              </Badge>
            </IconButton>

            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 0.5 }}
            >
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                sx={{ width: 32, height: 32 }}
              >
                {user?.name?.[0] || 'U'}
              </Avatar>
            </IconButton>
          </>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="text"
              onClick={() => navigate('/auth')}
              sx={{
                textTransform: 'none',
                color: 'text.secondary'
              }}
            >
              Sign in
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/auth?mode=signup')}
              sx={{
                textTransform: 'none',
                borderRadius: 8,
                px: { xs: 2, sm: 3 }
              }}
            >
              Get Started
            </Button>
          </Stack>
        )}
      </Box>
      {/* Recommended Topics */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Sparkles size={20} color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight={700}>
            Recommended Topics
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Explore the most popular AI topics and stay updated with the latest trends
        </Typography>

        <Stack spacing={1.5}>
          {displayRecommendedTopics.map((topic) => (
            <Box
              key={topic.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: selectedCategory === topic.label ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08)
                }
              }}
            >
              <Typography
                variant="body2"
                fontWeight={selectedCategory === topic.label ? 600 : 500}
                sx={{
                  flex: 1,
                  color: selectedCategory === topic.label ? 'primary.main' : 'text.primary',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                {topic.label}
              </Typography>
              {topic.count !== undefined && topic.count > 0 && (
                <Chip
                  label={topic.count}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>

        <Box
          sx={{
            mt: 2,
            textAlign: 'center',
            color: 'primary.main',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          See all topics
        </Box>
      </Paper>

      {/* Trending Now */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TrendingUp size={20} color={theme.palette.success.main} />
          <Typography variant="h6" fontWeight={700}>
            Trending Now
          </Typography>
        </Stack>

        <Stack spacing={1} direction="row" flexWrap="wrap" useFlexGap>
          {displayTrendingTopics.map((topic) => (
            <Chip
              key={topic.id}
              label={topic.count !== undefined && topic.count > 0 ? `${topic.label} (${topic.count})` : topic.label}
              variant="outlined"
              size="medium"
              sx={{
                borderRadius: 6,
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  borderColor: 'success.main',
                  color: 'success.main'
                }
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* Reading List Promo */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          📚 Create Your Reading List
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Save articles and organize them into custom collections
        </Typography>
        <Box
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            textAlign: 'center',
            py: 1,
            borderRadius: 1,
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }}
        >
          Get Started
        </Box>
      </Paper>
    </Box>
  );
};

export default RightSection;