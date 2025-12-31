import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import SideNav from '../newcomponents/SideNav';
import Header from '../newcomponents/Header';

/**
 * Public Layout - Simple layout for non-authenticated pages
 * No header, sidebar, or footer - each page controls its own layout
 */
const AuthLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box component="main" sx={{ flex: 1 }}>
          <Outlet />
        </Box>
        {/* <Footer /> */}
      </Box>
    </Box>
  );
};

export default AuthLayout;
