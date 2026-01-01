import React from 'react';
import { Box, Stack } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from '../newcomponents/Header';
import SideNav from '../newcomponents/SideNav';
import Footer from '../newcomponents/Footer';
import { useAuth } from '../contexts/AuthContext';
import RightSection from '../newcomponents/RightSection';

const AuthenticatedLayout: React.FC = () => {
  const { user } = useAuth();

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

export default AuthenticatedLayout;
