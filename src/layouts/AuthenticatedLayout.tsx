import React from 'react';
import { Box, Stack } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from '../newcomponents/Header';
import SideNav from '../newcomponents/SideNav';
import Footer from '../newcomponents/Footer';
import { useAuth } from '../contexts/AuthContext';

const AuthenticatedLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Stack direction="column" flexGrow={1}>
        <Header
          isAuthenticated={true}
          user={user ? { name: user.email || 'User', email: user.email } : undefined}
        />
        <SideNav />
      </Stack>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box component="main" sx={{ flex: 1 }}>
          <Outlet />
        </Box>
        {/* <Footer /> */}
      </Box>
    </Box>
  );
};

export default AuthenticatedLayout;
