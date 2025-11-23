/**
 * usePrefetch Hook
 * 
 * Smart prefetching: Load next page when user is at item 7 of 10.
 * Steve Jobs: "Make it fast before they even know they need it"
 */

import { useEffect, useRef } from 'react';

interface UsePrefetchOptions {
  currentIndex: number;
  totalItems: number;
  pageSize: number;
  hasMore: boolean;
  loading: boolean;
  onPrefetch: () => void;
  triggerThreshold?: number;  // Prefetch when X items remaining
}

export const usePrefetch = ({
  currentIndex,
  totalItems,
  pageSize,
  hasMore,
  loading,
  onPrefetch,
  triggerThreshold = 3
}: UsePrefetchOptions) => {
  const prefetchedRef = useRef<number>(0);

  useEffect(() => {
    const itemsRemaining = totalItems - currentIndex;
    const shouldPrefetch = 
      itemsRemaining <= triggerThreshold &&
      hasMore &&
      !loading &&
      prefetchedRef.current < totalItems;

    if (shouldPrefetch) {
      console.log(`🚀 Prefetching: ${itemsRemaining} items remaining`);
      onPrefetch();
      prefetchedRef.current = totalItems;
    }
  }, [currentIndex, totalItems, hasMore, loading, onPrefetch, triggerThreshold]);

  // Reset when items change (new data loaded)
  useEffect(() => {
    if (totalItems > prefetchedRef.current) {
      prefetchedRef.current = 0;
    }
  }, [totalItems]);
};