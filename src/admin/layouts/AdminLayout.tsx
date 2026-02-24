import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Collapse,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  RssFeed as RssFeedIcon,
  Podcasts as PodcastIcon,
  VideoLibrary as VideoIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { Link, Outlet, useLocation,useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const drawerWidth = 240;

export const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { adminLogout, adminApiKey } = useAdminAuth();

  useEffect(() => {
    console.log('🔵 [AdminLayout] Component mounted/updated', {
      pathname: location.pathname,
      hasAdminApiKey: !!adminApiKey,
      isMobile,
    });
  }, [location.pathname, adminApiKey, isMobile]);

  const handleLogout = () => {
    console.log('🔵 [AdminLayout] handleLogout() START');
    try {
      adminLogout();
      console.log('🟢 [AdminLayout] Admin logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      console.error('🔴 [AdminLayout] Logout error:', error);
    }
  };

  const handleDrawerToggle = () => {
    console.log('🔵 [AdminLayout] Toggling drawer', { currentState: mobileOpen });
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { 
      text: 'Manage Sources', 
      icon: <RssFeedIcon />, 
      hasSubmenu: true,
      submenu: [
        { text: 'RSS Feeds', icon: <RssFeedIcon />, path: '/admin/sources/rss' },
        { text: 'Podcasts', icon: <PodcastIcon />, path: '/admin/sources/podcasts' },
        { text: 'Videos', icon: <VideoIcon />, path: '/admin/sources/videos' },
      ]
    },
    { text: 'Article Moderation', icon: <ArticleIcon />, path: '/admin/articles' },
    { text: 'Tavily Search', icon: <SearchIcon />, path: '/admin/tavily' },
    { text: 'Scraping Jobs', icon: <SettingsIcon />, path: '/admin/scraping' },
    { text: 'Newsletter', icon: <EmailIcon />, path: '/admin/newsletter' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.hasSubmenu ? (
              <>
                <ListItemButton onClick={() => setSourcesOpen(!sourcesOpen)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {sourcesOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={sourcesOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu?.map((subItem) => (
                      <ListItemButton
                        key={subItem.path}
                        component={Link}
                        to={subItem.path}
                        selected={location.pathname === subItem.path}
                        sx={{ pl: 4 }}
                        onClick={() => {
                          console.log('🔵 [AdminLayout] Navigating to:', subItem.path);
                          if (isMobile) setMobileOpen(false);
                        }}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItemButton
                component={Link}
                to={item.path!}
                selected={location.pathname === item.path}
                onClick={() => {
                  console.log('🔵 [AdminLayout] Navigating to:', item.path);
                  if (isMobile) setMobileOpen(false);
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Vidyagam Admin
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};