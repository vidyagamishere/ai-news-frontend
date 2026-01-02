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
import { Outlet } from 'react-router';
import RightSection from '../newcomponents/RightSection';
import SideNav from '../newcomponents/SideNav';
import { ChevronLeftIcon } from 'lucide-react';
import { Tune } from '@mui/icons-material';
const LEFT_WIDTH = 280;
const RIGHT_WIDTH = 320;
export default function ResponsiveLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [leftOpen, setLeftOpen] = React.useState(false);
  const [rightOpen, setRightOpen] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState<1 | 7 | 30 | 365>(7);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />

      {/* LEFT SIDENAV */}
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
        <SideNav />
      </Drawer>

      {/* CENTER CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto',
          px: { md: 0, lg: 2 }
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1200,
          }}
        >
          {/* MOBILE HEADER */}
          {isMobile && (
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

              <Box sx={{ flexGrow: 1 }} />

              <IconButton onClick={() => setRightOpen(true)}>
                <Tune />
              </IconButton>
            </Box>
          )}

          <Outlet context={{ dateFilter, onDateFilterChange: setDateFilter }} />
        </Box>
      </Box>

      {/* RIGHT SIDENAV / CONTEXT RAIL */}
      <Drawer
        anchor="right"
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? rightOpen : true}
        onClose={() => setRightOpen(false)}
        sx={{
          width: RIGHT_WIDTH,
          marginRight: isMobile ? 0 : 2,
          '& .MuiDrawer-paper': {
            width: RIGHT_WIDTH,
            backgroundColor: 'background.default',
            borderLeft: 'none',
          },
        }}
      >
        <RightSection />
      </Drawer>
    </Box>
  );
}
