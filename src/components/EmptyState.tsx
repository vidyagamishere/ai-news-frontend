import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stack,
  Button 
} from '@mui/material';
import { 
  SearchOff as SearchOffIcon,
  FolderOff as FolderOffIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

interface EmptyStateProps {
  icon?: 'search' | 'folder' | 'article';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'article',
  title = 'No Content Available',
  message = 'There is no content to display at the moment.',
  actionLabel,
  onAction
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'search':
        return <SearchOffIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />;
      case 'folder':
        return <FolderOffIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />;
      default:
        return <ArticleIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
        p: 4
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          maxWidth: 500,
          backgroundColor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3
        }}
      >
        <Stack spacing={3} alignItems="center">
          {getIcon()}
          
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            {title}
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
          
          {actionLabel && onAction && (
            <Button
              variant="contained"
              size="large"
              onClick={onAction}
              sx={{ mt: 2 }}
            >
              {actionLabel}
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default EmptyState;
