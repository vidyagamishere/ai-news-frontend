import React from 'react';
import { Box, Paper, Typography, Stack, useTheme, Container } from '@mui/material';
import HorizontalArticleCard from './HorizontalArticleCard';
import type { Article } from '../../types/article';

interface CardContainerProps {
  title?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  articles: Article[];
  contentType?: string;
  onLike?: (articleId: number) => void;
  onBookmark?: (articleId: number) => void;
  onShare?: (articleId: number) => void;
  showInteractions?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
}

const CardContainer: React.FC<CardContainerProps> = ({
  title,
  headerTitle,
  headerSubtitle,
  articles,
  contentType = 'blog',
  onLike,
  onBookmark,
  onShare,
  showInteractions = false,
  emptyMessage = 'No articles available',
  emptyIcon
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: 2
      }}>
      {/* Large Header Section */}
      {headerTitle && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {headerTitle}
          </Typography>
          {headerSubtitle && (
            <Typography color="text.secondary" variant='caption'>
              {headerSubtitle}
            </Typography>
          )}
        </Box>
      )}

      {/* Header */}
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
        <Stack spacing={0} divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {articles.map((article, index) => (
            <HorizontalArticleCard
              key={article.id || index}
              article={article}
              contentType={contentType}
              onLike={onLike}
              onBookmark={onBookmark}
              onShare={onShare}
              showInteractions={showInteractions}
            />
          ))}
        </Stack>
      ) : (
        <Box
          sx={{
            p: 6,
            textAlign: 'center'
          }}
        >
          {emptyIcon && (
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>
              {emptyIcon}
            </Typography>
          )}
          <Typography variant="h5" fontWeight={700}>
            {emptyMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CardContainer;
