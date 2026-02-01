import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Switch,
  IconButton,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { apiService } from '../../services/api';
import { AddSourceDialog } from '../components/AddSourceDialog';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Source {
  id: number;
  name: string;
  rss_url: string;
  website: string;
  category_id: number;
  category_name?: string;
  priority: number;
  is_active: boolean;
  scraping_frequency_hours: number;
  llm_model?: string;
}

export const SourcesManager: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [currentTab, setCurrentTab] = useState(0); // 0: RSS, 1: Podcasts, 2: Videos

  const contentTypes = ['blogs', 'podcasts', 'videos'];  // Changed from singular to plural
  const tabLabels = ['RSS Feeds', 'Podcasts', 'Videos'];
  const { adminApiKey } = useAdminAuth();

  useEffect(() => {
    fetchSources();
  }, [currentTab, adminApiKey]);

  const fetchSources = async () => {
    console.log('🔵 [SourcesManager] fetchSources() START', {
      currentTab,
      contentType: contentTypes[currentTab],
      hasAdminApiKey: !!adminApiKey,
    });
    
    setLoading(true);
    setDataReady(false);
    // Clear selection when changing tabs
    setSelectedRows([]);
    
    if (!adminApiKey) {
      console.error('🔴 [SourcesManager] Admin not authenticated');
      setSources([]);
      setLoading(false);
      setDataReady(true);
      return;
    }
    
    let validatedSources: Source[] = []; // Move declaration outside try block
    
    try {
      console.log('🟡 [SourcesManager] Calling getSourcesByType...', {
        contentType: contentTypes[currentTab],
      });
      
      const response = await apiService.getSourcesByType(contentTypes[currentTab], adminApiKey);
      
      console.log('🟢 [SourcesManager] Raw API response:', {
        response,
        sourcesCount: response?.sources?.length || 0,
        firstSource: response?.sources?.[0],
      });
      
      // Ensure each source has an id and validate the data structure
      validatedSources = (response.sources || []).map((source: any, index: number) => {
        const validated = {
          ...source,
          id: source.id || source.source_id || Math.random(),
          rss_url: source.url || source.rss_url || '',
          category_name: source.category_name || 'Unknown',
          llm_model: source.llm_model || 'None',
          scraping_frequency_hours: source.scrape_frequency_days 
            ? source.scrape_frequency_days * 24 
            : (source.scraping_frequency_hours || 24),
          is_active: source.is_active !== undefined ? source.is_active : true,
        };
        
        if (index === 0) {
          console.log('🟢 [SourcesManager] First validated source:', validated);
        }
        
        return validated;
      });
      
      console.log('🟢 [SourcesManager] Validated sources:', {
        count: validatedSources.length,
        sources: validatedSources,
      });
      
      setSources(validatedSources);
      // Small delay to ensure React state is fully updated
      setTimeout(() => setDataReady(true), 50);
    } catch (error) {
      console.error('🔴 [SourcesManager] Failed to fetch sources:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      setSnackbar({ open: true, message: 'Failed to load sources', severity: 'error' });
      setSources([]);
      setDataReady(true);
    } finally {
      setLoading(false);
      console.log('🔵 [SourcesManager] fetchSources() END', {
        validatedSourcesCount: validatedSources.length,
      });
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    if (!adminApiKey) {
      console.error('Admin not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      await apiService.bulkUpdateSources([{ id, is_active: !currentStatus }], adminApiKey);
      setSnackbar({ open: true, message: 'Source status updated', severity: 'success' });
      fetchSources();
    } catch (error) {
      console.error('Failed to update source:', error);
      setSnackbar({ open: true, message: 'Failed to update source', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this source?')) return;
    
    if (!adminApiKey) {
      console.error('Admin not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      await apiService.bulkDeleteSources([id], contentTypes[currentTab], adminApiKey);
      setSnackbar({ open: true, message: 'Source deleted successfully', severity: 'success' });
      fetchSources();
    } catch (error) {
      console.error('Failed to delete source:', error);
      setSnackbar({ open: true, message: 'Failed to delete source', severity: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.isArray(selectedRows) ? selectedRows : [];
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} sources?`)) return;
    
    if (!adminApiKey) {
      console.error('Admin not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      await apiService.bulkDeleteSources(
        selectedIds as number[], 
        contentTypes[currentTab], 
        adminApiKey
      );
      setSnackbar({ open: true, message: 'Sources deleted successfully', severity: 'success' });
      setSelectedRows([] as any);
      fetchSources();
    } catch (error) {
      console.error('Failed to delete sources:', error);
      setSnackbar({ open: true, message: 'Failed to delete sources', severity: 'error' });
    }
  };

  const getSelectedCount = () => selectedRows.length;

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    { field: 'rss_url', headerName: 'URL', flex: 1, minWidth: 250 },
    { field: 'category_name', headerName: 'Category', width: 150 },
    { field: 'priority', headerName: 'Priority', width: 100 },
    { 
      field: 'scraping_frequency_hours', 
      headerName: 'Frequency (hrs)', 
      width: 130,
      valueGetter: (params) => {
        // Handle both hours and days
        const hours = params.row.scraping_frequency_hours;
        const days = params.row.scrape_frequency_days;
        return hours || (days ? days * 24 : 24);
      }
    },
    { field: 'llm_model', headerName: 'LLM Model', width: 120 },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={() => handleToggleActive(params.row.id, params.value)}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => {
              setEditingSource(params.row);
              setDialogOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = sources.map((n) => n.id);
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
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Manage Sources</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingSource(null);
            setDialogOpen(true);
          }}
        >
          Add Source
        </Button>
      </Box>

      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 2 }}>
        {tabLabels.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      {getSelectedCount() > 0 && (
        <Box mb={2}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleBulkDelete}
          >
            Delete {getSelectedCount()} Selected
          </Button>
        </Box>
      )}

      <Box sx={{ width: '100%' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
          </Box>
        ) : !dataReady ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress size={24} />
          </Box>
        ) : sources.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <Typography>No sources found</Typography>
          </Box>
        ) : (
          <Paper sx={{ width: '100%', mb: 2 }}>
            <TableContainer>
              <Table sx={{ minWidth: 750 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedRows.length > 0 && selectedRows.length < sources.length}
                        checked={sources.length > 0 && selectedRows.length === sources.length}
                        onChange={handleSelectAllClick}
                      />
                    </TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Frequency (hrs)</TableCell>
                    <TableCell>LLM Model</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sources.map((row) => {
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
                        <TableCell>{row.name}</TableCell>
                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.rss_url}
                        </TableCell>
                        <TableCell>{row.category_name}</TableCell>
                        <TableCell>{row.priority}</TableCell>
                        <TableCell>{row.scraping_frequency_hours || 24}</TableCell>
                        <TableCell>{row.llm_model || 'None'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={row.is_active}
                            onChange={() => handleToggleActive(row.id, row.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingSource(row);
                              setDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
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
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={sources.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
      </Box>

      <AddSourceDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingSource(null);
        }}
        onSuccess={() => {
          fetchSources();
          setSnackbar({ open: true, message: 'Source saved successfully', severity: 'success' });
        }}
        editingSource={editingSource}
        contentType={contentTypes[currentTab]}
      />

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