import { Box, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import type { Article } from '../../types/article';
import NewsItem from './NewsItem';

interface NewsItemContainerProps {
  title?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  articles: Article[];
  contentType?: 'blog' | 'podcast' | 'video' | 'course' | 'job' | 'event';
  onLike?: (articleId: number) => void;
  onBookmark?: (articleId: number) => void;
  onShare?: (articleId: number) => void;
  showInteractions?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  onArticleClick?: (article: Article) => void;
  onItemClick?: (article: Article) => void;
}

const NewsItemContainer: React.FC<NewsItemContainerProps> = ({
  title,
  headerTitle,
  headerSubtitle,
  articles,
  contentType = 'blog',
  onLike,
  onBookmark,
  onShare,
  showInteractions = false,
  emptyMessage,
  emptyIcon,
  onArticleClick,
  onItemClick,
}) => {
  const theme = useTheme();

  const getContentIcon = () => {
    switch (contentType) {
      case 'blog': return '📰';
      case 'podcast': return '🎧';
      case 'video': return '📹';
      case 'course': return '🎓';
      case 'job': return '💼';
      case 'event': return '📅';
      default: return '📰';
    }
  };

  const getDefaultEmptyMessage = () => {
    switch (contentType) {
      case 'blog': return 'No articles available';
      case 'podcast': return 'No podcasts available';
      case 'video': return 'No videos available';
      case 'course': return 'No courses available';
      case 'job': return 'No job listings available';
      case 'event': return 'No events available';
      default: return 'No content available';
    }
  };

  const isCardLayout = contentType === 'course' || contentType === 'job' || contentType === 'event';

  return (
    <Box sx={{
      width: '100%',
      px: { xs: 0, md: 2 },
      py: { xs: 1, md: 2 }
    }}>
      {/* Large Header Section */}
      {headerTitle && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {headerTitle}
          </Typography>
          {headerSubtitle && (
            <Typography color="text.secondary" variant="body2">
              {headerSubtitle}
            </Typography>
          )}
        </Box>
      )}

      {/* Section Title */}
      {title && (
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50'
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Box>
      )}

      {/* Content */}
      {articles.length > 0 ? (
        isCardLayout ? (
          // ✅ Use Flexbox card layout for courses, jobs, and events
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              mt: 2,
              // Responsive card widths using flex-basis
              '& > *': {
                flexBasis: {
                  xs: '100%',           // Mobile: 1 column
                  sm: 'calc(50% - 12px)',   // Tablet: 2 columns (50% - gap/2)
                  md: 'calc(33.333% - 16px)' // Desktop: 3 columns (33.33% - gap*2/3)
                },
                flexGrow: 0,
                flexShrink: 0
              }
            }}
          >
            {articles.map((article, index) => (
              <Box key={article.id || index}>
                <NewsItem
                  article={article}
                  contentType={contentType}
                  onLike={onLike}
                  onBookmark={onBookmark}
                  onShare={onShare}
                  showInteractions={showInteractions}
                  onClick={onArticleClick}
                />
              </Box>
            ))}
          </Box>
        ) : (
          // ✅ Existing Stack layout for blogs/podcasts/videos - unchanged
          <Stack 
            spacing={0} 
            divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}
          >
            {articles.map((article, index) => (
              <NewsItem
                key={article.id || index}
                article={article}
                contentType={contentType}
                onLike={onLike}
                onBookmark={onBookmark}
                onShare={onShare}
                showInteractions={showInteractions}
                onClick={onArticleClick}
                onCardClick={onItemClick ? () => onItemClick(article) : undefined}
            />
            ))}
          </Stack>
        )
      ) : (
        // Empty state
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>
            {emptyIcon || getContentIcon()}
          </Typography>
          <Typography variant="h6" fontWeight={600} color="text.secondary">
            {emptyMessage || getDefaultEmptyMessage()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NewsItemContainer;