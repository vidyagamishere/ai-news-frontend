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
const LEFT_WIDTH = 280;
export default function ResponsiveLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const [leftOpen, setLeftOpen] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState<1 | 7 | 30 | 365>(7);
  const [selectedTab, setSelectedTab] = React.useState<'news' | 'audio' | 'video' | 'posts' | 'learning'>('news');

  // Check if we're on Landing page (no SideNav needed)
  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';

  const handleTabChange = (tab: 'news' | 'audio' | 'video' | 'posts' | 'learning') => {
    console.log('📑 ResponsiveLayout: Tab changed to:', tab);
    setSelectedTab(tab);
    
    // Close mobile drawer
    if (isMobile) {
      setLeftOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />

      {/* LEFT SIDENAV - Only show on Dashboard, not on Landing */}
      {!isLandingPage && (
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
      )}

      {/* CENTER CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto',
          px: { md: 0, lg: 2 },
          // Adjust margin when no sidebar
          ml: !isLandingPage && !isMobile ? `${LEFT_WIDTH}px` : 0
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1200 }}>
          {/* Mobile Header - Show menu button only on Dashboard */}
          {isMobile && !isLandingPage && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <IconButton onClick={() => setLeftOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Typography sx={{ ml: 1 }}>Vidyagam</Typography>
            </Box>
          )}

          <Outlet context={{ 
            dateFilter, 
            onDateFilterChange: setDateFilter,
            selectedTab,
            onTabChange: handleTabChange 
          }} />
        </Box>
      </Box>
    </Box>
  );
}
