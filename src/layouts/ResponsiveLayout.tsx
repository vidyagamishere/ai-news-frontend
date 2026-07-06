import {
  Box,
  CssBaseline,
  Drawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import * as React from 'react';
import { useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RightSection from '../newcomponents/RightSection';
import SideNav from '../newcomponents/SideNav';

const LEFT_WIDTH = 280;
const RIGHT_WIDTH = 300;
interface OutletContextType {
  dateFilter?: 1 | 7 | 30 | 365;
  onDateFilterChange?: (filter: 1 | 7 | 30 | 365) => void;
  selectedTab?: 'news' | 'audio' | 'video' | 'posts' | 'learning' | 'courses' | 'jobs' | 'events';
  onTabChange?: (tab: 'news' | 'audio' | 'video' | 'posts' | 'learning' | 'courses' | 'jobs' | 'events') => void;
  onCategoryChangeHandlerSet?: (handler: (category: string) => void) => void;
  onSettingsClickHandlerSet?: (handler: () => void) => void;
  onBookmarksClickHandlerSet?: (handler: () => void) => void;
  onStatsClickHandlerSet?: (handler: () => void) => void;
  onSearchStart?: () => void;
  onMenuClick?: () => void;
  onTrendingClick?: () => void;
  onTrendingHandlerSet?: (handler: (topic: string) => void) => void;
}
export default function ResponsiveLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [leftOpen, setLeftOpen] = React.useState(false);
  const [rightOpen, setRightOpen] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState<1 | 7 | 30 | 365>(7);
  const [selectedTab, setSelectedTab] = React.useState<'news' | 'audio' | 'video' | 'posts' | 'learning' | 'courses' | 'jobs' | 'events'>('news');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  // Store the original handlers in refs to avoid re-renders
  const originalHandlerRef = React.useRef<((category: string) => void) | undefined>(undefined);
  const onTrendingClickHandlerRef = React.useRef<((topic: string) => void) | undefined>(undefined);
  const onSettingsClickHandlerRef = React.useRef<(() => void) | undefined>(undefined);
  const onBookmarksClickHandlerRef = React.useRef<(() => void) | undefined>(undefined);
  const onStatsClickHandlerRef = React.useRef<(() => void) | undefined>(undefined);

  // Check if we're on Landing page (no SideNav needed)
  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';
  const isDashboardRoute = location.pathname.includes('/dashboard');

  // Wrapper function that updates local state and calls the original handler
  const wrappedCategoryHandler = React.useCallback((category: string) => {
    setSelectedCategory(category);

    if (!isDashboardRoute) {
      if (isAuthenticated) {
        navigate('/dashboard', {
          state: {
            preselectedCategory: category,
            preselectedTab: selectedTab,
          },
        });
        return;
      }

      // Keep unauthenticated landing page interactions local so category
      // clicks update the center feed instead of no-op navigation.
      if (isLandingPage && originalHandlerRef.current) {
        originalHandlerRef.current(category);
        return;
      } else {
        navigate('/');
      }
      return;
    }

    if (originalHandlerRef.current) {
      originalHandlerRef.current(category);
    }
  }, [isAuthenticated, isDashboardRoute, isLandingPage, navigate, selectedTab]);

  // Function to set the category change handler from child components
  const handleSetCategoryHandler = React.useCallback((handler: (category: string) => void) => {
    originalHandlerRef.current = handler;
  }, []);

  // Function to set the settings click handler from child components
  const handleSetSettingsHandler = React.useCallback((handler: () => void) => {
    onSettingsClickHandlerRef.current = handler;
  }, []);

  // Add handler setters (around line 90):
  const handleSetBookmarksHandler = useCallback((handler: () => void) => {
    onBookmarksClickHandlerRef.current = handler;
  }, []);

  const handleSetStatsHandler = useCallback((handler: () => void) => {
    onStatsClickHandlerRef.current = handler;
  }, []);

  const handleSetTrendingHandler = React.useCallback((handler: (topic: string) => void) => {
    onTrendingClickHandlerRef.current = handler;
  }, []);

  const handleLeftDrawerOpen = () => setLeftOpen(true);
  const handleRightDrawerOpen = () => setRightOpen(true);

  const handleTabChange = (tab: 'news' | 'audio' | 'video' | 'posts' | 'learning' | 'courses' | 'jobs' | 'events') => {
    console.log('📑 ResponsiveLayout: Tab changed to:', tab);
    setSelectedTab(tab);

    if (!isDashboardRoute) {
      if (isAuthenticated) {
        navigate('/dashboard', {
          state: {
            preselectedTab: tab,
            preselectedCategory: tab === 'news' ? 'All' : selectedCategory,
          },
        });
      } else {
        navigate('/');
      }
      return;
    }

    // If switching to 'news' tab (home), reset category to 'All'
    if (tab === 'news') {
      console.log('🏠 ResponsiveLayout: Resetting category to All');
      wrappedCategoryHandler('All');
    }

    // Close mobile drawer
    if (isMobile) {
      setLeftOpen(false);
    }
  };

  const handleSearchStart = React.useCallback(() => {
    console.log('🔍 ResponsiveLayout: Search started, clearing category selection');
    setSelectedCategory('All');
  }, []);

  const handleTrendingTopicClick = React.useCallback((topic: string) => {
    console.log('🔥 ResponsiveLayout: Trending topic clicked:', topic);

    if (!isDashboardRoute) {
      if (isAuthenticated) {
        navigate('/dashboard', {
          state: {
            preselectedTab: 'news',
            initialSearchQuery: topic,
          },
        });
      } else {
        navigate('/');
      }

      if (isMobile) {
        setRightOpen(false);
      }
      return;
    }

    // Trigger search through the handler if available
    if (onTrendingClickHandlerRef.current) {
      onTrendingClickHandlerRef.current(topic);
    }
    // Open the drawer on mobile
    if (isMobile) {
      setRightOpen(false);
    }
  }, [isAuthenticated, isDashboardRoute, isMobile, navigate]);


  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? leftOpen : true}
        onClose={() => setLeftOpen(false)}
        sx={{
          width: LEFT_WIDTH,
          '& .MuiDrawer-paper': {
            width: LEFT_WIDTH,
            borderRight: '1px solid ' + theme.palette.divider,
            backgroundColor: 'background.default',
          },
        }}
      >
        <SideNav
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          onBookmarksClick={() => onBookmarksClickHandlerRef.current?.()}
          onStatsClick={() => onStatsClickHandlerRef.current?.()}
          onSettingsClick={() => {
            if (onSettingsClickHandlerRef.current) {
              onSettingsClickHandlerRef.current();
            }
          }}
        />
      </Drawer>


      {/* CENTER CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 2, md: 0, lg: 2 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
          <Outlet context={{
            dateFilter,
            onDateFilterChange: setDateFilter,
            selectedTab,
            onTabChange: handleTabChange,
            onCategoryChangeHandlerSet: handleSetCategoryHandler,
            onSettingsClickHandlerSet: handleSetSettingsHandler,
            onBookmarksClickHandlerSet: handleSetBookmarksHandler,
            onStatsClickHandlerSet: handleSetStatsHandler,
            onSearchStart: handleSearchStart,
            onMenuClick: handleLeftDrawerOpen,
            onTrendingClick: handleRightDrawerOpen,
            onTrendingHandlerSet: handleSetTrendingHandler,
          } as OutletContextType} />
        </Box>
      </Box>

      {/* RIGHT SECTION - Show on Landing page */}

      <Drawer
        anchor="right"
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? rightOpen : true}
        onClose={() => setRightOpen(false)}
        sx={{
          flexGrow: 1,
          display: 'flex',
          maxWidth: RIGHT_WIDTH,
          width: RIGHT_WIDTH,
          //marginRight: isMobile ? 0 : 2,
          '& .MuiDrawer-paper': {
            width: RIGHT_WIDTH,
            backgroundColor: 'background.default',
            borderLeft: 'none',
            overflow: 'auto',
          },
        }}
      >
        <RightSection
          onCategoryChange={wrappedCategoryHandler}
          selectedCategory={selectedCategory}
          onSettingsClick={() => onSettingsClickHandlerRef.current?.()}
          onTrendingClick={handleTrendingTopicClick}
          onStatsClick={() => onStatsClickHandlerRef.current?.()}  // Add this line

        />
      </Drawer>

    </Box>
  );
}
