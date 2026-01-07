import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ExternalLink, RefreshCw } from 'lucide-react';
import apiService from '../services/api';
import AdminValidation from '../components/AdminValidation';
import { useAdminAuth } from '../contexts/AdminAuthContext';

import { CheckSquare } from 'lucide-react';

import axios from "axios";

const PAGE_SIZE = 20;

interface AISource {
  name: string;
  rss_url: string;
  website: string;
  enabled: boolean;
  priority: number;
  category: string;
}

// At the top of Admin.tsx or in your types file
interface Article {
  id: number;
  title: string;
  summary: string;
  is_yt_shorts: boolean;
  is_insta_reels: boolean;
}

const Admin: React.FC = () => {
  const { isAdminAuthenticated, adminApiKey } = useAdminAuth();
  const [sources, setSources] = useState<AISource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState<AISource>({
    name: '',
    rss_url: '',
    website: '',
    enabled: true,
    priority: 5,
    category: 'other'
  });

  const categories = ['company', 'research', 'news', 'blog', 'podcast', 'video', 'events', 'learning', 'demos', 'other'];
  
  const [shortsArticles, setShortsArticles] = useState<Article[]>([]);  
  const [selectedShorts, setSelectedShorts] = useState<number[]>([]);
  const [shortsLoading, setShortsLoading] = useState(false);
  const [shortsMsg, setShortsMsg] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Add authentication check on component mount
  useEffect(() => {
    // If not authenticated, redirect to login page
    if (!isAdminAuthenticated || !adminApiKey) {
      console.log('❌ Not authenticated - redirecting to admin login');
      window.location.href = '/admin/login';
    }
  }, [isAdminAuthenticated, adminApiKey]);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      
      // Check if admin is authenticated
      if (!isAdminAuthenticated || !adminApiKey) {
        console.log('❌ Not authenticated in fetchSources');
        return; // Don't show alert here, the redirect will happen in the mount effect
      }
      
      // Use admin API key instead of JWT token
      const response = await apiService.callEndpoint('admin/sources', 'GET', {}, false, {
        'X-Admin-API-Key': adminApiKey
      });
      setSources(response.sources || []);
    } catch (error: unknown) {
      console.error('Failed to fetch sources:', error);
      if (error instanceof Error && (error.message.includes('Authentication required') || error.message.includes('Admin access'))) {
        console.log('❌ Authentication error - will redirect to login');
        // Redirect will happen via the mount effect
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await apiService.callEndpoint('admin/sources/add', 'POST', newSource, false, {
        'X-Admin-API-Key': adminApiKey
      });
      
      await fetchSources();
      setNewSource({ name: '', rss_url: '', website: '', enabled: true, priority: 5, category: 'other' });
      setShowAddForm(false);
      alert('Source added successfully!');
    } catch (error) {
      console.error('Add error:', error);
      alert('Failed to add source');
    }
  };

  const handleUpdate = async (index: number, updatedSource: AISource) => {
    try {
      await apiService.callEndpoint('admin/sources/update', 'POST', { index, ...updatedSource }, false, {
        'X-Admin-API-Key': adminApiKey
      });
      
      await fetchSources();
      setEditingIndex(null);
      alert('Source updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update source');
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    
    try {
      await apiService.callEndpoint('admin/sources/delete', 'POST', { index }, false, {
        'X-Admin-API-Key': adminApiKey
      });
      
      await fetchSources();
      alert('Source deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete source');
    }
  };

  const initiateAdminScraping = async () => {
    try {
      // Check if admin is authenticated
      if (!isAdminAuthenticated || !adminApiKey) {
        alert('Session expired. Please sign in again.');
        window.location.href = '/admin/login';
        return;
      }
      
      // Use admin API key for scraping endpoint
      const response = await apiService.callEndpoint('admin/scrape', 'POST', {}, false, {
        'X-Admin-API-Key': adminApiKey
      });
      console.log('Admin scraping result:', response);
      
      if (response.success) {
        const articlesProcessed = response.data?.articles_processed || 0;
        alert(`✅ Admin scraping completed successfully!\n${articlesProcessed} articles processed.`);
      } else {
        alert(`❌ Scraping failed: ${response.message || 'Unknown error'}`);
      }
    } catch (error: unknown) {
      console.error('Admin scraping error:', error);
      if (error instanceof Error && error.message.includes('Authentication required')) {
        alert('Session expired. Please sign in again.');
        window.location.href = '/admin/login';
      } else {
        alert('❌ Admin scraping failed. Please check console for details.');
      }
    }
  };

  const validateAllFeeds = async () => {
    try {
      setLoading(true);
      const result = await apiService.callEndpoint('admin/validate-all-feeds', 'POST', {}, false, {
        'X-Admin-API-Key': adminApiKey
      });
      
      console.log('Feed validation results:', result);
      
      const totalChecked = result.total_checked || 0;
      const validCount = result.results?.filter((r: any) => r.status === 'valid').length || 0;
      const invalidCount = result.results?.filter((r: any) => r.status === 'invalid').length || 0;
      
      alert(`Feed Validation Complete!\n\nTotal Feeds: ${totalChecked}\nValid: ${validCount}\nInvalid: ${invalidCount}\n\nCheck console for detailed results.`);
      
      // Optionally refresh sources to show validation status
      await fetchSources();
    } catch (error) {
      console.error('Feed validation error:', error);
      alert('Feed validation failed');
    } finally {
      setLoading(false);
    }
  };

  const validateSingleFeed = async (feedUrl: string, sourceName: string) => {
    try {
      const result = await apiService.callEndpoint('admin/validate-feed', 'POST', { feed_url: feedUrl }, true);
      
      const validation = result.result;
      
      if (validation.status === 'valid') {
        alert(`✅ ${sourceName} Feed Valid!\n\nMessage: ${validation.message}`);
      } else {
        alert(`❌ ${sourceName} Feed Invalid!\n\nMessage: ${validation.message}`);
      }
    } catch (error) {
      console.error('Single feed validation error:', error);
      alert('Feed validation failed');
    }
  };

  useEffect(() => {
  if (isAdminAuthenticated && adminApiKey) {
    fetchShortsArticles(page);
  }
}, [isAdminAuthenticated, adminApiKey]);

  const fetchShortsArticles = async (pg: number) => {
    try {
      setLoading(true);
      
      // Check if admin is authenticated
      if (!isAdminAuthenticated || !adminApiKey) {
        console.log('❌ Not authenticated in fetchArticles');
        return; // Don't show alert here, the redirect will happen in the mount effect
      }
      
      // Use admin API key instead of JWT token
      const response = await apiService.callEndpoint('admin/articles', 'GET', {}, false, {
        'X-Admin-API-Key': adminApiKey
      });
      setShortsArticles(response.articles || []);
    } catch (error: unknown) {
      console.error('Failed to fetch articles:', error);
      if (error instanceof Error && (error.message.includes('Authentication required') || error.message.includes('Admin access'))) {
        console.log('❌ Authentication error - will redirect to login');
        // Redirect will happen via the mount effect
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShortsSelect = (id: number) => {
    setSelectedShorts(sel =>
      sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]
    );
  };

  const handleGenerateShorts = async () => {
    setShortsLoading(true);
    setShortsMsg("");
    try {
      await apiService.callEndpoint('admin/generate-shorts', 'POST', selectedShorts, false, {
      'X-Admin-API-Key': adminApiKey
       });
      setShortsMsg("Shorts processed successfully!");
      setSelectedShorts([]);
      fetchShortsArticles(page);
    } catch (err: any) {
      setShortsMsg("Error: " + (err?.response?.data?.detail || err?.message));
    } finally {
      setShortsLoading(false);
    }
  };
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const [selectedModel, setSelectedModel] = useState<'claude' | 'gemini' | 'ollama'>('gemini');
  const [selectedFrequency, setSelectedFrequency] = useState<1 | 7 | 30>(1); // ✅ NEW: Frequency state
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ NEW: States for podcast/video scraping
  const [podcastScrapingLoading, setPodcastScrapingLoading] = useState(false);
  const [videoScrapingLoading, setVideoScrapingLoading] = useState(false);
  const [podcastResult, setPodcastResult] = useState<any>(null);
  const [videoResult, setVideoResult] = useState<any>(null);
  const [podcastError, setPodcastError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const models = [
    {
      id: 'gemini' as const,
      name: 'Google Gemini 2.0 Flash',
      description: 'FREE • Fast • Excellent quality • Recommended',
      color: '#4285f4',
      recommended: true
    },
    {
      id: 'claude' as const,
      name: 'Claude 3 Haiku',
      description: 'Paid • Best quality • Anthropic',
      color: '#d97706'
    },
    {
      id: 'ollama' as const,
      name: '🦙 Local Ollama (Llama 3.2)',
      description: 'FREE • Privacy-focused • Runs locally • No API needed',
      color: '#10b981',
      recommended: false
    }
  ];

  // ✅ NEW: Frequency options
  const frequencies = [
    {
      value: 1,
      label: 'Daily (1 day)',
      description: 'Scrape sources configured for daily updates',
      icon: '📅',
      color: '#10b981'
    },
    {
      value: 7,
      label: 'Weekly (7 days)',
      description: 'Scrape sources configured for weekly updates',
      icon: '📆',
      color: '#3b82f6'
    },
    {
      value: 30,
      label: 'Monthly (30 days)',
      description: 'Scrape sources configured for monthly updates',
      icon: '🗓️',
      color: '#6366f1'
    }
  ];

  // ...existing code...

  const handleTriggerScraping = async () => {
    try {
      setScrapingLoading(true); // ✅ FIX: Changed from setIsScrapingLoading
      setError(null);
      setResult(null);
      
      const endpoint = `admin/scrape?llm_model=${selectedModel}&scrape_frequency=${selectedFrequency}`;
      console.log('🚀 Triggering scraping with endpoint:', endpoint);      

      // Start scraping job
      const response = await apiService.callEndpoint(
        endpoint,
        'POST',
        {},
        false,
        {
          'X-Admin-API-Key': adminApiKey,
          'Content-Type': 'application/json'
        },
      );
      
      const jobId = response.job_id;
      console.log('✅ Scraping job started:', jobId);
      console.log('ℹ️ Polling for job status...');
      console.log('Response:', response);
      // Poll for status every 5 seconds
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 3;
      
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiService.callEndpoint(
            `admin/scrape-status/${jobId}`,
            'GET',
            {},
            false,
            {
              'X-Admin-API-Key': adminApiKey
            }
          );
          
          // Reset error counter on successful response
          consecutiveErrors = 0;
          
          const status = statusResponse.status;
          console.log(`🔄 Job status: ${status}`);
          
          if (status === 'completed') {
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            setScrapingLoading(false);
            setResult({
              success: true,
              message: 'Scraping completed successfully!',
              llm_model_used: selectedModel,
              details: statusResponse.result
            });
            console.log('📊 Result:', statusResponse.result);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            setScrapingLoading(false);
            setError(statusResponse.error || 'Scraping failed');
          }
        } catch (pollError) {
          consecutiveErrors++;
          console.error(`❌ Polling error (${consecutiveErrors}/${maxConsecutiveErrors}):`, pollError);
          
          // Only stop polling after multiple consecutive errors
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error('❌ Too many consecutive polling errors, stopping...');
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            setScrapingLoading(false);
            setError('Failed to check scraping status - network error');
          }
          // Otherwise, continue polling (transient network issues)
        }
      }, 5000); // Poll every 5 seconds
      
      // ✅ ADD TIMEOUT: Stop polling after 30 minutes (for 1-day scraping)
      const timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        if (scrapingLoading) {
          setScrapingLoading(false);
          setError('Scraping timeout (30 min) - job may still be running in background');
        }
      }, 1800000); // 30 minutes timeout
      
    } catch (error) {
      console.error('❌ Scraping error:', error);
      setScrapingLoading(false); // ✅ FIX: Changed from setIsScrapingLoading
      setError(error instanceof Error ? error.message : 'Failed to start scraping');
    }
  };

  // ✅ NEW: Handler for podcast scraping
  const handleTriggerPodcastScraping = async () => {
    try {
      setPodcastScrapingLoading(true);
      setPodcastError(null);
      setPodcastResult(null);
      
      const endpoint = `admin/scrape-pending-podcasts?llm_model=${selectedModel}`;
      console.log('🎧 Triggering podcast scraping with endpoint:', endpoint);

      // Start scraping job
      const response = await apiService.callEndpoint(
        endpoint,
        'POST',
        {},
        false,
        {
          'X-Admin-API-Key': adminApiKey,
          'Content-Type': 'application/json'
        }
      );
      
      const jobId = response.job_id;
      console.log('✅ Podcast scraping job started:', jobId);
      console.log('ℹ️ Polling for job status...');
      
      // Poll for status every 5 seconds
      let podcastConsecutiveErrors = 0;
      const maxConsecutiveErrors = 3;
      
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiService.callEndpoint(
            `admin/scrape-status/${jobId}`,
            'GET',
            {},
            false,
            {
              'X-Admin-API-Key': adminApiKey
            }
          );
          
          // Reset error counter on successful response
          podcastConsecutiveErrors = 0;
          
          console.log('📊 Podcast job status:', statusResponse.status);
          
          if (statusResponse.status === 'completed') {
            clearInterval(pollInterval);
            clearTimeout(podcastTimeoutId);
            setPodcastScrapingLoading(false);
            setPodcastResult({
              success: true,
              message: 'Podcast scraping completed successfully!',
              ...statusResponse.result
            });
            console.log('✅ Podcast scraping completed:', statusResponse.result);
          } else if (statusResponse.status === 'failed') {
            clearInterval(pollInterval);
            clearTimeout(podcastTimeoutId);
            setPodcastScrapingLoading(false);
            setPodcastError(statusResponse.error || 'Podcast scraping failed');
            console.error('❌ Podcast scraping failed:', statusResponse.error);
          }
        } catch (pollError) {
          podcastConsecutiveErrors++;
          console.error(`❌ Error polling podcast job status (${podcastConsecutiveErrors}/${maxConsecutiveErrors}):`, pollError);
          
          // Only stop polling after multiple consecutive errors
          if (podcastConsecutiveErrors >= maxConsecutiveErrors) {
            console.error('❌ Too many consecutive polling errors, stopping...');
            clearInterval(pollInterval);
            clearTimeout(podcastTimeoutId);
            setPodcastScrapingLoading(false);
            setPodcastError('Failed to check scraping status - network error');
          }
        }
      }, 5000);
      
      // Add timeout: Stop polling after 10 minutes
      const podcastTimeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        if (podcastScrapingLoading) {
          setPodcastScrapingLoading(false);
          setPodcastError('Scraping timeout - job may still be running in background');
        }
      }, 600000);
      
    } catch (error) {
      console.error('❌ Podcast scraping error:', error);
      setPodcastScrapingLoading(false);
      setPodcastError(error instanceof Error ? error.message : 'Failed to start podcast scraping');
    }
  };

  // ✅ NEW: Handler for video scraping
  const handleTriggerVideoScraping = async () => {
    try {
      setVideoScrapingLoading(true);
      setVideoError(null);
      setVideoResult(null);
      
      const endpoint = `admin/scrape-pending-videos?llm_model=${selectedModel}`;
      console.log('🎥 Triggering video scraping with endpoint:', endpoint);

      // Start scraping job
      const response = await apiService.callEndpoint(
        endpoint,
        'POST',
        {},
        false,
        {
          'X-Admin-API-Key': adminApiKey,
          'Content-Type': 'application/json'
        }
      );
      
      const jobId = response.job_id;
      console.log('✅ Video scraping job started:', jobId);
      console.log('ℹ️ Polling for job status...');
      
      // Poll for status every 5 seconds
      let videoConsecutiveErrors = 0;
      const maxConsecutiveErrors = 3;
      
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiService.callEndpoint(
            `admin/scrape-status/${jobId}`,
            'GET',
            {},
            false,
            {
              'X-Admin-API-Key': adminApiKey
            }
          );
          
          // Reset error counter on successful response
          videoConsecutiveErrors = 0;
          
          console.log('📊 Video job status:', statusResponse.status);
          
          if (statusResponse.status === 'completed') {
            clearInterval(pollInterval);
            clearTimeout(videoTimeoutId);
            setVideoScrapingLoading(false);
            setVideoResult({
              success: true,
              message: 'Video scraping completed successfully!',
              ...statusResponse.result
            });
            console.log('✅ Video scraping completed:', statusResponse.result);
          } else if (statusResponse.status === 'failed') {
            clearInterval(pollInterval);
            clearTimeout(videoTimeoutId);
            setVideoScrapingLoading(false);
            setVideoError(statusResponse.error || 'Video scraping failed');
            console.error('❌ Video scraping failed:', statusResponse.error);
          }
        } catch (pollError) {
          videoConsecutiveErrors++;
          console.error(`❌ Error polling video job status (${videoConsecutiveErrors}/${maxConsecutiveErrors}):`, pollError);
          
          // Only stop polling after multiple consecutive errors
          if (videoConsecutiveErrors >= maxConsecutiveErrors) {
            console.error('❌ Too many consecutive polling errors, stopping...');
            clearInterval(pollInterval);
            clearTimeout(videoTimeoutId);
            setVideoScrapingLoading(false);
            setVideoError('Failed to check scraping status - network error');
          }
        }
      }, 5000);
      
      // Add timeout: Stop polling after 10 minutes
      const videoTimeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        if (videoScrapingLoading) {
          setVideoScrapingLoading(false);
          setVideoError('Scraping timeout - job may still be running in background');
        }
      }, 600000);
      
    } catch (error) {
      console.error('❌ Video scraping error:', error);
      setVideoScrapingLoading(false);
      setVideoError(error instanceof Error ? error.message : 'Failed to start video scraping');
    }
  };

  if (loading && (!isAdminAuthenticated || !adminApiKey)) {
    return (
      <div className="admin-container">
        <div className="loading">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <p>Checking authentication...</p>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Add the validation component at the top */}
      <AdminValidation />
      
      <div className="admin-header">
        <h1>🔧 AI Sources Admin Panel</h1>
        <div className="admin-actions">
          <button onClick={validateAllFeeds} className="btn btn-warning" disabled={loading}>
            <RefreshCw size={16} />
            Validate All Feeds
          </button>
          <button onClick={initiateAdminScraping} className="btn btn-secondary">
            <RefreshCw size={16} />
            Admin Scraping
          </button>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn btn-primary"
          >
            <Plus size={16} />
            Add New Source
          </button>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat">
          <span className="stat-number">{sources.length}</span>
          <span className="stat-label">Total Sources</span>
        </div>
        <div className="stat">
          <span className="stat-number">{sources.filter(s => s.enabled).length}</span>
          <span className="stat-label">Enabled</span>
        </div>
        <div className="stat">
          <span className="stat-number">{new Set(sources.map(s => s.category)).size}</span>
          <span className="stat-label">Categories</span>
        </div>
      </div>

    <div className="admin-shorts-section" style={{marginTop: '2rem', marginBottom: '2rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '8px'}}>
          <h2 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem'}}>
            Generate Shorts for Articles
          </h2>
          {shortsMsg && <div style={{marginBottom: '1rem', color: shortsMsg.startsWith("Error") ? '#dc2626' : '#10b981'}}>{shortsMsg}</div>}
          <button
            className="btn btn-primary"
            onClick={handleGenerateShorts}
            disabled={selectedShorts.length === 0 || shortsLoading}
            style={{marginBottom: '1rem'}}
          >
            {shortsLoading ? "Processing..." : "Generate Shorts"}
          </button>
          <ul style={{maxHeight: '300px', overflowY: 'auto', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb', padding: '1rem'}}>
            {(shortsArticles ?? []).map(article => {
              const hasShorts = article.is_yt_shorts || article.is_insta_reels;
              return (
                <li key={article.id} style={{marginBottom: '0.75rem', display: 'flex', alignItems: 'center'}}>
                  <input
                    type="checkbox"
                    checked={selectedShorts.includes(article.id)}
                    onChange={() => handleShortsSelect(article.id)}
                    disabled={hasShorts}
                    style={{marginRight: '0.75rem'}}
                  />
                  <span style={{fontWeight: 500}}>{article.title}</span>
                  <span style={{marginLeft: '1rem', color: '#6b7280', fontSize: '0.95rem'}}>{article.summary}</span>
                  {hasShorts && (
                    <span style={{
                      marginLeft: '1rem',
                      background: '#e0e7ff',
                      color: '#3730a3',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.85rem'
                    }}>
                      Shorts Created
                    </span>
                  )}
                </li>
              );
            })}
            {shortsArticles.length === 0 && <li>No articles found.</li>}
          </ul>
          <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '8px'}}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >Next</button>
          </div>
        </div>

      {showAddForm && (
        <div className="add-form">
          <h3>Add New AI Source</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Source Name"
              value={newSource.name}
              onChange={(e) => setNewSource({...newSource, name: e.target.value})}
            />
            <input
              type="url"
              placeholder="RSS Feed URL"
              value={newSource.rss_url}
              onChange={(e) => setNewSource({...newSource, rss_url: e.target.value})}
            />
            <input
              type="url"
              placeholder="Website URL"
              value={newSource.website}
              onChange={(e) => setNewSource({...newSource, website: e.target.value})}
            />
            <select
              value={newSource.category}
              onChange={(e) => setNewSource({...newSource, category: e.target.value})}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Priority (1-10)"
              value={newSource.priority}
              onChange={(e) => setNewSource({...newSource, priority: parseInt(e.target.value) || 5})}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newSource.enabled}
                onChange={(e) => setNewSource({...newSource, enabled: e.target.checked})}
              />
              Enabled
            </label>
          </div>
          <div className="form-actions">
            <button onClick={handleAdd} className="btn btn-primary">
              <Save size={16} />
              Save Source
            </button>
            <button 
              onClick={() => setShowAddForm(false)} 
              className="btn btn-secondary"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}
     {/* ✅ UPDATED: Model Selection Section */}
      <div className="model-selection" style={{ marginTop: '0', marginBottom: '32px' }}>
        <h2>🚀 RSS Feed Scraping Configuration</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          Configure scraping for RSS feeds from <code>ai_sources</code> table based on frequency settings.
        </p>
        
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
          🤖 Select LLM Model for Content Processing
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          Choose the AI model to process and analyze scraped content.
        </p>
        
        <div className="model-options">
          {models.map((model) => (
            <div
              key={model.id}
              className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
              onClick={() => setSelectedModel(model.id)}
              style={{ borderColor: selectedModel === model.id ? model.color : '#e5e7eb' }}
            >
              {model.recommended && <div className="recommended-badge">RECOMMENDED</div>}
              <div className="model-name" style={{ color: model.color }}>
                {model.name}
              </div>
              <div className="model-description">
                {model.description}
              </div>
              {selectedModel === model.id && (
                <div className="selected-indicator" style={{ color: model.color }}>
                  ✓ Selected
                </div>
              )}
            </div>
          ))}
        </div>
        
        {selectedModel === 'ollama' && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <strong style={{ color: '#92400e' }}>Ollama Setup Required</strong>
            </div>
            <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#78350f' }}>
              <li>Make sure Ollama is running: <code style={{ backgroundColor: '#1e293b', color: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>ollama serve</code></li>
              <li>Model must be installed: <code style={{ backgroundColor: '#1e293b', color: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>ollama pull llama3.2:3b</code></li>
              <li>Backend must be configured with <code style={{ backgroundColor: '#1e293b', color: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>OLLAMA_MODEL=llama3.2:3b</code></li>
            </ul>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#92400e' }}>
              ✅ Test connection: <code style={{ backgroundColor: '#1e293b', color: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>curl http://localhost:11434/api/tags</code>
            </p>
          </div>
        )}

        {/* ✅ NEW: Model Performance Comparison */}
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#374151' }}>
            📊 Model Performance Comparison
          </h4>
          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Model</th>
                <th style={{ textAlign: 'center', padding: '8px 4px' }}>Speed</th>
                <th style={{ textAlign: 'center', padding: '8px 4px' }}>Quality</th>
                <th style={{ textAlign: 'center', padding: '8px 4px' }}>Cost</th>
                <th style={{ textAlign: 'center', padding: '8px 4px' }}>Privacy</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 4px' }}>Gemini 2.0</td>
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>⚡⚡⚡</td>
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>⭐⭐⭐⭐</td>
                <td style={{ textAlign: 'center', padding: '8px 4px', color: '#10b981', fontWeight: 'bold' }}>FREE</td>
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>☁️ Cloud</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 4px' }}>Claude 3</td>
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>⚡⚡</td>
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>⭐⭐⭐⭐⭐</td>
                <td style={{ textAlign: 'center', padding: '8px 4px', color: '#ef4444', fontWeight: 'bold' }}>PAID</td>
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>☁️ Cloud</td>
              </tr>
              <tr style={{ backgroundColor: '#d1fae5', borderBottom: '1px solid #10b981' }}>
                <td style={{ padding: '8px 4px', fontWeight: '600' }}>🦙 Ollama</td>
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>⚡⚡⚡⚡</td>
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>⭐⭐⭐</td>
                <td style={{ textAlign: 'center', padding: '8px 4px', color: '#10b981', fontWeight: 'bold' }}>FREE</td>
                <td style={{ textAlign: 'center', padding: '8px 4px', color: '#10b981', fontWeight: 'bold' }}>🔒 Local</td>
              </tr>
            </tbody>
          </table>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
            💡 <strong>Tip:</strong> Use Ollama for free, private processing. Use Gemini for fastest results. Use Claude for best quality.
          </p>
        </div>

        {/* Frequency Selection - Already good! */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
            ⏰ Select Scraping Frequency
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            Choose which sources to scrape based on their configured update frequency.
          </p>
          
          <div className="frequency-options">
            {frequencies.map((freq) => (
              <div
                key={freq.value}
                className={`frequency-option ${selectedFrequency === freq.value ? 'selected' : ''}`}
                onClick={() => setSelectedFrequency(freq.value as 1 | 7 | 30)}
                style={{ 
                  borderColor: selectedFrequency === freq.value ? freq.color : '#e5e7eb',
                  backgroundColor: selectedFrequency === freq.value ? `${freq.color}10` : '#ffffff'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{freq.icon}</div>
                <div className="frequency-label" style={{ color: freq.color, fontWeight: '600' }}>
                  {freq.label}
                </div>
                <div className="frequency-description">
                  {freq.description}
                </div>
                {selectedFrequency === freq.value && (
                  <div className="selected-indicator" style={{ color: freq.color }}>
                    ✓ Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scraping Button - Already good! */}
        <button
          onClick={handleTriggerScraping}
          disabled={scrapingLoading}
          className="btn-scraping"
          style={{ 
            backgroundColor: scrapingLoading ? '#9ca3af' : models.find(m => m.id === selectedModel)?.color,
            cursor: scrapingLoading ? 'not-allowed' : 'pointer',
            marginTop: '24px'
          }}
        >
          {scrapingLoading ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ⏳ Scraping in progress...
            </>
          ) : (
            <>
              {selectedModel === 'ollama' ? '🦙' : selectedModel === 'gemini' ? '🤖' : selectedModel === 'claude' ? '🧠' : '🚀'}
              {' '}Start {frequencies.find(f => f.value === selectedFrequency)?.label} Scraping with{' '}
              {models.find(m => m.id === selectedModel)?.name}
            </> 
          )}
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`result-display ${result.success ? 'success' : 'error'}`}>
          <h3>{result.success ? '✅ Scraping Completed Successfully' : '❌ Scraping Failed'}</h3>
          <p>{result.message}</p>
          <div className="result-details">
            <div className="detail-item">
              <span className="detail-label">🤖 Model Used:</span>
              <strong>{models.find(m => m.id === selectedModel)?.name || result.llm_model_used}</strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">⏰ Frequency:</span>
              <strong>{frequencies.find(f => f.value === selectedFrequency)?.label}</strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">📡 Sources Scraped:</span>
              <strong>{result.details?.sources_scraped || 0}</strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">📄 Articles Found:</span>
              <strong>{result.details?.articles_found || 0}</strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">💾 Articles Processed:</span>
              <strong style={{ color: '#10b981' }}>{result.details?.articles_processed || 0}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Error Display - ALSO MOVED UP */}
      {error && (
        <div className="error-display">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* ✅ NEW: Podcast Scraping Section */}
      <div className="scraping-section" style={{ marginTop: '3rem', borderTop: '2px solid #e5e7eb', paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          🎧 Podcast Scraping
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Scrape all pending podcasts from <code>ai_podcasts</code> table (status = 'pending')
        </p>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.5rem', fontStyle: 'italic' }}>
          💡 Uses the <strong>{models.find(m => m.id === selectedModel)?.name}</strong> model selected above
        </p>
        
        <button
          onClick={handleTriggerPodcastScraping}
          disabled={podcastScrapingLoading}
          className="btn-scraping"
          style={{ 
            backgroundColor: podcastScrapingLoading ? '#9ca3af' : '#10b981',
            cursor: podcastScrapingLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {podcastScrapingLoading ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ⏳ Scraping podcasts...
            </>
          ) : (
            <>
              🎧 Scrape Pending Podcasts with {models.find(m => m.id === selectedModel)?.name}
            </>
          )}
        </button>

        {/* Podcast Result Display */}
        {podcastResult && (
          <div className={`result-display ${podcastResult.success ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
            <h3>{podcastResult.success ? '✅ Podcast Scraping Completed' : '❌ Podcast Scraping Failed'}</h3>
            <p>{podcastResult.message}</p>
            <div className="result-details">
              <div className="detail-item">
                <span className="detail-label">🤖 Model Used:</span>
                <strong>{podcastResult.llm_model}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-label">🎧 Total Pending:</span>
                <strong>{podcastResult.podcasts_total || 0}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-label">✅ Processed:</span>
                <strong>{podcastResult.podcasts_processed || 0}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-label">💾 Articles Inserted:</span>
                <strong style={{ color: '#10b981' }}>{podcastResult.articles_inserted || 0}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Podcast Error Display */}
        {podcastError && (
          <div className="error-display" style={{ marginTop: '1rem' }}>
            <h3>Error</h3>
            <p>{podcastError}</p>
          </div>
        )}
      </div>

      {/* ✅ NEW: Video Scraping Section */}
      <div className="scraping-section" style={{ marginTop: '3rem', borderTop: '2px solid #e5e7eb', paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          🎥 Video Scraping
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Scrape all pending videos from <code>ai_videos</code> table (status = 'pending')
        </p>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.5rem', fontStyle: 'italic' }}>
          💡 Uses the <strong>{models.find(m => m.id === selectedModel)?.name}</strong> model selected above
        </p>
        
        <button
          onClick={handleTriggerVideoScraping}
          disabled={videoScrapingLoading}
          className="btn-scraping"
          style={{ 
            backgroundColor: videoScrapingLoading ? '#9ca3af' : '#ef4444',
            cursor: videoScrapingLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {videoScrapingLoading ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ⏳ Scraping videos...
            </>
          ) : (
            <>
              🎥 Scrape Pending Videos with {models.find(m => m.id === selectedModel)?.name}
            </>
          )}
        </button>

        {/* Video Result Display */}
        {videoResult && (
          <div className={`result-display ${videoResult.success ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
            <h3>{videoResult.success ? '✅ Video Scraping Completed' : '❌ Video Scraping Failed'}</h3>
            <p>{videoResult.message}</p>
            <div className="result-details">
              <div className="detail-item">
                <span className="detail-label">🤖 Model Used:</span>
                <strong>{videoResult.llm_model}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-label">🎥 Total Pending:</span>
                <strong>{videoResult.videos_total || 0}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-label">✅ Processed:</span>
                <strong>{videoResult.videos_processed || 0}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-label">💾 Articles Inserted:</span>
                <strong style={{ color: '#10b981' }}>{videoResult.articles_inserted || 0}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Video Error Display */}
        {videoError && (
          <div className="error-display" style={{ marginTop: '1rem' }}>
            <h3>Error</h3>
            <p>{videoError}</p>
          </div>
        )}
      </div>

      <div className="sources-table">
        <h3>AI Sources ({sources.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>RSS URL</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source, index) => (
                <SourceRow
                  key={index}
                  source={source}
                  index={index}
                  isEditing={editingIndex === index}
                  onEdit={() => setEditingIndex(index)}
                  onSave={(updatedSource) => handleUpdate(index, updatedSource)}
                  onCancel={() => setEditingIndex(null)}
                  onDelete={() => handleDelete(index)}
                  onValidate={(feedUrl, sourceName) => validateSingleFeed(feedUrl, sourceName)}
                  categories={categories}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Key Info - Keep at bottom */}
      {/* ✅ UPDATED: API Key Info with Ollama Setup Guide */}
      <div className="api-key-info">
        <h3>🔑 LLM Configuration</h3>
        <ul>
          <li>
            <strong>Claude:</strong> ANTHROPIC_API_KEY (paid) - <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Get Key</a>
          </li>
          <li>
            <strong>Gemini:</strong> GOOGLE_API_KEY (FREE) - <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get Key</a>
          </li>
          <li>
            <strong>🦙 Ollama:</strong> No API key needed! Runs 100% locally on your machine
          </li>
        </ul>
        
        {/* ✅ NEW: Ollama Setup Guide */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#d1fae5', 
          borderRadius: '8px', 
          borderLeft: '4px solid #10b981' 
        }}>
          <h4 style={{ 
            margin: '0 0 0.5rem 0', 
            color: '#065f46', 
            fontSize: '0.95rem',
            fontWeight: '600'
          }}>
            🦙 Setting Up Ollama (Local & Free)
          </h4>
          <ol style={{ 
            margin: '0.5rem 0', 
            paddingLeft: '1.5rem', 
            fontSize: '0.875rem', 
            color: '#047857',
            lineHeight: '1.8'
          }}>
            <li>
              Install Ollama: <code style={{ backgroundColor: '#1e293b', color: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>brew install ollama</code> (macOS)
            </li>
            <li>
              Pull model: <code style={{ backgroundColor: '#1e293b', color: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>ollama pull llama3.2:3b</code>
            </li>
            <li>
              Start service: <code style={{ backgroundColor: '#1e293b', color: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>ollama serve</code>
            </li>
            <li>
              Update backend <code>.env</code>: <code style={{ backgroundColor: '#1e293b', color: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>OLLAMA_MODEL=llama3.2:3b</code>
            </li>
          </ol>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            fontSize: '0.875rem', 
            color: '#065f46',
            fontWeight: '500'
          }}>
            ✅ <strong>Benefits:</strong> 100% free, runs offline, complete privacy, no rate limits!
          </p>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            fontSize: '0.8rem', 
            color: '#059669',
            fontStyle: 'italic'
          }}>
            💡 <strong>Verify setup:</strong> <code style={{ backgroundColor: '#1e293b', color: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>curl http://localhost:11434/api/tags</code>
          </p>
        </div>
        
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          💡 Add API keys to your <code>.env</code> file in the backend directory
        </p>
      </div>

      <style>{`
        .admin-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          color: #1a1a1a;
          margin: 0;
        }

        .admin-actions {
          display: flex;
          gap: 1rem;
        }

        .admin-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e5e5e5;
        }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: bold;
          color: #2563eb;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .add-form {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border: 1px solid #e5e5e5;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
        }

        .sources-table {
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e5e5;
          overflow: hidden;
        }

        .sources-table h3 {
          padding: 1rem;
          margin: 0;
          background: #f8f9fa;
          border-bottom: 1px solid #e5e5e5;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e5e5;
        }

        th {
          background: #f8f9fa;
          font-weight: 600;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background: #d97706;
        }

        .btn-info {
          background: #3b82f6;
          color: white;
        }

        .btn-info:hover {
          background: #2563eb;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .loading {
          text-align: center;
          padding: 4rem;
        }

        .status-enabled {
          color: #10b981;
          font-weight: 500;
        }

        .status-disabled {
          color: #ef4444;
          font-weight: 500;
        }

        .model-selection {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border: 1px solid #e5e5e5;
          margin-top: 2rem;
        }

        .model-selection h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #111827;
        }

        .model-options {
          display: grid;
          gap: 1rem;
          margin-bottom: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .model-option {
          padding: 1.25rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background-color: #ffffff;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          position: relative;
        }

        .model-option:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }

        .model-option.selected {
          border-width: 2px;
          background-color: #f9fafb;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .recommended-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background-color: #10b981;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .model-name {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 6px;
          padding-right: 100px;
        }

        .model-description {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .selected-indicator {
          margin-top: 8px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .btn-scraping {
          width: 100%;
          padding: 1rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-scraping:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .btn-scraping:disabled {
          opacity: 0.6;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .result-display {
          margin-top: 2rem;
          padding: 1.5rem;
          border-radius: 12px;
          border: 2px solid transparent;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .result-display.success {
          background-color: #d1fae5;
          border-color: #10b981;
        }

        .result-display.error {
          background-color: #fee2e2;
          border-color: #dc2626;
        }

        .result-display h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .result-display p {
          font-size: 0.875rem;
          margin-bottom: 1rem;
          color: #374151;
        }

        .result-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .detail-item strong {
          font-size: 1.25rem;
          color: #111827;
        }

        .error-display {
          margin-top: 2rem;
          padding: 1.5rem;
          background-color: #fee2e2;
          border: 2px solid #dc2626;
          border-radius: 12px;
          animation: fadeIn 0.3s ease-in;
        }

        .error-display h3 {
          color: #dc2626;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .error-display p {
          color: #991b1b;
          font-size: 0.875rem;
        }

        .api-key-info {
          margin-top: 2rem;
          padding: 1.5rem;
          background: linear-gradient(to right, #eff6ff, #dbeafe);
          border: 2px solid #bfdbfe;
          border-radius: 12px;
        }

        .api-key-info h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #1e40af;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .api-key-info ul {
          font-size: 0.875rem;
          color: #1e40af;
          line-height: 2;
          padding-left: 1.5rem;
        }

        .api-key-info ul li {
          margin-bottom: 0.5rem;
        }

        .api-key-info ul li strong {
          font-weight: 600;
        }

        .api-key-info ul li a {
          color: #2563eb;
          text-decoration: underline;
          font-weight: 500;
        }

        .api-key-info ul li a:hover {
          color: #1d4ed8;
        }

        .api-key-info p {
          font-size: 0.875rem;
          color: #3b82f6;
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #ffffff;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }

        .api-key-info code {
          background-color: #1e293b;
          color: #e0e7ff;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }

        .frequency-options {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          margin-bottom: 1.5rem;
        }

        .frequency-option {
          padding: 1.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background-color: #ffffff;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          position: relative;
        }

        .frequency-option:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }

        .frequency-option.selected {
          border-width: 2px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .frequency-label {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .frequency-description {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.4;
        }

        /* ...rest of existing styles... */
      `}</style>
    </div>
  );
};

interface SourceRowProps {
  source: AISource;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (source: AISource) => void;
  onCancel: () => void;
  onDelete: () => void;
  onValidate: (feedUrl: string, sourceName: string) => void;
  categories: string[];
}

const SourceRow: React.FC<SourceRowProps> = ({ 
  source, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete,
  onValidate,
  categories 
}) => {
  const [editedSource, setEditedSource] = useState<AISource>(source);

  useEffect(() => {
    setEditedSource(source);
  }, [source, isEditing]);

  if (isEditing) {
    return (
      <tr>
        <td>
          <input
            value={editedSource.name}
            onChange={(e) => setEditedSource({...editedSource, name: e.target.value})}
          />
        </td>
        <td>
          <select
            value={editedSource.category}
            onChange={(e) => setEditedSource({...editedSource, category: e.target.value})}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </td>
        <td>
          <input
            value={editedSource.rss_url}
            onChange={(e) => setEditedSource({...editedSource, rss_url: e.target.value})}
          />
        </td>
        <td>
          <input
            type="number"
            value={editedSource.priority}
            onChange={(e) => setEditedSource({...editedSource, priority: parseInt(e.target.value) || 5})}
          />
        </td>
        <td>
          <label>
            <input
              type="checkbox"
              checked={editedSource.enabled}
              onChange={(e) => setEditedSource({...editedSource, enabled: e.target.checked})}
            />
            Enabled
          </label>
        </td>
        <td>
          <div className="action-buttons">
            <button onClick={() => onSave(editedSource)} className="btn btn-primary">
              <Save size={14} />
            </button>
            <button onClick={onCancel} className="btn btn-secondary">
              <X size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <strong>{source.name}</strong>
        {source.website && (
          <a href={source.website} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} style={{ marginLeft: '8px' }} />
          </a>
        )}
      </td>
      <td>
        <span className={`category-badge category-${source.category}`}>
          {source.category}
        </span>
      </td>
      <td>
        <a href={source.rss_url} target="_blank" rel="noopener noreferrer" className="rss-link">
          {source.rss_url.length > 40 ? source.rss_url.substring(0, 40) + '...' : source.rss_url}
        </a>
      </td>
      <td>{source.priority}</td>
      <td>
        <span className={source.enabled ? 'status-enabled' : 'status-disabled'}>
          {source.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </td>
      <td>
        <div className="action-buttons">
          <button 
            onClick={() => onValidate(source.rss_url, source.name)} 
            className="btn btn-info"
            title="Validate RSS Feed"
          >
            <RefreshCw size={14} />
          </button>
          <button onClick={onEdit} className="btn btn-secondary">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="btn btn-danger">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default Admin;