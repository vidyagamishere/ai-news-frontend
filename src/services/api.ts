// UPDATED API service - Modular FastAPI Architecture Integration  
// All API calls now go to direct FastAPI endpoints with modular routing
import axios from 'axios';
import DebugLogger from '../utils/debug';

// Modular FastAPI backend URL - Direct endpoints with APIRouter
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'https://mindful-adventure-production-50fa.up.railway.app';

console.log('🏗️ API Service: Using Modular FastAPI Architecture with PostgreSQL');
console.log('🔗 Backend URL:', API_BASE_URL);
console.log('🚀 Direct endpoint calls (no router middleware)');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for Google auth and complex operations
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Debug logging helper
 */
const debugLog = (method: string, event: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[${method}] ${event}`, data || '');
  }
};

// Create a separate instance for content requests with longer timeout
const contentApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds for digest processing with comprehensive database views
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize debug logger for API service
const debug = new DebugLogger('APIService');

// Request deduplication cache to prevent duplicate API calls
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>();
const cacheTimeout = 10000; // 10 seconds cache for better deduplication

// Direct modular endpoint request function - calls FastAPI endpoints directly
async function makeModularRequest(
  endpoint: string, 
  method: string = 'GET', 
  params: any = {}, 
  data: any = null,
  headers: any = {},
  useContentApi: boolean = false
) {
  debug.enter('makeModularRequest', { endpoint, method, params, hasData: !!data, headers: Object.keys(headers) });
  const startTime = Date.now();
  
  // Create cache key for GET requests only (POST requests should not be cached)
  const cacheKey = method === 'GET' ? `${method}:${endpoint}:${JSON.stringify(params)}:${JSON.stringify(headers)}` : null;
  
  if (cacheKey) {
    // Check if request is in cache and still valid
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      console.log(`🔄 Using cached request for: ${method} /${endpoint}`);
      return cached.promise;
    }
  }
  
  try {
    const apiInstance = useContentApi ? contentApi : api;
    
    debug.step('makeModularRequest', 'sending_request', { endpoint, method });
    console.log(`📡 Modular Request: ${method} /${endpoint}`);
    
    // Build request configuration
    const config: any = {
      method: method.toLowerCase(),
      url: `/${endpoint}`,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    };
    
    // Add query parameters for GET requests
    if (method === 'GET' && Object.keys(params).length > 0) {
      config.params = params;
    }
    
    // Add request body for POST/PUT requests
    if ((method === 'POST' || method === 'PUT') && (data || Object.keys(params).length > 0)) {
      config.data = data || params;
    }
    
    const response = await apiInstance.request(config);
    
    debug.step('makeModularRequest', 'received_response', { 
      endpoint, 
      status: response.status, 
      hasData: !!response.data 
    });
    
    console.log(`✅ Modular Response: /${endpoint} - ${response.status}`);
    
    const executionTime = Date.now() - startTime;
    debug.exit('makeModularRequest', { 
      status: response.status, 
      endpoint,
      dataType: typeof response.data 
    }, executionTime);
    
    return response.data;
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    debug.error('makeModularRequest', error, executionTime);
    
    console.error(`❌ Modular request failed for /${endpoint}:`, error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    
    // Handle not found errors
    if (error.response?.status === 404) {
      throw new Error(`Endpoint /${endpoint} not found`);
    }
    
    // Return detailed error info with all backend error data preserved
    const errorData = error.response?.data || {};
    const errorMessage = errorData.detail || errorData.message || error.message;
    
    // Create enhanced error with all backend data preserved
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).error_code = errorData.error_code;
    (enhancedError as any).status = errorData.status || error.response?.status;
    (enhancedError as any).redirect_to_signin = errorData.redirect_to_signin;
    (enhancedError as any).redirect_to_signup = errorData.redirect_to_signup;
    (enhancedError as any).detailed_instructions = errorData.detailed_instructions;
    
    throw enhancedError;
  }
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DAILY_CACHE_KEY = 'daily_cache_timestamp';

// Check if we need to clear daily cache
const shouldClearDailyCache = (): boolean => {
  const lastClear = localStorage.getItem(DAILY_CACHE_KEY);
  if (!lastClear) return true;
  
  const timeSinceLastClear = Date.now() - parseInt(lastClear);
  const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  return timeSinceLastClear > oneDayMs;
};

// Clear daily cache and mark timestamp
const clearDailyCache = (): void => {
  console.log('🗂️ Clearing daily cache - archiving old content');
  cache.clear();
  localStorage.setItem(DAILY_CACHE_KEY, Date.now().toString());
};

const getCacheKey = (endpoint: string, params?: any) => {
  return `${endpoint}${params ? '?' + new URLSearchParams(params).toString() : ''}`;
};

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
};

// Types for API responses with enhanced topic support
export interface AITopic {
  id: string;
  name: string;
  category: string;
}

// ============================================
// ENHANCED ARTICLE INTERFACE WITH DUAL NAMING
// ============================================

/**
 * Main Article type used throughout the application
 * Supports both snake_case (backend) and camelCase (frontend)
 * All optional fields for maximum compatibility
 */
export interface Article {
  // ===== CORE IDENTIFIERS =====
  id?: number | string;
  
  // ===== CONTENT =====
  title: string;
  summary?: string;
  description?: string;  // ✅ Alias for summary
  content_summary?: string;  // ✅ Extended summary from backend
  content?: string;  // ✅ Full article content
  url: string;
  sourceLink?: string;  // ✅ Alias for url
  external_link?: string;  // ✅ Alternative naming
  
  // ===== SOURCE INFORMATION =====
  source: string;  // Primary source field
  source_name?: string;  // ✅ Backend uses this
  publisher?: string;  // ✅ Alternative naming
  
  // ===== TEMPORAL DATA =====
  time: string;  // Primary time field
  published_date?: string;  // ✅ Backend uses this
  publishDate?: string;  // ✅ Alias
  created_at?: string;  // ✅ Backend timestamp
  updated_at?: string;  // ✅ Backend timestamp
  
  // ===== CATEGORIZATION =====
  category?: string;
  category_name?: string;  // ✅ Backend uses this
  category_id?: number;  // ✅ Backend reference
  
  content_type_name?: string;  // ✅ Backend uses this
  content_type?: string;  // ✅ Alternative naming
  type: 'blog' | 'audio' | 'video' | 'events' | 'learning' | 'demos' | 'BLOGS' | 'VIDEOS' | 'PODCASTS' | string;
  
  // ===== IMPACT & METRICS =====
  impact: 'high' | 'medium' | 'low';
  significance?: number;
  significanceScore: number;
  significance_score?: number;  // ✅ Backend snake_case
  
  rankingScore?: number;
  ranking_score?: number;  // ✅ Backend snake_case
  
  engagement_score?: number;
  engagementScore?: number;  // ✅ Alias
  
  recommendation_score?: number;
  recommendationScore?: number;  // ✅ Alias
  
  priority?: number;
  
  // ===== READING INFORMATION =====
  readTime: string;
  read_time?: string;  // ✅ Backend snake_case
  estimated_read_time?: string;  // ✅ Alternative
  
  complexity?: string;
  complexity_level?: string;  // ✅ Backend snake_case
  
  impact_level?: string;  // ✅ Backend snake_case
  
  // ===== MEDIA & ASSETS =====
  image?:string;
  scraped_image_url?: string;
  image_url?: string;  // ✅ ADD THIS - Article or category default image
  image_source?: string;  // ✅ ADD THIS - Article or category default image source
  thumbnail_url?: string;
  thumbnail?: string;  // ✅ Alias
  imageUrl?: string;  // ✅ Alias
  cover_image_url?: string;  // ✅ Alternative
  
  audio_url?: string;
  video_url?: string;
  
  duration?: number;  // In seconds for audio/video
  
  // ===== USER INTERACTION STATE =====
  is_bookmarked?: boolean;
  isBookmarked?: boolean;  // ✅ Alias
  
  is_liked?: boolean;
  isLiked?: boolean;  // ✅ Alias
  
  is_read?: boolean;
  isRead?: boolean;  // ✅ Alias
  
  is_viewed?: boolean;
  isViewed?: boolean;  // ✅ Alias
  
  // ===== ENGAGEMENT COUNTS =====
  likes_count?: number;
  likesCount?: number;  // ✅ Alias
  
  views_count?: number;
  viewsCount?: number;  // ✅ Alias
  
  shares_count?: number;
  sharesCount?: number;  // ✅ Alias
  
  bookmarks_count?: number;
  bookmarksCount?: number;  // ✅ Alias
  
  comments_count?: number;
  commentsCount?: number;  // ✅ Alias
  
  // ===== TOPICS & TAGS =====
  topics?: AITopic[];
  topic_names?: string[];
  topic_categories?: string[];
  tags?: string[];
  
  // ===== AUTHOR INFORMATION =====
  author?: string;
  author_name?: string;
  expert_verified?: boolean;
  
  // ===== POSITION & ORDERING =====
  position?: number;
  
  // ===== ADDITIONAL METADATA =====
  metadata?: Record<string, any>;
  sentiment?: 'positive' | 'negative' | 'neutral';
  credibility_score?: number;
  
  // ===== RELATED CONTENT =====
  related_articles?: number[];
  similar_articles?: number[];
}

// ============================================
// ARTICLE UTILITY FUNCTIONS
// ============================================

// ============================================
// ADDITIONAL API RESPONSE TYPES
// ============================================



/**
 * Swipeable feed response
 */
export interface SwipeableFeedResponse {
  articles: Article[];
  has_more: boolean;
  next_page: number;
  total_count: number;
  session_id?: string;
}

/**
 * Personalized feed response
 */
export interface PersonalizedFeedResponse {
  grouped_content?: Array<{
    category: string;
    items: Article[];
  }>;
  articles?: Article[];
  total_count?: number;
  has_more?: boolean;
}

/**
 * Bookmarks response
 */
export interface BookmarksResponse {
  articles: Article[];
  count: number;
}

/**
 * Interaction request
 */
export interface InteractionRequest {
  article_id: number | string;
  interaction_type: 'like' | 'bookmark' | 'share' | 'view';
  metadata?: Record<string, any>;
}

/**
 * Reading progress request
 */
export interface ReadingProgressRequest {
  article_id: number | string;
  read_percentage: number;
  time_spent_seconds: number;
  completed: boolean;
}

/**
 * Get source name with fallback chain
 */
export const getArticleSource = (article: Article): string => {
  return article.source_name || article.source || article.publisher || 'Unknown Source';
};

/**
 * Get category with fallback chain
 */
export const getArticleCategory = (article: Article): string => {
  return article.category_name || article.category || 'General';
};

/**
 * Get thumbnail with fallback chain
 */
export const getArticleThumbnail = (article: Article): string => {
  return (
    article.thumbnail_url ||
    article.thumbnail ||
    article.imageUrl ||
    article.cover_image_url ||
    '/default-thumbnail.jpg'
  );
};

/**
 * Get read time with fallback chain
 */
export const getArticleReadTime = (article: Article): string => {
  return (
    article.read_time ||
    article.readTime ||
    article.estimated_read_time ||
    '5 min'
  );
};

/**
 * Get summary with fallback chain
 */
export const getArticleSummary = (article: Article): string => {
  return (
    article.summary ||
    article.description ||
    article.content_summary ||
    'No summary available'
  );
};

/**
 * Get published date with fallback chain
 */
export const getArticlePublishedDate = (article: Article): string => {
  return (
    article.published_date ||
    article.time ||
    article.publishDate ||
    article.created_at ||
    new Date().toISOString()
  );
};

/**
 * Get content type with fallback chain and normalization
 */
export const getArticleContentType = (article: Article): 'BLOGS' | 'VIDEOS' | 'PODCASTS' => {
  const type = article.content_type_name || article.content_type || article.type || 'blog';
  const normalized = type.toLowerCase();
  
  if (normalized.includes('blog') || normalized.includes('article') || normalized.includes('post')) {
    return 'BLOGS';
  }
  if (normalized.includes('video') || normalized.includes('youtube') || normalized.includes('vimeo')) {
    return 'VIDEOS';
  }
  if (normalized.includes('podcast') || normalized.includes('audio') || normalized.includes('sound')) {
    return 'PODCASTS';
  }
  
  return 'BLOGS'; // Default fallback
};

/**
 * Get likes count with fallback
 */
export const getArticleLikesCount = (article: Article): number => {
  return article.likes_count || article.likesCount || 0;
};

/**
 * Get views count with fallback
 */
export const getArticleViewsCount = (article: Article): number => {
  return article.views_count || article.viewsCount || 0;
};

/**
 * Check if article is bookmarked
 */
export const isArticleBookmarked = (article: Article): boolean => {
  return article.is_bookmarked || article.isBookmarked || false;
};

/**
 * Check if article is liked
 */
export const isArticleLiked = (article: Article): boolean => {
  return article.is_liked || article.isLiked || false;
};

/**
 * Normalize article from API response (comprehensive mapping)
 */
export const normalizeArticle = (apiArticle: any,categoryDefault?: string): Article => {
  return {
    // Core fields
    id: apiArticle.id,
    title: apiArticle.title,
    url: apiArticle.url || apiArticle.sourceLink,
    
    // Content
    summary: apiArticle.summary || apiArticle.description,
    description: apiArticle.summary || apiArticle.description,
    content_summary: apiArticle.content_summary,
    content: apiArticle.content,
    
    // Source
    source: apiArticle.source || apiArticle.source_name || apiArticle.publisher || 'Unknown',
    source_name: apiArticle.source_name || apiArticle.source,
    publisher: apiArticle.publisher || apiArticle.source,
    
    // Time
    time: apiArticle.time || apiArticle.published_date || new Date().toISOString(),
    published_date: apiArticle.published_date || apiArticle.time,
    publishDate: apiArticle.published_date || apiArticle.time,
    
    // Category
    category: apiArticle.category || apiArticle.category_name,
    category_name: apiArticle.category_name || apiArticle.category,
    category_id: apiArticle.category_id,
    
    // Type
    type: apiArticle.type || apiArticle.content_type || 'blog',
    content_type: apiArticle.content_type || apiArticle.type,
    content_type_name: apiArticle.content_type_name || apiArticle.content_type,
    
    // Impact & Scores
    impact: apiArticle.impact || 'medium',
    significance: apiArticle.significance || apiArticle.significanceScore,
    significanceScore: apiArticle.significanceScore || apiArticle.significance || 5,
    significance_score: apiArticle.significance_score || apiArticle.significance,
    rankingScore: apiArticle.rankingScore || apiArticle.ranking_score,
    ranking_score: apiArticle.ranking_score || apiArticle.rankingScore,
    engagement_score: apiArticle.engagement_score || apiArticle.engagementScore,
    recommendation_score: apiArticle.recommendation_score || apiArticle.recommendationScore,
    
    // Reading info
    readTime: apiArticle.readTime || apiArticle.read_time || '5 min',
    read_time: apiArticle.read_time || apiArticle.readTime,
    complexity: apiArticle.complexity || apiArticle.complexity_level,
    impact_level: apiArticle.impact_level,
    
    // Media
    image_url: apiArticle.image_url || categoryDefault,
    image_source: apiArticle.image_source || (apiArticle.image_url ? 'scraped' : 'category_default'),
    thumbnail_url: apiArticle.thumbnail_url || apiArticle.thumbnail || apiArticle.imageUrl || apiArticle.image_url || categoryDefault,
    thumbnail: apiArticle.thumbnail_url || apiArticle.thumbnail || apiArticle.image_url || categoryDefault,
    imageUrl: apiArticle.imageUrl || apiArticle.thumbnail_url || apiArticle.image_url || categoryDefault,
    cover_image_url: apiArticle.cover_image_url || apiArticle.image_url || categoryDefault,
    audio_url: apiArticle.audio_url,
    video_url: apiArticle.video_url,
    duration: apiArticle.duration,
  
    
    // User interactions
    is_bookmarked: apiArticle.is_bookmarked || apiArticle.isBookmarked || false,
    isBookmarked: apiArticle.is_bookmarked || apiArticle.isBookmarked || false,
    is_liked: apiArticle.is_liked || apiArticle.isLiked || false,
    isLiked: apiArticle.is_liked || apiArticle.isLiked || false,
    is_read: apiArticle.is_read || apiArticle.isRead || false,
    is_viewed: apiArticle.is_viewed || apiArticle.isViewed || false,
    
    // Counts
    likes_count: apiArticle.likes_count || apiArticle.likesCount || 0,
    likesCount: apiArticle.likes_count || apiArticle.likesCount || 0,
    views_count: apiArticle.views_count || apiArticle.viewsCount || 0,
    viewsCount: apiArticle.views_count || apiArticle.viewsCount || 0,
    shares_count: apiArticle.shares_count || apiArticle.sharesCount || 0,
    sharesCount: apiArticle.shares_count || apiArticle.sharesCount || 0,
    bookmarks_count: apiArticle.bookmarks_count || apiArticle.bookmarksCount || 0,
    bookmarksCount: apiArticle.bookmarks_count || apiArticle.bookmarksCount || 0,
    comments_count: apiArticle.comments_count || apiArticle.commentsCount || 0,
    commentsCount: apiArticle.comments_count || apiArticle.commentsCount || 0,
    
    // Topics
    topics: apiArticle.topics,
    topic_names: apiArticle.topic_names,
    topic_categories: apiArticle.topic_categories,
    tags: apiArticle.tags,
    
    // Additional
    author: apiArticle.author || apiArticle.author_name,
    position: apiArticle.position,
    priority: apiArticle.priority,
    metadata: apiArticle.metadata,
    
    // Keep any additional properties
    ...apiArticle
  };
};

export const getArticleImage = (article: Article, categoryDefault?: string): string => {
  // Priority 1: Article's own image_url
  if (article.image_url) {
    console.log('📸 Using article image:', article.image_url);
    return article.image_url;
  }
  
  // Priority 2: Category default (passed as parameter)
  if (categoryDefault) {
    console.log('📸 Using category default:', categoryDefault);
    return categoryDefault;
  }
  
  // Priority 3: Other image fields
  if (article.thumbnail_url) {
    console.log('📸 Using thumbnail:', article.thumbnail_url);
    return article.thumbnail_url;
  }
  
  if (article.cover_image_url) {
    console.log('📸 Using cover image:', article.cover_image_url);
    return article.cover_image_url;
  }
  
  // Priority 4: Inline SVG fallback (NO network request)
  console.log('🎨 No image found, using SVG fallback');
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect width="600" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="45%25" font-family="system-ui,-apple-system,sans-serif" font-size="48" fill="%239ca3af" text-anchor="middle"%3E📰%3C/text%3E%3Ctext x="50%25" y="60%25" font-family="system-ui,-apple-system,sans-serif" font-size="18" fill="%236b7280" text-anchor="middle"%3ENo Image Available%3C/text%3E%3C/svg%3E';
};

/**
 * Check if image is from category default
 */
export const isImageFromCategory = (article: Article): boolean => {
  return article.image_source === 'category_default';
};

export interface Metrics {
  totalUpdates: number;
  highImpact: number;
  newResearch: number;
  industryMoves: number;
}

export interface TopStory {
  title: string;
  source: string;
  significanceScore: number;
  url: string;
  imageUrl?: string;
  summary?: string;
  content_summary?: string;
  // Enhanced topic information from database views
  topics?: AITopic[];
  topic_names?: string[];
  topic_categories?: string[];
}

export interface DigestResponse {
  summary: {
    keyPoints: string[];
    metrics: Metrics;
    personalized_greeting?: string;
    user_focus_topics?: string[];
    personalization_note?: string;
  };
  topStories: TopStory[];
  content: {
    blog: Article[];
    audio: Article[];
    video: Article[];
    events: Article[];
    learning: Article[];
    demos: Article[];
  };
  timestamp: string;
  badge: string;
  enhanced?: boolean;
  admin_features?: boolean;
  personalized?: boolean;
  personalization_meta?: {
    user_topics: string[];
    content_types_requested: string[];
    filtering_applied: boolean;
    timestamp: string;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  components: {
    database: boolean;
    scraper: boolean;
    processor: boolean;
    ai_sources: number;
    authentication?: boolean;
  };
  auto_update?: {
    in_progress: boolean;
    last_run: string;
    errors: string[];
    auto_update_enabled: boolean;
  };
  router_info?: {
    architecture: string;
    scalable: boolean;
    function_limit_solved: boolean;
    auth_integrated?: boolean;
  };
}

export interface Source {
  name: string;
  rss_url: string;
  website: string;
  enabled: boolean;
  priority: number;
  category: string;
  content_type?: string;
}

export interface SourcesResponse {
  sources: Source[];
  enabled_count: number;
  total_count: number;
  router_architecture?: string;
}

export interface ScrapeResponse {
  message: string;
  articles_found: number;
  articles_processed: number;
  sources: string[];
  total_sources: number;
  router_handled?: boolean;
}

// Authentication Types
export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture: string;
    verified_email: boolean;
  };
  expires_in: number;
  router_auth?: boolean;
}

export interface AuthVerifyResponse {
  valid: boolean;
  user?: any;
  expires?: number;
  router_verified?: boolean;
  error?: string;
}

// Complete API service using router pattern
export const apiService = {
  // ===============================
  // CORE CONTENT ENDPOINTS
  // ===============================

  // Get current digest
  getDigest: async (refresh?: boolean): Promise<DigestResponse> => {
    if (shouldClearDailyCache()) {
      clearDailyCache();
    }
    
    const params = refresh ? { refresh: '1' } : {};
    const cacheKey = getCacheKey('digest', params);
    
    if (!refresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('🚀 Using cached digest data');
        return cached;
      }
    }
    
    console.log('📡 Fetching digest via modular endpoint...');
    const data = await makeModularRequest('digest', 'GET', params, null, {}, true);
    setCachedData(cacheKey, data);
    return data;
  },

  // Get health status
  getHealth: async (): Promise<HealthResponse> => {
    return await makeModularRequest('health', 'GET');
  },

// FIND Lines 793-825 (getPaginatedContent method)
// REPLACE with this fixed version:

  getPaginatedContent: async (params: {
    page?: number;
    page_size?: number;
    content_type?: string;
    category_id?: number;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<{
    success: boolean;
    items: any[];
    meta: {
      current_page: number;
      page_size: number;
      total_items: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
      next_page: number | null;
      prev_page: number | null;
    };
    timestamp: string;
  }> => {
    debugLog('APIService.getPaginatedContent()', 'ENTER', params);
    
    console.log('📄 Fetching paginated content...', params);
    
    try {
      // Build query parameters
      const queryParams: any = {};
      if (params.page) queryParams.page = params.page;
      if (params.page_size) queryParams.page_size = params.page_size;
      if (params.content_type) queryParams.content_type = params.content_type;
      if (params.category_id) queryParams.category_id = params.category_id;
      if (params.sort_by) queryParams.sort_by = params.sort_by;
      if (params.sort_order) queryParams.sort_order = params.sort_order;

      // ✅ FIX: Use makeModularRequest (not makeRequest)
      const response = await makeModularRequest(
        'content/paginated',  // endpoint without leading slash
        'GET',                // method
        queryParams,          // params
        null,                 // data
        {},                   // headers
        true                  // useContentApi (90s timeout)
      );
      
      debugLog('APIService.getPaginatedContent()', 'EXIT', response);
      console.log(`✅ Loaded ${response.items?.length || 0} items (page ${response.meta?.current_page || 1})`);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch paginated content:', error);
      throw error;
    }
  },

  // FIND Lines 826-868 (getLandingContentPaginated method)
  // REPLACE with this fixed version:

  getLandingContentPaginated: async (page: number = 1, page_size: number = 10): Promise<{
    success: boolean;
    categories: Array<{
      id: number;
      name: string;
      description: string;
      content: {
        blogs: any[];
        podcasts: any[];
        videos: any[];
      };
    }>;
    meta: {
      page: number;
      page_size: number;
      total_blogs: number;
      total_podcasts: number;
      total_videos: number;
      has_next: boolean;
      total_pages: number;
    };
    timestamp: string;
  }> => {
    debugLog('APIService.getLandingContentPaginated()', 'ENTER', { page, page_size });
    
    console.log(`🏠 Fetching landing content (page ${page}, size ${page_size})...`);
    
    try {
      // ✅ FIX: Use makeModularRequest (not makeRequest)
      const response = await makeModularRequest(
        'landing-content',  // endpoint without leading slash
        'GET',              // method
        { page, page_size }, // params
        null,               // data
        {},                 // headers
        true                // useContentApi (90s timeout)
      );
      
      debugLog('APIService.getLandingContentPaginated()', 'EXIT', response);
      console.log(`✅ Loaded landing content: ${response.categories?.length || 0} categories`);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch landing content:', error);
      throw error;
    }
  },
  
  // Get sources configuration
  getSources: async (): Promise<SourcesResponse> => {
    return await makeModularRequest('sources', 'GET');
  },

  // ===============================
  // PRE-LOGIN LANDING PAGE ENDPOINTS
  // These endpoints call backend APIs that access database views
  // Frontend does not access database directly - all data via API
  // ===============================

  // Get breaking news alerts for pre-login users
  // Backend endpoint: GET /breaking-news (uses breaking_news_alerts DB view)
  getBreakingNewsAlerts: async (limit: number = 5): Promise<{
    articles: Array<{
      title: string;
      summary: string;
      url: string;
      source: string;
      significanceScore: number;
      published_date: string | null;
      content_type: string;
      category: string;
    }>;
    count: number;
    type: string;
  }> => {
    console.log('🚨 Fetching breaking news alerts for landing page...');
    return await makeModularRequest('breaking-news', 'GET', { limit });
  },

  // Get Generative AI category stories for pre-login users  
  // Backend endpoint: GET /generative-ai-content (uses articles table with AI filters)
  getGenerativeAIStories: async (limit: number = 3): Promise<{
    articles: Array<{
      title: string;
      summary: string;
      url: string;
      source: string;
      significanceScore: number;
      published_date: string | null;
      content_type: string;
      category: string;
    }>;
    count: number;
    type: string;
  }> => {
    console.log('🤖 Fetching Generative AI stories for landing page...');
    return await makeModularRequest('generative-ai-content', 'GET', { limit });
  },

  // Get AI Applications category stories for pre-login users  
  // Backend endpoint: GET /ai-applications-content (uses articles table with AI filters)
  getAIApplicationsStories: async (limit: number = 3): Promise<{
    articles: Array<{
      title: string;
      summary: string;
      url: string;
      source: string;
      significanceScore: number;
      published_date: string | null;
      content_type: string;
      category: string;
    }>;
    count: number;
    type: string;
  }> => {
    console.log('🏢 Fetching AI Applications stories for landing page...');
    return await makeModularRequest('ai-applications-content', 'GET', { limit });
  },

  // Get AI Startups category stories for pre-login users  
  // Backend endpoint: GET /ai-startups-content (uses articles table with AI filters)
  getAIStartupsStories: async (limit: number = 3): Promise<{
    articles: Array<{
      title: string;
      summary: string;
      url: string;
      source: string;
      significanceScore: number;
      published_date: string | null;
      content_type: string;
      category: string;
    }>;
    count: number;
    type: string;
  }> => {
    console.log('🚀 Fetching AI Startups stories for landing page...');
    return await makeModularRequest('ai-startups-content', 'GET', { limit });
  },

  // Get all landing page content organized by categories and content types
  // Backend endpoint: GET /landing-content (mobile dashboard style organization)
  getLandingContent: async (limitPerType: number = 100): Promise<{
    categories: Array<{
      id: number;
      name: string;
      priority: number;
      description: string;
      content: {
        blogs: Array<{
          title: string;
          summary: string;
          url: string;
          source: string;
          significanceScore: number;
          published_date: string | null;
          author: string;
          category: string;
          content_type: string;
        }>;
        podcasts: Array<{
          title: string;
          summary: string;
          url: string;
          source: string;
          significanceScore: number;
          published_date: string | null;
          author: string;
          category: string;
          content_type: string;
        }>;
        videos: Array<{
          title: string;
          summary: string;
          url: string;
          source: string;
          significanceScore: number;
          published_date: string | null;
          author: string;
          category: string;
          content_type: string;
        }>;
      };
    }>;
    total_categories: number;
  }> => {
    console.log('🏠 Fetching landing content for all categories and content types...');
    return await makeModularRequest('landing-content', 'GET', { limit_per_type: limitPerType });
  },

  

  // Get personalized digest - requires authentication
  getPersonalizedDigest: async (refresh?: boolean): Promise<DigestResponse> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required for personalized content');
    }
    
    if (shouldClearDailyCache()) {
      clearDailyCache();
    }
    
    const params = refresh ? { refresh: '1' } : {};
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    const cacheKey = getCacheKey('personalized-digest', params);
    
    if (!refresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('🚀 Using cached personalized digest data');
        return cached;
      }
    }
    
    console.log('📡 Fetching personalized digest via modular endpoint...');
    const data = await makeModularRequest('digest', 'GET', params, null, headers, true);
    setCachedData(cacheKey, data);
    return data;
  },

  // ===============================
  // SCRAPING & AUTO-UPDATE
  // ===============================

  // Trigger manual scraping
  triggerScrape: async (priorityOnly = false): Promise<ScrapeResponse> => {
    const params = priorityOnly ? { priority_only: 'true' } : {};
    return await makeModularRequest('scrape', 'GET', params);
  },

  // Trigger auto-update
  triggerAutoUpdate: async (): Promise<{ message: string; status: any }> => {
    return await makeModularRequest('auto-update', 'POST', {}, { action: 'trigger' });
  },

  // Get auto-update status
  getAutoUpdateStatus: async (): Promise<any> => {
    return await makeModularRequest('auto-update', 'GET');
  },

  // ===============================
  // CONTENT FILTERING & TYPES
  // ===============================

  // Get available content types
  getContentTypes: async (): Promise<any> => {
    return await makeModularRequest('content-types', 'GET');
  },

  // Get content by type (generic endpoint)
  getContentByType: async (contentType: string, refresh?: boolean): Promise<any> => {
    const params = refresh ? { refresh: 'true', content_type: contentType } : { content_type: contentType };
    return await makeModularRequest(`content/${contentType}`, 'GET', params, null, {}, true);
  },

  // Get user preferences - requires authentication
  getUserPreferences: async (): Promise<any> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required for user preferences');
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    return await makeModularRequest('api/v2/auth/profile', 'GET', {}, null, headers);
  },

  // ===============================
  // AUTHENTICATION ENDPOINTS
  // ===============================

  // Google OAuth authentication
  authenticateWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    console.log('🔐 Authenticating with Google via modular endpoint...');
    
    const data = {
      credential: idToken  // Backend expects 'credential' field, not 'id_token'
    };
    
    return await makeModularRequest('api/v2/auth/google', 'POST', {}, data);
  },

  // Verify authentication token
  verifyAuth: async (): Promise<AuthVerifyResponse> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return { valid: false, error: 'no_token' };
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    try {
      const result = await makeModularRequest('auth/profile', 'GET', {}, null, headers);
      return { valid: true, user: result };
    } catch (error) {
      console.log('🔐 Auth verification failed:', error);
      return { valid: false, error: 'invalid_token' };
    }
  },

  // Logout
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
      const result = await makeModularRequest('api/v2/auth/logout', 'POST', {}, {}, headers);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return result;
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { success: true, message: 'Logged out locally' };
    }
  },

  // Get available AI topics for authentication
  getAuthTopics: async (): Promise<any> => {
    return await makeModularRequest('topics', 'GET');
  },

  // ===============================
  // ADMIN ENDPOINTS
  // ===============================

  // Validate sources (admin only)
  validateSources: async (adminKey: string, options?: {
    contentType?: string;
    priority?: number;
    timeout?: number;
    maxConcurrent?: number;
  }): Promise<any> => {
    const headers = { 'X-Admin-Key': adminKey };
    const data = options || {};
    return await makeModularRequest('admin/validate-sources', 'POST', {}, data, headers);
  },

  // Validate single source (admin only)
  validateSingleSource: async (adminKey: string, sourceData: {
    name: string;
    rss_url: string;
    website?: string;
    content_type?: string;
  }): Promise<any> => {
    const headers = { 'X-Admin-Key': adminKey };
    return await makeModularRequest('admin/validate-single-source', 'POST', {}, sourceData, headers);
  },

  // Admin quick test
  quickTest: async (adminKey: string): Promise<any> => {
    const headers = { 'X-Admin-Key': adminKey };
    return await makeModularRequest('admin/quick-test', 'GET', {}, null, headers);
  },

  // Get validation status (admin only)
  getValidationStatus: async (adminKey: string): Promise<any> => {
    const headers = { 'X-Admin-Key': adminKey };
    return await makeModularRequest('admin/validation-status', 'GET', {}, null, headers);
  },

  // ===============================
  // TESTING & DEBUG
  // ===============================

  // Test database connection
  testDatabase: async (): Promise<any> => {
    return await makeModularRequest('health', 'GET');
  },

  // Generic modular method for future endpoints
  callEndpoint: async (
    endpoint: string, 
    method: string = 'GET', 
    params: any = {}, 
    requireAuth: boolean = false,
    customHeaders: any = {}
  ) => {
    let headers: any = {};
    
    if (requireAuth) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error(`Authentication required for ${endpoint}`);
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Merge custom headers (including admin API key)
    headers = { ...headers, ...customHeaders };
    
    return await makeModularRequest(endpoint, method, params, null, headers);
  },

  // Generic GET method (backward compatibility)
  get: async (endpoint: string, params?: any): Promise<any> => {
    // Remove any leading slashes and api prefixes
    const cleanEndpoint = endpoint.replace(/^\/?(api\/)?/, '');
    return await makeModularRequest(cleanEndpoint, 'GET', params);
  },

  // ===============================
  // PERSONALIZED FEED ENDPOINTS
  // ===============================

  // Get personalized feed with advanced filtering
  getPersonalizedFeed: async (filterRequest: {
    interests?: string[];
    content_types?: string[];
    publishers?: string[];
    time_filter?: string;
    search_query?: string;
    limit?: number;
  }): Promise<any> => {
    console.log('📱 Fetching personalized feed with filters:', filterRequest);
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return await makeModularRequest('api/v1/personalized-feed', 'POST', {}, {
      interests: filterRequest.interests || [],
      content_types: filterRequest.content_types || [],
      publishers: filterRequest.publishers || [],
      time_filter: filterRequest.time_filter || '',
      search_query: filterRequest.search_query || '',
      limit: filterRequest.limit || 50
    }, headers, true);
  },

  // Get available interests/topics
  getAvailableInterests: async (): Promise<{ categories: any[]; count: number }> => {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return await makeModularRequest('ai-topics', 'GET', {}, null, headers);
  },

  // Get available publishers  
  getAvailablePublishers: async (): Promise<{ publishers: Array<{id: number; name: string; category_id?: number; priority?: number}>; count: number }> => {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    // Call the actual API endpoint instead of returning empty
    try {
      return await makeModularRequest('api/v1/available-publishers', 'GET', {}, null, headers);
    } catch (error) {
      console.warn('Failed to fetch publishers, using fallback:', error);
      return { publishers: [], count: 0 };
    }
  },

  // Get available content types
  getAvailableContentTypes: async (): Promise<{ content_types: Array<{id: number; name: string; display_name: string; description?: string}>; count: number }> => {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      return await makeModularRequest('api/v1/available-content-types', 'GET', {}, null, headers);
    } catch (error) {
      console.warn('Failed to fetch content types, using fallback:', error);
      return { content_types: [], count: 0 };
    }
  },

  // Get available categories for onboarding
  getAvailableCategories: async (): Promise<{ categories: Array<{id: number; name: string; description?: string; priority?: number}>; count: number }> => {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      return await makeModularRequest('api/v1/available-categories', 'GET', {}, null, headers);
    } catch (error) {
      console.warn('Failed to fetch categories, using fallback:', error);
      return { categories: [], count: 0 };
    }
  },

  // Get publishers for specific category
  getPublishersByCategory: async (categoryId?: number): Promise<{ publishers: Array<{id: number; name: string; category_id?: number; priority?: number}>; count: number }> => {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const url = categoryId ? `api/v1/publishers?category_id=${categoryId}` : 'api/v1/available-publishers';
      return await makeModularRequest(url, 'GET', {}, null, headers);
    } catch (error) {
      console.warn('Failed to fetch publishers by category, using fallback:', error);
      return { publishers: [], count: 0 };
    }
  },

  // Update user preferences (enhanced)
  updateUserPreferences: async (preferences: any): Promise<any> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required for updating preferences');
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    return await makeModularRequest('api/v2/auth/preferences', 'PUT', {}, preferences, headers);
  },

  // Content counts endpoint
  getContentCounts: async (categoryId?: string, timeFilter: string = 'All Time'): Promise<any> => {
    debug.enter('getContentCounts', { categoryId, timeFilter });
    
    const params: any = {};
    if (categoryId && categoryId !== 'all') {
      params.category_id = categoryId;
    }
    if (timeFilter) {
      params.time_filter = timeFilter;
    }
    
    try {
      const response = await makeModularRequest('content-counts', 'GET', params, null, {}, true);
      debug.exit('getContentCounts', { 
        totalArticles: response.total_blogs || 0, 
        totalPodcasts: response.total_podcasts || 0, 
        totalVideos: response.total_videos || 0 
      });
      return response;
    } catch (error) {
      debug.error('getContentCounts', error);
      // Return fallback data on error
      return {
        total_blogs: 0,
        total_podcasts: 0,
        total_videos: 0,
        by_category: {}
      };
    }
  },

  // ===============================
  // SWIPEABLE FEED ENDPOINTS (NEW)
  // ===============================

  // Get swipeable feed with pagination
  getSwipeableFeed: async (params: {
  page?: number;
  limit?: number;
  feed_type?: 'personalized' | 'trending' | 'following';
  category?: string;
  content_type?: string;
  exclude_viewed?: boolean;
}): Promise<SwipeableFeedResponse> => {
  const token = localStorage.getItem('authToken');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  const response = await makeModularRequest('api/v1/interactions/swipeable-feed', 'GET', params, null, headers, true);
  
  // Normalize all articles
  if (response.articles) {
    response.articles = response.articles.map(normalizeArticle);
  }
  
  return response;
},

  // Save/bookmark article
  bookmarkArticle: async (articleId: string): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    return await makeModularRequest('api/v1/bookmark', 'POST', {}, { article_id: articleId }, headers);
  },

  // Remove bookmark
  removeBookmark: async (articleId: string): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    return await makeModularRequest('api/v1/bookmark', 'DELETE', { article_id: articleId }, null, headers);
  },

  // Get user's bookmarked articles
  getBookmarks: async (): Promise<{ articles: Article[]; count: number }> => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    return await makeModularRequest('api/v1/bookmarks', 'GET', {}, null, headers);
  },

  // Track article interaction (swipe left/right)
  trackInteraction: async (articleId: string, action: 'skip' | 'save' | 'read'): Promise<void> => {
    const token = localStorage.getItem('authToken');
    if (!token) return; // Optional: Allow anonymous tracking
    
    const headers = { 'Authorization': `Bearer ${token}` };
    await makeModularRequest('api/v1/track-interaction', 'POST', {}, {
      article_id: articleId,
      action,
      timestamp: new Date().toISOString()
    }, headers);
  },

  // Get user reading streak
  getReadingStreak: async (): Promise<{
    current_streak: number;
    longest_streak: number;
    total_days: number;
    last_read_date: string;
  }> => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    return await makeModularRequest('api/v1/reading-streak', 'GET', {}, null, headers);
  },

  // Get gamification stats
  getGamificationStats: async (): Promise<{
    points: number;
    level: number;
    badges: Array<{ id: string; name: string; earned_date: string }>;
    achievements: Array<{ id: string; name: string; progress: number; target: number }>;
  }> => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    return await makeModularRequest('api/v1/gamification', 'GET', {}, null, headers);
  },
    // Create article interaction (like, bookmark, share, view)
  createInteraction: async (request: InteractionRequest): Promise<{ success: boolean; message: string; points_earned?: number }> => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    return await makeModularRequest('api/v1/interactions/article', 'POST', {}, request, headers);
  },

  // Remove article interaction
  removeInteraction: async (articleId: number | string, interactionType: 'like' | 'bookmark' | 'share'): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    return await makeModularRequest('api/v1/interactions/article', 'DELETE', { 
      article_id: articleId, 
      interaction_type: interactionType 
    }, null, headers);
  },

  // Update reading progress
  updateReadingProgress: async (request: ReadingProgressRequest): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    return await makeModularRequest('api/v1/interactions/reading-progress', 'POST', {}, request, headers);
  },

  // Get article statistics
  getArticleStats: async (articleId: number | string): Promise<{
    article_id: number;
    views_count: number;
    likes_count: number;
    bookmarks_count: number;
    shares_count: number;
    comments_count: number;
    engagement_score: number;
    last_updated: string;
  }> => {
    return await makeModularRequest(`api/v1/interactions/article-stats/${articleId}`, 'GET');
  },
};



console.log('✅ API Service initialized with complete modular FastAPI architecture');
console.log('🔗 All endpoints now use direct modular FastAPI routing with APIRouter');
console.log('🔐 Authentication, admin, and content endpoints integrated via PostgreSQL backend');
console.log('📊 Content counts endpoint added for real-time statistics');

export default apiService;