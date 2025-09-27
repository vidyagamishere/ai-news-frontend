import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ExternalLink, RefreshCw } from 'lucide-react';
import apiService from '../services/api';
import AdminValidation from '../components/AdminValidation';

interface AISource {
  name: string;
  rss_url: string;
  website: string;
  enabled: boolean;
  priority: number;
  category: string;
}

const Admin: React.FC = () => {
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

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/admin/sources');
      setSources(response.sources || []);
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE || 'https://ai-news-scraper-production.up.railway.app';
      const response = await fetch(`${apiBaseUrl}/api/admin/sources/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(newSource)
      });
      
      if (response.ok) {
        await fetchSources();
        setNewSource({ name: '', rss_url: '', website: '', enabled: true, priority: 5, category: 'other' });
        setShowAddForm(false);
        alert('Source added successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to add source: ${error.error}`);
      }
    } catch (error) {
      console.error('Add error:', error);
      alert('Failed to add source');
    }
  };

  const handleUpdate = async (index: number, updatedSource: AISource) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE || 'https://ai-news-scraper-production.up.railway.app';
      const response = await fetch(`${apiBaseUrl}/api/admin/sources/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ index, ...updatedSource })
      });
      
      if (response.ok) {
        await fetchSources();
        setEditingIndex(null);
        alert('Source updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update source: ${error.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update source');
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE || 'https://ai-news-scraper-production.up.railway.app';
      const response = await fetch(`${apiBaseUrl}/api/admin/sources/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ index })
      });
      
      if (response.ok) {
        await fetchSources();
        alert('Source deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete source: ${error.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete source');
    }
  };

  const testScraping = async () => {
    try {
      const response = await apiService.get('/api/test-scraping');
      console.log('Scraping test result:', response);
      alert(`Scraping test completed. Found ${response.articles_found || 0} articles. Check console for details.`);
    } catch (error) {
      console.error('Scraping test error:', error);
      alert('Scraping test failed');
    }
  };

  const validateAllFeeds = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE || 'https://ai-news-scraper-production.up.railway.app';
      const response = await fetch(`${apiBaseUrl}/api/admin/validate-all-feeds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Feed validation results:', result);
        
        const invalidCount = result.invalid_feeds || 0;
        const validCount = result.valid_feeds || 0;
        const totalCount = result.total_feeds || 0;
        
        alert(`Feed Validation Complete!\n\nTotal Feeds: ${totalCount}\nValid: ${validCount}\nInvalid: ${invalidCount}\n\nCheck console for detailed results.`);
        
        // Optionally refresh sources to show validation status
        await fetchSources();
      } else {
        const error = await response.json();
        alert(`Feed validation failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Feed validation error:', error);
      alert('Feed validation failed');
    } finally {
      setLoading(false);
    }
  };

  const validateSingleFeed = async (feedUrl: string, sourceName: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE || 'https://ai-news-scraper-production.up.railway.app';
      const response = await fetch(`${apiBaseUrl}/api/admin/validate-feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ feed_url: feedUrl })
      });
      
      if (response.ok) {
        const result = await response.json();
        const validation = result.validation;
        
        if (validation.valid) {
          alert(`✅ ${sourceName} Feed Valid!\n\nEntries: ${validation.total_entries}\nRecent: ${validation.recent_entries}\nLast Updated: ${validation.last_updated}`);
        } else {
          alert(`❌ ${sourceName} Feed Invalid!\n\nError: ${validation.error}\nStatus: ${validation.status_code || 'Unknown'}`);
        }
      } else {
        const error = await response.json();
        alert(`Validation failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Single feed validation error:', error);
      alert('Single feed validation failed');
    }
  };

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
          <button onClick={testScraping} className="btn btn-secondary">
            <RefreshCw size={16} />
            Test Scraping
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