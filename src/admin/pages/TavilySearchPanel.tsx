import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Slider,
  FormControlLabel,
  Switch,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { apiService } from '../../services/api';
import { useAdminAuth } from '../../contexts/AdminAuthContext';


export const TavilySearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [enrichWithLLM, setEnrichWithLLM] = useState(false);
  const [llmModel, setLlmModel] = useState('claude');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const { adminApiKey } = useAdminAuth();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      if (!adminApiKey) {
        console.error('Admin not authenticated');
        return;
      }
      const response = await apiService.getTavilySearchHistory(1, 20, adminApiKey);
      setHistory(response.searches || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setSnackbar({ open: true, message: 'Please enter a search query', severity: 'error' });
      return;
    }

    setSearching(true);
    if (!adminApiKey) {
      setSnackbar({ open: true, message: 'Admin API key is required', severity: 'error' });
      setSearching(false);
      return;
    }
    
    try {
      const response = await apiService.searchTavily({
        query,
        max_results: maxResults,
        enrich_with_llm: enrichWithLLM,
        llm_model: enrichWithLLM ? llmModel : undefined,
      }, adminApiKey);
      
      setSearchResult(response);
      setSnackbar({ 
        open: true, 
        message: `Found ${response.articles_found} articles, inserted ${response.articles_inserted}`, 
        severity: 'success' 
      });
      fetchHistory();
    } catch (error) {
      console.error('Failed to search:', error);
      setSnackbar({ open: true, message: 'Search failed', severity: 'error' });
    } finally {
      setSearching(false);
    }
  };

  const historyColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'query', headerName: 'Query', flex: 1, minWidth: 200 },
    { field: 'max_results', headerName: 'Max Results', width: 120 },
    { 
      field: 'enrich_with_llm', 
      headerName: 'LLM', 
      width: 100,
      renderCell: (params) => params.value ? <Chip label={params.row.llm_model} size="small" /> : '-',
    },
    { field: 'articles_found', headerName: 'Found', width: 100, type: 'number' },
    { field: 'articles_inserted', headerName: 'Inserted', width: 100, type: 'number' },
    { field: 'articles_skipped', headerName: 'Skipped', width: 100, type: 'number' },
    { 
      field: 'created_at', 
      headerName: 'Date', 
      width: 160,
      valueFormatter: (params) => {
        try {
          return format(new Date(params), 'MMM dd, yyyy HH:mm');
        } catch {
          return params;
        }
      },
    },
  ];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedHistory = history.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Tavily Search</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Search Query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              fullWidth
              placeholder="e.g., Latest AI developments"
            />

            <Box>
              <Typography gutterBottom>Max Results: {maxResults}</Typography>
              <Slider
                value={maxResults}
                onChange={(_, value) => setMaxResults(value as number)}
                min={1}
                max={50}
                marks={[
                  { value: 1, label: '1' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                ]}
              />
            </Box>

            <Box display="flex" gap={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={enrichWithLLM}
                    onChange={(e) => setEnrichWithLLM(e.target.checked)}
                  />
                }
                label="Enrich with LLM"
              />

              {enrichWithLLM && (
                <TextField
                  select
                  label="LLM Model"
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="claude">Claude</MenuItem>
                  <MenuItem value="gemini">Gemini</MenuItem>
                  <MenuItem value="ollama">Ollama</MenuItem>
                </TextField>
              )}
            </Box>

            <Button
              variant="contained"
              startIcon={searching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>

            {searchResult && (
              <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Results:</strong> Found {searchResult.articles_found} articles, 
                  inserted {searchResult.articles_inserted}, skipped {searchResult.articles_skipped}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>Search History</Typography>
      <Paper sx={{ width: '100%' }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Query</TableCell>
                <TableCell>Max Results</TableCell>
                <TableCell>LLM</TableCell>
                <TableCell>Found</TableCell>
                <TableCell>Inserted</TableCell>
                <TableCell>Skipped</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No search history
                  </TableCell>
                </TableRow>
              ) : (
                paginatedHistory.map((row) => (
                  <TableRow hover key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.query}
                    </TableCell>
                    <TableCell>{row.max_results}</TableCell>
                    <TableCell>
                      {row.enrich_with_llm ? (
                        <Chip label={row.llm_model} size="small" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{row.articles_found}</TableCell>
                    <TableCell>{row.articles_inserted}</TableCell>
                    <TableCell>{row.articles_skipped}</TableCell>
                    <TableCell>
                      {row.created_at ? format(new Date(row.created_at), 'MMM dd, yyyy HH:mm') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={history.length}
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