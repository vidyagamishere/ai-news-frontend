/**
 * usePagination Hook
 * 
 * Steve Jobs principle: "Simple can be harder than complex"
 * This hook makes pagination look effortless to the user.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import type { Article } from '../types/article';
import type { PaginationMeta } from '../types/pagination';

export interface UsePaginationOptions {
  content_type?: string;
  category_id?: number;
  page_size?: number;
  initialPage?: number;
  sort_by?: string;
  sort_order?: string;
  autoLoad?: boolean;
}

export const usePagination = (options: UsePaginationOptions = {}) => {
  const [items, setItems] = useState<Article[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(options.initialPage || 1);

  const fetchPage = useCallback(async (page: number, append: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getPaginatedContent({
        page,
        page_size: options.page_size || 10,
        content_type: options.content_type,
        category: options.category_id?.toString(),  // ✅ FIXED: Use 'category' instead of 'category_id'
        sort_by: options.sort_by,
        sort_order: options.sort_order
      });  

      const responseItems = response.items || response.articles || [];
      
      if (response.success || responseItems.length > 0) {
        if (append) {
          setItems(prev => [...prev, ...responseItems]);
        } else {
          setItems(responseItems);
        }
        
        if (response.meta) {
          setMeta(response.meta);
        }
        setCurrentPage(page);
        
        console.log(`📄 Loaded page ${page}: ${responseItems.length} items`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch content');
      console.error('❌ Pagination error:', err);
    } finally {
      setLoading(false);
    }
  }, [options.content_type, options.category_id, options.page_size]);

  const loadMore = useCallback(() => {
    if (meta?.has_next && !loading) {
      console.log('🔄 Loading more items...');
      fetchPage(currentPage + 1, true);  // Append mode
    }
  }, [meta, loading, currentPage, fetchPage]);

  const refresh = useCallback(() => {
    console.log('🔄 Refreshing from page 1...');
    setItems([]);
    setCurrentPage(1);
    fetchPage(1, false);  // Replace mode
  }, [fetchPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= (meta?.total_pages || 1)) {
      fetchPage(page, false);
    }
  }, [meta, fetchPage]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchPage(1, false);
    }
  }, [fetchPage, options.autoLoad]);

  return {
    items,
    meta,
    loading,
    error,
    currentPage,
    loadMore,
    refresh,
    goToPage,
    hasMore: meta?.has_next || false
  };
};