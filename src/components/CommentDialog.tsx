import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  IconButton,
  Stack,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { MessageCircle, Send, Edit2, Trash2, Reply } from 'lucide-react';
import { apiService, Comment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  articleId: number;
  onCommentAdded?: () => void;
}

const CommentDialog: React.FC<CommentDialogProps> = ({ 
  open, 
  onClose, 
  articleId,
  onCommentAdded 
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const MAX_CHARS = 500;

  // Load comments on open
  useEffect(() => {
    if (open) {
      loadComments();
    }
  }, [open, articleId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await apiService.getArticleComments(articleId);
      // Organize into threaded structure
      const threaded = organizeThreaded(response.comments);
      setComments(threaded);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Organize flat comments into threaded structure
  const organizeThreaded = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    flatComments.forEach(comment => {
      const commentNode = commentMap.get(comment.id)!;
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    return rootComments;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || newComment.length > MAX_CHARS) return;

    try {
      await apiService.createComment(articleId, newComment, replyingTo || undefined);
      setNewComment('');
      setReplyingTo(null);
      await loadComments();
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError('Failed to post comment');
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim() || editContent.length > MAX_CHARS) return;

    try {
      await apiService.updateComment(commentId, editContent);
      setEditingId(null);
      setEditContent('');
      await loadComments();
    } catch (err) {
      console.error('Failed to update comment:', err);
      setError('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await apiService.deleteComment(commentId);
      await loadComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment');
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isAuthor = user?.id === comment.user_id;
    const isEditing = editingId === comment.id;

    return (
      <Box
        key={comment.id}
        sx={{
          ml: depth * 4,
          mb: 2,
          pl: depth > 0 ? 2 : 0,
          borderLeft: depth > 0 ? '2px solid' : 'none',
          borderColor: 'divider'
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar sx={{ width: 32, height: 32 }}>
            {comment.username[0].toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography variant="subtitle2" fontWeight={600}>
                {comment.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(comment.created_at).toLocaleDateString()}
              </Typography>
              {comment.is_edited && (
                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                  (edited)
                </Typography>
              )}
            </Stack>

            {isEditing ? (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  inputProps={{ maxLength: MAX_CHARS }}
                  helperText={`${editContent.length}/${MAX_CHARS}`}
                  size="small"
                />
                <Stack direction="row" spacing={1} mt={1}>
                  <Button size="small" onClick={() => handleEditComment(comment.id)}>
                    Save
                  </Button>
                  <Button size="small" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            ) : (
              <>
                <Typography variant="body2" mb={1}>
                  {comment.content}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    size="small"
                    startIcon={<Reply size={14} />}
                    onClick={() => setReplyingTo(comment.id)}
                  >
                    Reply
                  </Button>

                  {isAuthor && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </>
                  )}
                </Stack>
              </>
            )}

            {/* Render replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
              <Box mt={2}>
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <MessageCircle size={20} />
          <Typography variant="h6">Comments</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Comment Input */}
        <Box mb={3}>
          {replyingTo && (
            <Alert 
              severity="info" 
              onClose={() => setReplyingTo(null)}
              sx={{ mb: 1 }}
            >
              Replying to comment
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            inputProps={{ maxLength: MAX_CHARS }}
            helperText={`${newComment.length}/${MAX_CHARS}`}
          />
          <Button
            variant="contained"
            startIcon={<Send size={16} />}
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || newComment.length > MAX_CHARS}
            sx={{ mt: 1 }}
          >
            Post Comment
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Comments List */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No comments yet. Be the first to comment!
          </Typography>
        ) : (
          <Box>
            {comments.map(comment => renderComment(comment, 0))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentDialog;