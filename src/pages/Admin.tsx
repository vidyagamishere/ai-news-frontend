import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ExternalLink, RefreshCw } from 'lucide-react';
import apiService from '../services/api';
import AdminValidation from '../components/AdminValidation';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface AISource {
  name: string;
  rss_url: string;
  website: string;
  enabled: boolean;
  priority: number;
  category: string;
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

  const [selectedModel, setSelectedModel] = useState<'claude' | 'gemini' | 'huggingface'>('gemini');
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      id: 'huggingface' as const,
      name: 'Llama 3.1 8B Instruct',
      description: 'FREE • Good quality • HuggingFace',
      color: '#6366f1'
    }
  ];

  const handleTriggerScraping = async () => {
    console.log('🎯 handleTriggerScraping called with model:', selectedModel);
    setScrapingLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use the admin API service with model parameter
      const response = await apiService.callEndpoint(
        `admin/scrape?llm_model=${selectedModel}`, 
        'POST', 
        {}, 
        false, 
        {
          'X-Admin-API-Key': adminApiKey
        }
      );

      console.log('✅ Scraping response:', response);
      
      if (response.success) {
        setResult({
          success: true,
          message: response.message || 'Scraping completed successfully',
          llm_model_used: selectedModel,
          details: {
            sources_scraped: response.sources_scraped || 0,
            articles_found: response.articles_found || 0,
            articles_processed: response.articles_processed || 0
          }
        });
      } else {
        throw new Error(response.message || 'Scraping failed');
      }
    } catch (err: any) {
      console.error('Scraping error:', err);
      setError(err.message || 'Failed to trigger scraping');
    } finally {
      setScrapingLoading(false);
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

      {/* Model Selection Section - MOVED HERE BEFORE SOURCES TABLE */}
      <div className="model-selection" style={{ marginTop: '0', marginBottom: '32px' }}>
        <h2>🤖 Select LLM Model for Content Processing</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          Choose the AI model to process and analyze scraped content. Each model has different strengths:
        </p>
        
        {/* Debug indicator */}
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#f0fdf4', 
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '12px',
          color: '#15803d',
          border: '1px solid #86efac'
        }}>
          ✅ Model Selection Panel Loaded • Currently Selected: <strong>{selectedModel}</strong>
        </div>

        <div className="model-options">
          {models.map((model) => {
            console.log('🎨 Rendering model option:', model.name, 'Selected:', selectedModel === model.id);
            return (
              <div
                key={model.id}
                className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
                onClick={() => {
                  console.log('🖱️ Model clicked:', model.id);
                  setSelectedModel(model.id);
                }}
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
            );
          })}
        </div>
        <button
          onClick={handleTriggerScraping}
          disabled={scrapingLoading}
          className="btn-scraping"
          style={{ 
            backgroundColor: scrapingLoading ? '#9ca3af' : models.find(m => m.id === selectedModel)?.color,
            cursor: scrapingLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {scrapingLoading ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ⏳ Scraping in progress...
            </>
          ) : (
            `🚀 Start Scraping with ${models.find(m => m.id === selectedModel)?.name}`
          )}
        </button>
      </div>

      {/* Result Display - ALSO MOVED UP */}
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
      <div className="api-key-info">
        <h3>API Keys Required</h3>
        <ul>
          <li><strong>Claude:</strong> ANTHROPIC_API_KEY (paid)</li>
          <li><strong>Gemini:</strong> GOOGLE_API_KEY (FREE - get from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">here</a>)</li>
          <li><strong>HuggingFace:</strong> HUGGINGFACE_API_KEY (FREE - get from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">here</a>)</li>
        </ul>
        <p>
          💡 Add keys to your <code>.env</code> file in the backend directory
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