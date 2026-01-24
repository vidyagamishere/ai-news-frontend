import React from 'react';
import {
  Box,
  Container,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';

// Horizontal Article Card Skeleton matching HorizontalArticleCard layout
export const HorizontalArticleCardSkeleton: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      py: 2,
      gap: 2
    }}
  >
    <Container maxWidth="lg">
      {/* Content on left */}
      <Box sx={{ flex: 1 }}>
        {/* Publisher/Source */}
        <Skeleton variant="text" width="30%" height={16} sx={{ mb: 1 }} />

        {/* Title */}
        <Skeleton variant="text" width="90%" height={28} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="70%" height={28} sx={{ mb: 1 }} />

        {/* Summary */}
        <Skeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="85%" height={20} sx={{ mb: 2 }} />

        {/* Metadata */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Skeleton variant="text" width={80} height={20} />
          <Skeleton variant="circular" width={4} height={4} />
          <Skeleton variant="rounded" width={80} height={24} />
        </Box>
      </Box>
    </Container>

    {/* Thumbnail on right */}
    <Skeleton
      variant="rounded"
      width={100}
      height={100}
      sx={{
        flexShrink: 0,
        borderRadius: 1
      }}
    />
  </Box>
);

// Container with header and multiple horizontal cards
export const ArticleListSkeleton: React.FC<{ count?: number; showHeader?: boolean }> = ({
  count = 5,
  showHeader = true
}) => (
  <Box sx={{ mt: 10 }}>
    <Container maxWidth="lg" disableGutters>
      {/* Content with dividers */}
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <Stack spacing={0} divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {Array.from({ length: count }).map((_, i) => (
            <HorizontalArticleCardSkeleton key={i} />
          ))}
        </Stack>
      </Box>
    </Container>

  </Box >
);

// Legacy vertical card skeleton (kept for backward compatibility)
export const ArticleCardSkeleton: React.FC = () => (
  <Box
    sx={{
      border: 1,
      borderColor: 'divider',
      borderRadius: 2,
      overflow: 'hidden'
    }}
  >
    <Box sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={100} />
        </Box>
      </Stack>
    </Box>
  </Box>
);

export const LandingSkeleton: React.FC = () => (
  <ArticleListSkeleton count={6} showHeader={true} />
);

export const DashboardSkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Stack spacing={3}>
      {/* Content Skeleton */}
      <ArticleListSkeleton count={5} showHeader={true} />
    </Stack>
  </Box>
);

export const ContentSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <ArticleListSkeleton count={count} showHeader={false} />
);

const LoadingSkeleton = {
  ArticleCardSkeleton,
  HorizontalArticleCardSkeleton,
  ArticleListSkeleton,
  LandingSkeleton,
  DashboardSkeleton,
  ContentSkeleton
};

export default LoadingSkeleton;
