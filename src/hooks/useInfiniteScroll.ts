/**
 * useInfiniteScroll Hook
 * 
 * Detects when user scrolls near bottom and triggers loading.
 * Like Instagram/TikTok - seamless infinite scroll.
 */

import { useEffect, useRef, useCallback } from 'react';

export interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;  // Pixels from bottom to trigger load
  root?: Element | null;  // Scroll container (null = window)
}

export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  loading,
  threshold = 500,
  root = null
}: UseInfiniteScrollOptions) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting && hasMore && !loading) {
        console.log('🔄 Infinite scroll triggered!');
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading]
  );

  useEffect(() => {
    if (!sentinelRef.current) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root,
      rootMargin: `${threshold}px`,
      threshold: 0
    });

    // Observe sentinel element
    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, root, threshold]);

  return { sentinelRef };
};