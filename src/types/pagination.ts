/**
 * TypeScript interfaces for pagination
 */
export type { Article } from '../services/api';

export interface PaginationMeta {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  next_page: number | null;
  prev_page: number | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  items: T[];
  meta: PaginationMeta;
  timestamp: string;
}


export interface PaginationParams {
  page?: number;
  page_size?: number;
  content_type?: string;
  category_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}