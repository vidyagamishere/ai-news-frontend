import React, { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Card, CardContent, CircularProgress,
  Snackbar, Alert, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Tabs, Tab, IconButton, Tooltip, Divider,
} from '@mui/material';
import {
  Send as SendIcon, Preview as PreviewIcon, Schedule as ScheduleIcon,
  Email as EmailIcon, People as PeopleIcon, CheckCircle as CheckIcon,
  Error as ErrorIcon, Archive as ArchiveIcon, Visibility as ViewIcon,
  Refresh as RefreshIcon, FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { apiService } from '../../services/api';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface NewsletterEdition {
  id: number;
  edition_type: string;
  edition_date: string;
  subject_line: string;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  status: string;
  sent_at: string | null;
  created_at: string;
}

interface NewsletterStats {
  total_editions: number;
  total_emails_sent: number;
  total_opened: number;
  total_clicked: number;
  total_subscribers: number;
  daily_subscribers: number;
  weekly_subscribers: number;
}

interface PreviewData {
  subject: string;
  html: string;
  article_count: number;
  breaking_count: number;
}

interface ArchivedEdition extends NewsletterEdition {
  has_archive: boolean;
}

interface ArchiveDetail {
  id: number;
  edition_type: string;
  edition_date: string;
  subject_line: string;
  html_content: string;
  articles_included: number[];
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  status: string;
  sent_at: string | null;
  created_at: string;
  deliveries: {
    email: string;
    status: string;
    sent_at: string | null;
    error_message: string | null;
    first_name: string | null;
    last_name: string | null;
  }[];
}

export const NewsletterPanel: React.FC = () => {
  const { adminApiKey } = useAdminAuth();
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<'daily' | 'weekly'>('daily');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Archive state
  const [archivedEditions, setArchivedEditions] = useState<ArchivedEdition[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archivePage, setArchivePage] = useState(0);
  const [archiveRowsPerPage, setArchiveRowsPerPage] = useState(10);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [archiveTypeFilter, setArchiveTypeFilter] = useState<string>('');
  const [archiveViewOpen, setArchiveViewOpen] = useState(false);
  const [archiveDetail, setArchiveDetail] = useState<ArchiveDetail | null>(null);
  const [archiveDetailLoading, setArchiveDetailLoading] = useState(false);

  useEffect(() => {
    if (adminApiKey) fetchData();
  }, [adminApiKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-Admin-API-Key': adminApiKey! };
      const [statsRes, editionsRes] = await Promise.all([
        apiService.callEndpoint('admin/newsletter/stats', 'GET', {}, false, headers),
        apiService.callEndpoint('admin/newsletter/editions?page=1&limit=50', 'GET', {}, false, headers),
      ]);
      setStats(statsRes);
      setEditions(editionsRes.editions || []);
    } catch (error) {
      console.error('Failed to fetch newsletter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const headers = { 'X-Admin-API-Key': adminApiKey! };
      const data = await apiService.callEndpoint(
        `admin/newsletter/preview?frequency=${selectedFrequency}`, 'GET', {}, false, headers
      );
      setPreviewData(data);
      setPreviewOpen(true);
    } catch {
      setSnackbar({ open: true, message: 'Failed to generate preview', severity: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!confirm(`Send ${selectedFrequency} newsletter to all subscribers?`)) return;
    setSending(true);
    try {
      const headers = { 'X-Admin-API-Key': adminApiKey! };
      const result = await apiService.callEndpoint(
        `admin/newsletter/trigger?frequency=${selectedFrequency}`, 'POST', {}, false, headers
      );
      setSnackbar({
        open: true,
        message: `Newsletter sent! ${result.result?.sent || 0} emails delivered.`,
        severity: 'success',
      });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to send', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) return;
    try {
      const headers = { 'X-Admin-API-Key': adminApiKey! };
      await apiService.callEndpoint('admin/newsletter/send-test', 'POST',
        { frequency: selectedFrequency, email: testEmail }, false, headers
      );
      setSnackbar({ open: true, message: `Test sent to ${testEmail}`, severity: 'success' });
      setTestEmailDialogOpen(false);
      setTestEmail('');
    } catch {
      setSnackbar({ open: true, message: 'Failed to send test email', severity: 'error' });
    }
  };

  // Archive functions
  const fetchArchive = async () => {
    if (!adminApiKey) return;
    setArchiveLoading(true);
    try {
      const headers = { 'X-Admin-API-Key': adminApiKey };
      const typeParam = archiveTypeFilter ? `&edition_type=${archiveTypeFilter}` : '';
      const res = await apiService.callEndpoint(
        `admin/newsletter/archive?page=${archivePage + 1}&limit=${archiveRowsPerPage}${typeParam}`,
        'GET', {}, false, headers
      );
      setArchivedEditions(res.editions || []);
      setArchiveTotal(res.total || 0);
    } catch (error) {
      console.error('Failed to fetch archive:', error);
      setSnackbar({ open: true, message: 'Failed to load archive', severity: 'error' });
    } finally {
      setArchiveLoading(false);
    }
  };

  const fetchArchiveDetail = async (editionId: number) => {
    if (!adminApiKey) return;
    setArchiveDetailLoading(true);
    try {
      const headers = { 'X-Admin-API-Key': adminApiKey };
      const res = await apiService.callEndpoint(
        `admin/newsletter/archive/${editionId}`, 'GET', {}, false, headers
      );
      setArchiveDetail(res);
      setArchiveViewOpen(true);
    } catch (error) {
      console.error('Failed to fetch archive detail:', error);
      setSnackbar({ open: true, message: 'Failed to load newsletter', severity: 'error' });
    } finally {
      setArchiveDetailLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchArchive();
    }
  }, [activeTab, archivePage, archiveRowsPerPage, archiveTypeFilter]);

  const getStatusChip = (status: string) => {
    const config: Record<string, { color: 'success' | 'warning' | 'error' | 'default'; icon: React.ReactNode }> = {
      sent: { color: 'success', icon: <CheckIcon fontSize="small" /> },
      sending: { color: 'warning', icon: <CircularProgress size={14} /> },
      failed: { color: 'error', icon: <ErrorIcon fontSize="small" /> },
      draft: { color: 'default', icon: <ScheduleIcon fontSize="small" /> },
    };
    const c = config[status] || config.draft;
    return <Chip label={status.toUpperCase()} color={c.color} size="small" icon={c.icon as React.ReactElement} />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Newsletter Management</Typography>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<SendIcon />} iconPosition="start" label="Send & History" />
          <Tab icon={<ArchiveIcon />} iconPosition="start" label="Archive" />
        </Tabs>
      </Paper>

      {/* TAB 0: Send & History */}
      {activeTab === 0 && (<>

      {/* Stats Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Subscribers', value: stats?.total_subscribers || 0, icon: <PeopleIcon />, color: '#1976d2' },
          { label: 'Daily Subscribers', value: stats?.daily_subscribers || 0, icon: <EmailIcon />, color: '#2e7d32' },
          { label: 'Weekly Subscribers', value: stats?.weekly_subscribers || 0, icon: <ScheduleIcon />, color: '#ed6c02' },
          { label: 'Editions Sent', value: stats?.total_editions || 0, icon: <SendIcon />, color: '#9c27b0' },
          { label: 'Total Emails Sent', value: stats?.total_emails_sent || 0, icon: <CheckIcon />, color: '#0288d1' },
        ].map((card) => (
          <Box key={card.label} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(20% - 16px)' } }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2">{card.label}</Typography>
                    <Typography variant="h4">{card.value}</Typography>
                  </Box>
                  <Box sx={{ backgroundColor: card.color, borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Stack>

      {/* Send Controls */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Send Newsletter</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Newsletter Type</InputLabel>
            <Select value={selectedFrequency} label="Newsletter Type"
              onChange={(e) => setSelectedFrequency(e.target.value as 'daily' | 'weekly')}>
              <MenuItem value="daily">📰 Daily Digest</MenuItem>
              <MenuItem value="weekly">📊 Weekly Roundup</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={previewLoading ? <CircularProgress size={18} /> : <PreviewIcon />}
            onClick={handlePreview} disabled={previewLoading}>Preview</Button>
          <Button variant="outlined" color="secondary" startIcon={<EmailIcon />}
            onClick={() => setTestEmailDialogOpen(true)}>Send Test</Button>
          <Button variant="contained" color="primary"
            startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            onClick={handleSendNewsletter} disabled={sending}>
            {sending ? 'Sending...' : `Send ${selectedFrequency} Newsletter`}
          </Button>
        </Stack>
      </Paper>

      {/* Editions History */}
      <Paper>
        <Typography variant="h6" sx={{ p: 2, pb: 0 }}>Edition History</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell align="center">Recipients</TableCell>
                <TableCell align="center">Sent</TableCell>
                <TableCell align="center">Opened</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((edition) => (
                <TableRow key={edition.id}>
                  <TableCell>{(() => { try { return format(new Date(edition.edition_date), 'MMM dd, yyyy'); } catch { return edition.edition_date; }})()}</TableCell>
                  <TableCell><Chip label={edition.edition_type} size="small" color={edition.edition_type === 'daily' ? 'primary' : 'secondary'} /></TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{edition.subject_line}</TableCell>
                  <TableCell align="center">{edition.total_recipients}</TableCell>
                  <TableCell align="center">{edition.total_sent}</TableCell>
                  <TableCell align="center">{edition.total_opened}</TableCell>
                  <TableCell>{getStatusChip(edition.status)}</TableCell>
                </TableRow>
              ))}
              {editions.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No newsletters sent yet.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={editions.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
      </Paper>

      </>)}

      {/* TAB 1: Archive */}
      {activeTab === 1 && (
        <Box>
          {/* Archive Controls */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <FilterIcon color="action" />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Filter by Type</InputLabel>
                  <Select value={archiveTypeFilter} label="Filter by Type"
                    onChange={(e) => { setArchiveTypeFilter(e.target.value); setArchivePage(0); }}>
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="daily">📰 Daily Digest</MenuItem>
                    <MenuItem value="weekly">📊 Weekly Roundup</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchArchive} disabled={archiveLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>

          {/* Archive Table */}
          <Paper>
            <Typography variant="h6" sx={{ p: 2, pb: 0 }}>📂 Archived Newsletters</Typography>
            {archiveLoading ? (
              <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell align="center">Recipients</TableCell>
                        <TableCell align="center">Sent</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Archived</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {archivedEditions.map((edition) => (
                        <TableRow key={edition.id} hover>
                          <TableCell>
                            {(() => { try { return format(new Date(edition.edition_date), 'MMM dd, yyyy'); } catch { return edition.edition_date; }})()}
                          </TableCell>
                          <TableCell>
                            <Chip label={edition.edition_type} size="small"
                              color={edition.edition_type === 'daily' ? 'primary' : 'secondary'} />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {edition.subject_line}
                          </TableCell>
                          <TableCell align="center">{edition.total_recipients}</TableCell>
                          <TableCell align="center">{edition.total_sent}</TableCell>
                          <TableCell>{getStatusChip(edition.status)}</TableCell>
                          <TableCell align="center">
                            {edition.has_archive
                              ? <Chip label="Yes" size="small" color="success" variant="outlined" />
                              : <Chip label="No" size="small" color="default" variant="outlined" />
                            }
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={edition.has_archive ? 'View Newsletter' : 'No archive available'}>
                              <span>
                                <IconButton size="small" color="primary"
                                  disabled={!edition.has_archive || archiveDetailLoading}
                                  onClick={() => fetchArchiveDetail(edition.id)}>
                                  {archiveDetailLoading ? <CircularProgress size={18} /> : <ViewIcon />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {archivedEditions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No archived newsletters found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination component="div" count={archiveTotal} page={archivePage}
                  onPageChange={(_, p) => setArchivePage(p)} rowsPerPage={archiveRowsPerPage}
                  onRowsPerPageChange={(e) => { setArchiveRowsPerPage(parseInt(e.target.value, 10)); setArchivePage(0); }} />
              </>
            )}
          </Paper>
        </Box>
      )}

      {/* Archive View Dialog */}
      <Dialog open={archiveViewOpen} onClose={() => setArchiveViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6">📧 {archiveDetail?.subject_line}</Typography>
              <Typography variant="body2" color="text.secondary">
                {archiveDetail?.edition_type === 'daily' ? '📰 Daily' : '📊 Weekly'} ·{' '}
                {archiveDetail?.edition_date && (() => { try { return format(new Date(archiveDetail.edition_date), 'MMMM dd, yyyy'); } catch { return archiveDetail.edition_date; }})()}
                {archiveDetail?.sent_at && ` · Sent ${(() => { try { return format(new Date(archiveDetail.sent_at), 'h:mm a'); } catch { return ''; }})()}`}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {archiveDetail && (
                <>
                  <Chip label={`${archiveDetail.total_sent} sent`} size="small" color="success" />
                  {archiveDetail.total_opened > 0 && <Chip label={`${archiveDetail.total_opened} opened`} size="small" color="info" />}
                  {(archiveDetail as any).total_failed > 0 && <Chip label={`${(archiveDetail as any).total_failed} failed`} size="small" color="error" />}
                </>
              )}
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {/* Newsletter HTML Preview */}
          {archiveDetail?.html_content ? (
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <iframe
                srcDoc={archiveDetail.html_content}
                title="Archived Newsletter"
                style={{ width: '100%', height: '500px', border: 'none' }}
              />
            </Box>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>No HTML content archived for this edition.</Alert>
          )}

          {/* Delivery Log */}
          {archiveDetail?.deliveries && archiveDetail.deliveries.length > 0 && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                📬 Delivery Log ({archiveDetail.deliveries.length} recipients)
              </Typography>
              <TableContainer sx={{ maxHeight: 250 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Recipient</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Sent At</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {archiveDetail.deliveries.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {[d.first_name, d.last_name].filter(Boolean).join(' ') || '—'}
                        </TableCell>
                        <TableCell>{d.email}</TableCell>
                        <TableCell>{getStatusChip(d.status)}</TableCell>
                        <TableCell>
                          {d.sent_at ? (() => { try { return format(new Date(d.sent_at), 'MMM dd, h:mm a'); } catch { return d.sent_at; }})() : '—'}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'error.main', fontSize: '12px' }}>
                          {d.error_message || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          📧 Preview — {previewData?.subject}
          <Typography variant="body2" color="text.secondary">
            {previewData?.article_count} articles · {previewData?.breaking_count} breaking
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {previewData && (
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'auto', maxHeight: '60vh' }}
              dangerouslySetInnerHTML={{ __html: previewData.html }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendNewsletter}>Send Now</Button>
        </DialogActions>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onClose={() => setTestEmailDialogOpen(false)}>
        <DialogTitle>Send Test Newsletter</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Send a {selectedFrequency} preview to a specific email.
          </Typography>
          <TextField autoFocus fullWidth label="Email Address" type="email"
            value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestEmailDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendTestEmail} disabled={!testEmail.trim()}>Send Test</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};