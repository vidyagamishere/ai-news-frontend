import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, TrendingUp, Clock, Sparkles, X } from 'lucide-react';
import { apiService } from '../services/api';
import { cacheService, CACHE_DURATION } from '../utils/cacheService';

// Backend URL for direct API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'https://mindful-adventure-production-50fa.up.railway.app';

interface SearchQuestion {
  id: number;
  question_text: string;
  question_type: 'beginner' | 'advanced' | 'trending' | 'featured';
  category_name?: string;
  keywords: string[];
  priority: number;
  click_count: number;
}

interface AutocompleteSuggestion {
  text: string;
  type: 'curated' | 'trending' | 'popular' | 'related';
  category?: string;
  relevance: number;
}

interface TrendingSearch {
  term: string;
  category?: string;
  search_count: number;
  trending_score: number;
}

interface EnhancedSearchBarProps {
  onSearch: (query: string) => void;
  categoryId?: number;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  onSearch,
  categoryId,
  placeholder = "Search AI content...",
  className = "",
  showSuggestions = true
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuestions, setSearchQuestions] = useState<SearchQuestion[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ⚡ OPTIMIZED: Lazy load suggestions only when search bar is focused
  useEffect(() => {
    if (showSuggestions && isFocused && searchQuestions.length === 0) {
      // Load only when user actually interacts with search
      loadSearchQuestions();
      loadTrendingSearches();
    }
  }, [isFocused, showSuggestions]);

  // Load curated search questions with caching
  const loadSearchQuestions = async () => {
    try {
      console.log('🔍 Loading search questions for category:', categoryId);
      
      // Use cache with 30-minute TTL
      const cacheKey = `search_questions_${categoryId || 'all'}`;
      const response = await cacheService.get(
        cacheKey,
        () => apiService.get('search-suggestions/questions', {
          category_id: categoryId,
          limit: 6
        }),
        CACHE_DURATION.MEDIUM
      );
      
      console.log('✅ Search questions response:', response);
      setSearchQuestions(response.questions || []);
    } catch (error) {
      console.error('❌ Failed to load search questions:', error);
    }
  };

  // Load trending searches with caching
  const loadTrendingSearches = async () => {
    try {
      // Use cache with 5-minute TTL (trending data changes frequently)
      const cacheKey = `trending_searches_${categoryId || 'all'}`;
      const response = await cacheService.get(
        cacheKey,
        () => apiService.get('search-suggestions/trending', {
          category_id: categoryId,
          days: 7,
          limit: 5
        }),
        CACHE_DURATION.SHORT
      );
      
      setTrendingSearches(response.trending || []);
    } catch (error) {
      console.error('Failed to load trending searches:', error);
    }
  };

  // Debounced autocomplete with client-side filtering
  const handleInputChange = (value: string) => {
    setQuery(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Always show dropdown when typing
    setShowDropdown(true);

    // If query is empty or too short, show all curated questions
    if (value.length < 2) {
      setAutocompleteSuggestions([]);
      return;
    }

    // Debounce autocomplete API call
    debounceTimer.current = setTimeout(async () => {
      await loadAutocomplete(value);
    }, 300);
  };

  // Load autocomplete suggestions
  const loadAutocomplete = async (searchQuery: string) => {
    if (searchQuery.length < 2) return;

    try {
      setLoading(true);
      const response = await apiService.get('search-suggestions/autocomplete', {
        query: searchQuery,
        category_id: categoryId,
        limit: 8
      });
      setAutocompleteSuggestions(response.suggestions || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Autocomplete failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track search when executed
  const trackSearch = async (searchQuery: string, resultsCount: number = 0) => {
    try {
      await apiService.callEndpoint('search-suggestions/track', 'POST', {
        query: searchQuery,
        category_id: categoryId,
        results_count: resultsCount,
        session_id: getSessionId()
      });
    } catch (error) {
      console.error('Failed to track search:', error);
      // Don't fail the search if tracking fails
    }
  };

  // Track question click
  const trackQuestionClick = async (questionId: number) => {
    try {
      const params = new URLSearchParams({
        question_id: questionId.toString(),
        session_id: getSessionId(),
      });
      
      // Add category_context only if categoryId is set
      if (categoryId) {
        params.append('category_context', categoryId.toString());
      }
      
      // Call backend directly (not through router)
      await fetch(`${API_BASE_URL}/search-suggestions/track-question-click?${params.toString()}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track question click:', error);
    }
  };

  // Get or create session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('search_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('search_session_id', sessionId);
    }
    return sessionId;
  };

  // Handle search execution
  const executeSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setShowDropdown(false);
    setIsFocused(false);
    
    // Track the search
    trackSearch(searchQuery);
    
    // Execute the search callback
    onSearch(searchQuery);
  }, [onSearch, categoryId]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      executeSearch(query);
    }
  };

  // Handle clicking a search question
  const handleQuestionClick = (question: SearchQuestion) => {
    trackQuestionClick(question.id);
    executeSearch(question.question_text);
  };

  // Handle clicking an autocomplete suggestion
  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    executeSearch(suggestion.text);
  };

  // Handle clicking a trending search
  const handleTrendingClick = (trending: TrendingSearch) => {
    executeSearch(trending.term);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setAutocompleteSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Get icon for question type
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'trending': return <TrendingUp className="w-3.5 h-3.5" />;
      case 'featured': return <Sparkles className="w-3.5 h-3.5" />;
      default: return <Search className="w-3.5 h-3.5" />;
    }
  };

  // Get color for question type - NO BACKGROUNDS
  const getQuestionTypeColor = (type: string) => {
    return ''; // Remove all background colors
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Input - YouTube Style with Border */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={`
            flex items-center gap-1 px-4 py-2 bg-white rounded-full
            border border-black
            transition-all duration-200
          `}
        >
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowDropdown(true);
            }}
            placeholder={placeholder}
            className="flex-1 w-full text-gray-900 placeholder-gray-400 text-sm overflow-hidden text-ellipsis"
            style={{ 
              minWidth: 0, 
              border: 'none', 
              outline: 'none', 
              background: 'transparent',
              boxShadow: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              maxWidth: '95%'
            }}
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full transition-opacity hover:opacity-70"
              style={{ padding: '0px', background: 'transparent' }}
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}

          {loading && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </form>

      {/* Dropdown with Suggestions - YouTube Style Clean White Background */}
      {showDropdown && isFocused && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-50 max-h-[500px] overflow-y-auto w-full" style={{ border: '1px solid #e5e7eb' }}>

          {/* Autocomplete Suggestions (when typing) */}
          {autocompleteSuggestions.length > 0 && (
            <div className="py-2">
              {autocompleteSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer select-none"
                >
                  <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 truncate">{suggestion.text}</div>
                    {suggestion.category && (
                      <div className="text-xs text-gray-500 truncate">{suggestion.category}</div>
                    )}
                  </div>
                  {suggestion.type === 'trending' && (
                    <TrendingUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Curated Search Questions (when empty or focused) - YouTube Style Clean */}
          {autocompleteSuggestions.length === 0 && searchQuestions.length > 0 && (() => {
            // Filter questions based on current query
            const filteredQuestions = query.length >= 2
              ? searchQuestions.filter(q =>
                  q.question_text.toLowerCase().includes(query.toLowerCase()) ||
                  q.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
                )
              : searchQuestions;

            if (filteredQuestions.length === 0) return null;

            return (
            <div className="py-2">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  onClick={() => handleQuestionClick(question)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer select-none"
                >
                  <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 text-sm text-gray-800 min-w-0 truncate">
                    {question.question_text}
                  </div>
                </div>
              ))}
            </div>
            );
          })()}

          {/* Trending Searches - YouTube Style Clean */}
          {autocompleteSuggestions.length === 0 && trendingSearches.length > 0 && (
            <div className="py-1">
              {trendingSearches.slice(0, 5).map((trending, index) => (
                <div
                  key={index}
                  onClick={() => handleTrendingClick(trending)}
                  className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer select-none"
                >
                  <TrendingUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 text-sm text-gray-800 min-w-0 truncate">
                    {trending.term}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {autocompleteSuggestions.length === 0 &&
           searchQuestions.length === 0 &&
           trendingSearches.length === 0 && (
            <div className="p-8 text-center text-gray-400 bg-white">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Start typing to search...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchBar;
