import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Stack,
  Divider
} from '@mui/material';
import { Psychology as BrainIcon } from '@mui/icons-material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        py: 6,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid sx={{xs:12, md:6}}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BrainIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight="bold">
                  Vidyagam
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Gaining Knowledge, Filtered for You
              </Typography>
            </Stack>
          </Grid>

          {/* Links Section */}
          <Grid sx={{xs:12, md:6}}>
            <Grid container spacing={3}>
              <Grid sx={{xs:6}}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Legal
                </Typography>
                <Stack spacing={1}>
                  <Link
                    component={RouterLink}
                    to="/privacy"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    component={RouterLink}
                    to="/terms"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                  >
                    Terms of Service
                  </Link>
                </Stack>
              </Grid>

              <Grid sx={{xs:6}}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Contact
                </Typography>
                <Stack spacing={1}>
                  <Link
                    href="mailto:admin@vidyagam.com"
                    color="text.secondary"
                    underline="hover"
                    variant="body2"
                  >
                    Contact Us
                  </Link>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Copyright */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © 2025 Vidyagam. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
