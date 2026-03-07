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
    CircularProgress,
    Paper,
    Stack
} from '@mui/material';
import {
    Newspaper,
    Podcast,
    Video,
    MessageSquare,
    GraduationCap,
    Briefcase,
    CalendarDays,
    Home,
    TrendingUp,
    Bookmark,
    Settings
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Psychology, EmojiEvents } from '@mui/icons-material';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SocialIcons from './SocialIcons';

interface SideNavProps {
    selectedTab?: string;
    onTabChange?: (tab: 'news' | 'audio' | 'video' | 'posts' | 'learning' | 'courses' | 'jobs' | 'events') => void;
    onSettingsClick?: () => void;
    onBookmarksClick?: () => void;
    onStatsClick?: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ 
    selectedTab = 'news', 
    onTabChange, 
    onSettingsClick,
    onBookmarksClick,
    onStatsClick 
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { user, isAuthenticated } = useAuth();
    
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
            'course': <GraduationCap size={20} />,
            'courses': <GraduationCap size={20} />,
            'job': <Briefcase size={20} />,
            'jobs': <Briefcase size={20} />,
            'event': <CalendarDays size={20} />,
            'events': <CalendarDays size={20} />
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
            'course': 'courses',
            'courses': 'courses',
            'jobs': 'jobs',
            'job': 'jobs',
            'events': 'events',
            'event': 'events'
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
        { id: 'trending', icon: <TrendingUp size={20} />, label: 'Trending', path: '/trending', type: 'navigation' },
        { id: 'saved', icon: <Bookmark size={20} />, label: 'Saved Articles', type: 'action', action: onBookmarksClick },
        { id: 'stats', icon: <EmojiEvents sx={{ fontSize: 20 }} />, label: 'My Stats', type: 'action', action: onStatsClick },
        { id: 'settings', icon: <Settings size={20} />, label: 'Preferences', type: 'action', action: onSettingsClick },
    ];

    const handleContentTypeClick = (type: 'news' | 'audio' | 'video' | 'posts' | 'learning' | 'courses' | 'jobs' | 'events') => {
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

    const handleLibraryItemClick = (item: any) => {
        if (item.type === 'action' && item.action) {
            item.action();
        } else if (item.type === 'navigation' && item.path) {
            navigate(item.path);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 2 }}>
            {/* Logo/Brand */}
            <Box sx={{ px: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Psychology sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={700}>
                        Vidyagam
                    </Typography>
                </Box>
            </Box>

            <List sx={{ flexGrow: 1, px: 1 }}>
                {/* Home Button */}
                <ListItemButton
                    onClick={handleHomeClick}
                    sx={{
                        mx: 1,
                        mb: 0.5,
                        borderRadius: 2,
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                        }
                    }}
                >
                    <ListItemIcon>
                        <Home size={20} />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                </ListItemButton>

                <Divider sx={{ my: 2 }} />

                {/* Content Types Section */}
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
                    CONTENT
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
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
                                selected={item.type === 'navigation' && location.pathname === item.path}
                                onClick={() => handleLibraryItemClick(item)}
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

            {/* Social Media Links */}
            <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
                <Typography
                    variant="caption"
                    sx={{
                        mb: 1,
                        color: 'text.secondary',
                        fontWeight: 600,
                        display: 'block',
                        textAlign: 'center',
                    }}
                >
                    FOLLOW US
                </Typography>
                <SocialIcons size="small" iconSize={16} spacing={0.25} />
            </Box>

            {/* Points Widget - Show at bottom for authenticated users */}
            {isAuthenticated && user && (
                <Box sx={{ p: 2 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: theme.shadows[2]
                            }
                        }}
                        onClick={() => onStatsClick?.()}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <EmojiEvents sx={{ fontSize: 24 }} color="primary" />
                            <Box>
                                <Typography variant="body2" fontWeight={600}>
                                    Level {user.level || 1}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {user.total_points || 0} points
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default SideNav;