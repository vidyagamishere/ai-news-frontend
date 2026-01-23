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
  const [categoryChangeHandler, setCategoryChangeHandler] = React.useState<((category: string) => void) | undefined>(undefined);

  // Check if we're on Landing page (no SideNav needed)
  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';

  // Wrapper function to properly set the category change handler
  // React's setState treats functions specially, so we need to wrap it
  const handleSetCategoryHandler = React.useCallback((handler: (category: string) => void) => {
    setCategoryChangeHandler(() => handler);
  }, []);

  const handleLeftDrawerOpen = () => setLeftOpen(true);
  const handleRightDrawerOpen = () => setRightOpen(true);

  const handleTabChange = (tab: 'news' | 'audio' | 'video' | 'posts' | 'learning') => {
    console.log('📑 ResponsiveLayout: Tab changed to:', tab);
    setSelectedTab(tab);

    // If switching to 'news' tab (home), reset category to 'All'
    if (tab === 'news' && categoryChangeHandler) {
      console.log('🏠 ResponsiveLayout: Resetting category to All');
      categoryChangeHandler('All');
    }

    // Close mobile drawer
    if (isMobile) {
      setLeftOpen(false);
    }
  };

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
            onMenuClick: handleLeftDrawerOpen,
            onTrendingClick: handleRightDrawerOpen,
          }} />
        </Box>

        {/* RIGHT SECTION - Desktop (scrolls with page) */}
        {isLandingPage && !isMobile && (
          <Box
            sx={{
              width: RIGHT_WIDTH,
              flexShrink: 0,
              px: 2
            }}
          >
            <RightSection onCategoryChange={categoryChangeHandler} />
          </Box>
        )}
      </Box>

      {/* RIGHT SECTION - Mobile Drawer */}
      {isLandingPage && isMobile && (
        <Drawer
          anchor="right"
          variant="temporary"
          open={rightOpen}
          onClose={() => setRightOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: RIGHT_WIDTH,
              backgroundColor: 'background.default',
              borderLeft: 'none',
            },
          }}
        >
          <RightSection onCategoryChange={categoryChangeHandler} />
        </Drawer>
      )};
      
    </Box>
  );
}
