import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Stack,
  Divider,
  useTheme,
  IconButton,
  Button,
  Avatar,
  Badge,
  useMediaQuery,
  Container,
  Menu,
  MenuItem
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  TrendingUp,
  Sparkles,
  Search,
  Bell,
  Menu as MenuIcon,
  User,
  LogOut,
  BookmarkPlus,
  Settings,
  Edit,
  Trophy
} from 'lucide-react';
import { useDashboardContext } from '../contexts/DashboardContext';
import { useNavigate, useLocation } from 'react-router-dom';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import { useSearch } from '../contexts/SearchContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { cacheService, CACHE_DURATION } from '../utils/cacheService';


interface Topic {
  id: string;
  label: string;
  count?: number;
  categoryId?: number;
  isPreferred?: boolean;
}

// Add prop to receive category change handler
interface RightSectionProps {
  onCategoryChange?: (categoryName: string) => void;
  selectedCategory?: string;
  onSettingsClick?: () => void;
  onTrendingClick?: (topic: string) => void;
  onStatsClick?: () => void;  // Add this line
}

const RightSection: React.FC<RightSectionProps> = ({ onCategoryChange, selectedCategory: selectedCategoryProp, onSettingsClick, onTrendingClick, onStatsClick }) => {
  const theme = useTheme();
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');
  const isLanding = location.pathname === '/' || location.pathname === '/landing';
  
  // Add unique ID for debugging
  const instanceId = React.useRef(Math.random().toString(36).substr(2, 9));
  
  useEffect(() => {
    console.log(`🔍 RightSection Instance: ${instanceId.current}`);
    console.log(`📍 Location: ${location.pathname}`);
    console.log(`🎯 Is Dashboard: ${isDashboard}`);
    console.log(`🏠 Is Landing: ${isLanding}`);
  }, [location.pathname, isDashboard, isLanding]);
  
  const { user, isAuthenticated, logout } = useAuth();
  
  // ✅ ALWAYS call the hook, but only use values if on dashboard
  let dashboardContext;
  try {
    dashboardContext = useDashboardContext();
  } catch (e) {
    // Context not available
    dashboardContext = { content: [], categories: [], selectedCategory: 'All' };
  }
  
  // Only use dashboard context values if on dashboard page
  const contextContent = isDashboard ? dashboardContext.content : [];
  const contextCategories = isDashboard ? dashboardContext.categories : [];
  const contextSelectedCategory = isDashboard ? dashboardContext.selectedCategory : 'All';
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  
  // Fetch categories directly from API
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: Add state for trending keywords
  const [trendingKeywords, setTrendingKeywords] = useState<Topic[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('🔄 RightSection: Fetching categories directly from API...');
        const response = await cacheService.get(
          'available_categories', 
          () => apiService.getAvailableCategories(), 
          CACHE_DURATION.LONG
        );
        
        if (response && Array.isArray(response.categories)) {
          console.log('✅ RightSection: Categories fetched:', response.categories.length);
          console.log('📊 RightSection: Sample category:', response.categories[0]);
          setAvailableCategories(response.categories);
        }
      } catch (error) {
        console.error('❌ RightSection: Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ✅ IMPROVED: Fetch trending keywords with better error handling
  useEffect(() => {
    const fetchTrendingKeywords = async () => {
      try {
        setTrendingLoading(true);
        console.log('🔥 RightSection: Fetching trending keywords from API...');
        
        const response = await cacheService.get(
          'trending_keywords', 
          () => apiService.getTrendingKeywords(1, 10),  // Last 1 day, max 10 keywords
          CACHE_DURATION.TRENDING  // 10 minutes cache
        );
        
        // ✅ Validate response structure
        if (response && response.trending_keywords && Array.isArray(response.trending_keywords)) {
          console.log('✅ RightSection: Trending keywords fetched:', response.trending_keywords.length);
          console.log('📊 Sample keyword:', response.trending_keywords[0]);
          
          // Transform to Topic format if needed
          const transformedKeywords = response.trending_keywords.map(kw => ({
            id: kw.id || kw.label.toLowerCase().replace(/\s+/g, '-'),
            label: kw.label,
            count: kw.count || 0
          }));
          
          setTrendingKeywords(transformedKeywords);
        } else {
          console.warn('⚠️ RightSection: Invalid or empty trending keywords response');
          console.warn('Response structure:', response);
          setTrendingKeywords([]);
        }
      } catch (error) {
        console.error('❌ RightSection: Failed to fetch trending keywords:', error);
        setTrendingKeywords([]);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrendingKeywords();
    
    // Refresh trending keywords every 10 minutes
    const interval = setInterval(fetchTrendingKeywords, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Use directly fetched categories with counts from API
  // For authenticated users, prioritize their selected categories
  const recommendedTopics: Topic[] = useMemo(() => {
    let topics = availableCategories.map(category => ({
      id: category.name.toLowerCase().replace(/\s+/g, '-'),
      label: category.name,
      count: category.count || 0,
      categoryId: category.id,  // Keep actual category ID
      isPreferred: false  // Will be updated below
    }));

    // If user is authenticated and has category preferences, prioritize those
    if (isAuthenticated && user?.preferences) {
      const userCategoryIds = (user.preferences as any)?.category_ids_selected || [];
      const userCategories = availableCategories.filter(cat => userCategoryIds.includes(cat.id));
      const otherCategories = availableCategories.filter(cat => !userCategoryIds.includes(cat.id));
      
      // Show user's selected categories first, then others sorted by count
      topics = [
        ...userCategories.map(cat => ({
          id: cat.name.toLowerCase().replace(/\s+/g, '-'),
          label: cat.name,
          count: cat.count || 0,
          categoryId: cat.id,
          isPreferred: true  // Mark as preferred
        })),
        ...otherCategories.map(cat => ({
          id: cat.name.toLowerCase().replace(/\s+/g, '-'),
          label: cat.name,
          count: cat.count || 0,
          categoryId: cat.id,
          isPreferred: false  // Mark as not preferred
        })).sort((a, b) => (b.count || 0) - (a.count || 0))
      ];
    } else {
      // For non-authenticated users, sort by count and mark all as preferred
      topics = topics.map(t => ({ ...t, isPreferred: true }));
      topics.sort((a, b) => (b.count || 0) - (a.count || 0));
    }

    return topics.slice(0, 11);
  }, [availableCategories, isAuthenticated, user]);

  // Keep selectedCategory for UI state
  const content = isDashboard ? contextContent : [];
  const selectedCategory = selectedCategoryProp || (isDashboard ? contextSelectedCategory : 'All');

  console.log('📊 RightSection: Using categories with counts:', availableCategories.length);
  console.log('📍 RightSection: Current page:', isDashboard ? 'Dashboard' : isLanding ? 'Landing' : 'Other');
  console.log('🎯 RightSection: Selected category:', selectedCategory);

  // Extract trending topics from actual content
  const trendingTopics = useMemo(() => {
    const topicCounts = new Map<string, number>();

    content.forEach(article => {
      article.topics?.forEach((topic: any) => {
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
  const displayTrendingTopics = useMemo(() => {
    // Priority 1: Use real trending keywords from API (if available and loaded)
    if (!trendingLoading && trendingKeywords.length > 0) {
      console.log('✅ Displaying API trending keywords:', trendingKeywords.length);
      return trendingKeywords;
    }
    
    // Priority 2: Extract from actual content (existing logic)
    if (trendingTopics.length > 0) {
      console.log('✅ Displaying content-based trending:', trendingTopics.length);
      return trendingTopics;
    }
    
    // Priority 3: Fallback to generic AI topics
    console.log('⚠️ Using fallback trending topics');
    return [
      { id: 'generative-ai', label: 'Generative AI', count: 0 },
      { id: 'machine-learning', label: 'Machine Learning', count: 0 },
      { id: 'ai-applications', label: 'AI Applications', count: 0 },
      { id: 'llm', label: 'Large Language Models', count: 0 },
      { id: 'computer-vision', label: 'Computer Vision', count: 0 }
    ];
  }, [trendingKeywords, trendingTopics, trendingLoading]);

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleSettingsClick = () => {
    handleClose();
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      // Fallback to navigation if handler not provided
      navigate('/preferences');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  const handleCategoryClick = (categoryName: string) => {
    console.log('📂 Category clicked:', categoryName);
    
    // Call the parent handler if provided
    if (onCategoryChange) {
      onCategoryChange(categoryName);
    }
    
    // For non-authenticated users on landing, navigate to auth
    {/*if (!isAuthenticated && isLanding) {
      navigate('/auth?mode=signup');
    }*/}
  };

  return (
    <Box 
      sx={{ 
        p: 2, 
        width: '100%', 
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.divider,
          borderRadius: '4px',
          '&:hover': {
            background: theme.palette.action.hover,
          },
        },
      }}
      data-rightsection-id={instanceId.current}
    >
      {/* Authentication Section - Only show on Landing page for non-authenticated users */}
      {isLanding && !isAuthenticated && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
            background: 'none'
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Join Vidyagam
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get personalized AI content and insights
          </Typography>
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/auth?mode=signup')}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                py: 1.25,
                fontWeight: 600
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/auth')}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                py: 1.25,
                fontWeight: 600
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Paper>
      )}

      {/* User Actions - Only show for authenticated users */}
      {isAuthenticated && (
        <Stack 
          direction="row" 
          spacing={1} 
          justifyContent="center"
          sx={{ mb: 2 }}
        >
          <IconButton
            onClick={handleProfileMenuOpen}
            size="medium"
            title="Profile"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: 'primary.main'
              }
            }}
          >
           <User size={20} />
          </IconButton>
          {/*}
            <IconButton
            onClick={() => navigate('/write')}
            size="medium"
            title="Write"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: 'primary.main'
              }
            }}
          >
            <Edit size={20} />
          </IconButton>
          <IconButton
            onClick={(e) => handleNotificationOpen(e)}
            size="medium"
            title="Notifications"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: 'primary.main'
              }
            }}
          >
            <Badge badgeContent={3} color="error">
              <Bell size={20} />
            </Badge>
          </IconButton>
          <IconButton
            onClick={() => navigate('/settings')}
            size="medium"
            title="Settings"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: 'primary.main'
              }
            }}
          >
            <Settings size={20} />
          </IconButton> */}
        </Stack>
      )}

      {/* Recommended Topics */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          background: 'none'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <Sparkles size={20} color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight={700}>
            Recommended Topics
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {displayRecommendedTopics.map((topic) => {
            const isSelected = selectedCategory === topic.label;
            const isPreferred = topic.isPreferred !== false; // Default to true for landing page
            const showPreferenceHint = isDashboard && !isPreferred;
            
            return (
              <Box
                key={topic.id}
                onClick={() => handleCategoryClick(topic.label)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.25,
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                  border: showPreferenceHint ? `1px dashed ${alpha(theme.palette.text.secondary, 0.3)}` : 'none',
                  opacity: showPreferenceHint ? 0.7 : 1,
                  '&:hover': {
                    backgroundColor: isSelected 
                      ? alpha(theme.palette.primary.main, 0.16) 
                      : alpha(theme.palette.primary.main, 0.08),
                    opacity: 1
                  }
                }}
                title={showPreferenceHint ? 'Add to your preferences to see content from this category' : ''}
              >
                <Typography
                  variant="body2"
                  fontWeight={isSelected ? 600 : 500}
                  sx={{
                    flex: 1,
                    color: isSelected 
                      ? 'primary.main' 
                      : showPreferenceHint 
                        ? 'text.secondary'
                        : 'text.primary'
                  }}
                >
                  {showPreferenceHint && '+ '}{topic.label}
                </Typography>
                {topic.count !== undefined && (
                  <Chip
                    label={topic.count}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      minWidth: '28px',
                      backgroundColor: isSelected 
                        ? alpha(theme.palette.primary.main, 0.2)
                        : showPreferenceHint
                          ? alpha(theme.palette.text.secondary, 0.1)
                          : alpha(theme.palette.primary.main, 0.1),
                      color: showPreferenceHint ? 'text.secondary' : 'primary.main'
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Stack>
      </Paper>

      {/* Trending Now */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          background: 'none'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <TrendingUp size={20} color={theme.palette.success.main} />
          <Typography variant="h6" fontWeight={700}>
            Trending Now
          </Typography>
          {trendingLoading && (
            <Typography variant="caption" color="text.secondary">
              (loading...)
            </Typography>
          )}
          {!trendingLoading && trendingKeywords.length > 0 && (
            <Typography variant="caption" color="success.main">
              ({trendingKeywords.length} live)
            </Typography>
          )}
        </Stack>

        <Stack spacing={1} direction="row" flexWrap="wrap" useFlexGap>
          {displayTrendingTopics.map((topic) => (
            <Chip
              key={topic.id}
              label={topic.count !== undefined && topic.count > 0 ? `${topic.label} (${topic.count})` : topic.label}
              variant="outlined"
              size="medium"
              onClick={() => {
                console.log('🔥 Trending topic clicked:', topic.label, 'count:', topic.count);
                if (onTrendingClick) {
                  onTrendingClick(topic.label);
                }
              }}
              sx={{
                borderRadius: 6,
                fontWeight: 500,
                cursor: 'pointer',
                borderColor: topic.count > 0 ? 'success.main' : 'divider',
                color: topic.count > 0 ? 'success.main' : 'text.primary',
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
      {isAuthenticated && (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mt: 2,
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
      )}
      {/* User Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 240, mt: 1 }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.name || 'User Name'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => handleNavigate('/profile')}>
          <User size={18} style={{ marginRight: 12 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/library')}>
          <BookmarkPlus size={18} style={{ marginRight: 12 }} />
          Library
        </MenuItem>
        {/* Add before Preferences menu item: */}
        <MenuItem onClick={() => {
          setAnchorEl(null);
          // Navigate to stats or trigger stats modal
          onStatsClick?.();  // Pass this prop from ResponsiveLayout
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Trophy size={18} />
            <Box>
              <Typography variant="body2">Level {user?.level || 1}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.total_points || 0} points
              </Typography>
            </Box>
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <Settings size={18} style={{ marginRight: 12 }} />
          Preferences
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogOut size={18} style={{ marginRight: 12 }} />
          Sign out
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 360, mt: 1, maxHeight: 400 }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleClose}>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              New article published
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Check out the latest AI breakthrough
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              Someone liked your comment
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your insight on GPT-4 got attention
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleClose} sx={{ justifyContent: 'center', color: 'primary.main' }}>
          <Typography variant="body2">View all notifications</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default RightSection;