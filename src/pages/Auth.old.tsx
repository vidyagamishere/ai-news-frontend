import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  Chip,
  Fade,
  Slide
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as MailIcon,
  Person as UserIcon,
  Lock as LockIcon,
  Psychology as BrainIcon,
  Rocket as RocketIcon,
  Science as ScienceIcon,
  TrackChanges as TargetIcon,
  AccountBalance as BuildingIcon,
  AutoAwesome,
  TrendingUp,
  Security,
  Speed
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import GoogleSignIn from '../components/auth/GoogleSignIn';
import { validateSignupEmail } from '../utils/emailValidation';

type AuthMode = 'signin' | 'signup';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const { loading, error, isAuthenticated, login, signup, isGmailDomain } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (mode === 'signup' && !formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (mode === 'signup') {
      const emailError = validateSignupEmail(formData.email);
      if (emailError) {
        errors.email = emailError;
      }
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (mode === 'signup' && !formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the Terms of Service';
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      console.log('🔍 Auth Debug:', { mode, email: formData.email, name: formData.name });
      
      const isGmail = isGmailDomain(formData.email);
      
      if (mode === 'signin') {
        if (isGmail) {
          setFormErrors({ email: 'Gmail users must use "Continue with Google" button above' });
          return;
        }
        console.log('🔐 Password signin');
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        if (isGmail) {
          setFormErrors({ email: 'Gmail users must use "Continue with Google" button above' });
          return;
        }
        console.log('📧 Sending OTP for non-Gmail signup');
        await authService.sendOTP(formData.email, formData.name, 'signup');
        const userData = JSON.stringify({ name: formData.name, email: formData.email, password: formData.password });
        navigate('/verify-otp?email=' + encodeURIComponent(formData.email) + '&userData=' + encodeURIComponent(userData) + '&authMode=signup');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      
      if (err.error_code === 'EMAIL_EXISTS' && mode === 'signup') {
        const message = err.message || 'An account with this email already exists. Please sign in instead.';
        setFormErrors({ email: message });
        setTimeout(() => {
          setMode('signin');
          setFormErrors({});
        }, 5000);
      } else if (err.error_code === 'EMAIL_NOT_FOUND' && mode === 'signin') {
        const message = err.message || 'No account found with this email. Please sign up first.';
        setFormErrors({ email: message });
        setTimeout(() => {
          setMode('signup');
          setFormErrors({});
        }, 5000);
      } else {
        const errorMsg = err.message || '';
        if (errorMsg.includes('Email ID already registered') || errorMsg.includes('already exists') && mode === 'signup') {
          setFormErrors({ email: 'An account with this email already exists. Please sign in instead.' });
          setTimeout(() => {
            setMode('signin');
            setFormErrors({});
          }, 5000);
        } else if (errorMsg.includes('No account found') && mode === 'signin') {
          setFormErrors({ email: 'No account found with this email. Please sign up first.' });
          setTimeout(() => {
            setMode('signup');
            setFormErrors({});
          }, 5000);
        } else {
          setFormErrors({ email: errorMsg || 'An error occurred. Please try again.' });
        }
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGoogleSuccess = () => {
    navigate('/dashboard');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    });
  const theme = useTheme();

  const features = [
    {
      icon: AutoAwesome,
      title: 'AI-Powered Curation',
      description: 'Smart algorithms surface the most relevant AI breakthroughs',
      color: '#667eea'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Updates',
      description: 'Get notified instantly when major AI news breaks',
      color: '#f093fb'
    },
    {
      icon: Security,
      title: 'Trusted Sources',
      description: 'Verified content from leading AI labs and researchers',
      color: '#4facfe'
    },
    {
      icon: Speed,
      title: 'Lightning Fast',
      description: 'Optimized performance for seamless browsing',
      color: '#43e97b'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '10K+', label: 'Daily Articles' },
    { value: '100+', label: 'AI Sources' },
    { value: '24/7', label: 'Updates' }
  ];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '800px',
          height: '800px',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'float 20s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'float 25s ease-in-out infinite reverse',
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(30px, 30px) rotate(180deg)' }
        }
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 2, md: 6 }} alignItems="center" sx={{ minHeight: '100vh' }}>
          {/* Left Panel - Branding & Features */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={800}>
              <Box sx={{ pr: { md: 4 } }}>
                <Stack spacing={4}>
                  {/* Logo & Tagline */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          borderRadius: 3,
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                      >
                        <BrainIcon sx={{ fontSize: 40, color: 'white' }} />
                      </Box>
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

                    <Typography 
                      variant="h4" 
                      fontWeight={700}
                      sx={{ 
                        mb: 2,
                        background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.text.secondary} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Your AI Intelligence Hub
                    </Typography>

                    <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                      Join the next generation of AI enthusiasts. Get personalized news, 
                      breakthrough research, and expert insights—all in one place.
                    </Typography>

                    {/* Stats */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      {stats.map((stat, index) => (
                        <Grid item xs={6} sm={3} key={index}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              background: alpha(theme.palette.background.paper, 0.7),
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              transition: 'all 0.3s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                              }
                            }}
                          >
                            <Typography variant="h5" fontWeight={800} color="primary">
                              {stat.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {stat.label}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {/* Features Grid */}
                  <Grid container spacing={2}>
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <Grid item xs={12} sm={6} key={index}>
                          <Slide direction="up" in timeout={1000 + index * 100}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2.5,
                                height: '100%',
                                background: alpha(theme.palette.background.paper, 0.7),
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                  transform: 'translateY(-8px)',
                                  boxShadow: `0 12px 40px ${alpha(feature.color, 0.2)}`,
                                  borderColor: alpha(feature.color, 0.3)
                                },
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '3px',
                                  background: `linear-gradient(90deg, ${feature.color} 0%, transparent 100%)`,
                                  opacity: 0,
                                  transition: 'opacity 0.3s'
                                },
                                '&:hover::before': {
                                  opacity: 1
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Box
                                  sx={{
                                    background: alpha(feature.color, 0.1),
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Icon sx={{ fontSize: 28, color: feature.color }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                    {feature.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                    {feature.description}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </Slide>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Trust Badge */}
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {['OpenAI', 'Google AI', 'Anthropic', 'Meta AI', 'DeepMind'].map((company, index) => (
                        <Chip
                          key={index}
                          label={company}
                          size="small"
                          sx={{
                            background: alpha(theme.palette.background.paper, 0.6),
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            fontWeight: 600
                          }}
                        />
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Trusted sources from leading AI organizations
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Fade>
          </Grid>

          {/* Right Panel - Auth Form */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={1000}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 3, md: 5 }, 
                  maxWidth: 520, 
                  mx: 'auto',
                  background: alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 4,
                  boxShadow: `0 20px 80px ${alpha(theme.palette.common.black, 0.1)}`
                }}
              
          </Grid>

          {/* Right Panel - Auth Form */}
          <Grid sx={{ xs: 12, md: 6 }}>
            <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, maxWidth: 500, mx: 'auto' }}>
              <Stack spacing={3}>
                {/* Header */}
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {isSignIn ? 'Welcome back' : 'Join Vidyagam'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isSignIn 
                      ? 'Enter your credentials to access your dashboard' 
                      : 'Enter your details to get started with your AI news experience'
                    }
                  </Typography>
                </Box>

                {/* Google Sign In */}
                <GoogleSignIn onSuccess={handleGoogleSuccess} />

                <Divider>
                  <Typography variant="caption" color="text.secondary">
                    or continue with email
                  </Typography>
                </Divider>

                {/* Form */}
                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    {isSignUp && (
                      <TextField
                        fullWidth
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                        required={isSignUp}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <UserIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}

                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      error={!!formErrors.email}
                      helperText={formErrors.email}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />

                    {formData.email && !isGmailDomain(formData.email) && (
                      <>
                        <TextField
                          fullWidth
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          error={!!formErrors.password}
                          helperText={formErrors.password}
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />

                        {isSignUp && (
                          <TextField
                            fullWidth
                            label="Confirm Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            error={!!formErrors.confirmPassword}
                            helperText={formErrors.confirmPassword}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LockIcon />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      </>
                    )}

                    {mode === 'signup' && (
                      <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.paper' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.acceptTerms}
                              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              I accept the{' '}
                              <Button
                                size="small"
                                onClick={() => setShowTermsModal(true)}
                                sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                              >
                                Terms of Service
                              </Button>
                              {' '}and{' '}
                              <Button
                                size="small"
                                onClick={() => setShowPrivacyModal(true)}
                                sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                              >
                                Privacy Policy
                              </Button>
                            </Typography>
                          }
                        />
                        <Alert 
                          severity={formData.acceptTerms ? 'success' : 'warning'}
                          sx={{ mt: 1.5 }}
                        >
                          {formData.acceptTerms 
                            ? 'Policies accepted - you can proceed' 
                            : 'Please accept Terms of Service and Privacy Policy'}
                        </Alert>
                      </Paper>
                    )}

                    {error && (
                      <Alert severity="error">{error}</Alert>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={mode === 'signup' ? !formData.acceptTerms || loading : loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? 'Processing...' : (mode === 'signup' ? 'Continue to Sign Up' : 'Continue to Sign In')}
                    </Button>
                  </Stack>
                </Box>

                <Divider />

                {/* Footer */}
                {isSignIn ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      New to Vidyagam?{' '}
                      <Button
                        onClick={() => switchMode('signup')}
                        sx={{ textTransform: 'none' }}
                      >
                        Create account →
                      </Button>
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Already have an account?{' '}
                      <Button
                        onClick={() => switchMode('signin')}
                        sx={{ textTransform: 'none' }}
                      >
                        Sign in here
                      </Button>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      By creating an account, you agree to our{' '}
                      <Link to="/terms">Terms of Service</Link> and{' '}
                      <Link to="/privacy">Privacy Policy</Link>
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Terms Modal */}
      <Dialog open={showTermsModal} onClose={() => setShowTermsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Terms of Service</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            By using this service, you agree to our Terms of Service. We are committed to 
            providing you with high-quality AI news and content.
          </Typography>
          <Typography paragraph>
            <strong>1. Acceptance of Terms:</strong> By accessing and using this service, 
            you accept and agree to be bound by the terms and provision of this agreement.
          </Typography>
          <Typography>
            For complete terms and conditions, please contact our support team.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTermsModal(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Modal */}
      <Dialog open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Privacy Policy</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            We are committed to protecting your privacy. This Privacy Policy explains how we 
            collect, use, disclose, and safeguard your information when you use our service.
          </Typography>
          <Typography>
            For complete privacy information, please contact our support team.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrivacyModal(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Auth;
