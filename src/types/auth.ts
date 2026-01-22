export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  subscriptionTier: 'free' | 'premium';
  preferences: UserPreferences;
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  is_admin?: boolean; // Admin flag for admin interface access
  level?: number; // User level for gamification
  total_points?: number; // Total points for gamification

}

export interface UserPreferences {
  topics: AITopic[];
  newsletter_frequency: '12_hours' | 'daily' | 'weekly' | 'monthly';
  email_notifications: boolean;
  breaking_news_alerts?: boolean;
  newsletter_subscribed?: boolean;
  content_types: ContentType[];
  onboardingCompleted?: boolean;
  onboarding_completed?: boolean;
  user_roles?: string[];  // Array of role IDs (novice, student, professional, executive)
  category_ids_selected?: number[]; // Array of selected category IDs
  content_type_ids_selected?: number[]; // Array of selected content type IDs
  publisher_ids_selected?: number[]; // Array of selected publisher IDs
  professional_roles?: string[]; // More specific professional roles (developer, researcher, manager, etc.)
  role_type?: string;     // Single role type for backwards compatibility
  experience_level?: string; // AI experience level (beginner, intermediate, advanced, expert)
}

export interface AITopic {
  id: string;
  name: string;
  description: string;
  category: 'company' | 'research' | 'news' | 'platform' | 'startup' | 
           'international' | 'robotics' | 'automotive' | 'creative' | 
           'policy' | 'language' | 'gaming' | 'healthcare' | 'finance' |
           'hardware' | 'cloud' | 'events' | 'learning' |
           // Legacy categories for backward compatibility
           'technology' | 'industry' | 'ethics' | 'tools';
  selected: boolean;
}

export type ContentType = 'blogs' | 'podcasts' | 'videos' | 'events' | 'learning' | 'demos';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface SubscriptionTier {
  id: 'free' | 'premium';
  name: string;
  price: number;
  features: string[];
  limitations?: string[];
}