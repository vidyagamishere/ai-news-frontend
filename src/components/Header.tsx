import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Paper,
  TextField,
  InputAdornment,
  Collapse,
  Badge,
  Stack,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Bookmark as BookmarkIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  console.log('Header Auth Debug:', { user, hasUser: !!user });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('🔍 Searching for:', searchQuery);
      setIsSearchOpen(false);
    }
  };

  const menuItems = [
    {
      icon: HomeIcon,
      label: 'Dashboard',
      path: '/dashboard',
      color: 'primary.main'
    },
    {
      icon: BookmarkIcon,
      label: 'My Categories',
      path: '/categories',
      color: 'secondary.main'
    },
    {
      icon: SettingsIcon,
      label: 'Preferences',
      path: '/preferences',
      color: 'info.main'
    },
    {
      icon: PersonIcon,
      label: 'Profile',
      path: '/profile',
      color: 'success.main'
    },
    {
      icon: NotificationsIcon,
      label: 'Notifications',
      path: '/notifications',
      color: 'warning.main'
    }
  ];

  return (
    <>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={scrolled ? 4 : 1}
        sx={{
          backgroundColor: scrolled ? 'background.paper' : 'background.paper',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          transition: 'all 0.3s'
        }}
      >
        <Toolbar>
          {/* Menu Button */}
          <IconButton
            edge="start"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            sx={{ mr: 2 }}
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>

          {/* Logo */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Typography
              variant="h6"
              sx={{
                background: 'linear-gradient(90deg, #2563eb, #7c3aed, #ec4899)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}
            >
              ✨ AI News Hub
            </Typography>
          </Box>

          {/* Search Button */}
          <IconButton
            edge="end"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Badge variant="dot" color="error" invisible={isSearchOpen}>
              <SearchIcon />
            </Badge>
          </IconButton>
        </Toolbar>

        {/* Search Bar Collapse */}
        <Collapse in={isSearchOpen}>
          <Box sx={{ px: 2, pb: 2, borderTop: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search AI news, research papers, tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper'
                }
              }}
            />
          </Box>
        </Collapse>
      </AppBar>

      {/* Spacer for fixed AppBar */}
      <Toolbar />
      {isSearchOpen && <Box sx={{ height: 60 }} />}

      {/* Drawer Menu */}
      <Drawer
        anchor="left"
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
          }
        }}
      >
        {/* User Profile Section */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: 'white'
          }}
        >
          <IconButton
            onClick={() => setIsMenuOpen(false)}
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.2)'
            }}
          >
            <CloseIcon />
          </IconButton>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Avatar
              src={user?.profileImage}
              alt={user?.name}
              sx={{ 
                width: 64, 
                height: 64,
                border: '4px solid rgba(255,255,255,0.3)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #fbbf24 0%, #ec4899 100%)'
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle1" fontWeight="bold" noWrap>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }} noWrap>
                {user?.email}
              </Typography>
              <Chip
                label={user?.subscriptionTier === 'premium' ? '⭐ Premium' : '🆓 Free'}
                size="small"
                sx={{
                  mt: 0.5,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '0.7rem'
                }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Menu Items */}
        <List sx={{ flex: 1, p: 2 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #1e40af, #6d28d9)',
                      }
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(37, 99, 235, 0.08)'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Icon sx={{ color: isActive ? 'white' : item.color }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Stats Section */}
        <Paper sx={{ m: 2, p: 2, backgroundColor: 'background.paper' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Your Activity
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Articles Read
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="primary">
                127
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Bookmarks
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="secondary">
                34
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Streak
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                🔥 7 days
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Divider />

        {/* Logout Button */}
        <Box sx={{ p: 2 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(90deg, #ef4444, #ec4899)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(90deg, #dc2626, #db2777)',
              }
            }}
          >
            <ListItemIcon>
              <LogoutIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </ListItemButton>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
