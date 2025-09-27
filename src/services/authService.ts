import type { User, LoginCredentials, SignupCredentials, AITopic } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://ai-news-scraper-production.up.railway.app';

interface AuthResponse {
  user: User;
  token: string;
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
  private async request(endpoint: string, options: RequestInit = {}) {
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
      
      throw enhancedError;
    }

    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request('/auth/login', {
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
      const user = await this.request('/auth/profile');
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
      const response = await this.request('/auth/preferences', {
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
        const freshProfile = await this.request('/auth/profile');
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
    const response = await this.request('/topics');
    // Handle new API structure with topics, user_roles, and content_types
    if (response.topics && Array.isArray(response.topics)) {
      return response.topics.map((topic: any) => ({
        ...topic,
        selected: false // Add selected property for compatibility
      }));
    }
    // Fallback for old API structure
    return Array.isArray(response) ? response : [];
  }

  async getUserRolesAndTopics(): Promise<{
    user_roles: any[];
    topics: AITopic[];
    content_types: any[];
  }> {
    const response = await this.request('/topics');
    return {
      user_roles: response.user_roles || [],
      topics: response.topics || [],
      content_types: response.content_types || []
    };
  }

  async googleLogin(idToken: string): Promise<AuthResponse> {
    console.log('Sending Google login request with token length:', idToken.length);
    const response = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ 
        credential: idToken  // Backend expects 'credential' field, not 'id_token'
      }),
    });
    console.log('🔍 Google login API response:', response);
    return response;
  }

  async sendOTP(email: string, name?: string, authMode: 'signin' | 'signup' = 'signin'): Promise<OTPResponse> {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        name,
        auth_mode: authMode
      }),
    });
  }

  async verifyOTP(email: string, otp: string, userData: any): Promise<AuthResponse> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp,
        userData
      }),
    });
  }
}

export const authService = new AuthService();