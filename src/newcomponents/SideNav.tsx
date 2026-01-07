import React, { useEffect, useState } from 'react';
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    useTheme,
    alpha,
    CircularProgress
} from '@mui/material';
import {
    Newspaper,
    Podcast,
    Video,
    MessageSquare,
    GraduationCap,
    Home,
    TrendingUp,
    Bookmark,
    Settings
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Psychology } from '@mui/icons-material';
import { apiService } from '../services/api';

interface SideNavProps {
    selectedTab?: string;
    onTabChange?: (tab: 'news' | 'audio' | 'video' | 'posts' | 'learning') => void;
}

const SideNav: React.FC<SideNavProps> = ({ selectedTab = 'news', onTabChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    
    // ✅ Detect which page we're on (same as RightSection)
    const isDashboard = location.pathname.includes('/dashboard');
    const isLanding = location.pathname === '/' || location.pathname === '/landing';
    
    // Add unique ID for debugging
    const instanceId = React.useRef(Math.random().toString(36).substr(2, 9));
    
    useEffect(() => {
        console.log(`🔍 SideNav Instance: ${instanceId.current}`);
        console.log(`📍 Location: ${location.pathname}`);
        console.log(`🎯 Is Dashboard: ${isDashboard}`);
        console.log(`🏠 Is Landing: ${isLanding}`);
    }, [location.pathname, isDashboard, isLanding]);
    
    const [contentTypes, setContentTypes] = useState<Array<{
        id: string;
        icon: React.ReactNode;
        label: string;
        backendName: string;
    }>>([]);
    const [loading, setLoading] = useState(true);

    // Icon mapping for content types
    const getIconForContentType = (name: string): React.ReactNode => {
        const iconMap: Record<string, React.ReactNode> = {
            'blog': <Newspaper size={20} />,
            'blogs': <Newspaper size={20} />,
            'article': <Newspaper size={20} />,
            'podcast': <Podcast size={20} />,
            'podcasts': <Podcast size={20} />,
            'audio': <Podcast size={20} />,
            'video': <Video size={20} />,
            'videos': <Video size={20} />,
            'post': <MessageSquare size={20} />,
            'posts': <MessageSquare size={20} />,
            'learning': <GraduationCap size={20} />,
            'course': <GraduationCap size={20} />
        };
        return iconMap[name.toLowerCase()] || <Newspaper size={20} />;
    };

    // Map backend content type names to frontend tab IDs
    const mapContentTypeToTab = (backendName: string): string => {
        const mapping: Record<string, string> = {
            'blogs': 'news',
            'blog': 'news',
            'article': 'news',
            'podcasts': 'audio',
            'podcast': 'audio',
            'videos': 'video',
            'video': 'video',
            'posts': 'posts',
            'post': 'posts',
            'learning': 'learning',
            'course': 'learning'
        };
        return mapping[backendName.toLowerCase()] || backendName.toLowerCase();
    };

    // Fetch content types from backend
    useEffect(() => {
        const fetchContentTypes = async () => {
            try {
                console.log('🔄 SideNav: Fetching content types from backend...');
                const response = await apiService.getAvailableContentTypes();

                if (response?.content_types && Array.isArray(response.content_types)) {
                    const types = response.content_types.map((ct: any) => ({
                        id: mapContentTypeToTab(ct.name),
                        icon: getIconForContentType(ct.name),
                        label: ct.display_name || ct.name,
                        backendName: ct.name
                    }));

                    console.log('✅ SideNav: Content types loaded:', types);
                    setContentTypes(types);
                }
            } catch (error) {
                console.error('❌ SideNav: Failed to fetch content types:', error);
                // Fallback to default types
                setContentTypes([
                    { id: 'news', icon: <Newspaper size={20} />, label: 'Articles', backendName: 'blogs' },
                    { id: 'audio', icon: <Podcast size={20} />, label: 'Podcasts', backendName: 'podcasts' },
                    { id: 'video', icon: <Video size={20} />, label: 'Videos', backendName: 'videos' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchContentTypes();
    }, []);

    const libraryItems = [
        { id: 'trending', icon: <TrendingUp size={20} />, label: 'Trending', path: '/trending' },
        { id: 'saved', icon: <Bookmark size={20} />, label: 'Saved Articles', path: '/saved' },
        { id: 'settings', icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
    ];

    const handleContentTypeClick = (type: 'news' | 'audio' | 'video' | 'posts' | 'learning') => {
        console.log('📑 SideNav: Content type clicked:', type, 'on page:', isLanding ? 'Landing' : 'Dashboard');

        // ✅ Just change tab - don't navigate (same as RightSection)
        if (onTabChange) {
            onTabChange(type);
        }
    };

    const handleHomeClick = () => {
        console.log('🏠 SideNav: Home clicked on:', isLanding ? 'Landing' : 'Dashboard');
        
        // ✅ Stay on current page, just reset to 'news' tab
        if (onTabChange) {
            onTabChange('news');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 2 }}>
            {/* Debug banner (only in development) */}
            {/* process.env.NODE_ENV === 'development' && (
                <Box sx={{ 
                    bgcolor: 'warning.main', 
                    color: 'white', 
                    p: 1, 
                    mb: 2, 
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    mx: 1
                }}>
                    SideNav ID: {instanceId.current}<br/>
                    Page: {isDashboard ? 'Dashboard' : isLanding ? 'Landing' : 'Other'}
                </Box>
            )*/}

            {/* Logo/Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pl: 2 }}>
                <Psychology sx={{ fontSize: 40, color: 'orange' }} />
                <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em'
                    }}
                >
                    Vidyagam
                </Typography>
            </Box>

            <List sx={{ px: 1 }}>
                {/* Home */}
                <ListItemButton
                    selected={selectedTab === 'news'}
                    onClick={handleHomeClick}
                    sx={{
                        mx: 1,
                        mb: 1,
                        borderRadius: 2,
                        '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.16),
                            }
                        }
                    }}
                >
                    <ListItemIcon>
                        <Home size={20} />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                </ListItemButton>

                <Typography
                    variant="caption"
                    sx={{
                        px: 2,
                        mb: 1,
                        color: 'text.secondary',
                        fontWeight: 600,
                        display: 'block'
                    }}
                >
                    CONTENT TYPES
                </Typography>

                {/* Dynamic Content Types from Backend */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    contentTypes.map((type) => (
                        <ListItemButton
                            key={type.id}
                            selected={selectedTab === type.id}
                            onClick={() => handleContentTypeClick(type.id as any)}
                            sx={{
                                mx: 1,
                                mb: 0.5,
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.16),
                                    }
                                }
                            }}
                        >
                            <ListItemIcon>
                                {type.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={type.label}
                                primaryTypographyProps={{
                                    fontWeight: selectedTab === type.id ? 600 : 400
                                }}
                            />
                        </ListItemButton>
                    ))
                )}

                <Divider sx={{ my: 2 }} />

                {/* Library Section - Only show on Dashboard */}
                {isDashboard && (
                    <>
                        <Typography
                            variant="caption"
                            sx={{
                                px: 2,
                                mb: 1,
                                color: 'text.secondary',
                                fontWeight: 600,
                                display: 'block'
                            }}
                        >
                            LIBRARY
                        </Typography>

                        {libraryItems.map((item) => (
                            <ListItemButton
                                key={item.id}
                                selected={location.pathname === item.path}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    mx: 1,
                                    mb: 0.5,
                                    borderRadius: 2,
                                    '&.Mui-selected': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.16),
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        ))}
                    </>
                )}
            </List>
        </Box>
    );
};

export default SideNav;