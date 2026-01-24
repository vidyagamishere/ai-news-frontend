import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  IconButton,
  Typography,
  Stack,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { Share2, Copy, Mail, Check, MessageCircle } from 'lucide-react';
import { Facebook, LinkedIn, MailOutline, WhatsApp, X } from '@mui/icons-material';
import { apiService } from '../services/api';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  articleId: number;
  articleUrl: string;
  articleTitle: string;
  onShareTracked?: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  articleId,
  articleUrl,
  articleTitle,
  onShareTracked
}) => {
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      await apiService.trackShare(articleId, 'copy_link');
      setSnackbarMessage('Link copied to clipboard!');
      setSnackbarOpen(true);
      if (onShareTracked) onShareTracked();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEmailShare = async () => {
    try {
      const subject = encodeURIComponent(`Check out: ${articleTitle}`);
      const body = encodeURIComponent(`I thought you might find this interesting:\n\n${articleTitle}\n\n${articleUrl}`);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      await apiService.trackShare(articleId, 'email');
      setSnackbarMessage('Opening email client...');
      setSnackbarOpen(true);
      if (onShareTracked) onShareTracked();
    } catch (err) {
      console.error('Failed to share via email:', err);
    }
  };

  const handleFacebookShare = async () => {
    try {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, '_blank', 'width=600,height=400');
      await apiService.trackShare(articleId, 'facebook');
      setSnackbarMessage('Opening Facebook...');
      setSnackbarOpen(true);
      if (onShareTracked) onShareTracked();
    } catch (err) {
      console.error('Failed to share on Facebook:', err);
    }
  };

  const handleTwitterShare = async () => {
    try {
      const text = encodeURIComponent(articleTitle);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(articleUrl)}`, '_blank', 'width=600,height=400');
      await apiService.trackShare(articleId, 'twitter');
      setSnackbarMessage('Opening X (Twitter)...');
      setSnackbarOpen(true);
      if (onShareTracked) onShareTracked();
    } catch (err) {
      console.error('Failed to share on Twitter:', err);
    }
  };

  const handleLinkedInShare = async () => {
    try {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`, '_blank', 'width=600,height=400');
      await apiService.trackShare(articleId, 'linkedin');
      setSnackbarMessage('Opening LinkedIn...');
      setSnackbarOpen(true);
      if (onShareTracked) onShareTracked();
    } catch (err) {
      console.error('Failed to share on LinkedIn:', err);
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      const text = encodeURIComponent(`${articleTitle}\n\n${articleUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      await apiService.trackShare(articleId, 'whatsapp');
      setSnackbarMessage('Opening WhatsApp...');
      setSnackbarOpen(true);
      if (onShareTracked) onShareTracked();
    } catch (err) {
      console.error('Failed to share on WhatsApp:', err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Share2 size={20} />
            <Typography variant="h6">Share Article</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {articleTitle}
          </Typography>

          <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
            {/* Copy Link */}
            <Tooltip title={copied ? "Copied!" : "Copy Link"}>
              <IconButton
                onClick={handleCopyLink}
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                {copied ? <Check size={32} /> : <Copy size={32} />}
              </IconButton>
            </Tooltip>

            {/* Facebook */}
            <Tooltip title="Share on Facebook">
              <IconButton
                onClick={handleFacebookShare}
                sx={{
                  color: '#1877F2',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              >
                <Facebook sx={{ fontSize: 32 }} />
              </IconButton>
            </Tooltip>

            {/* X (Twitter) */}
            <Tooltip title="Share on X (Twitter)">
              <IconButton
                onClick={handleTwitterShare}
                sx={{
                  color: '#000000',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              >
                <X sx={{ fontSize: 32 }} />
              </IconButton>
            </Tooltip>

            {/* LinkedIn */}
            <Tooltip title="Share on LinkedIn">
              <IconButton
                onClick={handleLinkedInShare}
                sx={{
                  color: '#0A66C2',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              >
                <LinkedIn sx={{ fontSize: 32 }} />
              </IconButton>
            </Tooltip>

            {/* WhatsApp */}
            <Tooltip title="Share on WhatsApp">
              <IconButton
                onClick={handleWhatsAppShare}
                sx={{
                  color: '#25D366',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              >
                <WhatsApp sx={{ fontSize: 32 }} />
              </IconButton>
            </Tooltip>

            {/* Email */}
            <Tooltip title="Share via Email">
              <IconButton
                onClick={handleEmailShare}
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                <MailOutline sx={{ fontSize: 32 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default ShareDialog;