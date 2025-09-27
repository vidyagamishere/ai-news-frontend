import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackType?: 'icon' | 'placeholder' | 'hide';
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
  maxWidth?: string;
  lazy?: boolean;
}

const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = '',
  fallbackType = 'icon',
  aspectRatio = '16/9',
  maxWidth = '350px',
  lazy = true
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !imageLoaded) {
            setImageLoaded(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [lazy, imageLoaded]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth,
    aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s ease'
  };

  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff'
  };

  const placeholderStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '20px',
    color: '#64748b',
    backgroundColor: '#f8fafc'
  };

  // Don't render anything if error and fallbackType is 'hide'
  if (error && fallbackType === 'hide') {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`smart-image-container ${className}`}
      style={containerStyles}
    >
      {/* Loading State */}
      {loading && !error && (lazy ? imageLoaded : true) && (
        <div style={placeholderStyles}>
          <div className="loading-spinner" style={{
            width: '24px',
            height: '24px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Loading...</span>
        </div>
      )}

      {/* Error State */}
      {error && fallbackType !== 'hide' && (
        <div style={placeholderStyles}>
          {fallbackType === 'icon' ? (
            <>
              <AlertCircle size={32} color="#94a3b8" />
              <span style={{ fontSize: '12px', textAlign: 'center' }}>
                Image unavailable
              </span>
            </>
          ) : (
            <>
              <ImageIcon size={32} color="#94a3b8" />
              <span style={{ fontSize: '12px', textAlign: 'center' }}>
                {alt || 'Image placeholder'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Lazy Loading Placeholder */}
      {lazy && !imageLoaded && !error && (
        <div style={placeholderStyles}>
          <ImageIcon size={32} color="#cbd5e1" />
          <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Image loading...
          </span>
        </div>
      )}

      {/* Actual Image */}
      {!error && (lazy ? imageLoaded : true) && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={{
            ...imageStyles,
            opacity: loading ? 0 : 1
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? "lazy" : "eager"}
        />
      )}

      {/* Subtle overlay for better text readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, transparent 0%, rgba(59, 130, 246, 0.02) 100%)',
          pointerEvents: 'none',
          borderRadius: '8px'
        }}
      />
    </div>
  );
};

export default SmartImage;