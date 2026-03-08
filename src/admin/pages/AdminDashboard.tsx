import React, { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Article as ArticleIcon,
  RssFeed as RssFeedIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Stats {
  total_articles: number;
  total_sources: number;
  total_categories: number;
  active_jobs: number;
}

export const AdminDashboard: React.FC = () => {
  const { adminApiKey } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔵 [AdminDashboard] Component mounted', { hasAdminApiKey: !!adminApiKey });
    fetchStats();
  }, [adminApiKey]);

  const fetchStats = async () => {
    console.log('🔵 [AdminDashboard] fetchStats() START', { hasAdminApiKey: !!adminApiKey });
    
    if (!adminApiKey) {
      console.error('🔴 [AdminDashboard] No admin API key available');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🟡 [AdminDashboard] Fetching categories and active jobs...');
      
      const [categoriesRes, jobsRes] = await Promise.all([
        apiService.getAllCategories(adminApiKey),
        apiService.getActiveScrapingJobs(adminApiKey),
      ]);

      console.log('🟢 [AdminDashboard] Categories response:', {
        categoriesRes,
        categoriesCount: categoriesRes.categories?.length || 0,
      });

      console.log('🟢 [AdminDashboard] Active jobs response:', {
        jobsRes,
        activeJobsCount: jobsRes.active_jobs?.length || 0,
      });

      const statsData = {
        total_articles: 0,
        total_sources: 0,
        total_categories: categoriesRes.categories?.length || 0,
        active_jobs: jobsRes.active_jobs?.length || 0,
      };

      console.log('🟢 [AdminDashboard] Final stats:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('🔴 [AdminDashboard] Failed to fetch stats:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      setLoading(false);
      console.log('🔵 [AdminDashboard] fetchStats() END');
    }
  };

  const statCards = [
    { title: 'Total Articles', value: stats?.total_articles || 0, icon: <ArticleIcon />, color: '#1976d2' },
    { title: 'Total Sources', value: stats?.total_sources || 0, icon: <RssFeedIcon />, color: '#2e7d32' },
    { title: 'Categories', value: stats?.total_categories || 0, icon: <CategoryIcon />, color: '#ed6c02' },
    { title: 'Active Jobs', value: stats?.active_jobs || 0, icon: <TrendingIcon />, color: '#9c27b0' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        sx={{ mt: 2, flexWrap: 'wrap' }}
      >
        {statCards.map((card) => (
          <Box key={card.title} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: card.color,
                      borderRadius: '50%',
                      width: 56,
                      height: 56,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};