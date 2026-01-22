import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Collapse,
  Paper,
  IconButton,
  Divider,
  InputBase,
  alpha
} from '@mui/material';
import { Send, Reply, MoreHorizontal } from 'lucide-react';
import { apiService, type Comment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface InlineCommentsProps {
  articleId: number;
  open: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
  anchorEl: HTMLElement | null;
}

const MAX_CHARS = 500;

const InlineComments: React.FC<InlineCommentsProps> = ({
  articleId,
  open,
  onClose,
  onCommentAdded,
  anchorEl
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadComments();
      // Initialize all comments as expanded
      setExpandedReplies(new Set());
    }
  }, [open, articleId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getArticleComments(articleId);
      const organizedComments = organizeThreaded(response);
      setComments(organizedComments);
    } catch (err: any) {
      console.error('Error loading comments:', err);
      setError(err.response?.data?.detail || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const organizeThreaded = (flatComments: Comment[]): Comment[] => {
    console.log('📝 Organizing comments - flat list:', flatComments);
    const commentMap = new Map<number, Comment & { replies: Comment[] }>();
    const rootComments: (Comment & { replies: Comment[] })[] = [];

    // First pass: create comment nodes with replies array
    flatComments.forEach(comment => {
      const commentNode = { ...comment, replies: [] as Comment[] };
      commentMap.set(comment.id, commentNode);
    });

    // Second pass: build the tree
    flatComments.forEach(comment => {
      const commentNode = commentMap.get(comment.id)!;
      
      if (comment.parent_comment_id) {
        console.log(`🔗 Comment ${comment.id} is a reply to ${comment.parent_comment_id}`);
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentNode);
          console.log(`✅ Added reply ${comment.id} to parent ${comment.parent_comment_id}`);
        } else {
          console.warn(`⚠️ Parent ${comment.parent_comment_id} not found for comment ${comment.id}`);
          rootComments.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    console.log('🌳 Root comments:', rootComments);
    console.log('📊 Comments with replies:', 
      rootComments.filter(c => c.replies && c.replies.length > 0).map(c => ({
        id: c.id,
        repliesCount: c.replies?.length
      }))
    );

    return rootComments;
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      setError(null);
      await apiService.createComment(
        articleId,
        newComment.trim(),
        replyingTo || undefined
      );
      
      setNewComment('');
      setReplyingTo(null);
      await loadComments();
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err: any) {
      console.error('Error posting comment:', err);
      setError(err.response?.data?.detail || 'Failed to post comment');
    }
  };

  const toggleReplies = (commentId: number) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const renderComment = (comment: Comment, depth: number = 0): JSX.Element => {
    const showReplies = !expandedReplies.has(comment.id); // Default to showing replies
    
    return (
      <Box key={comment.id} sx={{ mb: depth === 0 ? 2 : 0 }}>
        <Stack direction="row" spacing={1.5} sx={{ pl: depth * 5 }}>
          {/* Avatar */}
          <Avatar 
            sx={{ 
              width: depth === 0 ? 40 : 32, 
              height: depth === 0 ? 40 : 32, 
              fontSize: depth === 0 ? '1rem' : '0.875rem',
              bgcolor: 'primary.main'
            }}
          >
            {comment.username?.[0]?.toUpperCase() || 'A'}
          </Avatar>

          {/* Comment Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* LinkedIn-style comment bubble */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                bgcolor: (theme) => depth === 0 
                  ? alpha(theme.palette.grey[100], 0.5)
                  : alpha(theme.palette.grey[50], 0.3),
                borderRadius: 2,
                mb: 0.5
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {comment.username || 'Anonymous'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {new Date(comment.created_at).toLocaleDateString()}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {comment.content}
              </Typography>
            </Paper>

            {/* Action buttons */}
            <Stack direction="row" spacing={2} sx={{ px: 1 }}>
              {depth < 3 && (
                <Button
                  size="small"
                  onClick={() => setReplyingTo(comment.id)}
                  sx={{ 
                    minWidth: 'auto',
                    textTransform: 'none',
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    px: 0,
                    py: 0.25,
                    '&:hover': { bgcolor: 'transparent' }
                  }}
                >
                  Reply
                </Button>
              )}
              {comment.replies && comment.replies.length > 0 && (
                <Button
                  size="small"
                  onClick={() => toggleReplies(comment.id)}
                  sx={{ 
                    minWidth: 'auto',
                    textTransform: 'none',
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    px: 0,
                    py: 0.25,
                    '&:hover': { bgcolor: 'transparent' }
                  }}
                >
                  {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </Button>
              )}
            </Stack>

            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && showReplies && (
              <Box mt={1}>
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    );
  };

  // Position the comments below the anchor element
  const getPosition = () => {
    if (!anchorEl) return {};
    const rect = anchorEl.getBoundingClientRect();
    return {
      position: 'fixed' as const,
      top: rect.bottom + 8,
      left: Math.max(16, rect.left - 150), // Center below icon with some offset
      zIndex: 1300
    };
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1299,
          backgroundColor: 'transparent'
        }}
      />
      
      {/* Comments Panel */}
      <Paper
        ref={containerRef}
        elevation={8}
        sx={{
          ...getPosition(),
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 500,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontSize="1rem" fontWeight={600}>
            Comments ({comments.length})
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2, mb: 0 }}>
            {error}
          </Alert>
        )}

        {/* Comments List */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : comments.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={2} variant="body2">
              No comments yet. Be the first!
            </Typography>
          ) : (
            <Box>
              {comments.map(comment => renderComment(comment, 0))}
            </Box>
          )}
        </Box>

        {/* Input Area - LinkedIn style */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {replyingTo && (
            <Alert 
              severity="info"
              onClose={() => setReplyingTo(null)}
              sx={{ mb: 1, py: 0.5, fontSize: '0.75rem' }}
            >
              Replying to comment
            </Alert>
          )}
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            {/* User Avatar */}
            <Avatar sx={{ width: 32, height: 32, mt: 0.5 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            
            {/* LinkedIn-style input */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                border: 1,
                borderColor: 'divider',
                borderRadius: 5,
                overflow: 'hidden',
                '&:focus-within': {
                  borderColor: 'primary.main'
                }
              }}
            >
              <InputBase
                fullWidth
                multiline
                maxRows={4}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                sx={{
                  px: 2,
                  py: 1,
                  fontSize: '0.875rem'
                }}
              />
              <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center"
                sx={{ px: 2, pb: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {newComment.length}/{MAX_CHARS}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || newComment.length > MAX_CHARS}
                  sx={{ 
                    minWidth: 'auto',
                    px: 2,
                    py: 0.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '0.75rem'
                  }}
                >
                  Post
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Paper>
    </>
  );
};

export default InlineComments;
