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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({
    blog: 'gemini',
    podcast: 'gemini',
    video: 'gemini',
  });
  const [selectedFrequencies, setSelectedFrequencies] = useState<Record<string, number>>({
    blog: 1,
    podcast: 1,
    video: 1,
  });
  const { adminApiKey } = useAdminAuth();

  // LLM model configurations with colors
  const llmModels = [
    { value: 'gemini', label: 'Gemini', color: '#4285f4' },
    { value: 'claude', label: 'Claude', color: '#d97706' },
    { value: 'ollama', label: 'Ollama', color: '#10b981' },
    { value: 'huggingface', label: 'HuggingFace', color: '#9333ea' },
  ];

  // Scraping frequency options
  const frequencyOptions = [
    { value: 1, label: 'Daily (1 day)' },
    { value: 7, label: 'Weekly (7 days)' },
    { value: 30, label: 'Monthly (30 days)' },
  ];
  
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
      const selectedModel = selectedModels[contentType];
      const selectedFrequency = selectedFrequencies[contentType];
      const frequencyLabel = frequencyOptions.find(f => f.value === selectedFrequency)?.label || 'custom';
      
      // For now, only RSS feeds (blog) are supported via /admin/scrape endpoint
      if (contentType === 'blog') {
        // Show in-progress message
        setSnackbar({ 
          open: true, 
          message: `Starting scraping job with ${selectedModel} (${frequencyLabel})...`, 
          severity: 'info' 
        });
        
        console.log('🚀 Starting background scraping job...');
        const startTime = Date.now();
        
        // Start background job (returns immediately with job_id)
        const jobResponse = await apiService.callEndpoint(
          `admin/scrape?llm_model=${selectedModel}&scrape_frequency=${selectedFrequency}`,
          'POST',
          {},
          false,
          { 'X-Admin-API-Key': adminApiKey }
        );
        
        const jobId = jobResponse.job_id;
        console.log(`✅ Job started with ID: ${jobId}`);
        
        // Show job started message
        setSnackbar({ 
          open: true, 
          message: `Scraping job started! Checking progress... (Job ID: ${jobId.substring(0, 8)})`, 
          severity: 'info' 
        });
        
        // Poll for job status every 3 seconds
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await apiService.callEndpoint(
              `admin/scrape-status/${jobId}`,
              'GET',
              {},
              false,
              { 'X-Admin-API-Key': adminApiKey }
            );
            
            console.log('📊 Job status:', statusResponse.status, '-', statusResponse.progress);
            
            if (statusResponse.status === 'completed') {
              clearInterval(pollInterval);
              const duration = ((Date.now() - startTime) / 1000).toFixed(1);
              const articlesInserted = statusResponse.articles_inserted || 0;
              const articlesFound = statusResponse.articles_found || 0;
              const sourcesScraped = statusResponse.sources_scraped || 0;
              
              setSnackbar({ 
                open: true, 
                message: `✅ Scraping completed in ${duration}s! Found ${articlesFound} articles from ${sourcesScraped} sources, inserted ${articlesInserted} new articles`, 
                severity: 'success' 
              });
              
              setTimeout(fetchJobs, 2000);
            } else if (statusResponse.status === 'failed') {
              clearInterval(pollInterval);
              setSnackbar({ 
                open: true, 
                message: `❌ Scraping failed: ${statusResponse.error || 'Unknown error'}`, 
                severity: 'error' 
              });
            } else {
              // Update progress message
              setSnackbar({ 
                open: true, 
                message: `Scraping in progress: ${statusResponse.progress}`, 
                severity: 'info' 
              });
            }
          } catch (pollError) {
            console.error('Failed to poll job status:', pollError);
            clearInterval(pollInterval);
            setSnackbar({ 
              open: true, 
              message: 'Failed to check scraping status', 
              severity: 'error' 
            });
          }
        }, 3000); // Poll every 3 seconds
        
        // Set timeout to stop polling after 15 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setSnackbar({ 
            open: true, 
            message: 'Scraping is taking longer than expected. Check the jobs list for status.', 
            severity: 'warning' 
          });
        }, 15 * 60 * 1000); // 15 minutes
        
      } else {
        // Podcast and video scraping coming soon
        setSnackbar({ 
          open: true, 
          message: `${contentType} scraping coming soon - currently in development`, 
          severity: 'info' 
        });
      }
    } catch (error: any) {
      console.error('Failed to trigger scraping:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to trigger scraping';
      setSnackbar({ open: true, message: `Scraping failed: ${errorMessage}`, severity: 'error' });
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

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>LLM Model</InputLabel>
                    <Select
                      value={selectedModels[item.type]}
                      label="LLM Model"
                      onChange={(e) => setSelectedModels({ ...selectedModels, [item.type]: e.target.value })}
                      disabled={triggering === item.type}
                    >
                      {llmModels.map((model) => (
                        <MenuItem key={model.value} value={model.value}>
                          <Box display="flex" alignItems="center">
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: model.color,
                                mr: 1,
                              }}
                            />
                            {model.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Scrape Frequency</InputLabel>
                    <Select
                      value={selectedFrequencies[item.type]}
                      label="Scrape Frequency"
                      onChange={(e) => setSelectedFrequencies({ ...selectedFrequencies, [item.type]: e.target.value as number })}
                      disabled={triggering === item.type}
                    >
                      {frequencyOptions.map((freq) => (
                        <MenuItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

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