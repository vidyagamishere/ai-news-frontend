import * as React from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideNav from '../newcomponents/SideNav';
import RightSection from '../newcomponents/RightSection';

const LEFT_WIDTH = 280;
const RIGHT_WIDTH = 320;
export default function ResponsiveLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const [leftOpen, setLeftOpen] = React.useState(false);
  const [rightOpen, setRightOpen] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState<1 | 7 | 30 | 365>(7);
  const [selectedTab, setSelectedTab] = React.useState<'news' | 'audio' | 'video' | 'posts' | 'learning'>('news');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  
  // Store the original handler in a ref to avoid re-renders
  const originalHandlerRef = React.useRef<((category: string) => void) | undefined>(undefined);

  // Check if we're on Landing page (no SideNav needed)
  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';

  // Wrapper function that updates local state and calls the original handler
  const wrappedCategoryHandler = React.useCallback((category: string) => {
    setSelectedCategory(category);
    if (originalHandlerRef.current) {
      originalHandlerRef.current(category);
    }
  }, []);

  // Function to set the category change handler from child components
  const handleSetCategoryHandler = React.useCallback((handler: (category: string) => void) => {
    originalHandlerRef.current = handler;
  }, []);

  const handleLeftDrawerOpen = () => setLeftOpen(true);
  const handleRightDrawerOpen = () => setRightOpen(true);

  const handleTabChange = (tab: 'news' | 'audio' | 'video' | 'posts' | 'learning') => {
    console.log('📑 ResponsiveLayout: Tab changed to:', tab);
    setSelectedTab(tab);

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
        />
      </Drawer>


      {/* CENTER CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          px: { md: 0, lg: 2 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
          <Outlet context={{
            dateFilter,
            onDateFilterChange: setDateFilter,
            selectedTab,
            onTabChange: handleTabChange,
            onCategoryChangeHandlerSet: handleSetCategoryHandler,
            onSearchStart: handleSearchStart,
            onMenuClick: handleLeftDrawerOpen,
            onTrendingClick: handleRightDrawerOpen,
          }} />
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
            width: RIGHT_WIDTH,
            marginRight: isMobile ? 0 : 2,
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
          />
        </Drawer>
      
    </Box>
  );
}
