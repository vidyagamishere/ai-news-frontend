import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { apiService } from '../../services/api';
import { useAdminAuth } from '../../contexts/AdminAuthContext';


interface AddSourceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingSource: any;
  contentType: string;
}

const schema = yup.object({
  name: yup.string().required('Name is required'),
  rss_url: yup.string().url('Must be a valid URL').required('URL is required'),
  website: yup.string().url('Must be a valid URL'),
  category_id: yup.number().required('Category is required'),
  priority: yup.number().min(1).max(10).required('Priority is required'),
  scraping_frequency_hours: yup.number().min(1).required('Frequency is required'),
  llm_model: yup.string(),
  description: yup.string(),
}).required();

export const AddSourceDialog: React.FC<AddSourceDialogProps> = ({
  open,
  onClose,
  onSuccess,
  editingSource,
  contentType,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { adminApiKey } = useAdminAuth();
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      rss_url: '',
      website: '',
      category_id: 0,
      priority: 5,
      scraping_frequency_hours: 24,
      llm_model: 'claude',
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (editingSource) {
        reset(editingSource);
      } else {
        reset({
          name: '',
          rss_url: '',
          website: '',
          category_id: 0,
          priority: 5,
          scraping_frequency_hours: 24,
          llm_model: 'claude',
          description: '',
        });
      }
    }
  }, [open, editingSource, reset]);

  const fetchCategories = async () => {
    console.log('🔵 [AddSourceDialog] fetchCategories() START');
    
    try {
      if (!adminApiKey) {
        console.error('🔴 [AddSourceDialog] Admin not authenticated');
        setError('Admin not authenticated');
        return;
      }
      
      const response = await apiService.getAllCategories(adminApiKey);
      
      console.log('🟢 [AddSourceDialog] Categories fetched:', {
        response,
        categoriesCount: response?.categories?.length || 0,
        categories: response.categories,
      });
      
      setCategories(response.categories || []);
      setError(null);
    } catch (error) {
      console.error('🔴 [AddSourceDialog] Failed to fetch categories:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      setError('Failed to fetch categories');
    }
  };

  const onSubmit = async (data: any) => {
    console.log('🔵 [AddSourceDialog] onSubmit() START', {
      data,
      editingSource,
      contentType,
    });
    
    setLoading(true);
    setError(null);
    
    if (!adminApiKey) {
      console.error('🔴 [AddSourceDialog] Admin not authenticated');
      setError('Admin not authenticated');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...data,
        content_type: contentType,
        is_active: true,
      };

      console.log('🟡 [AddSourceDialog] Submitting payload:', {
        payload,
        isEditing: !!editingSource,
        endpoint: editingSource ? 'admin/sources/update' : 'admin/sources/add',
      });

      if (editingSource) {
        const result = await apiService.callEndpoint(
          'admin/sources/update',
          'POST',
          { ...payload, id: editingSource.id },
          false,
          { 'X-Admin-API-Key': adminApiKey }
        );
        console.log('🟢 [AddSourceDialog] Update result:', result);
      } else {
        const result = await apiService.callEndpoint(
          'admin/sources/add',
          'POST',
          payload,
          false,
          { 'X-Admin-API-Key': adminApiKey }
        );
        console.log('🟢 [AddSourceDialog] Add result:', result);
      }

      console.log('🟢 [AddSourceDialog] Success! Calling onSuccess()');
      setError(null);
      onSuccess();
      onClose();
      reset();
    } catch (error: any) {
      console.error('🔴 [AddSourceDialog] Failed to save source:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorResponse: error?.response,
      });
      setError(error?.message || 'Failed to save source. Please try again.');
    } finally {
      setLoading(false);
      console.log('🔵 [AddSourceDialog] onSubmit() END');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editingSource ? 'Edit Source' : 'Add New Source'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box display="flex" flexDirection="column" gap={2}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Source Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <Controller
              name="rss_url"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="RSS/Feed URL"
                  fullWidth
                  error={!!errors.rss_url}
                  helperText={errors.rss_url?.message}
                />
              )}
            />

            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Website URL"
                  fullWidth
                  error={!!errors.website}
                  helperText={errors.website?.message}
                />
              )}
            />

            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Category"
                  fullWidth
                  error={!!errors.category_id}
                  helperText={errors.category_id?.message}
                >
                  <MenuItem value={0}>Select Category</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Box display="flex" gap={2}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Priority (1-10)"
                    fullWidth
                    error={!!errors.priority}
                    helperText={errors.priority?.message}
                  />
                )}
              />

              <Controller
                name="scraping_frequency_hours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Frequency (hours)"
                    fullWidth
                    error={!!errors.scraping_frequency_hours}
                    helperText={errors.scraping_frequency_hours?.message}
                  />
                )}
              />
            </Box>

            <Controller
              name="llm_model"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="LLM Model"
                  fullWidth
                >
                  <MenuItem value="claude">Claude</MenuItem>
                  <MenuItem value="gemini">Gemini</MenuItem>
                  <MenuItem value="ollama">Ollama</MenuItem>
                  <MenuItem value="">None</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  rows={3}
                  fullWidth
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : editingSource ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};