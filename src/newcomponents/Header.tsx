import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  InputBase,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  useMediaQuery,
  useTheme,
  Container
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Search,
  Bell,
  Edit,
  Menu as MenuIcon,
  User,
  Settings,
  LogOut,
  BookmarkPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import { useSearch } from '../contexts/SearchContext';

const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.08),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
      '&:focus': {
        width: '50ch',
      },
    },
  },
}));

interface HeaderProps {
  onMenuClick?: () => void;
  isAuthenticated?: boolean;
  user?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  onSearch?: (query: string) => void;
  searchCategoryId?: number;
  showSearch?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  isAuthenticated = false,
  user,
  onSearch,
  searchCategoryId,
  showSearch = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  // Use context values if props are not provided
  const searchContext = useSearch();
  const finalOnSearch = onSearch || searchContext.onSearch;
  const finalCategoryId = searchCategoryId ?? searchContext.categoryId;
  const finalShowSearch = showSearch || searchContext.showSearch;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        background: 'none',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0, sm: 2 } }}>
          {/* Right Section: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'left', gap: { xs: 0.5, sm: 2 } }}>
            {/* Search Bar - Desktop */}
            {finalShowSearch && finalOnSearch && !isMobile && (
              <Box sx={{ width: { md: 400, lg: 500 }, mr: 2 }}>
                <EnhancedSearchBar
                  onSearch={finalOnSearch}
                  categoryId={finalCategoryId}
                  placeholder="Search AI content..."
                  showSuggestions={true}
                />
              </Box>
            )}

            {isMobile && (
              <IconButton color="inherit" size="small">
                <Search size={20} />
              </IconButton>
            )}
          </Box>
          
          {/* Center Section: Logo */}
          <Box sx={{ display: 'flex', alignItems: 'left', gap: { xs: 0.5, sm: 2 } }}>
            {isAuthenticated ? (
              <>
                <Button
                  startIcon={<Edit size={18} />}
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
                  <Edit size={20} />
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
              <>
                <Button
                  variant="text"
                  onClick={() => navigate('/auth')}
                  sx={{
                    textTransform: 'none',
                    color: 'text.secondary',
                    display: { xs: 'none', sm: 'block' }
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
              </>
            )}
          </Box>
        </Toolbar>
      </Container>

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
        <MenuItem onClick={() => handleNavigate('/settings')}>
          <Settings size={18} style={{ marginRight: 12 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleNavigate('/auth')}>
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
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              New article published
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Check out the latest AI breakthrough
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
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
    </AppBar>
  );
};

export default Header;