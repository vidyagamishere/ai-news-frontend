import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
  Stack
} from '@mui/material';
import { ExternalLink } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import SocialIcons from './SocialIcons';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Content',
      links: [
        { label: 'Latest News', path: '/news' },
        { label: 'Podcasts & Audio', path: '/podcasts' },
        { label: 'Videos', path: '/videos' },
        { label: 'Learning', path: '/learning' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Careers', path: '/careers' },
        { label: 'Press', path: '/press' },
        { label: 'Contact', path: '/contact' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Help Center', path: '/help' },
        { label: 'Writing Guide', path: '/guide' },
        { label: 'API Documentation', path: '/docs' },
        { label: 'Brand Assets', path: '/brand' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Cookie Policy', path: '/cookies' },
        { label: 'Copyright Policy', path: '/copyright' },
      ]
    }
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        pt: 6,
        pb: 3,
        mt: 8
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Brand Section */}
          <Grid sx={{xs:12, md:3}}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                mb: 2,
                letterSpacing: '-0.02em'
              }}
            >
              AI Insights
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 280 }}
            >
              Your trusted source for the latest AI news, research, and insights.
              Join our community of AI enthusiasts and professionals.
            </Typography>
            <SocialIcons size="small" iconSize={20} spacing={0.5} />
          </Grid>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <Grid sx={{xs:6, sm:3, md:2}} key={section.title}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                {section.title}
              </Typography>
              <Stack spacing={1.5}>
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    component={RouterLink}
                    to={link.path}
                    underline="none"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: 'text.primary'
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}

          {/* Newsletter Section */}
          <Grid sx={{xs:6, md:3}} >
            <Typography
              variant="subtitle2"
              fontWeight={600}
              sx={{ mb: 2 }}
            >
              Stay Updated
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Subscribe to our newsletter for weekly AI insights and updates.
            </Typography>
            <Link
              href="/newsletter"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Subscribe now
              <ExternalLink size={14} />
            </Link>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Bottom Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'center' },
            gap: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} AI Insights by Vidyagam Learning LLC. All rights reserved.
          </Typography>
          <Stack
            direction="row"
            spacing={3}
            sx={{ fontSize: '0.875rem' }}
          >
            <Link
              component={RouterLink}
              to="/sitemap"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'text.primary' } }}
            >
              Sitemap
            </Link>
            <Link
              component={RouterLink}
              to="/accessibility"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'text.primary' } }}
            >
              Accessibility
            </Link>
            <Link
              component={RouterLink}
              to="/status"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'text.primary' } }}
            >
              Status
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;