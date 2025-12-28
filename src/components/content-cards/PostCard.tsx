import React from 'react';
import { MessageSquare, TrendingUp, Award } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    author: {
      name: string;
      avatar?: string;
      reputation?: number;
      isExpert?: boolean;
    };
    upvotes: number;
    commentCount: number;
    tags: string[];
    timestamp: string;
    category: string;
  };
  onClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Research': '#8b5cf6',
      'Discussion': '#3b82f6',
      'Help': '#f59e0b',
      'Expert': '#10b981',
    };
    return colors[category] || '#6b7280';
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border-l-4"
      style={{ borderLeftColor: getCategoryColor(post.category) }}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {post.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{post.author.name}</span>
                {post.author.isExpert && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <Award size={12} />
                    Expert
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{post.timestamp}</span>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: getCategoryColor(post.category) }}
          >
            {post.category}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {post.content}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm">
            <button className="flex items-center gap-1.5 text-gray-600 hover:text-purple-600 transition-colors">
              <TrendingUp size={16} />
              <span className="font-medium">{post.upvotes} upvotes</span>
            </button>
            <button className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors">
              <MessageSquare size={16} />
              <span className="font-medium">{post.commentCount} comments</span>
            </button>
          </div>
          {post.author.reputation && (
            <div className="text-xs text-gray-500">
              Reputation: {post.author.reputation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
