import { alpha, Box, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';
import type { Article } from '../../types/article';
import EventCard from './EventCard';

interface EventContainerProps {
  articles: Article[];
  headerTitle?: string;
  headerSubtitle?: string;
  onLike?: (id: number) => void;
  onBookmark?: (id: number) => void;
  showInteractions?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
}

const EventContainer: React.FC<EventContainerProps> = ({
  articles,
  headerTitle,
  headerSubtitle,
  onLike,
  onBookmark,
  showInteractions = false,
  emptyMessage = 'No events available yet',
  emptyIcon = '📅',
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ width: '100%' }}>
      {headerTitle && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
            {headerTitle}
          </Typography>
          {headerSubtitle && (
            <Typography variant="body2" color="text.secondary">
              {headerSubtitle}
            </Typography>
          )}
        </Box>
      )}

      {articles.length > 0 ? (
        <Stack spacing={1.5}>
          {articles.map((article, idx) => (
            <EventCard
              key={article.id ?? idx}
              article={article}
              onLike={onLike}
              onBookmark={onBookmark}
              showInteractions={showInteractions}
            />
          ))}
        </Stack>
      ) : (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px dashed',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Typography sx={{ fontSize: '3.5rem', mb: 1.5, opacity: 0.6 }}>{emptyIcon}</Typography>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {emptyMessage}
          </Typography>
          <Typography color="text.disabled" variant="body2">
            Conferences, webinars, and meetups will appear here
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EventContainer;
