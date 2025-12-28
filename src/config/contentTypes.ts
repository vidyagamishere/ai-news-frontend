// Content Type Configuration
export const CONTENT_TYPES = [
  {
    id: 'posts',
    name: 'Posts',
    icon: '🗨️',
    color: '#8b5cf6',
    description: 'Community discussions and insights',
    available: false, // Set to true when backend data is ready
  },
  {
    id: 'blogs',
    name: 'Articles',
    icon: '📰',
    color: '#3b82f6',
    description: 'In-depth articles and tutorials',
    available: true,
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    icon: '🎧',
    color: '#f59e0b',
    description: 'Audio content and interviews',
    available: true,
  },
  {
    id: 'videos',
    name: 'Videos',
    icon: '📹',
    color: '#ef4444',
    description: 'Visual learning and demos',
    available: true,
  },
  {
    id: 'learning',
    name: 'Learning',
    icon: '🎓',
    color: '#10b981',
    description: 'Structured courses and certifications',
    available: false, // Set to true when backend data is ready
  },
] as const;

export type ContentTypeId = typeof CONTENT_TYPES[number]['id'];

// Helper function to get content type configuration
export const getContentType = (id: ContentTypeId) => {
  return CONTENT_TYPES.find(type => type.id === id);
};

// Helper function to get content type color
export const getContentTypeColor = (id: ContentTypeId) => {
  return getContentType(id)?.color || '#6b7280';
};

// Helper function to get content type icon
export const getContentTypeIcon = (id: ContentTypeId) => {
  return getContentType(id)?.icon || '📄';
};

// Empty state messages for unavailable content types
export const EMPTY_STATE_MESSAGES = {
  posts: {
    icon: '🗨️',
    title: 'Community Discussions Coming Soon!',
    description: 'We\'re building an engaged community where you can discuss AI insights, ask questions, and share experiences with fellow learners. Join the waitlist to be notified when we launch!',
    actionText: 'Join Waitlist',
  },
  learning: {
    icon: '🎓',
    title: 'Premium Learning Labs Launching Soon!',
    description: 'Get ready for structured courses, expert-led tutorials, and certification programs to master AI & tech skills. Be the first to know when we launch premium learning paths!',
    actionText: 'Notify Me',
  },
} as const;
