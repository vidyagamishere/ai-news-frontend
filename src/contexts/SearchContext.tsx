import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface SearchContextType {
  onSearch?: (query: string) => void;
  categoryId?: number;
  showSearch?: boolean;
}

const SearchContext = createContext<SearchContextType>({});

export const useSearch = () => useContext(SearchContext);

interface SearchProviderProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
  categoryId?: number;
  showSearch?: boolean;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({
  children,
  onSearch,
  categoryId,
  showSearch = false
}) => {
  return (
    <SearchContext.Provider value={{ onSearch, categoryId, showSearch }}>
      {children}
    </SearchContext.Provider>
  );
};
