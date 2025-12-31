import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  alpha,
  IconButton
} from '@mui/material';
import {
  Newspaper,
  Podcast,
  Video,
  MessageSquare,
  GraduationCap,
  Home,
  TrendingUp,
  Bookmark,
  Settings,
  Menu as MenuIcon,
  X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const SideNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={22} />,
      path: '/'
    },
    {
      id: 'news',
      label: 'Latest News',
      icon: <Newspaper size={22} />,
      path: '/news',
      badge: 12
    },
    {
      id: 'podcasts',
      label: 'Podcasts & Audio',
      icon: <Podcast size={22} />,
      path: '/podcasts'
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: <Video size={22} />,
      path: '/videos'
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: <MessageSquare size={22} />,
      path: '/posts'
    },
    {
      id: 'learning',
      label: 'Learning',
      icon: <GraduationCap size={22} />,
      path: '/learning'
    }
  ];

  const secondaryNavItems: NavItem[] = [
    {
      id: 'trending',
      label: 'Trending',
      icon: <TrendingUp size={22} />,
      path: '/trending'
    },
    {
      id: 'saved',
      label: 'Saved Articles',
      icon: <Bookmark size={22} />,
      path: '/saved'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={22} />,
      path: '/settings'
    }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'none',
        pt: 2
      }}
    >
      {/* Mobile Header with Close Button */}
      {isMobile && (
        <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
              letterSpacing: '-0.02em'
            }}
          >
            AI Insights
          </Typography>
          <IconButton onClick={handleDrawerToggle} size="small">
            <X size={20} />
          </IconButton>
        </Box>
      )}

      {/* Main Navigation */}
      <Box sx={{ px: 2, mb: 1 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'text.secondary',
            letterSpacing: '0.05em'
          }}
        >
          Explore
        </Typography>
      </Box>
      <List sx={{ px: 1 }}>
        {mainNavItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.18),
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main'
                  }
                },
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: isActive(item.path) ? 600 : 500
                }}
              />
              {item.badge && (
                <Box
                  sx={{
                    backgroundColor: 'error.main',
                    color: 'white',
                    borderRadius: '12px',
                    px: 1,
                    py: 0.25,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    minWidth: '24px',
                    textAlign: 'center'
                  }}
                >
                  {item.badge}
                </Box>
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Secondary Navigation */}
      <Box sx={{ px: 2, mb: 1 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'text.secondary',
            letterSpacing: '0.05em'
          }}
        >
          Library
        </Typography>
      </Box>
      <List sx={{ px: 1 }}>
        {secondaryNavItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.18),
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main'
                  }
                },
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: isActive(item.path) ? 600 : 500
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Bottom Section */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Box
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            borderRadius: 2,
            p: 2
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Upgrade to Pro
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            Get unlimited access to all content and features
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
            onClick={() => handleNavigate('/upgrade')}
          >
            Upgrade Now
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            left: 16,
            bottom: 16,
            zIndex: 1200,
            backgroundColor: 'primary.main',
            color: 'white',
            boxShadow: 3,
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <MenuIcon size={24} />
        </IconButton>
      )}

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            background: 'none'
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default SideNav;