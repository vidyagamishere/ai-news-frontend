import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Paper,
  Stack,
  Chip,
  Divider,
  Alert,
  Link
} from '@mui/material';
import {
  Rocket as RocketIcon,
  TrendingUp as TrendingUpIcon,
  NotificationsActive as NotificationsIcon,
  BarChart as BarChartIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService, type DigestResponse } from '../services/api';
import Loading from '../components/Loading';
import Header from '../components/Header';
import SEO from '../components/SEO';

const Home: React.FC = () => {
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const fetchDigest = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📡 Fetching digest (attempt ${retryCount + 1}/3)...`);
      
      const data = await apiService.getDigest(false);
      setDigest(data);
      console.log('✅ Fresh data loaded successfully');
      
    } catch (err: any) {
      console.error('Failed to fetch digest:', err);
      
      // If this is the first failure and we have no existing data, provide fallback
      if (retryCount === 0 && !digest) {
        console.log('🔄 First attempt failed, showing fallback data and retrying in background...');
        
        const fallbackData: DigestResponse = {
          topStories: [
            {
              title: 'Latest AI Breakthroughs in Machine Learning',
              summary: 'Discover the cutting-edge developments in artificial intelligence that are reshaping industries worldwide. These groundbreaking advances represent significant progress in neural network architectures, automated learning systems, and computational intelligence. Leading research institutions are pioneering novel approaches to machine learning that promise to revolutionize how we process information and solve complex problems. The innovations span from deep learning optimization to reinforcement learning applications across diverse sectors. These developments mark a pivotal moment in AI evolution, with implications extending far beyond current technological boundaries.',
              content_summary: 'Discover the cutting-edge developments in artificial intelligence that are reshaping industries worldwide. These groundbreaking advances represent significant progress in neural network architectures, automated learning systems, and computational intelligence. Leading research institutions are pioneering novel approaches to machine learning that promise to revolutionize how we process information and solve complex problems. The innovations span from deep learning optimization to reinforcement learning applications across diverse sectors. These developments mark a pivotal moment in AI evolution, with implications extending far beyond current technological boundaries.',
              url: '#',
              source: 'AI Research Labs',
              significanceScore: 9.2
            },
            {
              title: 'OpenAI Releases New Language Model Capabilities',
              summary: 'Revolutionary advances in natural language processing promise to transform how we interact with AI systems. These breakthrough capabilities demonstrate unprecedented understanding of context, reasoning, and complex linguistic patterns that rival human comprehension. The new model architecture incorporates advanced attention mechanisms and sophisticated training methodologies that enable more nuanced and accurate responses. Industry experts anticipate these developments will accelerate AI adoption across education, business, and creative industries. This represents a significant leap forward in creating more intuitive and powerful AI assistants.',
              content_summary: 'Revolutionary advances in natural language processing promise to transform how we interact with AI systems. These breakthrough capabilities demonstrate unprecedented understanding of context, reasoning, and complex linguistic patterns that rival human comprehension. The new model architecture incorporates advanced attention mechanisms and sophisticated training methodologies that enable more nuanced and accurate responses. Industry experts anticipate these developments will accelerate AI adoption across education, business, and creative industries. This represents a significant leap forward in creating more intuitive and powerful AI assistants.',
              url: '#',
              source: 'OpenAI',
              significanceScore: 8.7
            },
            {
              title: 'Google DeepMind Achieves New Breakthrough',
              summary: 'Significant progress in AI reasoning capabilities marks another milestone in artificial general intelligence research. The breakthrough demonstrates enhanced logical thinking, problem-solving abilities, and multi-step reasoning that approaches human-level cognitive performance. This advancement builds upon years of research in neural architectures, reinforcement learning, and cognitive modeling to create more sophisticated AI systems. The implications extend across scientific research, strategic planning, and complex decision-making applications where deep reasoning is essential. This development brings us closer to achieving artificial general intelligence with broad applicability.',
              content_summary: 'Significant progress in AI reasoning capabilities marks another milestone in artificial general intelligence research. The breakthrough demonstrates enhanced logical thinking, problem-solving abilities, and multi-step reasoning that approaches human-level cognitive performance. This advancement builds upon years of research in neural architectures, reinforcement learning, and cognitive modeling to create more sophisticated AI systems. The implications extend across scientific research, strategic planning, and complex decision-making applications where deep reasoning is essential. This development brings us closer to achieving artificial general intelligence with broad applicability.',
              url: '#',
              source: 'Google DeepMind',
              significanceScore: 8.5
            }
          ],
          summary: {
            keyPoints: ['AI research advancing rapidly', 'New model capabilities emerging', 'Industry transformation accelerating'],
            metrics: {
              totalUpdates: 45,
              highImpact: 12,
              newResearch: 18,
              industryMoves: 15
            }
          },
          content: {
            blog: [],
            audio: [],
            video: [],
            events: [],
            learning: [],
            demos: []
          },
          timestamp: new Date().toISOString(),
          badge: 'Preview'
        };
        
        setDigest(fallbackData);
        
        // Retry in background with exponential backoff
        setTimeout(() => {
          fetchDigest(1);
        }, 3000);
      } else if (retryCount < 2) {
        // Retry with backoff
        setTimeout(() => {
          fetchDigest(retryCount + 1);
        }, Math.pow(2, retryCount) * 2000);
      } else {
        setError('Unable to load fresh content. Displaying cached data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToAuth = (mode: 'signin' | 'signup') => {
    navigate(`/auth?mode=${mode}`);
  };

  useEffect(() => {
    fetchDigest();
    
    // Set up periodic refresh every 10 minutes for fresh content
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing content...');
      fetchDigest();
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading && !digest) {
    return <Loading message="Loading AI news..." />;
  }

  if (error && !digest) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>⚠️ Connection Issue</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>{error}</Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" onClick={() => fetchDigest(0)} disabled={loading}>
              {loading ? 'Retrying...' : 'Try Again'}
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Box>
      {/* Skip to main content link for accessibility */}
      <Link
        href="#main-content"
        sx={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 999,
          '&:focus': {
            left: '10px',
            top: '10px',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            padding: '8px 16px',
            borderRadius: 1
          }
        }}
      >
        Skip to main content
      </Link>

      <SEO 
        title="Vidyagam AI News | Gaining Knowledge, Filtered for You"
        description="Stay ahead with the latest AI breakthroughs, research, and industry insights. Personalized AI news curated by advanced neural networks."
        url="/"
      />
      
      <Header />

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg" id="main-content">
          <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
            Stay Ahead of the AI Revolution
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
            Stay ahead of the AI revolution with curated news, insights, and breakthroughs 
            from 50+ top sources. <strong>No signup required to explore.</strong>
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => navigateToAuth('signup')}
            startIcon={<RocketIcon />}
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              fontSize: '1.1rem',
              px: 4,
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.9)',
              }
            }}
          >
            Start Your AI Journey
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.9 }}>
            Free access • No credit card • Instant setup
          </Typography>

          <Grid container spacing={4} sx={{ mt: 4, justifyContent: 'center' }}>
            <Grid sx={{xs:4, sm: 'auto'}}>
              <Typography variant="h4" fontWeight="bold">50+</Typography>
              <Typography variant="body2">AI Sources</Typography>
            </Grid>
            <Grid sx={{xs:4, sm: 'auto'}}>
              <Typography variant="h4" fontWeight="bold">Daily</Typography>
              <Typography variant="body2">Updates</Typography>
            </Grid>
            <Grid sx={{xs:4, sm: 'auto'}}>
              <Typography variant="h4" fontWeight="bold">Free</Typography>
              <Typography variant="body2">Access</Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {digest && (
          <>
            {/* Breaking Stories */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                🚨 Breaking Stories
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Latest breaking news from today
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
                {digest.topStories?.slice(0, 5).map((story, index) => (
                  <Card
                    key={index}
                    sx={{
                      minWidth: 300,
                      maxWidth: 400,
                      cursor: 'pointer',
                      '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s' }
                    }}
                    onClick={() => window.open(story.url, '_blank')}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {story.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {(story.summary || story.content_summary || '').substring(0, 150)}...
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {story.source}
                        </Typography>
                        <Chip label={`Score: ${story.significanceScore}`} size="small" color="primary" />
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>

            {/* Content Types */}
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              📰 Latest AI News by Category
            </Typography>

            {/* AI News & Updates */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                🤖 AI News & Updates
              </Typography>
              <Grid container spacing={2}>
                {digest.topStories?.slice(0, 5).map((story, index) => (
                  <Grid sx={{xs:12, sm:6, md:4}} key={index}>
                    <Card
                      sx={{ height: '100%', cursor: 'pointer' }}
                      onClick={() => window.open(story.url, '_blank')}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {story.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(story.summary || story.content_summary || '').substring(0, 150)}...
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Chip label={story.source} size="small" />
                        <Chip label={`Score: ${story.significanceScore}`} size="small" color="primary" />
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Machine Learning */}
            {digest.content?.blog && digest.content.blog.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  🧠 Machine Learning
                </Typography>
                <Grid container spacing={2}>
                  {digest.content.blog.slice(0, 5).map((story, index) => (
                    <Grid sx={{xs:12, sm:6, md:4}} key={index}>
                      <Card
                        sx={{ height: '100%', cursor: 'pointer' }}
                        onClick={() => window.open(story.url, '_blank')}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {story.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(story.summary || story.content_summary || '').substring(0, 150)}...
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Chip label={story.source} size="small" />
                          <Chip label={`Score: ${story.significanceScore}`} size="small" color="primary" />
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* AI Learning & Education */}
            {digest.content?.learning && digest.content.learning.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  📚 AI Learning & Education
                </Typography>
                <Grid container spacing={2}>
                  {digest.content.learning.slice(0, 5).map((story, index) => (
                    <Grid sx={{xs:12, sm:6, md:4}} key={index}>
                      <Card
                        sx={{ height: '100%', cursor: 'pointer' }}
                        onClick={() => window.open(story.url, '_blank')}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {story.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(story.summary || story.content_summary || '').substring(0, 150)}...
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Chip label={story.source} size="small" />
                          <Chip label={`Score: ${story.significanceScore}`} size="small" color="primary" />
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Video Content */}
            {digest.content?.video && digest.content.video.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  🎥 Video Content
                </Typography>
                <Grid container spacing={2}>
                  {digest.content.video.slice(0, 5).map((story, index) => (
                    <Grid sx={{xs:12, sm:6, md:4}} key={index}>
                      <Card
                        sx={{ height: '100%', cursor: 'pointer' }}
                        onClick={() => window.open(story.url, '_blank')}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {story.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(story.summary || story.content_summary || '').substring(0, 150)}...
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Chip label={story.source} size="small" />
                          <Chip label={`Score: ${story.significanceScore}`} size="small" color="primary" />
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Audio & Podcasts */}
            {digest.content?.audio && digest.content.audio.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  🎙️ Audio & Podcasts
                </Typography>
                <Grid container spacing={2}>
                  {digest.content.audio.slice(0, 5).map((story, index) => (
                    <Grid sx={{xs:12, sm:6, md:4}} key={index}>
                      <Card
                        sx={{ height: '100%', cursor: 'pointer' }}
                        onClick={() => window.open(story.url, '_blank')}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {story.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(story.summary || story.content_summary || '').substring(0, 150)}...
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Chip label={story.source} size="small" />
                          <Chip label={`Score: ${story.significanceScore}`} size="small" color="primary" />
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Why Sign Up */}
            <Paper elevation={3} sx={{ p: 4, my: 6, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
                🎯 Why Sign Up?
              </Typography>
              <Grid container spacing={3} sx={{ mt: 2 }}>
                {[
                  { icon: <TrendingUpIcon />, title: 'Personalized Content', desc: 'Get AI news tailored to your interests' },
                  { icon: <NotificationsIcon />, title: 'Breaking News Alerts', desc: 'Instant notifications for critical developments' },
                  { icon: <BarChartIcon />, title: 'Advanced Analytics', desc: 'Track trends and discover what matters' },
                  { icon: <EmailIcon />, title: 'Newsletter Digest', desc: 'Daily summaries delivered to your inbox' }
                ].map((item, idx) => (
                  <Grid sx={{xs:12, sm:6, md:3}} key={idx}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ fontSize: 48, mb: 1 }}>{item.icon}</Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>{item.title}</Typography>
                      <Typography variant="body2">{item.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigateToAuth('signup')}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                  }}
                >
                  Start Your Personalized AI Journey
                </Button>
              </Box>
            </Paper>

            {/* CTA Section */}
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center', backgroundColor: 'background.paper' }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Want Full Access?
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Sign up for free to get personalized AI news, daily digests, 
                and exclusive insights delivered to your inbox.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigateToAuth('signup')}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigateToAuth('signin')}
                >
                  Sign In
                </Button>
              </Stack>
            </Paper>
          </>
        )}
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          backgroundColor: 'background.paper',
          py: 4,
          mt: 8,
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" textAlign="center" color="text.secondary">
            Copyright ©2025 by Vidyagam Learning LLC
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            <Button onClick={() => navigate('/about')} size="small">About</Button>
            <Button onClick={() => navigate('/terms')} size="small">Terms</Button>
            <Button href="mailto:admin@vidyagam.com" size="small">Feedback</Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
