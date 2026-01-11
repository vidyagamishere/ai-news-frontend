import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  InputBase,
  Box,
  useMediaQuery,
  useTheme,
  Container,
  Select,
  FormControl,
  MenuItem
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Search,
  TrendingUp,
  Menu as MenuIcon
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

  // Use context values if props are not provided
  const searchContext = useSearch();
  const finalOnSearch = onSearch || searchContext.onSearch;
  const finalCategoryId = searchCategoryId ?? searchContext.categoryId;
  const finalShowSearch = showSearch || searchContext.showSearch;

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        background: 'white',
      }}
    >


      <Toolbar sx={{ px: { lg: 2 }, py: 1 }}>
        {/* Left: Mobile Menu Icon */}
        {isMobile && onMenuClick && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 1 }}
            title="Open Menu"
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Center: Search Bar (Desktop) or Title (Mobile) */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}>
          {/* Mobile Title */}
          {isMobile && (
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 700, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
            >
              Vidyagam
            </Typography>
          )}
          {!isMobile && finalShowSearch && finalOnSearch && (
            <Box sx={{ width: { md: 300, lg: 400 } }}>
              <EnhancedSearchBar
                onSearch={finalOnSearch}
                categoryId={finalCategoryId}
                placeholder="Search AI content..."
                showSuggestions={true}
              />
            </Box>
          )}
        </Box>

        {/* Right: Icons and Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Mobile Trending Icon */}
          {isMobile && onTrendingClick && (
            <IconButton color="inherit" size="small" onClick={onTrendingClick} title="Trending Topics">
              <TrendingUp size={20} />
            </IconButton>
          )}

          {/* Date Filter (Desktop only in this row) */}
          {!isMobile && dateFilter !== undefined && onDateFilterChange && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={dateFilter}
                onChange={(e: SelectChangeEvent<number>) => onDateFilterChange(e.target.value as 1 | 7 | 30 | 365)}
                sx={{ bgcolor: 'background.paper', borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
              >
                <MenuItem value={1}>Last 24h</MenuItem>
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={365}>Last year</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Toolbar>

      {/* Mobile-only second row for Search and Date Filter */}
      {isMobile && (
        <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 2, borderTop: 1, borderColor: 'divider' }}>
          {finalShowSearch && finalOnSearch && (
            <EnhancedSearchBar
              onSearch={finalOnSearch}
              categoryId={finalCategoryId}
              placeholder="Search AI content..."
              showSuggestions={true}
            />
          )}
          {dateFilter !== undefined && onDateFilterChange && (
            <FormControl size="small" fullWidth>
              <Select
                value={dateFilter}
                onChange={(e: SelectChangeEvent<number>) => onDateFilterChange(e.target.value as 1 | 7 | 30 | 365)}
                sx={{ bgcolor: 'background.paper', borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
              >
                <MenuItem value={1}>Last 24h</MenuItem>
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={365}>Last year</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      )}
    </AppBar>
  );
};

export default Header;