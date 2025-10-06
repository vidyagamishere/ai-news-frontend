import type { User, LoginCredentials, SignupCredentials, AITopic } from '../types/auth';
import DebugLogger from '../utils/debug';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://mindful-adventure-production-50fa.up.railway.app';

interface AuthResponse {
  user: User;
  access_token: string;
  isUserExist?: boolean;
}

interface OTPResponse {
  message: string;
  email: string;
  emailVerificationRequired: boolean;
  otpSent: boolean;
  expiresInMinutes: number;
}

class AuthService {
  private debug = new DebugLogger('AuthService');
  
  private async request(endpoint: string, options: RequestInit = {}) {
    this.debug.enter('request', { endpoint, method: options.method || 'GET' });
    const startTime = Date.now();
    
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      
      // Create enhanced error with all backend data preserved
      const enhancedError = new Error(errorData.message || `Request failed: ${response.status}`);
      (enhancedError as any).error_code = errorData.error_code;
      (enhancedError as any).status = errorData.status || response.status;
      (enhancedError as any).redirect_to_signin = errorData.redirect_to_signin;
      (enhancedError as any).redirect_to_signup = errorData.redirect_to_signup;
      (enhancedError as any).detailed_instructions = errorData.detailed_instructions;
      
      this.debug.error('request', enhancedError, Date.now() - startTime);
      throw enhancedError;
    }

    const data = await response.json();
    const executionTime = Date.now() - startTime;
    this.debug.exit('request', { 
      endpoint, 
      status: response.status, 
      hasData: !!data 
    }, executionTime);
    
    return data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request('/api/v2/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse | OTPResponse> {
    // For OTP-based signup, we just need email and name
    // Password validation is removed as we use OTP verification
    return this.sendOTP(credentials.email, credentials.name);
  }

  async validateToken(_token: string): Promise<User> {
    try {
      console.log('🔍 Validating token with API...');
      const user = await this.request('/api/v2/auth/profile');
      console.log('✅ Token validation successful');
      return user;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      // Clean up invalid token
      localStorage.removeItem('authToken');
      throw error;
    }
  }

  async updateUserPreferences(preferences: Partial<User['preferences']>): Promise<User> {
    console.log('🔗 Sending preferences update request:', preferences);
    
    try {
      const response = await this.request('/api/v2/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
      console.log('🔗 Preferences update response:', response);
      return response;
    } catch (error) {
      console.error('🔗 Preferences update failed:', error);
      
      // Fallback: If backend fails, get fresh user profile to check if it actually saved
      console.log('🔄 Attempting to fetch fresh profile as fallback...');
      try {
        const freshProfile = await this.request('/api/v2/auth/profile');
        console.log('🔄 Fresh profile fetched:', freshProfile);
        return freshProfile;
      } catch (profileError) {
        console.error('🔄 Profile fetch also failed:', profileError);
        throw error; // Throw original error
      }
    }
  }

  async upgradeSubscription(): Promise<User> {
    return this.request('/subscription/upgrade', {
      method: 'POST',
    });
  }

  async getAvailableTopics(): Promise<AITopic[]> {
    const response = await this.request('/ai-topics');
    // Only use categories from ai_categories_master table
    if (response.categories && Array.isArray(response.categories) && response.categories.length > 0) {
      return response.categories.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        category: category.category_label || 'general',
        selected: false // Add selected property for compatibility
      }));
    }
    // Throw error if no categories found to trigger fallback in components
    throw new Error('No categories found in ai_categories_master table');
  }

  async getUserRolesAndTopics(): Promise<{
    user_roles: any[];
    topics: AITopic[];
    content_types: any[];
  }> {
    const response = await this.request('/ai-topics');
    
    // Only use categories from ai_categories_master table
    let topics = [];
    if (response.categories && Array.isArray(response.categories) && response.categories.length > 0) {
      topics = response.categories.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        category: category.category_label || 'general',
        selected: false
      }));
    } else {
      // Throw error if no categories to maintain consistency
      throw new Error('No categories found in ai_categories_master table');
    }
    
    return {
      user_roles: response.user_roles || [],
      topics: topics,
      content_types: response.content_types || []
    };
  }

  async googleLogin(idToken: string): Promise<AuthResponse> {
    console.log('Sending Google login request with token length:', idToken.length);
    const response = await this.request('/api/v2/auth/google', {
      method: 'POST',
      body: JSON.stringify({ 
        credential: idToken  // Backend expects 'credential' field, not 'id_token'
      }),
    });
    console.log('🔍 Google login API response:', response);
    return response;
  }

  async sendOTP(email: string, name?: string, authMode: 'signin' | 'signup' = 'signin'): Promise<OTPResponse> {
    return this.request('/api/v2/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        name,
        auth_mode: authMode
      }),
    });
  }

  async verifyOTP(email: string, otp: string, userData: any): Promise<AuthResponse> {
    this.debug.enter('verifyOTP', { 
      email, 
      otp: '[REDACTED]', 
      userData 
    });
    
    const result = await this.request('/api/v2/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp,
        userData
      }),
    });
    
    this.debug.exit('verifyOTP', { 
      hasUser: !!result.user, 
      hasToken: !!result.token,
      userEmail: result.user?.email,
      isAdmin: result.user?.is_admin,
      isUserExist: result.isUserExist 
    });
    
    return result;
  }
}

export const authService = new AuthService();