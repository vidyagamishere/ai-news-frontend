import React from 'react';
import { Box, Paper, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandingSidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 2, width: '100%' }}>
      {/* Landing page specific content */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Get Started
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sign up to get personalized AI news
        </Typography>
        <Stack spacing={1}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/auth?mode=signup')}
          >
            Sign Up
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
        </Stack>
      </Paper>

      {/* Other landing page sidebar content */}
    </Box>
  );
};

export default LandingSidebar;
