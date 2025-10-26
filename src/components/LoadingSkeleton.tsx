import React from 'react';
import '../styles/design-tokens.css';
import '../styles/components.css';

interface LoadingSkeletonProps {
  variant?: 'article-card' | 'text' | 'title' | 'paragraph' | 'avatar' | 'button';
  count?: number;
  height?: string;
  width?: string;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  count = 1,
  height,
  width,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'article-card':
        return (
          <div className={`skeleton skeleton-card ${className}`}>
            <div className="p-6 space-y-4">
              {/* Article tag */}
              <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div>
              
              {/* Article title */}
              <div className="space-y-2">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton" style={{ width: '60%', height: '1.5em' }}></div>
              </div>
              
              {/* Article summary */}
              <div className="space-y-2">
                <div className="skeleton skeleton-paragraph"></div>
                <div className="skeleton skeleton-paragraph"></div>
                <div className="skeleton skeleton-paragraph"></div>
              </div>
              
              {/* Meta information */}
              <div className="flex justify-between items-center mt-4">
                <div className="skeleton" style={{ width: '120px', height: '1em' }}></div>
                <div className="skeleton" style={{ width: '60px', height: '1em' }}></div>
              </div>
            </div>
          </div>
        );

      case 'title':
        return (
          <div 
            className={`skeleton skeleton-title ${className}`}
            style={{ 
              height: height || '1.5em',
              width: width || '80%'
            }}
          ></div>
        );

      case 'paragraph':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, index) => (
              <div 
                key={index}
                className={`skeleton skeleton-paragraph ${className}`}
                style={{ 
                  height: height || '1em',
                  width: index === count - 1 ? '75%' : '100%'
                }}
              ></div>
            ))}
          </div>
        );

      case 'avatar':
        return (
          <div 
            className={`skeleton ${className}`}
            style={{ 
              height: height || '40px',
              width: width || '40px',
              borderRadius: '50%'
            }}
          ></div>
        );

      case 'button':
        return (
          <div 
            className={`skeleton ${className}`}
            style={{ 
              height: height || '40px',
              width: width || '120px',
              borderRadius: '8px'
            }}
          ></div>
        );

      case 'text':
      default:
        return (
          <div 
            className={`skeleton skeleton-text ${className}`}
            style={{ 
              height: height || '1em',
              width: width || '100%'
            }}
          ></div>
        );
    }
  };

  if (variant === 'article-card' || variant === 'paragraph') {
    return <>{renderSkeleton()}</>;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

// Pre-built skeleton layouts for common use cases
export const ArticleCardSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 1, 
  className = '' 
}) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <LoadingSkeleton 
        key={index}
        variant="article-card" 
        className={className}
      />
    ))}
  </>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
    {/* Header skeleton */}
    <div className="space-y-4">
      <LoadingSkeleton variant="title" width="40%" />
      <LoadingSkeleton variant="paragraph" count={2} />
    </div>

    {/* Filter chips skeleton */}
    <div className="flex gap-3 flex-wrap">
      {Array.from({ length: 6 }).map((_, index) => (
        <LoadingSkeleton 
          key={index}
          variant="button" 
          width="80px" 
          height="32px"
        />
      ))}
    </div>

    {/* Article grid skeleton */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ArticleCardSkeleton count={6} />
    </div>
  </div>
);

export const LandingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    {/* Header skeleton */}
    <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto text-center space-y-4">
        <LoadingSkeleton variant="title" width="300px" className="mx-auto" />
        <LoadingSkeleton variant="text" width="200px" className="mx-auto" />
        <div className="flex justify-center gap-4 mt-6">
          <LoadingSkeleton variant="button" width="100px" />
          <LoadingSkeleton variant="button" width="120px" />
        </div>
      </div>
    </div>

    {/* Category navigation skeleton */}
    <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto flex gap-3 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, index) => (
          <LoadingSkeleton 
            key={index}
            variant="button" 
            width="120px" 
            height="36px"
          />
        ))}
      </div>
    </div>

    {/* Main content skeleton */}
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      {/* Category header skeleton */}
      <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 rounded-3xl p-8 space-y-4">
        <LoadingSkeleton variant="title" width="60%" />
        <LoadingSkeleton variant="paragraph" count={2} />
        <div className="grid grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="text-center space-y-2">
              <LoadingSkeleton variant="title" width="60px" className="mx-auto" />
              <LoadingSkeleton variant="text" width="80px" className="mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Content sections skeleton */}
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
            <LoadingSkeleton variant="title" width="200px" />
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <ArticleCardSkeleton count={3} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;