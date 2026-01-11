import { createContext, useContext } from 'react';
import type { Article } from '../services/api';

// Context for sharing dashboard state with other components
export interface DashboardContextType {
  content: Article[];
  selectedCategory: string;
  selectedTab: string;
  categories: string[];
}

export const DashboardContext = createContext<DashboardContextType>({
  content: [],
  selectedCategory: 'All',
  selectedTab: 'news',
  categories: []
});

export const useDashboardContext = () => {
  return useContext(DashboardContext);
};