// NEW API Router Service - Single Function Backend Architecture
import axios from 'axios';

// New Router-based backend URL
const ROUTER_API_BASE = import.meta.env.VITE_API_BASE || 'https://ai-news-scraper-production.up.railway.app';

// Create API instance for router
const routerApi = axios.create({
  baseURL: ROUTER_API_BASE,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Router request function
async function makeRouterRequest(endpoint: string, method: string = 'GET', params: any = {}, headers: any = {}) {
  try {
    // For GET requests, use query parameters
    if (method === 'GET') {
      const queryParams = new URLSearchParams({
        endpoint,
        ...params
      }).toString();
      
      const response = await routerApi.get(`/api/index?${queryParams}`, { headers });
      return response.data;
    } 
    // For POST requests, use JSON body
    else {
      const requestBody = {
        endpoint,
        method,
        params,
        headers
      };
      
      const response = await routerApi.post('/api/index', requestBody, { headers });
      return response.data;
    }
  } catch (error: any) {
    console.error(`Router request failed for ${endpoint}:`, error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    
    // Return error info for debugging
    throw new Error(`Router request failed: ${error.message}`);
  }
}

// Cache management (same as before)
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DAILY_CACHE_KEY = 'daily_cache_timestamp';

const shouldClearDailyCache = (): boolean => {
  const lastClear = localStorage.getItem(DAILY_CACHE_KEY);
  if (!lastClear) return true;
  
  const timeSinceLastClear = Date.now() - parseInt(lastClear);
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  return timeSinceLastClear > oneDayMs;
};

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

// Updated API service using router pattern
export const routerApiService = {
  // Get current digest
  getDigest: async (refresh?: boolean) => {
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
    
    console.log('📡 Fetching digest via router...');
    const data = await makeRouterRequest('digest', 'GET', params);
    setCachedData(cacheKey, data);
    return data;
  },

  // Get health status
  getHealth: async () => {
    console.log('📡 Fetching health via router...');
    return await makeRouterRequest('health', 'GET');
  },

  // Get sources configuration
  getSources: async () => {
    console.log('📡 Fetching sources via router...');
    return await makeRouterRequest('sources', 'GET');
  },

  // Trigger manual scraping
  triggerScrape: async (priorityOnly = false) => {
    const params = priorityOnly ? { priority_only: 'true' } : {};
    return await makeRouterRequest('scrape', 'GET', params);
  },

  // Trigger auto-update
  triggerAutoUpdate: async () => {
    return await makeRouterRequest('auto-update', 'POST', { action: 'trigger' });
  },

  // Get auto-update status
  getAutoUpdateStatus: async () => {
    return await makeRouterRequest('auto-update', 'GET');
  },

  // Personalized content endpoint with authentication
  getPersonalizedDigest: async (refresh?: boolean) => {
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
    
    console.log('📡 Fetching personalized digest via router...');
    const data = await makeRouterRequest('personalized-digest', 'GET', params, headers);
    setCachedData(cacheKey, data);
    return data;
  },

  // Test Neon database
  testNeon: async () => {
    return await makeRouterRequest('test-neon', 'GET');
  },

  // Generic router method for future endpoints
  callEndpoint: async (endpoint: string, method: string = 'GET', params: any = {}, requireAuth: boolean = false) => {
    let headers: any = {};
    
    if (requireAuth) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error(`Authentication required for ${endpoint}`);
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return await makeRouterRequest(endpoint, method, params, headers);
  }
};

export default routerApiService;