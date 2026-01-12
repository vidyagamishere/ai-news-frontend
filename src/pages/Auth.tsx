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
  AutoAwesome,
  TrendingUp,
  Security,
  Speed
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import GoogleSignIn from '../components/auth/GoogleSignIn';
import { validateSignupEmail } from '../utils/emailValidation';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isSignIn = mode === 'signin';
  const isSignUp = mode === 'signup';
  const theme = useTheme();

  useEffect(() => {
    setError('');
    setSuccess('');
    setErrors({});
  }, [mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (isSignUp) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }

      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the terms and conditions';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (isSignUp && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        const validationResult = validateSignupEmail(formData.email);
        if (validationResult) {
          setError(validationResult);
          setLoading(false);
          return;
        }

        const response = await signup({ 
          email: formData.email, 
          password: formData.password, 
          confirmPassword: formData.confirmPassword,
          name: formData.fullName,
          acceptTerms: formData.agreeToTerms
        });
        
        console.log('📧 Signup response:', response);
        
        // Type guard to check if response is OTP response
        const isOTPResponse = (res: any): res is { message: string; otpSent: boolean } => {
          return res && typeof res === 'object' && 'message' in res && typeof res.message === 'string';
        };
        
        // Check if response is OTP response (for non-Gmail users)
        if (isOTPResponse(response) && response.message.includes('OTP')) {
          console.log('✅ OTP response detected, navigating to verification...');
          setSuccess('OTP sent! Redirecting to verification...');
          // Pass all necessary data including password for non-Gmail signup
          const userData = {
            name: formData.fullName,
            password: formData.password
          };
          setTimeout(() => {
            navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}&userData=${encodeURIComponent(JSON.stringify(userData))}&authMode=signup`);
          }, 1500);
        } else {
          console.log('⚠️ Non-OTP response, using fallback flow');
          // Direct signup success (shouldn't happen with new flow, but keep for safety)
          setSuccess('Account created! Please check your email to verify your account.');
          setTimeout(() => {
            navigate('/auth?mode=signin');
          }, 2000);
        }
      } else {
        await login({ email: formData.email, password: formData.password });
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isSignIn ? 'sign in' : 'sign up'}`);
    } finally {
      setLoading(false);
    }
  };

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
          <Grid size={{ xs: 12, md: 6 }}>
            <Fade in timeout={800}>
              <Box 
                sx={{ 
                  pr: { md: 4 },
                  position: 'relative'
                }}
              >
                <Box
                  sx={{
                    background: `linear-gradient(135deg, 
                      ${alpha('#667eea', 0.95)} 0%, 
                      ${alpha('#764ba2', 0.95)} 50%,
                      ${alpha('#f093fb', 0.9)} 100%
                    )`,
                    borderRadius: 4,
                    p: { xs: 3, md: 5 },
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 20px 60px ${alpha('#667eea', 0.3)}`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `radial-gradient(circle at 20% 50%, ${alpha('#fff', 0.1)} 0%, transparent 50%),
                                   radial-gradient(circle at 80% 80%, ${alpha('#fff', 0.05)} 0%, transparent 50%)`,
                      pointerEvents: 'none'
                    }
                  }}
                >
                <Stack spacing={4}>
                  {/* Logo & Tagline */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: 3,
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 8px 32px ${alpha('#000', 0.15)}`
                        }}
                      >
                        <BrainIcon sx={{ fontSize: 40, color: '#667eea' }} />
                      </Box>
                      <Typography 
                        variant="h3" 
                        fontWeight={800}
                        sx={{
                          color: 'white',
                          letterSpacing: '-0.02em',
                          textShadow: `0 2px 20px ${alpha('#000', 0.2)}`
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
                        color: 'rgba(255, 255, 255, 0.95)',
                        textShadow: `0 2px 15px ${alpha('#000', 0.15)}`
                      }}
                    >
                      Your AI Intelligence Hub
                    </Typography>

                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 4, 
                        lineHeight: 1.8,
                        color: 'rgba(255, 255, 255, 0.85)',
                        textShadow: `0 1px 10px ${alpha('#000', 0.1)}`
                      }}
                    >
                      Join the next generation of AI enthusiasts. Get personalized news, 
                      breakthrough research, and expert insights—all in one place.
                    </Typography>

                    {/* Stats */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      {stats.map((stat, index) => (
                        <Grid size={{ xs: 6, sm: 3 }} key={index}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              background: 'rgba(255, 255, 255, 0.15)',
                              backdropFilter: 'blur(10px)',
                              border: `1px solid rgba(255, 255, 255, 0.2)`,
                              borderRadius: 2,
                              transition: 'all 0.3s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                background: 'rgba(255, 255, 255, 0.25)',
                                boxShadow: `0 8px 24px ${alpha('#000', 0.2)}`
                              }
                            }}
                          >
                            <Typography variant="h5" fontWeight={800} sx={{ color: 'white' }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
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
                        <Grid size={{ xs: 12, sm: 6 }} key={index}>
                          <Slide direction="up" in timeout={1000 + index * 100}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2.5,
                                height: '100%',
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid rgba(255, 255, 255, 0.3)`,
                                borderRadius: 3,
                                transition: 'all 0.3s',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                  transform: 'translateY(-8px)',
                                  boxShadow: `0 12px 40px ${alpha(feature.color, 0.3)}`,
                                  borderColor: feature.color,
                                  background: 'rgba(255, 255, 255, 1)'
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
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid rgba(255, 255, 255, 0.3)`,
                            color: 'white',
                            fontWeight: 600,
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.3)'
                            }
                          }}
                        />
                      ))}
                    </Stack>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        mt: 1, 
                        display: 'block',
                        color: 'rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      Trusted sources from leading AI organizations
                    </Typography>
                  </Box>
                </Stack>
                </Box>
              </Box>
            </Fade>
          </Grid>

          {/* Right Panel - Auth Form */}
          <Grid size={{ xs: 12, md: 6 }}>
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
              >
                <Stack spacing={3}>
                  {/* Header */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h4" 
                      fontWeight={800}
                      gutterBottom
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {isSignIn ? 'Welcome Back' : 'Create Account'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {isSignIn 
                        ? 'Sign in to continue your AI journey' 
                        : 'Join our community of AI enthusiasts'}
                    </Typography>
                  </Box>

                  {error && (
                    <Slide direction="down" in mountOnEnter unmountOnExit>
                      <Alert 
                        severity="error" 
                        onClose={() => setError('')}
                        sx={{ 
                          borderRadius: 2,
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {error}
                      </Alert>
                    </Slide>
                  )}

                  {success && (
                    <Slide direction="down" in mountOnEnter unmountOnExit>
                      <Alert 
                        severity="success"
                        sx={{ 
                          borderRadius: 2,
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {success}
                      </Alert>
                    </Slide>
                  )}

                  {/* Google Sign In */}
                  <GoogleSignIn 
                    onSuccess={() => navigate('/dashboard')}
                  />

                  <Divider>
                    <Chip 
                      label="or" 
                      size="small"
                      sx={{
                        background: alpha(theme.palette.background.paper, 0.8),
                        fontWeight: 600
                      }}
                    />
                  </Divider>

                  {/* Form */}
                  <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2.5}>
                      {isSignUp && (
                        <TextField
                          fullWidth
                          label="Full Name"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          error={!!errors.fullName}
                          helperText={errors.fullName}
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <UserIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: alpha(theme.palette.background.default, 0.5),
                              transition: 'all 0.3s',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.background.default, 0.7),
                              },
                              '&.Mui-focused': {
                                backgroundColor: alpha(theme.palette.background.default, 0.8),
                                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                              }
                            }
                          }}
                        />
                      )}

                      <TextField
                        fullWidth
                        type="email"
                        label="Email Address"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            transition: 'all 0.3s',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.background.default, 0.7),
                            },
                            '&.Mui-focused': {
                              backgroundColor: alpha(theme.palette.background.default, 0.8),
                              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }
                        }}
                      />

                      <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        label="Password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        error={!!errors.password}
                        helperText={errors.password}
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                size="small"
                              >
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            transition: 'all 0.3s',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.background.default, 0.7),
                            },
                            '&.Mui-focused': {
                              backgroundColor: alpha(theme.palette.background.default, 0.8),
                              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }
                        }}
                      />

                      {isSignUp && (
                        <TextField
                          fullWidth
                          type={showConfirmPassword ? 'text' : 'password'}
                          label="Confirm Password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword}
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                  size="small"
                                >
                                  {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: alpha(theme.palette.background.default, 0.5),
                              transition: 'all 0.3s',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.background.default, 0.7),
                              },
                              '&.Mui-focused': {
                                backgroundColor: alpha(theme.palette.background.default, 0.8),
                                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                              }
                            }
                          }}
                        />
                      )}

                      {isSignUp && (
                        <Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="agreeToTerms"
                                checked={formData.agreeToTerms}
                                onChange={handleInputChange}
                                disabled={loading}
                              />
                            }
                            label={
                              <Typography variant="body2">
                                I agree to the{' '}
                                <Link 
                                  to="#" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setShowTermsModal(true);
                                  }}
                                  style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 600 }}
                                >
                                  Terms & Conditions
                                </Link>
                                {' '}and{' '}
                                <Link 
                                  to="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setShowPrivacyModal(true);
                                  }}
                                  style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 600 }}
                                >
                                  Privacy Policy
                                </Link>
                              </Typography>
                            }
                          />
                          {errors.agreeToTerms && (
                            <Typography variant="caption" color="error" sx={{ ml: 2, display: 'block' }}>
                              {errors.agreeToTerms}
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{
                          py: 1.5,
                          mt: 1,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                          },
                          '&:disabled': {
                            background: alpha(theme.palette.action.disabled, 0.3)
                          }
                        }}
                      >
                        {loading ? 'Please wait...' : (isSignIn ? 'Sign In' : 'Create Account')}
                      </Button>

                      {isSignIn && (
                        <Box sx={{ textAlign: 'center' }}>
                          <Link 
                            to="/verify-email" 
                            style={{ 
                              color: theme.palette.primary.main, 
                              textDecoration: 'none', 
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}
                          >
                            Forgot Password?
                          </Link>
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {isSignIn ? "Don't have an account?" : "Already have an account?"}
                          {' '}
                          <Link 
                            to={`/auth?mode=${isSignIn ? 'signup' : 'signin'}`}
                            style={{ 
                              color: theme.palette.primary.main, 
                              textDecoration: 'none',
                              fontWeight: 700
                            }}
                          >
                            {isSignIn ? 'Sign Up' : 'Sign In'}
                          </Link>
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Container>

      {/* Terms Modal */}
      <Dialog 
        open={showTermsModal} 
        onClose={() => setShowTermsModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
            background: alpha(theme.palette.background.paper, 0.95)
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Terms & Conditions</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" paragraph>
            Welcome to Vidyagam. By accessing our service, you agree to these terms.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            1. Use of Service
          </Typography>
          <Typography variant="body2" paragraph>
            You must use Vidyagam in compliance with all applicable laws and regulations.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            2. User Accounts
          </Typography>
          <Typography variant="body2" paragraph>
            You are responsible for maintaining the confidentiality of your account.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            3. Content
          </Typography>
          <Typography variant="body2" paragraph>
            We reserve the right to remove any content that violates our policies.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowTermsModal(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Modal */}
      <Dialog 
        open={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
            background: alpha(theme.palette.background.paper, 0.95)
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Privacy Policy</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" paragraph>
            Your privacy is important to us. This policy explains how we handle your data.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Information We Collect
          </Typography>
          <Typography variant="body2" paragraph>
            We collect information you provide directly, such as your name and email.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            How We Use Information
          </Typography>
          <Typography variant="body2" paragraph>
            We use your information to provide and improve our service.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Data Security
          </Typography>
          <Typography variant="body2" paragraph>
            We implement appropriate security measures to protect your data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowPrivacyModal(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Auth;
