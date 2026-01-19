/**
 * Central Article Types
 * Single source of truth for all article-related interfaces
 */

// Topic information
export interface AITopic {
  id: string;
  name: string;
  category: string;
}

// Main Article Interface
export interface Article {
  // Core identifiers
  id?: number | string;
  
  // Content
  title: string;
  url: string;
  description?: string;
  summary?: string;
  content_summary?: string;
  
  // Source information
  source: string;
  source_name?: string;
  author?: string;
  
  // Timestamps (REQUIRED)
  time: string;
  published_date?: string | null;  // ✅ FIXED: Allow null
  
  // Classification
  type?: string;
  content_type?: string;
  content_type_name?: string;
  category?: string;
  category_name?: string;
  
  // Metrics (REQUIRED)
  readTime: string;
  read_time?: string;
  significanceScore: number;
  significance?: number;
  significance_score?: number;
  likes_count?: number;
  views_count?: number;  // ✅ ADD THIS
  bookmarks_count?: number;  // ✅ ADD THIS
  comments_count?: number;  // ✅ ADD THIS
  engagement_score?: number;  // ✅ ADD THIS
  share_count?: number;
  
  // Media
  image?: string;  // Primary image field (mapped from backend image_url)
  image_url?: string;  // Backend field name
  thumbnail_url?: string;  // Thumbnail variant
  thumbnail?: string;  // Alternative thumbnail field
  imageUrl?: string;  // Legacy camelCase field
  audio_url?: string;
  
  // Topics (enhanced)
  topics?: AITopic[];
  topic_names?: string[];
  topic_categories?: string[];
  
  // Additional metadata
  duration?: number;
  impact?: 'high' | 'medium' | 'low';
  rankingScore?: number;
  ranking_score?: number;  // ✅ ADD: Backend field name
  complexity?: number;
  complexity_level?: number;
  
  // User interaction flags ✅ ADD THESE
  is_bookmarked?: boolean;
  is_liked?: boolean;
  is_viewed?: boolean;
   // Stats (using correct column name)
}

// Category structure
export interface Category {
  id: number;
  name: string;
  priority: number;
  description: string;
  content: {
    blogs: Article[];
    podcasts: Article[];
    videos: Article[];
  };
}

// Landing page content structure
export interface LandingContent {
  categories: Category[];
  total_categories: number;
}

// Content type info for UI
export interface ContentTypeInfo {
  label: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

// Helper function to get content type info
export const getContentTypeInfo = (type: string): ContentTypeInfo => {
  switch (type.toLowerCase()) {
    case 'podcast':
    case 'audio':
      return { label: 'PODCAST', bgColor: 'bg-amber-100', textColor: 'text-amber-800', icon: '🎧' };
    case 'video':
      return { label: 'VIDEO', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: '📹' };
    case 'post':
      return { label: 'POST', bgColor: 'bg-purple-100', textColor: 'text-purple-800', icon: '🗨️' };
    case 'learning':
    case 'course':
      return { label: 'COURSE', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: '🎓' };
    default:
      return { label: 'ARTICLE', bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: '📰' };
  }
};

// Helper to format time ago
export const formatTimeAgo = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  } catch {
    return 'Unknown';
  }
};

// Helper to format duration
export const formatDuration = (duration?: number): string => {
  if (!duration) return '';
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper to get article summary
export const getArticleSummary = (article: Article): string => {
  return article.summary || article.content_summary || article.description || '';
};

// Helper to get article source name
export const getArticleSource = (article: Article): string => {
  return article.source_name || article.source || 'Unknown';
};

// Helper to get article published date
export const getArticlePublishedDate = (article: Article): string => {
  return article.published_date || article.time || '';
};
