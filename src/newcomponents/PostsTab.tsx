import { Add, ArrowBack, Delete, Edit, OpenInNew, Refresh } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Article } from '../types/article';
import NewsItemContainer from './cards/NewsItemContainer';
import PostCreator from './PostCreator';

interface Post {
  id: number;
  title: string;
  summary: string;
  url: string;
  source: string;
  significance_score: number;
  published_date: string | null;
  author: string;
  keywords: string;
  category: string;
  category_label: string;
  content_type: string;
}

interface PostsTabProps {
  categoryId?: number;
}

// ── Map Post → Article so NewsItemContainer/NewsItem render it natively ────

const postToArticle = (post: Post): Article => {
  const plainText = (() => {
    const tmp = document.createElement('div');
    tmp.innerHTML = post.summary || '';
    return tmp.textContent || tmp.innerText || '';
  })();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  return {
    id: post.id,
    title: post.title,
    url: post.url || '#',
    summary: plainText,           // plain-text preview for the list
    source: post.author || 'Anonymous', // author shown as source (uppercase caption)
    source_name: post.author || 'Anonymous',
    author: post.author,
    published_date: post.published_date,
    time: post.published_date || '',
    category: post.category,
    category_name: post.category,
    content_type: 'POST',
    content_type_name: 'BLOGS',   // keeps the same card style as news
    significanceScore: post.significance_score || 5,
    significance_score: post.significance_score,
    readTime,
  };
};

// ── Skeleton ───────────────────────────────────────────────────────────────

const PostSkeleton: React.FC = () => (
  <Box sx={{ py: 2 }}>
    <Skeleton variant="text" width="20%" height={16} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="75%" height={22} />
    <Skeleton variant="text" width="90%" height={18} />
    <Skeleton variant="text" width="30%" height={14} sx={{ mt: 1 }} />
  </Box>
);

// ── Post detail (inline full-HTML reader) ─────────────────────────────────

const formatTimeAgo = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PostDetail: React.FC<{
  post: Post;
  onBack: () => void;
  isOwner?: boolean;
  onEdit?: () => void;
  onDeleteSuccess?: () => void;
}> = ({ post, onBack, isOwner, onEdit, onDeleteSuccess }) => {
  const theme = useTheme();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiService.deletePost(post.id);
      setConfirmDelete(false);
      onDeleteSuccess?.();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete post.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const keywords = post.keywords
    ? post.keywords.split(',').map(k => k.trim()).filter(Boolean)
    : [];

  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={onBack} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Back to Posts</Typography>
        {post.url && post.url !== '#' && (
          <Tooltip title="Open original link" arrow>
            <IconButton
              size="small"
              component="a"
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {isOwner && (
          <>
            <Tooltip title="Edit post" arrow>
              <IconButton size="small" onClick={onEdit} color="primary">
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete post" arrow>
              <IconButton size="small" onClick={() => setConfirmDelete(true)} color="error">
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onClose={() => !deleteLoading && setConfirmDelete(false)}>
        <DialogTitle>Delete Post?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &ldquo;{post.title}&rdquo;? This action cannot be undone.
          </DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mt: 1 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <Delete />}
          >
            {deleteLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {post.category && (
        <Chip
          label={post.category}
          size="small"
          sx={{ mb: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 600 }}
        />
      )}

      <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.3, mb: 1.5 }}>
        {post.title}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          {post.author || 'Anonymous'}
        </Typography>
        {post.published_date && (
          <><Box sx={{ color: 'text.disabled' }}>·</Box>
            <Typography variant="caption" color="text.secondary">{formatTimeAgo(post.published_date)}</Typography></>
        )}
        {post.source && (
          <><Box sx={{ color: 'text.disabled' }}>·</Box>
            <Typography variant="caption" color="text.secondary">{post.source}</Typography></>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {post.summary ? (
        <Box
          dangerouslySetInnerHTML={{ __html: post.summary }}
          sx={{
            '& h1,& h2,& h3,& h4': { fontWeight: 700, mt: 3, mb: 1.5, lineHeight: 1.3 },
            '& h1': { fontSize: '1.8rem' }, '& h2': { fontSize: '1.5rem' }, '& h3': { fontSize: '1.25rem' },
            '& p': { mb: 2, lineHeight: 1.8, color: 'text.primary' },
            '& ul,& ol': { pl: 3, mb: 2 }, '& li': { mb: 0.5, lineHeight: 1.8 },
            '& a': { color: 'primary.main', textDecoration: 'underline' },
            '& blockquote': { borderLeft: `4px solid ${theme.palette.primary.main}`, pl: 2, ml: 0, my: 2, color: 'text.secondary', fontStyle: 'italic' },
            '& code': { bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5, fontFamily: 'monospace', fontSize: '0.875em' },
            '& pre': { bgcolor: 'action.hover', p: 2, borderRadius: 1, overflow: 'auto', '& code': { bgcolor: 'transparent', p: 0 } },
            '& img': { maxWidth: '100%', borderRadius: 1 },
            '& strong': { fontWeight: 700 },
            lineHeight: 1.8,
          }}
        />
      ) : (
        <Typography color="text.secondary" fontStyle="italic">No content.</Typography>
      )}

      {keywords.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mt: 3 }}>
          {keywords.map(kw => <Chip key={kw} label={kw} size="small" variant="outlined" />)}
        </Stack>
      )}

      <Divider sx={{ mt: 4, mb: 2 }} />
      <Button startIcon={<ArrowBack />} onClick={onBack} variant="outlined" size="small">
        Back to Posts
      </Button>
    </Box>
  );
};

// ── Main Tab ───────────────────────────────────────────────────────────────

const PostsTab: React.FC<PostsTabProps> = ({ categoryId }) => {
  const { isAuthenticated, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const isOwner = (post: Post) =>
    !!(user && post.author && (user.name === post.author || user.email === post.author));

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getPosts(50, categoryId);
      setPosts(response.posts || []);
    } catch (err: any) {
      console.error('Failed to load posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  if (showCreator || editingPost) {
    return (
      <PostCreator
        onClose={() => { setShowCreator(false); setEditingPost(null); }}
        onSuccess={() => {
          setShowCreator(false);
          setEditingPost(null);
          setSelectedPost(null);
          fetchPosts();
        }}
        initialData={editingPost ? {
          id: editingPost.id,
          title: editingPost.title,
          summary: editingPost.summary,
          author: editingPost.author,
          category: editingPost.category,
          significance_score: editingPost.significance_score,
          url: editingPost.url,
          source: editingPost.source,
          keywords: editingPost.keywords,
        } : undefined}
      />
    );
  }

  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        isOwner={isOwner(selectedPost)}
        onEdit={() => setEditingPost(selectedPost)}
        onDeleteSuccess={() => { setSelectedPost(null); fetchPosts(); }}
      />
    );
  }

  const articles = posts.map(postToArticle);

  return (
    <Box sx={{ py: 2 }}>
      {/* Header row */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>Posts</Typography>
        </Box>
        <Tooltip title="Refresh posts" arrow>
          <IconButton onClick={fetchPosts} disabled={loading} size="small">
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
        {isAuthenticated && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreator(true)} sx={{ borderRadius: 2 }}>
            Add Post
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading && (
        <Stack spacing={0} divider={<Divider />}>
          {[1, 2, 3, 4, 5].map(i => <PostSkeleton key={i} />)}
        </Stack>
      )}

      {!loading && (
        <NewsItemContainer
          articles={articles}
          contentType="blog"
          showInteractions
          emptyMessage={isAuthenticated ? 'Be the first to create a post!' : 'Community posts and insights will appear here.'}
          emptyIcon="🗨️"
          onItemClick={(article) => {
            const post = posts.find(p => p.id === article.id);
            if (post) setSelectedPost(post);
          }}
        />
      )}

      {!loading && posts.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          {posts.length} post{posts.length !== 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};

export default PostsTab;
