import React, { useState, useEffect } from 'react';
import { Calendar, Search, Clock, TrendingUp, Archive as ArchiveIcon, ChevronLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import Header from '../components/Header';
import Loading from '../components/Loading';
// import TopStories from '../components/TopStories'; // Not used in archive page
import ContentTabs from '../components/content/ContentTabs';
import SEO from '../components/SEO';

interface ArchivedContent {
  id: string;
  date: string;
  timestamp: number;
  total_articles: number;
  content_types?: string[];
  content_types_count?: number;
  top_stories_count?: number;
  sources_processed?: number;
  archive_type?: string;
}

interface ArchiveStats {
  archives: ArchivedContent[];
  total_archives: number;
  max_retention_days: number;
  refresh_interval_hours: number;
}

interface DetailedArchive {
  archive_id: string;
  date: string;
  timestamp: number;
  content: Record<string, {
    data: any;
    cached_time: number;
    articles_count: number;
  }>;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  source: string;
  content_type: string;
  significance_score: number;
  summary: string;
  archived_date: string;
  is_top_story: boolean;
}

const Archive: React.FC = () => {
  const [archives, setArchives] = useState<ArchivedContent[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<DetailedArchive | null>(null);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [view, setView] = useState<'calendar' | 'search' | 'archive'>('calendar');

  const { user } = useAuth();

  useEffect(() => {
    loadArchiveData();
    
    // Set up auto-refresh to check for new archives every 5 minutes
    const interval = setInterval(() => {
      loadArchiveData(false); // Don't show loading spinner for background updates
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const loadArchiveData = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Load recent archives (last 60 archives, covering 30 days with 12-hour refresh)
      const archiveResponse = await apiService.get('/api/archive?limit=60');

      // Ensure content_types field exists for all archives
      const processedArchives = (archiveResponse.archives || []).map((archive: ArchivedContent) => ({
        ...archive,
        content_types: archive.content_types || ['blog', 'audio', 'video'],
        content_types_count: archive.content_types_count || archive.content_types?.length || 3
      }));

      // Sort archives by date (newest first)
      const sortedArchives = processedArchives.sort((a: ArchivedContent, b: ArchivedContent) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      // Only update if we have new data or this is the initial load
      if (showLoading || sortedArchives.length !== archives.length) {
        setArchives(sortedArchives);
        setStats(archiveResponse);
        
        // Show a subtle notification if new archives were found during auto-refresh
        if (!showLoading && sortedArchives.length > archives.length) {
          console.log(`📚 Found ${sortedArchives.length - archives.length} new archives`);
        }
      }
    } catch (err) {
      console.error('Failed to load archive data:', err);
      if (showLoading || archives.length === 0) {
        setError('Failed to load archive data. Please try again.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadArchiveById = async (archiveId: string, date: string) => {
    try {
      setLoading(true);
      const archive = await apiService.get(`/api/archive/${archiveId}`);
      setSelectedArchive(archive);
      setSelectedDate(date);
      setView('archive');
    } catch (err) {
      console.error(`Failed to load archive ${archiveId}:`, err);
      setError(`No archive found for ${date}`);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const results = await apiService.get(`/api/archive/search?q=${encodeURIComponent(searchQuery)}&limit=50`);
      setSearchResults(results.results || []);
      setView('search');
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !selectedArchive) {
    return <Loading message="Loading archive..." />;
  }

  if (error && !selectedArchive && !archives.length) {
    return (
      <div className="app">
        <Header onRefresh={() => {}} onManualScrape={() => {}} isLoading={false} />
        <div className="error-container">
          <div className="error-message">
            <h2>⚠️ Archive Error</h2>
            <p>{error}</p>
            <button onClick={() => loadArchiveData(true)} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app authenticated-app">
      <SEO 
        title="Vidyagam Archive | Intelligence at Light Speed"
        description="Browse historical AI news digests and search through archived articles."
        url="/archive"
      />
      <Header onRefresh={() => loadArchiveData(true)} onManualScrape={() => {}} isLoading={loading} />
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      <main className="main-content">
        <div className="main-content-contained">
          <div className="archive-header">
            <div className="archive-title">
              <ArchiveIcon size={32} />
              <div>
                <h1>News Archive</h1>
                <p>Browse and search through historical AI news digests</p>
              </div>
            </div>
            <div className="archive-actions">
              <button 
                onClick={() => window.location.href = '/'} 
                className="dashboard-link-btn"
              >
                <Home size={16} />
                Back to Dashboard
              </button>
            </div>

            {stats && (
              <div className="archive-stats">
                <div className="stat-card">
                  <Calendar size={20} />
                  <div>
                    <div className="stat-value">{stats.total_archives}</div>
                    <div className="stat-label">Archives Available</div>
                  </div>
                </div>
                <div className="stat-card">
                  <TrendingUp size={20} />
                  <div>
                    <div className="stat-value">{archives.reduce((sum, a) => sum + a.total_articles, 0)}</div>
                    <div className="stat-label">Total Articles</div>
                  </div>
                </div>
                <div className="stat-card">
                  <Clock size={20} />
                  <div>
                    <div className="stat-value">{stats.max_retention_days}</div>
                    <div className="stat-label">Max Retention Days</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="archive-nav">
            <button 
              className={`nav-btn ${view === 'calendar' ? 'active' : ''}`}
              onClick={() => setView('calendar')}
            >
              <Calendar size={16} />
              Calendar View
            </button>
            <button 
              className={`nav-btn ${view === 'search' ? 'active' : ''}`}
              onClick={() => setView('search')}
            >
              <Search size={16} />
              Search Archive
            </button>
            {selectedArchive && (
              <button 
                className={`nav-btn ${view === 'archive' ? 'active' : ''}`}
                onClick={() => setView('archive')}
              >
                <ArchiveIcon size={16} />
                {formatDate(selectedDate)}
              </button>
            )}
          </div>

          {view === 'calendar' && (
            <div className="archive-calendar">
              <h2>Recent Archives</h2>
              <div className="digests-grid">
                {archives.map((archive) => (
                  <div 
                    key={archive.id} 
                    className="digest-card"
                    onClick={() => loadArchiveById(archive.id, archive.date)}
                  >
                    <div className="digest-date">
                      {formatDate(archive.date)}
                    </div>
                    <div className="digest-stats">
                      <span>{archive.total_articles} articles</span>
                      <span>{archive.content_types && archive.content_types.length > 0 ? archive.content_types.join(', ') : 'Mixed content'}</span>
                      <span>{archive.content_types_count || 0} types</span>
                    </div>
                    <div className="archive-timestamp">
                      {new Date(archive.timestamp * 1000).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {archives.length === 0 && (
                <div className="no-archives">
                  <ArchiveIcon size={48} />
                  <h3>No Archives Yet</h3>
                  <p>Archives will appear here as content is refreshed every 12 hours.</p>
                </div>
              )}
            </div>
          )}

          {view === 'search' && (
            <div className="archive-search">
              <h2>Search Archive</h2>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search articles by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                />
                <button 
                  onClick={performSearch} 
                  disabled={searchLoading || !searchQuery.trim()}
                  className="search-btn"
                >
                  {searchLoading ? <Loading /> : <Search size={16} />}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="search-results">
                  <h3>{searchResults.length} results found</h3>
                  <div className="results-list">
                    {searchResults.map((result) => (
                      <div 
                        key={result.id}
                        className={`result-item ${result.is_top_story ? 'top-story' : ''}`}
                        onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')}
                      >
                        <div className="result-header">
                          <h4>{result.title}</h4>
                          <div className="result-meta">
                            <span className="source">{result.source}</span>
                            <span className="date">{formatDate(result.archived_date)}</span>
                            {result.is_top_story && <span className="top-story-badge">🔥 Top Story</span>}
                          </div>
                        </div>
                        <p className="result-summary">{result.summary}</p>
                        <div className="result-score">
                          Score: {result.significance_score.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'archive' && selectedArchive && (
            <div className="archived-digest">
              <div className="digest-header">
                <button 
                  onClick={() => setView('calendar')} 
                  className="back-btn"
                >
                  <ChevronLeft size={16} />
                  Back to Calendar
                </button>
                <h2>{formatDate(selectedDate)}</h2>
                <div className="archive-metadata">
                  <span>Archived: {new Date(selectedArchive.timestamp * 1000).toLocaleString()}</span>
                </div>
              </div>

              {/* Display the archived content using existing components */}
              {selectedArchive.content && Object.keys(selectedArchive.content).length > 0 ? (
                <ContentTabs 
                  userTier={user?.subscriptionTier || 'free'} 
                  topStories={[]}
                  isArchive={true}
                  archiveContent={(() => {
                    // Transform archive content structure for ContentTabs compatibility
                    const transformedContent: Record<string, any[]> = {};
                    Object.entries(selectedArchive.content).forEach(([contentType, contentData]: [string, any]) => {
                      if (contentData && contentData.data && Array.isArray(contentData.data)) {
                        transformedContent[contentType] = contentData.data;
                      } else if (Array.isArray(contentData)) {
                        transformedContent[contentType] = contentData;
                      }
                    });
                    return transformedContent;
                  })()}
                />
              ) : (
                <div className="no-archived-content">
                  <ArchiveIcon size={48} />
                  <h3>No Content Available</h3>
                  <p>This archive does not contain any content data.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Archive;