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
  slug?: string;          // canonical SEO slug – stable, backend-generated

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
  content_type_label?: string;  // Display name (e.g., "Videos", "Courses")
  category_label?: string;      // Category display name
  created_date?: string;        // Creation date (fallback for published_date)
  
  // Metrics (REQUIRED)
  readTime: string;
  read_time?: string;
  significanceScore: number;
  significance?: number;
  significance_score?: number;
  likes_count?: number;
  views_count?: number;
  bookmarks_count?: number;
  comments_count?: number;
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
  
  // Total interaction counts from article_stats (visible to all users) ✅
  likes?: number;
  bookmarks?: number;
  views?: number;
  shares?: number;
  comments?: number;
  engagement_score?: number;
// ===== COURSE-SPECIFIC FIELDS (metadata from articles.metadata JSONB) =====
  // These are populated from metadata column for content_type_id = 5 (Courses)
  instructor?: string;                    // Course instructor name
  platform?: string;                      // Coursera, Udemy, edX, etc.
  provider?: string;                      // University/Company (Stanford, Google, MIT)
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration_hours?: number;                // Total course duration
  duration_weeks?: number;                // Estimated weeks to complete
  price?: number;                         // Course price (USD)
  currency?: string;                      // Price currency
  is_free?: boolean;                      // Free vs paid course
  has_certificate?: boolean;              // Offers certification
  course_type?: string;                   // Free, Paid, Certification, Audit
  rating?: number;                        // Course rating (0-5)
  num_reviews?: number;                   // Number of reviews
  num_students?: number;                  // Enrolled students
  completion_rate?: number;               // Percentage of students who complete
  modules?: string[];                     // Course modules/chapters
  prerequisites?: string[];               // Required knowledge
  learning_outcomes?: string[];           // What students will learn
  topics_covered?: string[];              // Topics in the course
  enrollment_url?: string;                // Direct enrollment link
  start_date?: string;                    // Course start date
  is_self_paced?: boolean;               // Self-paced vs scheduled
  enrollment_open?: boolean;              // Currently accepting enrollment
  ai_topics?: string[];                   // AI-specific categorization
  recommended_for?: string;               // Target audience
  skill_level_required?: string;          // Prerequisites summary
  
  // ===== EVENT-SPECIFIC FIELDS (for future content_type_id = 6) =====
  event_date?: string;                    // Event date/time
  event_location?: string;                // Physical or virtual location
  event_type?: string;                    // Conference, Workshop, Webinar
  is_virtual?: boolean;                   // Online vs in-person
  registration_url?: string;              // Event registration link
  event_hosts?: string[];                 // Event organizers
  
  // ===== JOB-SPECIFIC FIELDS (for future content_type_id = 7) =====
  company?: string;                       // Hiring company
  job_title?: string;                     // Position title
  job_location?: string;                  // Job location
  is_remote?: boolean;                    // Remote work option
  salary_range?: string;                  // Salary information
  experience_level?: string;              // Junior, Mid, Senior
  job_type?: string;                      // Full-time, Part-time, Contract
  application_url?: string;               // Job application link
  skills_required?: string[];             // Required skills
  
  // Generic metadata field (JSONB from database)
  metadata?: Record<string, any>;        // Stores all content-type-specific data
}



// Category structure
export interface Category {
  id: number;
  name: string;
  priority: number;
  description: string;
  category?: string;  // Added for easier mapping
  count?: number;  // Number of articles in this category
  content: {
    blogs: Article[];
    podcasts: Article[];
    videos: Article[];
    posts: Article[];
    courses: Article[];
    events: Article[];
    jobs: Article[];
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
