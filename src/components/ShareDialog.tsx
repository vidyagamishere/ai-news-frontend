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
  Alert,
  Snackbar
} from '@mui/material';
import { Share2, Copy, Mail, Check } from 'lucide-react';
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
      
      // Track share
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
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      window.open(mailtoLink, '_blank');
      
      // Track share
      await apiService.trackShare(articleId, 'email');
      
      setSnackbarMessage('Opening email client...');
      setSnackbarOpen(true);
      
      if (onShareTracked) onShareTracked();
    } catch (err) {
      console.error('Failed to share via email:', err);
    }
  };

  // Future: Add Twitter, LinkedIn, Facebook handlers
  // const handleTwitterShare = async () => { ... }
  // const handleLinkedInShare = async () => { ... }

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

          <Stack spacing={2}>
            {/* Copy Link */}
            <Button
              variant="outlined"
              fullWidth
              startIcon={copied ? <Check size={18} /> : <Copy size={18} />}
              onClick={handleCopyLink}
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              {copied ? 'Link Copied!' : 'Copy Link'}
            </Button>

            {/* Email */}
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Mail size={18} />}
              onClick={handleEmailShare}
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              Share via Email
            </Button>

            {/* Future Platform Placeholders */}
            <Alert severity="info" sx={{ mt: 2 }}>
              More sharing options (Twitter, LinkedIn, Facebook) coming soon!
            </Alert>
          </Stack>
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