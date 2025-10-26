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

export interface Article {
  title: string;
  description: string;
  content_summary?: string;
  source: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  type: 'blog' | 'audio' | 'video' | 'events' | 'learning' | 'demos';
  url: string;
  readTime: string;
  significanceScore: number;
  rankingScore?: number;
  priority?: number;
  thumbnail_url?: string;
  imageUrl?: string;
  audio_url?: string;
  duration?: number;
  // Enhanced topic information from database views
  topics?: AITopic[];
  topic_names?: string[];
  topic_categories?: string[];
}

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
  getLandingContent: async (limitPerType: number = 3): Promise<{
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
    return await makeModularRequest('api/v1/personalized-feed', 'POST', {}, filterRequest, headers, true);
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
  getContentCounts: async (categoryId?: string): Promise<any> => {
    debug.enter('getContentCounts', { categoryId });
    
    const params = categoryId ? { category_id: categoryId } : {};
    
    try {
      const response = await makeModularRequest('content-counts', 'GET', params, null, {}, true);
      debug.exit('getContentCounts', { totalArticles: response.total_articles, totalPodcasts: response.total_podcasts, totalVideos: response.total_videos });
      return response;
    } catch (error) {
      debug.error('getContentCounts', error);
      throw error;
    }
  }
};

console.log('✅ API Service initialized with complete modular FastAPI architecture');
console.log('🔗 All endpoints now use direct modular FastAPI routing with APIRouter');
console.log('🔐 Authentication, admin, and content endpoints integrated via PostgreSQL backend');
console.log('📊 Content counts endpoint added for real-time statistics');

export default apiService;