import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import SideNav from '../newcomponents/SideNav';
import Header from '../newcomponents/Header';
import RightSection from '../newcomponents/RightSection';

/**
 * Public Layout - Simple layout for non-authenticated pages
 * No header, sidebar, or footer - each page controls its own layout
 */
const PublicLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SideNav />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
        <Box component="main" sx={{ flex: 1 }}>
          <Outlet />
        </Box>
        <Box
          sx={{
            width: 320,
            position: 'absolute',
            top: 80,
            right: 5,
          }}
        >
          <RightSection />
        </Box>
        {/* <Footer /> */}
      </Box>
    </Box>
  );
};

export default PublicLayout;
