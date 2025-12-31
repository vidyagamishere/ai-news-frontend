import React from 'react';

interface EmptyStateProps {
  type: 'posts' | 'learning';
  icon: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  const getGradient = () => {
    if (type === 'posts') return 'from-purple-500 to-blue-500';
    if (type === 'learning') return 'from-green-500 to-emerald-600';
    return 'from-gray-400 to-gray-600';
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div
        className={`w-24 h-24 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center text-6xl mb-6 shadow-lg`}
      >
        {icon}
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
        {title}
      </h3>
      
      <p className="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className={`px-8 py-3 bg-gradient-to-r ${getGradient()} text-white rounded-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
        >
          {actionText}
        </button>
      )}

      {/* Decorative elements */}
      <div className="mt-12 flex gap-4 text-4xl opacity-20">
        {type === 'posts' ? (
          <>
            <span>💬</span>
            <span>🗨️</span>
            <span>💡</span>
          </>
        ) : (
          <>
            <span>📚</span>
            <span>🎓</span>
            <span>🏆</span>
          </>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
