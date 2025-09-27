import React, { useState } from 'react';
import { apiService } from '../services/api';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const AdminValidation: React.FC = () => {
  const { adminApiKey, adminLogout } = useAdminAuth();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickTest = async () => {
    if (!adminApiKey) {
      setError('Admin not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await apiService.quickTest(adminApiKey);
      setResults(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Quick test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAll = async () => {
    if (!adminApiKey) {
      setError('Admin not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await apiService.validateSources(adminApiKey, {
        priority: 1,
        timeout: 10,
        maxConcurrent: 5
      });
      setResults(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateByType = async (contentType: string) => {
    if (!adminApiKey) {
      setError('Admin not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await apiService.validateSources(adminApiKey, {
        contentType,
        priority: 1,
        timeout: 15
      });
      setResults(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🔧 Admin Source Validation</h2>
        <button
          onClick={adminLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🚪 Logout
        </button>
      </div>
      
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#e8f5e8', 
        border: '1px solid #4ade80', 
        borderRadius: '4px', 
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        ✅ Admin authenticated - Ready to validate sources
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleQuickTest}
          disabled={loading}
          style={{
            padding: '10px 20px',
            margin: '5px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Testing...' : '🚀 Quick Test'}
        </button>

        <button
          onClick={handleValidateAll}
          disabled={loading}
          style={{
            padding: '10px 20px',
            margin: '5px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Validating...' : '✅ Validate All Priority'}
        </button>

        <button
          onClick={() => handleValidateByType('newsletters')}
          disabled={loading}
          style={{
            padding: '10px 20px',
            margin: '5px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          📧 Newsletters Only
        </button>

        <button
          onClick={() => handleValidateByType('blogs')}
          disabled={loading}
          style={{
            padding: '10px 20px',
            margin: '5px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          📝 Blogs Only
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3>✅ Validation Results</h3>
          <pre style={{
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <h4>📋 How to Use:</h4>
        <ol>
          <li><strong>Quick Test:</strong> Tests a few random sources quickly</li>
          <li><strong>Validate All Priority:</strong> Tests all priority 1 sources (recommended)</li>
          <li><strong>Content Type Validation:</strong> Test specific types (newsletters, blogs, etc.)</li>
          <li><strong>View Results:</strong> Check validation results and health scores below</li>
        </ol>
        
        <h4>🔗 Alternative:</h4>
        <p>
          You can also use the dedicated admin panel at:{' '}
          <a 
            href="https://ai-news-scraper.vercel.app/admin-validation" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff' }}
          >
            https://ai-news-scraper.vercel.app/admin-validation
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminValidation;