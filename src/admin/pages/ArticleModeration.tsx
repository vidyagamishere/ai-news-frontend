import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { apiService } from '../../services/api';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Article {
  id: number;
  title: string;
  category_name: string;
  publisher_name: string;
  llm_model: string;
  published_date: string;
  significance_score: number;
}

export const ArticleModeration: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const { adminApiKey } = useAdminAuth();
  // Filters
  const [categories, setCategories] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    category_id: '',
    llm_model: '',
    search_query: '',
    start_date: '',
    end_date: '',
    page: 1,
    page_size: 25,
  });
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [filters.page, filters.page_size]);

  const fetchCategories = async () => {
    if (!adminApiKey) {
      console.error('Admin not authenticated');
      return;
    }
    try {
      const response = await apiService.getAllCategories(adminApiKey);
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    if (!adminApiKey) {
      console.error('Admin not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      const params: any = {
        page: filters.page,
        page_size: filters.page_size,
      };
      
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.llm_model) params.llm_model = filters.llm_model;
      if (filters.search_query) params.search_query = filters.search_query;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await apiService.getFilteredArticles(params, adminApiKey);
      setArticles(response.articles || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      setSnackbar({ open: true, message: 'Failed to load articles', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    
    if (!adminApiKey) {
      console.error('Admin not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      await apiService.deleteArticle(id, adminApiKey);
      setSnackbar({ open: true, message: 'Article deleted successfully', severity: 'success' });
      fetchArticles();
    } catch (error) {
      console.error('Failed to delete article:', error);
      setSnackbar({ open: true, message: 'Failed to delete article', severity: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.isArray(selectedRows) ? selectedRows : [];
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} articles?`)) return;
    
    if (!adminApiKey) {
      console.error('Admin not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      await apiService.bulkDeleteArticles(selectedIds as number[], adminApiKey);
      setSnackbar({ open: true, message: 'Articles deleted successfully', severity: 'success' });
      setSelectedRows([] as any);
      fetchArticles();
    } catch (error) {
      console.error('Failed to delete articles:', error);
      setSnackbar({ open: true, message: 'Failed to delete articles', severity: 'error' });
    }
  };

  const handleApplyFilters = () => {
    setFilters({ ...filters, page: 1 });
    fetchArticles();
  };

  const getSelectedCount = () => selectedRows.length;

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = articles.map((n) => n.id);
      setSelectedRows(newSelected);
      return;
    }
    setSelectedRows([]);
  };

  const handleClick = (id: number) => {
    const selectedIndex = selectedRows.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRows, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedRows.slice(1));
    } else if (selectedIndex === selectedRows.length - 1) {
      newSelected = newSelected.concat(selectedRows.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedRows.slice(0, selectedIndex),
        selectedRows.slice(selectedIndex + 1),
      );
    }

    setSelectedRows(newSelected);
  };

  const isSelected = (id: number) => selectedRows.indexOf(id) !== -1;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setFilters({ ...filters, page: newPage + 1 });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setFilters({ ...filters, page: 1, page_size: newRowsPerPage });
  };

  const paginatedArticles = articles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Article Moderation</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchArticles}
        >
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            select
            label="Category"
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="LLM Model"
            value={filters.llm_model}
            onChange={(e) => setFilters({ ...filters, llm_model: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Models</MenuItem>
            <MenuItem value="claude">Claude</MenuItem>
            <MenuItem value="gemini">Gemini</MenuItem>
            <MenuItem value="ollama">Ollama</MenuItem>
          </TextField>

          <TextField
            label="Search"
            value={filters.search_query}
            onChange={(e) => setFilters({ ...filters, search_query: e.target.value })}
            placeholder="Search articles..."
            sx={{ minWidth: 250 }}
          />

          <TextField
            label="Start Date"
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End Date"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <Button variant="contained" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </Box>
      </Paper>

      {getSelectedCount() > 0 && (
        <Box mb={2}>
          <Button variant="outlined" color="error" onClick={handleBulkDelete}>
            Delete {getSelectedCount()} Selected
          </Button>
        </Box>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < articles.length}
                    checked={articles.length > 0 && selectedRows.length === articles.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Publisher</TableCell>
                <TableCell>LLM</TableCell>
                <TableCell>Published</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {articles.map((row) => {
                const isItemSelected = isSelected(row.id);
                return (
                  <TableRow
                    hover
                    key={row.id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={() => handleClick(row.id)}
                      />
                    </TableCell>
                    <TableCell>{row.id}</TableCell>
                    <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.title}
                    </TableCell>
                    <TableCell>{row.category_name}</TableCell>
                    <TableCell>{row.publisher_name}</TableCell>
                    <TableCell>{row.llm_model || '-'}</TableCell>
                    <TableCell>
                      {row.published_date ? format(new Date(row.published_date), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>{row.significance_score || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(row.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
