import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { apiService } from '../../services/api';
import { useAdminAuth } from '../../contexts/AdminAuthContext';


export const ScrapingControls: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const { adminApiKey } = useAdminAuth();
  
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    if (!adminApiKey) {
      console.error('Admin not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      const response = await apiService.getActiveScrapingJobs(adminApiKey);
      setJobs(response.active_jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async (contentType: string) => {
    setTriggering(contentType);
    if (!adminApiKey) {
      console.error('Admin not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      await apiService.callEndpoint(
        'admin/scraping/trigger',
        'POST',
        { content_type: contentType },
        false,
        { 'X-Admin-API-Key': adminApiKey }
      );
      setSnackbar({ open: true, message: `${contentType} scraping triggered`, severity: 'success' });
      setTimeout(fetchJobs, 2000); // Refresh after 2 seconds
    } catch (error) {
      console.error('Failed to trigger scraping:', error);
      setSnackbar({ open: true, message: 'Failed to trigger scraping', severity: 'error' });
    } finally {
      setTriggering(null);
    }
  };

  const scrapingTypes = [
    { type: 'blog', label: 'RSS Feeds', color: '#1976d2' },
    { type: 'podcast', label: 'Podcasts', color: '#2e7d32' },
    { type: 'video', label: 'Videos', color: '#ed6c02' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Scraping Controls</Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={fetchJobs}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
      >
        {scrapingTypes.map((item) => {
          const job = jobs.find(j => j.id.includes(item.type) || j.name.toLowerCase().includes(item.type));
          
          return (
            <Box key={item.type} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{item.label}</Typography>
                    <Chip 
                      label={job ? 'Active' : 'Idle'} 
                      color={job ? 'success' : 'default'} 
                      size="small" 
                    />
                  </Box>

                  {job && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Job: {job.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Trigger: {job.trigger}
                      </Typography>
                      {job.next_run && (
                        <Typography variant="body2" color="textSecondary">
                          Next Run: {format(new Date(job.next_run), 'MMM dd, HH:mm')}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    startIcon={triggering === item.type ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                    onClick={() => handleTrigger(item.type)}
                    disabled={triggering === item.type}
                    fullWidth
                    sx={{ bgcolor: item.color, '&:hover': { bgcolor: item.color, opacity: 0.9 } }}
                  >
                    {triggering === item.type ? 'Triggering...' : 'Trigger Now'}
                  </Button>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};