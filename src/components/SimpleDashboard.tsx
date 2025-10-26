import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface ContentItem {
  id: string;
  category: string;
  type: 'BLOGS' | 'VIDEOS' | 'PODCASTS';
  title: string;
  summary: string;
  sourceLink: string;
  publishDate: string;
  publisher: string;
  significance?: number;
}

const SimpleDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadFeed = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔥 Loading personalized feed directly...');
        
        const filterRequest = {
          interests: ['Generative AI', 'AI Applications', 'AI Start Ups'],
          content_types: ['BLOGS', 'VIDEOS', 'PODCASTS'],
          publishers: ['techcrunch', 'arxiv', 'venturebeat'],
          time_filter: 'Last Week',
          search_query: '',
          limit: 20
        };

        const response = await apiService.getPersonalizedFeed(filterRequest);
        
        // Convert grouped content to flat array
        const flatContent: ContentItem[] = [];
        response.grouped_content?.forEach((group: any) => {
          group.items?.forEach((item: any) => {
            flatContent.push({
              id: item.id?.toString() || Math.random().toString(),
              category: group.category,
              type: (item.content_type_label as 'BLOGS' | 'VIDEOS' | 'PODCASTS') || 'BLOGS',
              title: item.title || 'Untitled',
              summary: item.summary || item.description || 'No description available',
              sourceLink: item.url || '#',
              publishDate: item.published_date || new Date().toISOString(),
              publisher: item.source || 'Unknown',
              significance: item.significance_score || 5
            });
          });
        });
        
        setContent(flatContent);
        console.log('✅ Feed loaded successfully:', flatContent.length, 'items');
        
      } catch (err) {
        console.error('❌ Error loading feed:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [isAuthenticated, user?.id]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BLOGS': return '#3B82F6';
      case 'VIDEOS': return '#EF4444';
      case 'PODCASTS': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const groupContentByType = (content: ContentItem[]) => {
    const grouped: { [key: string]: ContentItem[] } = {};
    content.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = [];
      }
      grouped[item.type].push(item);
    });
    return grouped;
  };

  const renderBreakingNews = () => {
    const breakingNews = content.filter(item => item.significance && item.significance >= 8).slice(0, 3);
    
    if (breakingNews.length === 0) return null;

    return (
      <div style={{ 
        backgroundColor: '#fef2f2', 
        borderLeft: '4px solid #ef4444', 
        padding: '16px', 
        marginBottom: '24px',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            backgroundColor: '#ef4444', 
            borderRadius: '50%',
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>!</div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#991b1b', margin: 0 }}>
            🚨 Breaking News
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {breakingNews.map((item) => (
            <div key={item.id} style={{ 
              backgroundColor: 'white', 
              padding: '12px', 
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                fontWeight: '600', 
                color: '#111827', 
                fontSize: '14px', 
                marginBottom: '8px',
                lineHeight: '1.4'
              }}>
                {item.title}
              </h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '12px', 
                color: '#6b7280' 
              }}>
                <span>{item.publisher}</span>
                <span>{formatDate(item.publishDate)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContentByType = (type: 'BLOGS' | 'VIDEOS' | 'PODCASTS') => {
    const typeContent = content.filter(item => item.type === type).slice(0, 6);
    
    if (typeContent.length === 0) return null;

    return (
      <div style={{ marginBottom: '32px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <span 
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              marginRight: '12px',
              backgroundColor: getTypeColor(type)
            }}
          ></span>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: 0,
            flex: 1
          }}>
            {type}
          </h2>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {typeContent.length} items
          </span>
        </div>
        
        <div style={{ display: 'grid', gap: '16px' }}>
          {typeContent.map((item) => (
            <div key={item.id} style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              padding: '16px',
              transition: 'box-shadow 0.2s'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '8px' 
              }}>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  backgroundColor: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {item.category}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {formatDate(item.publishDate)}
                </span>
              </div>
              
              <h3 style={{ 
                fontWeight: '600', 
                color: '#111827', 
                marginBottom: '8px',
                fontSize: '16px',
                lineHeight: '1.4'
              }}>
                {item.title}
              </h3>
              
              <p style={{ 
                color: '#6b7280', 
                fontSize: '14px', 
                marginBottom: '12px',
                lineHeight: '1.5'
              }}>
                {item.summary}
              </p>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {item.publisher}
                </span>
                <a 
                  href={item.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#2563eb',
                    fontSize: '14px', 
                    fontWeight: '500',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => (e.target as HTMLElement).style.color = '#1d4ed8'}
                  onMouseOut={(e) => (e.target as HTMLElement).style.color = '#2563eb'}
                >
                  Read More →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">AI News Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'User'}</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {content.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>
            <p>No content available</p>
          </div>
        ) : (
          <div style={{ paddingTop: '24px' }}>
            {renderBreakingNews()}
            {renderContentByType('BLOGS')}
            {renderContentByType('VIDEOS')}
            {renderContentByType('PODCASTS')}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDashboard;