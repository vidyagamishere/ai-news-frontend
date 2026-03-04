// UPDATED API service - Modular FastAPI Architecture Integration  
// All API calls now go to direct FastAPI endpoints with modular routing
import axios from 'axios';
import type { Article } from '../types/article';
import DebugLogger from '../utils/debug';
import { supabaseImageService } from './supabaseImageService';
type SharePlatform = 'copy_link' | 'email' | 'facebook' | 'twitter' | 'linkedin' | 'whatsapp';

// Modular FastAPI backend URL - Direct endpoints with APIRouter
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'https://mindful-adventure-production-50fa.up.railway.app';

console.log('🏗️ API Service: Using Modular FastAPI Architecture with PostgreSQL');
console.log('🔗 Backend URL:', API_BASE_URL);
console.log('🚀 Direct endpoint calls (no router middleware)');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds for Google auth and complex operations
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ActionTypeId = {
  LIKE: 1,
  COMMENT: 2,
  BOOKMARK: 3,
  VIEW: 4,
  SHARE: 5,
  FOLLOW: 6,
  READ: 7
} as const;

// Create a separate instance for content requests with longer timeout
const contentApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds for digest processing with comprehensive database views
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate instance for admin operations with very long timeout
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // 10 minutes for scraping and other long-running admin operations
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
  useContentApi: boolean = false,
  apiType: 'default' | 'content' | 'admin' = 'default'
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
    // Select API instance based on apiType (with backwards compatibility for useContentApi)
    let apiInstance = api;
    if (apiType === 'admin') {
      apiInstance = adminApi;
    } else if (apiType === 'content' || useContentApi) {
      apiInstance = contentApi;
    }

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

    // Add query parameters for GET and DELETE requests
    if ((method === 'GET' || method === 'DELETE') && Object.keys(params).length > 0) {
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

// Helper function to assign random Supabase images to articles by category
const mapArticleImages = async (article: any): Promise<any> => {
  if (!article) return article;

  // Use category_label from backend (ai_categories_master.category_label) if available
  // This directly matches Supabase folder names (e.g., "generative_ai", "ai_startups")
  // Otherwise fallback to category name conversion
  const categoryLabel = article.category_label || article.category || article.category_name || article.topic_category || 'General';

  // Fetch random image from Supabase for this category
  let supabaseImage: string | null = null;
  if (supabaseImageService.isEnabled()) {
    supabaseImage = await supabaseImageService.getRandomImageForCategory(categoryLabel);
  } else {
    console.warn('⚠️ Supabase service is disabled');
  }

  // Use Supabase image if available, otherwise use placeholder
  const finalImage = supabaseImage || article.image || '/placeholder-article.jpg';

  return {
    ...article,
    image: finalImage,  // Primary field with Supabase image
    imageUrl: finalImage,  // Legacy camelCase
    thumbnail_url: finalImage,  // Thumbnail variant
    category_label: categoryLabel  // Ensure category_label is preserved
  };
};

// Batch image mapping for better performance
const mapArticleImagesSync = (articles: any[]): any[] => {
  // For synchronous operations, we'll use a simplified version
  return articles.map(article => ({
    ...article,
    image: article.image || '/placeholder-article.jpg',
    imageUrl: article.image || '/placeholder-article.jpg',
    thumbnail_url: article.image || '/placeholder-article.jpg'
  }));
};

// Async batch mapping for articles with Supabase images
const mapArticleImagesAsync = async (articles: any[]): Promise<any[]> => {
  if (!supabaseImageService.isEnabled()) {
    return mapArticleImagesSync(articles);
  }

  // Map all articles with images in parallel
  return Promise.all(articles.map(article => mapArticleImages(article)));
};

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

// Re-export types from central location (remove AITopic since it's defined above)
export type { Article, Category, LandingContent } from '../types/article';

// Comment interface
export interface Comment {
  id: number;
  content: string;
  user_id: string;
  article_id: number;
  parent_comment_id?: number;
  created_at: string;
  updated_at?: string;
  replies?: Comment[];
  username?: string;
  user_avatar?: string;
}

// User Stats interface
export interface UserStats {
  total_points: number;
  current_level: number;
  level_name: string;
  points_to_next_level: number;
  actions_breakdown: {
    action_type: string;
    count: number;
    points: number;
  }[];
  recent_activities: any[];
}

// Complete API service using router pattern
export class ApiService {
  // ===============================
  // CORE CONTENT ENDPOINTS
  // ===============================

  // Get current digest
  async getDigest(refresh?: boolean): Promise<DigestResponse> {
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

    // Map Supabase images for all articles in the digest
    if (data.topStories) {
      data.topStories = await mapArticleImagesAsync(data.topStories);
    }
    if (data.content) {
      for (const key of Object.keys(data.content)) {
        if (Array.isArray(data.content[key])) {
          data.content[key] = await mapArticleImagesAsync(data.content[key]);
        }
      }
    }

    setCachedData(cacheKey, data);
    return data;
  }

  // Get health status
  async getHealth(): Promise<HealthResponse> {
    return await makeModularRequest('health', 'GET');
  }

  // Get sources configuration
  async getSources(): Promise<SourcesResponse> {
    return await makeModularRequest('sources', 'GET');
  }

  // ===============================
  // PRE-LOGIN LANDING PAGE ENDPOINTS
  // ===============================

  async getBreakingNewsAlerts(limit: number = 5): Promise<{
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
  }> {
    console.log('🚨 Fetching breaking news alerts for landing page...');
    const data = await makeModularRequest('breaking-news', 'GET', { limit });

    // Map Supabase images for articles
    if (data.articles && Array.isArray(data.articles)) {
      data.articles = await mapArticleImagesAsync(data.articles);
    }

    return data;
  }

  async getGenerativeAIStories(limit: number = 3): Promise<{
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
  }> {
    console.log('🤖 Fetching Generative AI stories for landing page...');
    const data = await makeModularRequest('generative-ai-content', 'GET', { limit });

    // Map Supabase images for articles
    if (data.articles && Array.isArray(data.articles)) {
      data.articles = await mapArticleImagesAsync(data.articles);
    }

    return data;
  }

  async getAIApplicationsStories(limit: number = 3): Promise<{
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
  }> {
    console.log('🏢 Fetching AI Applications stories for landing page...');
    const data = await makeModularRequest('ai-applications-content', 'GET', { limit });

    // Map Supabase images for articles
    if (data.articles && Array.isArray(data.articles)) {
      data.articles = await mapArticleImagesAsync(data.articles);
    }

    return data;
  }

  async getAIStartupsStories(limit: number = 3): Promise<{
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
  }> {
    console.log('🚀 Fetching AI Startups stories for landing page...');
    const data = await makeModularRequest('ai-startups-content', 'GET', { limit });

    // Map Supabase images for articles
    if (data.articles && Array.isArray(data.articles)) {
      data.articles = await mapArticleImagesAsync(data.articles);
    }

    return data;
  }

  async getLandingContent(limitPerType: number = 10, daysFilter: number = 7, categoryId?: number, contentTypeId?: number): Promise<{
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
  }> {
    console.log('🏠 Fetching landing content - Days:', daysFilter, 'Category ID:', categoryId, 'Content Type ID:', contentTypeId);
    const params: any = { limit_per_type: limitPerType, days_filter: daysFilter };
    if (categoryId !== undefined) params.category_id = categoryId;
    if (contentTypeId !== undefined) params.content_type_id = contentTypeId;
    console.log('📤 API Request params:', params);
    const data = await makeModularRequest('landing-content', 'GET', params);

    // Map Supabase images for all content in all categories
    if (data.categories && Array.isArray(data.categories)) {
      for (const category of data.categories) {
        if (category.content?.blogs) {
          category.content.blogs = await mapArticleImagesAsync(category.content.blogs);
        }
        if (category.content?.podcasts) {
          category.content.podcasts = await mapArticleImagesAsync(category.content.podcasts);
        }
        if (category.content?.videos) {
          category.content.videos = await mapArticleImagesAsync(category.content.videos);
        }
      }
    }

    return data;
  }

  async getPosts(limit: number = 50, categoryId?: number, daysFilter: number = 3650): Promise<{
    posts: Array<{
      id: number;
      title: string;
      summary: string;
      url: string;
      source: string;
      significance_score: number;
      published_date: string | null;
      author: string;
      keywords: string;
      category: string;
      category_label: string;
      content_type: string;
    }>;
    count: number;
  }> {
    const params: any = { limit, days_filter: daysFilter };
    if (categoryId !== undefined) params.category_id = categoryId;
    return makeModularRequest('posts', 'GET', params);
  }

  async createPost(
    data: {
      title: string;
      html_content: string;
      author?: string;
      category_id?: number;
      significance_score?: number;
      url?: string;
      source?: string;
      keywords?: string;
    }
  ): Promise<{ success: boolean; id: number; title: string; message: string }> {
    const token = localStorage.getItem('authToken');
    return makeModularRequest('posts', 'POST', {}, data, token ? { 'Authorization': `Bearer ${token}` } : {});
  }

  async updatePost(
    id: number,
    data: {
      title: string;
      html_content: string;
      author?: string;
      category_id?: number;
      significance_score?: number;
      url?: string;
      source?: string;
      keywords?: string;
    }
  ): Promise<{ success: boolean; id: number; message: string }> {
    const token = localStorage.getItem('authToken');
    return makeModularRequest(`posts/${id}`, 'PUT', {}, data, token ? { 'Authorization': `Bearer ${token}` } : {});
  }

  async deletePost(id: number): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('authToken');
    return makeModularRequest(`posts/${id}`, 'DELETE', {}, undefined, token ? { 'Authorization': `Bearer ${token}` } : {});
  }

  async searchContent(
    query: string,
    categoryId?: number,
    daysFilter: number = 7,
    limitPerType: number = 20
  ): Promise<{
    query: string;
    category: string;
    category_id: number | null;
    days_filter: number;
    results: {
      blogs: Array<any>;
      podcasts: Array<any>;
      videos: Array<any>;
    };
    counts: {
      blogs: number;
      podcasts: number;
      videos: number;
      total: number;
    };
    metadata: {
      search_type: string;
      filters_applied: {
        category: string;
        time_range_days: number;
      };
    };
  }> {
    console.log('🔍 Searching content - Query:', query, 'Category ID:', categoryId, 'Days:', daysFilter);
    const params: any = {
      query,
      days_filter: daysFilter,
      limit_per_type: limitPerType
    };
    if (categoryId !== undefined) params.category_id = categoryId;

    console.log('📤 Search API Request params:', params);
    const data = await makeModularRequest('search-content', 'GET', params);

    // Map Supabase images for all search results
    if (data.results?.blogs) {
      data.results.blogs = await mapArticleImagesAsync(data.results.blogs);
    }
    if (data.results?.podcasts) {
      data.results.podcasts = await mapArticleImagesAsync(data.results.podcasts);
    }
    if (data.results?.videos) {
      data.results.videos = await mapArticleImagesAsync(data.results.videos);
    }

    console.log('✅ Search complete - Total results:', data.counts.total);
    return data;
  }

  async getPersonalizedDigest(refresh?: boolean): Promise<DigestResponse> {
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

    // Map Supabase images for all articles in the personalized digest
    if (data.topStories) {
      data.topStories = await mapArticleImagesAsync(data.topStories);
    }
    if (data.content) {
      for (const key of Object.keys(data.content)) {
        if (Array.isArray(data.content[key])) {
          data.content[key] = await mapArticleImagesAsync(data.content[key]);
        }
      }
    }

    setCachedData(cacheKey, data);
    return data;
  }

  // ===============================
  // SCRAPING & AUTO-UPDATE
  // ===============================

  async triggerScrape(priorityOnly = false): Promise<ScrapeResponse> {
    const params = priorityOnly ? { priority_only: 'true' } : {};
    return await makeModularRequest('scrape', 'GET', params);
  }

  async triggerAutoUpdate(): Promise<{ message: string; status: any }> {
    return await makeModularRequest('auto-update', 'POST', {}, { action: 'trigger' });
  }

  async getAutoUpdateStatus(): Promise<any> {
    return await makeModularRequest('auto-update', 'GET');
  }

  // ===============================
  // CONTENT FILTERING & TYPES
  // ===============================

  async getContentTypes(): Promise<any> {
    return await makeModularRequest('content-types', 'GET');
  }

  async getContentByType(contentType: string, refresh?: boolean): Promise<any> {
    const params = refresh ? { refresh: 'true', content_type: contentType } : { content_type: contentType };
    const data = await makeModularRequest(`content/${contentType}`, 'GET', params, null, {}, true);

    // Map Supabase images if response contains articles array
    if (data.articles && Array.isArray(data.articles)) {
      data.articles = await mapArticleImagesAsync(data.articles);
    }

    return data;
  }

  async getUserPreferences(): Promise<any> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required for user preferences');
    }

    const headers = {
      'Authorization': `Bearer ${token}`
    };
    return await makeModularRequest('api/v2/auth/profile', 'GET', {}, null, headers);
  }

  // ===============================
  // AUTHENTICATION ENDPOINTS
  // ===============================

  async authenticateWithGoogle(idToken: string): Promise<AuthResponse> {
    console.log('🔐 Authenticating with Google via modular endpoint...');

    const data = {
      credential: idToken
    };

    return await makeModularRequest('api/v2/auth/google', 'POST', {}, data);
  }

  async verifyAuth(): Promise<AuthVerifyResponse> {
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
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const result = await makeModularRequest('api/v2/auth/logout', 'POST', {}, {}, headers);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return result;
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { success: true, message: 'Logged out locally' };
    }
  }

  async getAuthTopics(): Promise<any> {
    return await makeModularRequest('topics', 'GET');
  }

  // ===============================
  // ADMIN ENDPOINTS
  // ===============================

  async validateSources(adminKey: string, options?: {
    contentType?: string;
    priority?: number;
    timeout?: number;
    maxConcurrent?: number;
  }): Promise<any> {
    const headers = { 'X-Admin-Key': adminKey };
    const data = options || {};
    return await makeModularRequest('admin/validate-sources', 'POST', {}, data, headers);
  }

  async validateSingleSource(adminKey: string, sourceData: {
    name: string;
    rss_url: string;
    website?: string;
    content_type?: string;
  }): Promise<any> {
    const headers = { 'X-Admin-Key': adminKey };
    return await makeModularRequest('admin/validate-single-source', 'POST', {}, sourceData, headers);
  }

  async quickTest(adminKey: string): Promise<any> {
    const headers = { 'X-Admin-Key': adminKey };
    return await makeModularRequest('admin/quick-test', 'GET', {}, null, headers);
  }

  async getValidationStatus(adminKey: string): Promise<any> {
    const headers = { 'X-Admin-Key': adminKey };
    return await makeModularRequest('admin/validation-status', 'GET', {}, null, headers);
  }
  // ============= ENHANCED ADMIN ENDPOINTS =============

  async getFilteredArticles(params: {
    page?: number;
    page_size?: number;
    category_id?: number;
    publisher_id?: number;
    llm_model?: string;
    start_date?: string;
    end_date?: string;
    search_query?: string;
  }, adminApiKey: string) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const headers = { 'X-Admin-API-Key': adminApiKey };
    return await makeModularRequest(
      `admin/articles/filtered?${queryParams.toString()}`,
      'GET',
      {},
      null,
      headers
    );
  }

  async deleteArticle(articleId: number, adminApiKey: string) {
    const headers = { 'X-Admin-API-Key': adminApiKey };
    return await makeModularRequest(
      `admin/articles/${articleId}`,
      'DELETE',
      {},
      null,
      headers
    );
  }

  async bulkDeleteArticles(articleIds: number[], adminApiKey: string) {
    const headers = { 'X-Admin-API-Key': adminApiKey };
    return await makeModularRequest(
      'admin/articles/bulk-delete',
      'POST',
      {},
      { article_ids: articleIds },
      headers
    );
  }

  async getSourcesByType(contentType: string, adminApiKey: string) {
    const headers = { 'X-Admin-API-Key': adminApiKey };
    return await makeModularRequest(
      `admin/sources/by-type?content_type=${contentType}`,
      'GET',
      {},
      null,
      headers
    );
  }

  async bulkUpdateSources(updates: Array<{
    id: number;
    is_active?: boolean;
    scraping_frequency_hours?: number;
    llm_model?: string;
    priority?: number;
  }>, adminApiKey: string) {
    const headers = { 'X-Admin-API-Key': adminApiKey };
    return await makeModularRequest(
      'admin/sources/bulk-update',
      'POST',
      {},
      { updates },
      headers
    );
  }

  async bulkDeleteSources(sourceIds: number[], contentType: string, adminApiKey: string) {
    const headers = { 'X-Admin-API-Key': adminApiKey };
    return await makeModularRequest(
      'admin/sources/bulk-delete',
      'POST',
      {},
      { source_ids: sourceIds, content_type: contentType },
      headers
    );
  }

  async getAllCategories(adminApiKey: string) {
    console.log('🔵 [APIService] getAllCategories() START', { hasAdminApiKey: !!adminApiKey });
    const headers = { 'X-Admin-API-Key': adminApiKey };
    try {
      const result = await makeModularRequest(
        'admin/categories/all',
        'GET',
        {},
        null,
        headers
      );
      console.log('🟢 [APIService] getAllCategories() SUCCESS', {
        categoriesCount: result?.categories?.length || 0,
        result
      });
      return result;
    } catch (error) {
      console.error('🔴 [APIService] getAllCategories() ERROR', error);
      throw error;
    }
  }

  async getActiveScrapingJobs(adminApiKey: string) {
    console.log('🔵 [APIService] getActiveScrapingJobs() START', { hasAdminApiKey: !!adminApiKey });
    const headers = { 'X-Admin-API-Key': adminApiKey };
    try {
      const result = await makeModularRequest(
        'admin/scraping/active-jobs',
        'GET',
        {},
        null,
        headers
      );
      console.log('🟢 [APIService] getActiveScrapingJobs() SUCCESS', {
        activeJobsCount: result?.active_jobs?.length || 0,
        result
      });
      return result;
    } catch (error) {
      console.error('🔴 [APIService] getActiveScrapingJobs() ERROR', error);
      throw error;
    }
  }

  async searchTavily(params: {
    query: string;
    max_results?: number;
    enrich_with_llm?: boolean;
    llm_model?: string;
  }, adminApiKey: string) {
    const headers = { 'X-Admin-API-Key': adminApiKey };

    // Build query string manually since FastAPI expects Query parameters
    const queryString = new URLSearchParams({
      query: params.query,
      max_results: String(params.max_results || 10),
      enrich_with_llm: String(params.enrich_with_llm || false),
      llm_model: params.llm_model || 'gemini'
    }).toString();

    // POST with empty body but query params in URL
    return await makeModularRequest(
      `admin/tavily/search?${queryString}`,
      'POST',
      {},  // Empty params
      {},  // Empty body
      headers
    );
  }

  async getTavilySearchHistory(page: number = 1, pageSize: number = 20, adminApiKey: string) {
    const headers = { 'X-Admin-API-Key': adminApiKey };
    return await makeModularRequest(
      `admin/tavily/searches?page=${page}&page_size=${pageSize}`,
      'GET',
      {},
      null,
      headers
    );
  }

  // ✅ FIXED: Correct endpoint path and better error handling
  async getTrendingKeywords(days: number = 1, limit: number = 10): Promise<{
    trending_keywords: Array<{
      id: string;
      label: string;
      count: number;
    }>;
    timestamp: string;
    days: number;
    limit: number;
    count: number;
  }> {
    console.log(`🔥 Fetching trending keywords (last ${days} day(s), limit: ${limit})`);

    try {
      const response = await makeModularRequest(
        'api/v1/trending-keywords',  // ✅ FIXED: Correct endpoint path
        'GET',
        { days, limit },
        null,
        {},
        false,
        'default'
      );

      console.log(`✅ Trending keywords fetched: ${response.trending_keywords?.length || 0} keywords`);

      // ✅ Validate response structure
      if (!response.trending_keywords || !Array.isArray(response.trending_keywords)) {
        console.warn('⚠️ Invalid response structure from trending keywords API');
        return {
          trending_keywords: [],
          timestamp: new Date().toISOString(),
          days,
          limit,
          count: 0
        };
      }

      return {
        trending_keywords: response.trending_keywords,
        timestamp: response.timestamp || new Date().toISOString(),
        days: response.days || days,
        limit: response.limit || limit,
        count: response.count || response.trending_keywords.length
      };
    } catch (error) {
      console.error('❌ Failed to fetch trending keywords:', error);
      // Return empty array on error instead of throwing
      return {
        trending_keywords: [],
        timestamp: new Date().toISOString(),
        days,
        limit,
        count: 0
      };
    }
  }

  // ===============================
  // TESTING & DEBUG
  // ===============================

  async testDatabase(): Promise<any> {
    return await makeModularRequest('health', 'GET');
  }

  async callEndpoint(
    endpoint: string,
    method: string = 'GET',
    params: any = {},
    requireAuth: boolean = false,
    customHeaders: any = {}
  ) {
    let headers: any = { ...customHeaders };

    if (requireAuth) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error(`Authentication required for ${endpoint}`);
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Use admin API instance for scraping operations (long timeout)
    const apiType = endpoint.includes('admin/scrape') || endpoint.includes('admin/tavily') ? 'admin' : 'default';

    return await makeModularRequest(endpoint, method, params, null, headers, false, apiType);
  }

  async get(endpoint: string, params?: any): Promise<any> {
    const cleanEndpoint = endpoint.replace(/^\/?(api\/)?/, '');
    return await makeModularRequest(cleanEndpoint, 'GET', params);
  }

  // ===============================
  // PERSONALIZED FEED ENDPOINTS
  // ===============================

  async getPersonalizedFeed(filterRequest: {
    interests?: string[];
    content_types?: string[];
    publishers?: string[];
    time_filter?: string;
    search_query?: string;
    limit?: number;
  }): Promise<any> {
    console.log('📱 Fetching personalized feed with filters:', filterRequest);
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const data = await makeModularRequest('api/v1/personalized-feed', 'POST', {}, {
      interests: filterRequest.interests || [],
      content_types: filterRequest.content_types || [],
      publishers: filterRequest.publishers || [],
      time_filter: filterRequest.time_filter || '',
      search_query: filterRequest.search_query || '',
      limit: filterRequest.limit || 50
    }, headers, true);

    // Map Supabase images for articles in grouped content
    if (data.grouped_content && Array.isArray(data.grouped_content)) {
      for (const group of data.grouped_content) {
        if (group.items && Array.isArray(group.items)) {
          group.items = await mapArticleImagesAsync(group.items);
        }
      }
    }

    return data;
  }

  async getAvailableInterests(): Promise<{ categories: any[]; count: number }> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return await makeModularRequest('ai-topics', 'GET', {}, null, headers);
  }

  async getAvailablePublishers(): Promise<{ publishers: Array<{ id: number; name: string; category_id?: number; priority?: number }>; count: number }> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      return await makeModularRequest('api/v1/available-publishers', 'GET', {}, null, headers);
    } catch (error) {
      console.warn('Failed to fetch publishers, using fallback:', error);
      return { publishers: [], count: 0 };
    }
  }

  async getAvailableContentTypes(): Promise<{ content_types: Array<{ id: number; name: string; display_name: string; description?: string }>; count: number }> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      return await makeModularRequest('api/v1/available-content-types', 'GET', {}, null, headers);
    } catch (error) {
      console.warn('Failed to fetch content types, using fallback:', error);
      return { content_types: [], count: 0 };
    }
  }

  async getAvailableCategories(): Promise<{ categories: Array<{ id: number; name: string; description?: string; priority?: number; count?: number }>; count: number }> {
    console.log('📂 Fetching available categories...');
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const response = await makeModularRequest('api/v1/available-categories', 'GET', {}, null, headers);
      console.log('✅ Categories fetched successfully:', response);

      // Ensure response has expected structure
      if (!response.categories || !Array.isArray(response.categories)) {
        console.warn('⚠️ Invalid categories response structure:', response);
        return { categories: [], count: 0 };
      }

      return {
        categories: response.categories,
        count: response.count || response.categories.length
      };
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      return { categories: [], count: 0 };
    }
  }

  async getPublishersByCategory(categoryId?: number): Promise<{ publishers: Array<{ id: number; name: string; category_id?: number; priority?: number }>; count: number }> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const url = categoryId ? `api/v1/publishers?category_id=${categoryId}` : 'api/v1/available-publishers';
      return await makeModularRequest(url, 'GET', {}, null, headers);
    } catch (error) {
      console.warn('Failed to fetch publishers by category, using fallback:', error);
      return { publishers: [], count: 0 };
    }
  }

  async updateUserPreferences(preferences: any): Promise<any> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required for updating preferences');
    }

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    return await makeModularRequest('api/v2/auth/preferences', 'PUT', {}, preferences, headers);
  }

  async getContentCounts(categoryId: string = 'all', timeFilter: string = 'all'): Promise<any> {
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
      return {
        total_blogs: 0,
        total_podcasts: 0,
        total_videos: 0,
        by_category: {}
      };
    }
  }

  // ===============================
  // BOOKMARKS & INTERACTIONS
  // ===============================

  async getBookmarks(): Promise<{ articles: Article[] }> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const response = await makeModularRequest('api/v1/interactions/bookmarks', 'GET', {}, null, headers);

      // Map Supabase images for bookmarked articles
      if (response.articles && Array.isArray(response.articles)) {
        response.articles = await mapArticleImagesAsync(response.articles);
      }

      return response;
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      return { articles: [] };
    }
  }

  async bookmarkArticle(articleId: string): Promise<void> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      await makeModularRequest(`bookmarks/${articleId}`, 'POST', {}, null, headers);
    } catch (error) {
      console.error('Failed to bookmark article:', error);
      throw error;
    }
  }

  async removeBookmark(articleId: string): Promise<void> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      await makeModularRequest(`bookmarks/${articleId}`, 'DELETE', {}, null, headers);
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      throw error;
    }
  }

  async trackInteraction(articleId: string, interactionType: string): Promise<void> {
    const typeMap: Record<string, number> = {
      'view': ActionTypeId.VIEW,
      'read': ActionTypeId.READ, // or READ if you have it
      'like': ActionTypeId.LIKE,
      'save': ActionTypeId.BOOKMARK,
      'share': ActionTypeId.SHARE,
      'comment': ActionTypeId.COMMENT,
    };

    const actionTypeId = typeMap[interactionType.toLowerCase()];
    if (!actionTypeId) {
      console.warn(`Unknown interaction type: ${interactionType}`);
      return;
    }

    await this.createInteraction({
      article_id: articleId,
      action_type_id: actionTypeId
    });
  }

  // ✅ UPDATED: Create interaction method
  async createInteraction(data: {
    article_id: number | string;
    action_type_id: number;  // Changed from interaction_type string
    metadata?: any;
  }): Promise<void> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    await makeModularRequest('api/v1/interactions/article', 'POST', {}, data, headers);
  }

  // ✅ UPDATED: Remove interaction method
  async removeInteraction(articleId: number | string, actionTypeId: number): Promise<void> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    await makeModularRequest(
      'api/v1/interactions/article',
      'DELETE',
      { article_id: articleId, action_type_id: actionTypeId },  // Changed param name
      null,
      headers
    );
  }

  // ✅ UPDATED: Track share
  async trackShare(articleId: number, platform: SharePlatform): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required');
    }

    await makeModularRequest(
      'api/v1/interactions/share/track',
      'POST',
      {},
      { article_id: articleId, platform },
      { 'Authorization': `Bearer ${token}` }
    );
  }

  async getSwipeableFeed(params: {
    category?: string;
    content_type?: string;
    time_filter?: string;
    limit?: number;
    offset?: number;
    page?: number;
    feed_type?: string;  // ✅ ADD THIS
    exclude_viewed?: boolean;  // ✅ ADD THIS
  }): Promise<{ articles: Article[]; has_more: boolean; total: number }> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const response = await makeModularRequest('feed/swipeable', 'GET', params, null, headers, true);

      // Map Supabase images for articles
      if (response.articles && Array.isArray(response.articles)) {
        response.articles = await mapArticleImagesAsync(response.articles);
      }

      return response;
    } catch (error) {
      console.error('Failed to fetch swipeable feed:', error);
      return { articles: [], has_more: false, total: 0 };
    }
  }

  async getPaginatedContent(params: {
    category?: string;
    content_type?: string;
    time_filter?: string;
    limit?: number;
    offset?: number;
    page?: number;
    page_size?: number;  // ✅ ADD THIS
    sort_by?: string;  // ✅ ADD THIS
    sort_order?: string;  // ✅ ADD THIS
  }): Promise<{
    success?: boolean;  // ✅ ADD THIS
    articles: Article[];
    items?: Article[];  // ✅ ADD THIS
    meta?: any;  // ✅ ADD THIS
    has_more: boolean;
    total: number;
  }> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const response = await makeModularRequest('content/paginated', 'GET', params, null, headers, true);

      // Map Supabase images for articles
      if (response.articles && Array.isArray(response.articles)) {
        response.articles = await mapArticleImagesAsync(response.articles);
      }
      if (response.items && Array.isArray(response.items)) {
        response.items = await mapArticleImagesAsync(response.items);
      }

      return response;
    } catch (error) {
      console.error('Failed to fetch paginated content:', error);
      return { articles: [], has_more: false, total: 0 };
    }
  }
  // Comment-related methods
  async getArticleComments(articleId: number): Promise<Comment[]> {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.get(`/api/v1/social/comments/article/${articleId}`, {
        headers
      });
      return response.data.comments || [];
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  }

  async createComment(articleId: number, content: string, parentCommentId?: number): Promise<Comment> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post('/api/v1/social/comments', {
      article_id: articleId,
      content,
      parent_comment_id: parentCommentId
    }, {
      headers
    });
    return response.data;
  }

  async updateComment(commentId: number, content: string): Promise<Comment> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.put(`/api/v1/social/comments/${commentId}`, {
      content
    }, {
      headers
    });
    return response.data;
  }

  async deleteComment(commentId: number): Promise<void> {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await api.delete(`/api/v1/social/comments/${commentId}`, {
      headers
    });
  }

  // Reading stats
  async getUserReadingStats(): Promise<{
    total_articles_read: number;
    total_minutes_read: number;
    avg_articles_per_active_day: number;
    active_days_last_30: number;
    daily_stats: Array<{ date: string; day_label: string; articles_read: number; minutes_read: number }>;
    weekly_stats: Array<{ week_start: string; week_label: string; articles_read: number; minutes_read: number }>;
  }> {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.get('/api/v1/interactions/user/reading-stats', { headers });
      return response.data;
    } catch {
      return { total_articles_read: 0, total_minutes_read: 0, avg_articles_per_active_day: 0, active_days_last_30: 0, daily_stats: [], weekly_stats: [] };
    }
  }

  // User stats method
  async getUserStats(): Promise<UserStats> {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.get('/api/v1/interactions/user/stats', {
        headers
      });
      const d = response.data;
      // Backend returns nested { points: {...}, streak: {...}, actions_breakdown: [...] }
      // Normalize to flat UserStats shape
      const points = d.points || {};
      const totalPoints = points.total_points ?? d.total_points ?? 0;
      const level = points.level ?? d.current_level ?? 1;
      const nextThreshold = points.next_level_threshold ?? d.points_to_next_level ?? 100;
      return {
        total_points: totalPoints,
        current_level: level,
        level_name: d.level_name ?? `Level ${level}`,
        points_to_next_level: nextThreshold,
        actions_breakdown: (d.actions_breakdown || []).map((a: any) => ({
          action_type: a.action_type,
          count: a.count ?? 0,
          points: a.total_points ?? a.points ?? 0,
        })),
        recent_activities: d.recent_activities || [],
      };
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return {
        total_points: 0,
        current_level: 1,
        level_name: 'Beginner',
        points_to_next_level: 100,
        actions_breakdown: [],
        recent_activities: []
      };
    }
  }


}

export const apiService = new ApiService();

console.log('✅ API Service initialized with complete modular FastAPI architecture');
console.log('🔗 All endpoints now use direct modular FastAPI routing with APIRouter');
console.log('🔐 Authentication, admin, and content endpoints integrated via PostgreSQL backend');
console.log('📊 Content counts endpoint added for real-time statistics');

export default apiService;
