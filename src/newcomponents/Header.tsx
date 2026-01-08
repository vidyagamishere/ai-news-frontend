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
  Container,
  Select,
  FormControl
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Search,
  Bell,
  Edit,
  Menu as MenuIcon,
  User,
  Settings,
  LogOut,
  BookmarkPlus,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import { useSearch } from '../contexts/SearchContext';
import { useAuth } from '../contexts/AuthContext';
import { Psychology } from '@mui/icons-material';

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
  dateFilter?: 1 | 7 | 30 | 365;
  onDateFilterChange?: (value: 1 | 7 | 30 | 365) => void;
  onPreferencesClick?: () => void;
  onTrendingClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  isAuthenticated = false,
  user,
  onSearch,
  searchCategoryId,
  showSearch = false,
  dateFilter,
  onDateFilterChange,
  onPreferencesClick,
  onTrendingClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { logout } = useAuth();
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

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        background: 'white',
      }}
    >


        <Toolbar sx={{ px: {lg : 5 }, py: 1 }}>
          
          {/* Middle Section: Search Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, flex: 1 }}>
            {/* Search Bar - Desktop */}
            {finalShowSearch && finalOnSearch && !isMobile && (
              <Box sx={{ width: { md: 300, lg: 400 } }}>
                <EnhancedSearchBar
                  onSearch={finalOnSearch}
                  categoryId={finalCategoryId}
                  placeholder="Search AI content..."
                  showSuggestions={true}
                />
              </Box>
            )}

            {isMobile && (
              <>
                <IconButton color="inherit" size="small">
                  <Search size={20} />
                </IconButton>
                {onTrendingClick && (
                  <IconButton color="inherit" size="small" onClick={onTrendingClick} title="Trending Topics">
                    <TrendingUp size={20} />
                  </IconButton>
                )}
              </>
            )}
          </Box>
          
          {/* Right Section: Date Filter */}
          {dateFilter !== undefined && onDateFilterChange && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={dateFilter}
                  onChange={(e: SelectChangeEvent<number>) => onDateFilterChange(e.target.value as 1 | 7 | 30 | 365)}
                  sx={{ 
                    bgcolor: 'background.paper', 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider'
                    }
                  }}
                >
                  <MenuItem value={1}>Last 24h</MenuItem>
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                  <MenuItem value={365}>Last year</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Right Section: User Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <>
                {/* Preferences */}
                <IconButton
                  onClick={onPreferencesClick}
                  size="small"
                  title="Preferences"
                >
                  <Settings fontSize="small" />
                </IconButton>

                {/* Write Button */}
                <Button
                  startIcon={<Edit size={16} />}
                  variant="text"
                  onClick={() => navigate('/write')}
                  sx={{
                    textTransform: 'none',
                    display: { xs: 'none', sm: 'flex' },
                  }}
                >
                  Write
                </Button>

                {/* Notifications */}
                <IconButton size="small">
                  <Badge badgeContent={3} color="error">
                    <Bell size={20} />
                  </Badge>
                </IconButton>

                {/* User Avatar */}
                <IconButton
                  size="small"
                  onClick={() => handleProfileMenuOpen}
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
                {/* Sign In / Sign Up for non-authenticated users */}
                <Button
                  variant="text"
                  onClick={() => navigate('/auth')}
                  sx={{ textTransform: 'none' }}
                >
                  Sign in
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/auth?mode=signup')}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 8,
                    px: 3,
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </Box>
        </Toolbar>

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

      {/* Add Logout Button */}
      {isAuthenticated && (
        <IconButton
          onClick={handleLogout}
          title="Sign Out"
          sx={{ ml: 1 }}
        >
          <LogOut size={20} />
        </IconButton>
      )}
    </AppBar>
  );
};

export default Header;