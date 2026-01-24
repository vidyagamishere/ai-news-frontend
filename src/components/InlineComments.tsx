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
  alpha,
  Fade,
  Zoom,
  Chip,
  Tooltip,
  Drawer,
  Slide
} from '@mui/material';
import { Send, Reply, MoreHorizontal, X, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService, type Comment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface InlineCommentsProps {
  articleId: number;
  open: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
  anchorEl?: HTMLElement | null; // Make optional since we're using drawer
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
  const [hoveredComment, setHoveredComment] = useState<number | null>(null);
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
    const showReplies = !expandedReplies.has(comment.id);
    const isHovered = hoveredComment === comment.id;
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <Fade in timeout={300} key={comment.id}>
        <Box
          sx={{
            mb: depth === 0 ? 2.5 : 1.5,
            position: 'relative'
          }}
          onMouseEnter={() => setHoveredComment(comment.id)}
          onMouseLeave={() => setHoveredComment(null)}
        >
          <Stack direction="row" spacing={1.5} sx={{ pl: depth * 4 }}>
            {/* Threaded line indicator */}
            {depth > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  left: depth * 4 - 20,
                  top: 0,
                  bottom: hasReplies && showReplies ? 0 : '100%',
                  width: 2,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                  borderRadius: 1
                }}
              />
            )}

            {/* Avatar with online indicator */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: depth === 0 ? 44 : 36,
                  height: depth === 0 ? 44 : 36,
                  fontSize: depth === 0 ? '1.1rem' : '0.9rem',
                  bgcolor: 'primary.main',
                  background: `linear-gradient(135deg, ${depth === 0 ? '#667eea 0%, #764ba2 100%' : '#f093fb 0%, #f5576c 100%'
                    })`,
                  boxShadow: isHovered ? `0 4px 12px ${alpha('#667eea', 0.4)}` : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid',
                  borderColor: 'background.paper'
                }}
              >
                {comment.username?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              {/* Online status indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: depth === 0 ? 12 : 10,
                  height: depth === 0 ? 12 : 10,
                  bgcolor: '#4ade80',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  borderRadius: '50%',
                  opacity: Math.random() > 0.5 ? 1 : 0 // Simulate some users online
                }}
              />
            </Box>

            {/* Comment Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Modern comment card with glassmorphism */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: (theme) => depth === 0
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.grey[50], 0.6),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  mb: 0.75,
                  border: '1px solid',
                  borderColor: (theme) => isHovered
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha(theme.palette.divider, 0.1),
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                  boxShadow: isHovered
                    ? `0 8px 24px ${alpha('#000', 0.12)}`
                    : `0 2px 8px ${alpha('#000', 0.04)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: depth === 0
                      ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {comment.username || 'Anonymous'}
                  </Typography>
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: 'text.disabled'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                  {depth === 0 && (
                    <Chip
                      label="TOP"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        ml: 'auto !important'
                      }}
                    />
                  )}
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                    color: 'text.primary',
                    fontSize: '0.9rem'
                  }}
                >
                  {comment.content}
                </Typography>

                {/* Reaction bar (placeholder for future enhancement) */}
                <Fade in={isHovered}>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: '1px solid',
                      borderColor: (theme) => alpha(theme.palette.divider, 0.1)
                    }}
                  >
                    <Tooltip title="Like" arrow>
                      <IconButton size="small" sx={{ fontSize: '1rem' }}>
                        👍
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Love" arrow>
                      <IconButton size="small" sx={{ fontSize: '1rem' }}>
                        ❤️
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Insightful" arrow>
                      <IconButton size="small" sx={{ fontSize: '1rem' }}>
                        💡
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Fade>
              </Paper>

              {/* Action buttons - Modern style */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1.5 }}>
                {depth < 3 && (
                  <Tooltip title="Reply to this comment" arrow placement="top">
                    <Button
                      size="small"
                      startIcon={<Reply size={14} />}
                      onClick={() => setReplyingTo(comment.id)}
                      sx={{
                        minWidth: 'auto',
                        textTransform: 'none',
                        color: 'text.secondary',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main'
                        }
                      }}
                    >
                      Reply
                    </Button>
                  </Tooltip>
                )}
                {hasReplies && (
                  <Button
                    size="small"
                    endIcon={showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    onClick={() => toggleReplies(comment.id)}
                    sx={{
                      minWidth: 'auto',
                      textTransform: 'none',
                      color: 'primary.main',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15)
                      }
                    }}
                  >
                    {comment.replies?.length || 0} {(comment.replies?.length || 0) === 1 ? 'reply' : 'replies'}
                  </Button>
                )}
              </Stack>

              {/* Nested replies with smooth collapse */}
              <Collapse in={hasReplies && showReplies} timeout={300}>
                <Box mt={2}>
                  {comment.replies?.map(reply => renderComment(reply, depth + 1))}
                </Box>
              </Collapse>
            </Box>
          </Stack>
        </Box>
      </Fade>
    );
  };

  if (!open) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={400}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 480 },
          maxWidth: '100vw',
          boxShadow: (theme) => `-8px 0 24px ${alpha(theme.palette.common.black, 0.15)}`,
          border: 'none',
          borderRadius: 0
        }
      }}
    >
      {/* Modern Comments Panel */}
      <Box
        ref={containerRef}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: (theme) => `linear-gradient(to bottom, ${theme.palette.background.paper}, ${alpha(theme.palette.background.paper, 0.95)})`
        }}
      >
        {/* Modern Header with white background */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: (theme) => alpha(theme.palette.divider, 0.1)
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <MessageCircle size={24} />
              <Box>
                <Typography variant="h6" fontSize="1.1rem" fontWeight={700}>
                  Discussion
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: 'text.primary',
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.1),
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.2),
                  transform: 'rotate(90deg)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <X size={20} />
            </IconButton>
          </Stack>
        </Box>

        {error && (
          <Fade in>
            <Alert
              severity="error"
              sx={{
                m: 2,
                mb: 0,
                borderRadius: 2,
                '& .MuiAlert-message': { fontSize: '0.875rem' }
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Modern Input Area - Moved to top */}
        <Box
          sx={{
            p: 2.5,
            borderBottom: '1px solid',
            borderColor: (theme) => alpha(theme.palette.divider, 0.1),
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)'
          }}
        >
          {replyingTo && (
            <Fade in>
              <Alert
                severity="info"
                onClose={() => setReplyingTo(null)}
                icon={<Reply size={16} />}
                sx={{
                  mb: 1.5,
                  py: 0.5,
                  fontSize: '0.8rem',
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                  '& .MuiAlert-message': {
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }
                }}
              >
                Replying to comment
              </Alert>
            </Fade>
          )}
          
          {/* User info above comment box */}
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.400' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {user?.name || 'User'}
            </Typography>
          </Stack>

          {/* Premium input field */}
          <Paper
            elevation={0}
            sx={{
              border: '2px solid',
              borderColor: (theme) => alpha(theme.palette.divider, 0.1),
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:focus-within': {
                borderColor: 'primary.main',
                boxShadow: (theme) => `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
                bgcolor: 'background.paper'
              }
            }}
          >
            <InputBase
              fullWidth
              multiline
              minRows={3}
              maxRows={4}
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              sx={{
                px: 2,
                py: 1.5,
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ px: 2, pb: 1.5 }}
            >
              <Typography
                variant="caption"
                color={newComment.length > MAX_CHARS * 0.9 ? 'error.main' : 'text.secondary'}
                fontWeight={600}
              >
                {newComment.length}/{MAX_CHARS}
              </Typography>
              <Button
                variant="contained"
                size="small"
                endIcon={<Send size={14} />}
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || newComment.length > MAX_CHARS}
                sx={{
                  minWidth: 'auto',
                  px: 2.5,
                  py: 0.75,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  bgcolor: 'common.black',
                  color: 'common.white',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: 'grey.800',
                    boxShadow: 'none'
                  },
                  '&:disabled': {
                    bgcolor: 'grey.300',
                    color: 'grey.500'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Post
              </Button>
            </Stack>
          </Paper>
        </Box>

        {/* Comments List with custom scrollbar */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2.5,
            '&::-webkit-scrollbar': {
              width: 8
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
              borderRadius: 4,
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3)
              }
            }
          }}
        >
          {loading ? (
            <Fade in>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress size={40} thickness={3} />
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Loading comments...
                </Typography>
              </Box>
            </Fade>
          ) : comments.length === 0 ? (
            <Fade in>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <MessageCircle size={48} strokeWidth={1.5} opacity={0.3} />
                <Typography color="text.secondary" mt={2} variant="body2" fontWeight={500}>
                  No comments yet
                </Typography>
                <Typography color="text.disabled" variant="caption">
                  Be the first to share your thoughts!
                </Typography>
              </Box>
            </Fade>
          ) : (
            <Box>
              {comments.map(comment => renderComment(comment, 0))}
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default InlineComments;
