import {
  ArrowBack,
  Code,
  FormatAlignCenter,
  FormatAlignLeft,
  FormatAlignRight,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  FormatStrikethrough,
  FormatUnderlined,
  HorizontalRule,
  Image,
  Link,
  Redo,
  Title,
  Undo,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface PostCreatorProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    id: number;
    title: string;
    summary: string;   // HTML content
    author: string;
    category: string;
    significance_score: number;
    url: string;
    source: string;
    keywords: string;
  };
}

const CATEGORIES = [
  { id: 1, name: 'Generative AI' },
  { id: 2, name: 'AI Applications' },
  { id: 3, name: 'AI Startups' },
  { id: 4, name: 'Machine Learning' },
  { id: 5, name: 'AI Research' },
];

const ToolbarButton: React.FC<{
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, active, children }) => (
  <Tooltip title={title} arrow>
    <IconButton
      size="small"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      sx={{
        borderRadius: 1,
        bgcolor: active ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
        mx: 0.2,
      }}
    >
      {children}
    </IconButton>
  </Tooltip>
);

const PostCreator: React.FC<PostCreatorProps> = ({ onClose, onSuccess, initialData }) => {
  const { user } = useAuth();
  const isEditing = !!initialData;
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(initialData?.title || '');
  const [author, setAuthor] = useState(initialData?.author || user?.name || user?.email || '');
  const categoryIdFromName = CATEGORIES.find(c => c.name === initialData?.category)?.id ?? 1;
  const [categoryId, setCategoryId] = useState(categoryIdFromName);
  const [significanceScore, setSignificanceScore] = useState(initialData?.significance_score ?? 7.0);
  const [url, setUrl] = useState(initialData?.url || '');
  const [source, setSource] = useState(initialData?.source || '');
  const [keywords, setKeywords] = useState(initialData?.keywords || '');
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState('');

  // Pre-load existing HTML content into the editor
  React.useEffect(() => {
    if (isEditing && initialData?.summary && editorRef.current) {
      editorRef.current.innerHTML = initialData.summary;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) exec('insertImage', url);
  };

  const toggleHtmlMode = () => {
    if (!htmlMode) {
      // Switch to raw HTML view
      setRawHtml(editorRef.current?.innerHTML || '');
      setHtmlMode(true);
    } else {
      // Apply raw HTML back to editor
      if (editorRef.current) editorRef.current.innerHTML = rawHtml;
      setHtmlMode(false);
    }
  };

  const addKeyword = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && keywordInput.trim()) {
      e.preventDefault();
      const kw = keywordInput.trim().replace(/,$/, '');
      if (kw) {
        const existing = keywords ? keywords.split(',').map(k => k.trim()) : [];
        if (!existing.includes(kw)) {
          setKeywords([...existing, kw].join(', '));
        }
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    const updated = keywords.split(',').map(k => k.trim()).filter(k => k !== kw);
    setKeywords(updated.join(', '));
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }

    const htmlContent = htmlMode ? rawHtml : (editorRef.current?.innerHTML || '');

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        html_content: htmlContent,
        author: author || user?.name || user?.email || 'Anonymous',
        category_id: categoryId,
        significance_score: significanceScore,
        url: url.trim(),
        source: source.trim() || 'Community Post',
        keywords: keywords.trim(),
      };

      if (isEditing && initialData) {
        await apiService.updatePost(initialData.id, payload);
      } else {
        await apiService.createPost(payload);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || `Failed to ${isEditing ? 'update' : 'create'} post. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const keywordList = keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [];

  return (
    <Box sx={{ py: 2 }}>
      {/* Inline header row */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={onClose} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          {isEditing ? 'Edit Post' : 'Create New Post'}
        </Typography>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {saving ? (isEditing ? 'Updating…' : 'Publishing…') : (isEditing ? 'Update Post' : 'Publish Post')}
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Content */}
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {isEditing ? 'Post updated successfully!' : 'Post published successfully!'}
          </Alert>
        )}

        {/* Title */}
        <TextField
          fullWidth
          placeholder="Post title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: false,
            sx: { fontSize: '2rem', fontWeight: 700, mb: 1 },
          }}
          sx={{ mb: 2 }}
        />

        {/* Metadata row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId}
              label="Category"
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="External URL (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            size="small"
            placeholder="https://…"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            size="small"
            placeholder="e.g. Medium, Blog"
            sx={{ minWidth: 140 }}
          />
        </Stack>

        {/* Significance score */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Significance Score: <strong>{significanceScore.toFixed(1)}</strong>
          </Typography>
          <Slider
            value={significanceScore}
            onChange={(_, v) => setSignificanceScore(v as number)}
            min={1}
            max={10}
            step={0.5}
            valueLabelDisplay="auto"
            sx={{ maxWidth: 300 }}
          />
        </Box>

        {/* Keywords */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Add keywords (press Enter or comma)"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={addKeyword}
            size="small"
            fullWidth
            placeholder="e.g. llm, openai, gpt-4"
          />
          {keywordList.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
              {keywordList.map((kw) => (
                <Chip
                  key={kw}
                  label={kw}
                  size="small"
                  onDelete={() => removeKeyword(kw)}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* HTML Editor */}
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Toolbar */}
          {!htmlMode && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <ToolbarButton title="Bold (Ctrl+B)" onClick={() => exec('bold')}>
                <FormatBold fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Italic (Ctrl+I)" onClick={() => exec('italic')}>
                <FormatItalic fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Underline (Ctrl+U)" onClick={() => exec('underline')}>
                <FormatUnderlined fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Strikethrough" onClick={() => exec('strikeThrough')}>
                <FormatStrikethrough fontSize="small" />
              </ToolbarButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              <ToolbarButton title="Heading 1" onClick={() => exec('formatBlock', '<h1>')}>
                <Title fontSize="small" />
              </ToolbarButton>
              <Tooltip title="Heading 2" arrow>
                <IconButton
                  size="small"
                  onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h2>'); }}
                  sx={{ borderRadius: 1, fontSize: '0.7rem', fontWeight: 700, minWidth: 28, mx: 0.2 }}
                >
                  H2
                </IconButton>
              </Tooltip>
              <Tooltip title="Heading 3" arrow>
                <IconButton
                  size="small"
                  onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h3>'); }}
                  sx={{ borderRadius: 1, fontSize: '0.7rem', fontWeight: 700, minWidth: 28, mx: 0.2 }}
                >
                  H3
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              <ToolbarButton title="Align Left" onClick={() => exec('justifyLeft')}>
                <FormatAlignLeft fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Align Center" onClick={() => exec('justifyCenter')}>
                <FormatAlignCenter fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Align Right" onClick={() => exec('justifyRight')}>
                <FormatAlignRight fontSize="small" />
              </ToolbarButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              <ToolbarButton title="Bullet List" onClick={() => exec('insertUnorderedList')}>
                <FormatListBulleted fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Numbered List" onClick={() => exec('insertOrderedList')}>
                <FormatListNumbered fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Blockquote" onClick={() => exec('formatBlock', '<blockquote>')}>
                <FormatQuote fontSize="small" />
              </ToolbarButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              <ToolbarButton title="Insert Link" onClick={insertLink}>
                <Link fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Insert Image" onClick={insertImage}>
                <Image fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Code Block" onClick={() => exec('formatBlock', '<pre>')}>
                <Code fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Horizontal Rule" onClick={() => exec('insertHorizontalRule')}>
                <HorizontalRule fontSize="small" />
              </ToolbarButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              <ToolbarButton title="Undo" onClick={() => exec('undo')}>
                <Undo fontSize="small" />
              </ToolbarButton>
              <ToolbarButton title="Redo" onClick={() => exec('redo')}>
                <Redo fontSize="small" />
              </ToolbarButton>

              <Box sx={{ flex: 1 }} />
              <Tooltip title="Toggle raw HTML mode" arrow>
                <Chip
                  label="</> HTML"
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={toggleHtmlMode}
                  color="default"
                />
              </Tooltip>
            </Box>
          )}

          {/* Editor area */}
          {htmlMode ? (
            <Box>
              <Box sx={{ px: 2, py: 1, bgcolor: 'warning.light', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" fontWeight={600}>Raw HTML Mode</Typography>
                <Button size="small" variant="outlined" onClick={toggleHtmlMode}>
                  Back to Visual Editor
                </Button>
              </Box>
              <TextField
                multiline
                fullWidth
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                minRows={20}
                InputProps={{
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    borderRadius: 0,
                  },
                }}
                sx={{ '& fieldset': { border: 'none' } }}
              />
            </Box>
          ) : (
            <Box
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Write your post here… Start typing or paste HTML content."
              onFocus={(e) => {
                if (!e.currentTarget.textContent?.trim() && !e.currentTarget.innerHTML.trim()) {
                  e.currentTarget.innerHTML = '';
                }
              }}
              sx={{
                minHeight: 400,
                p: 3,
                outline: 'none',
                fontSize: '1rem',
                lineHeight: 1.8,
                color: 'text.primary',
                '&:empty:before': {
                  content: 'attr(data-placeholder)',
                  color: 'text.disabled',
                  pointerEvents: 'none',
                },
                '& h1': { fontSize: '2rem', fontWeight: 700, my: 2 },
                '& h2': { fontSize: '1.5rem', fontWeight: 700, my: 1.5 },
                '& h3': { fontSize: '1.2rem', fontWeight: 600, my: 1 },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  pl: 2,
                  ml: 0,
                  color: 'text.secondary',
                  fontStyle: 'italic',
                },
                '& pre': {
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  overflow: 'auto',
                },
                '& a': { color: 'primary.main' },
                '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
              }}
            />
          )}
        </Paper>

        {/* Bottom actions */}
        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={saving} startIcon={<ArrowBack />}>
            Back to Posts
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? (isEditing ? 'Updating…' : 'Publishing…') : (isEditing ? 'Update Post' : 'Publish Post')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default PostCreator;
