import React, { useState, useEffect } from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  LinearProgress,
  Stack,
  Paper
} from '@mui/material';
import { 
  Psychology as BrainIcon, 
  Storage as DatabaseIcon,
  Bolt as ZapIcon, 
  Refresh as RefreshIcon 
} from '@mui/icons-material';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = "Loading AI news..." }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  const loadingSteps = [
    { icon: BrainIcon, text: "Initializing AI systems", color: "#3b82f6" },
    { icon: DatabaseIcon, text: "Fetching latest news", color: "#10b981" },
    { icon: ZapIcon, text: "Processing content", color: "#f59e0b" },
    { icon: RefreshIcon, text: "Finalizing dashboard", color: "#8b5cf6" }
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % loadingSteps.length);
    }, 2000);

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  const CurrentIcon = loadingSteps[currentStep].icon;
  const progress = ((currentStep + 1) / loadingSteps.length) * 100;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        padding: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          borderRadius: 3
        }}
      >
        <Stack spacing={3} alignItems="center">
          {/* Main spinner */}
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              size={80}
              thickness={3}
              sx={{ color: loadingSteps[currentStep].color }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CurrentIcon sx={{ fontSize: 32, color: loadingSteps[currentStep].color }} />
            </Box>
          </Box>

          {/* Title */}
          <Typography variant="h5" fontWeight="bold" color="primary">
            Vidyagam AI News
          </Typography>

          {/* Current step message */}
          <Typography variant="body1" color="text.secondary">
            {loadingSteps[currentStep].text}{dots}
          </Typography>

          {/* Progress bar */}
          <Box sx={{ width: '100%' }}>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: loadingSteps[currentStep].color,
                  borderRadius: 4
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {Math.round(progress)}% Complete
            </Typography>
          </Box>

          {/* Steps list */}
          <Stack spacing={1.5} sx={{ width: '100%', mt: 2 }}>
            {loadingSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    opacity: isActive ? 1 : isCompleted ? 0.7 : 0.4,
                    transition: 'opacity 0.3s'
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 2,
                      borderColor: step.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isActive ? step.color : 'transparent'
                    }}
                  >
                    <StepIcon 
                      sx={{ 
                        fontSize: 16, 
                        color: isActive ? 'white' : step.color 
                      }} 
                    />
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    {step.text}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          {/* Tip */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            💡 <strong>Tip:</strong> We're fetching fresh AI news from 45+ sources
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Loading;
