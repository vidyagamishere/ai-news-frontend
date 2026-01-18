import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Typography,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp,
  Clear as ClearIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material';
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
  const theme = useTheme();
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
  }, [onSearch]);

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
      case 'trending': return <TrendingUp sx={{ fontSize: 18 }} />;
      case 'featured': return <SparklesIcon sx={{ fontSize: 18 }} />;
      default: return <SearchIcon sx={{ fontSize: 18 }} />;
    }
  };

  // Get color for question type - NO BACKGROUNDS
  const getQuestionTypeColor = (type: string) => {
    return ''; // Remove all background colors
  };

  return (
    <Box ref={searchRef} >
      {/* Search Input */}
      <form onSubmit={handleSubmit}>
        <TextField
          inputRef={inputRef}
          fullWidth
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          placeholder=""
          variant="outlined"
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading && <CircularProgress size={20} />}
                {query && !loading && (
                  <IconButton
                    size="medium"
                    onClick={handleClear}
                    edge="end"
                  >
                    <ClearIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </InputAdornment>
            ),
            sx: {
              bgcolor: 'background.default',
              borderRadius: 8,
              '& fieldset': {
                borderColor: 'divider',
                borderRadius: 8
              },
              '&:hover fieldset': {
                borderColor: 'text.secondary'
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main'
              }
            }
          }}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '1.125rem',
              py: 0.75
            }
          }}
        />
      </form>

      {/* Dropdown with Suggestions */}
      {showDropdown && isFocused && showSuggestions && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            borderRadius: 2,
            zIndex: 1300,
            maxHeight: '500px',
            overflowY: 'auto',
            width: '100%'
          }}
        >

          {/* Autocomplete Suggestions (when typing) */}
          {autocompleteSuggestions.length > 0 && (
            <List sx={{ py: 1 }}>
              {autocompleteSuggestions.map((suggestion, index) => (
                <ListItemButton
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{
                    py: 1.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.08)
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.text}
                    secondary={suggestion.category}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { color: 'text.primary' }
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      sx: { color: 'text.secondary' }
                    }}
                  />
                  {suggestion.type === 'trending' && (
                    <TrendingUp sx={{ fontSize: 16, color: 'text.disabled', ml: 1 }} />
                  )}
                </ListItemButton>
              ))}
            </List>
          )}

          {/* Curated Search Questions (when empty or focused) */}
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
            <List sx={{ py: 1 }}>
              {filteredQuestions.map((question) => (
                <ListItemButton
                  key={question.id}
                  onClick={() => handleQuestionClick(question)}
                  sx={{
                    py: 1.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.08)
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={question.question_text}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { color: 'text.primary' },
                      noWrap: true
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
            );
          })()}

          {/* Trending Searches */}
          {autocompleteSuggestions.length === 0 && trendingSearches.length > 0 && (
            <List sx={{ py: 1 }}>
              {trendingSearches.slice(0, 5).map((trending, index) => (
                <ListItemButton
                  key={index}
                  onClick={() => handleTrendingClick(trending)}
                  sx={{
                    py: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.08)
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TrendingUp sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={trending.term}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { color: 'text.primary' },
                      noWrap: true
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}

          {/* Empty State */}
          {autocompleteSuggestions.length === 0 &&
           searchQuestions.length === 0 &&
           trendingSearches.length === 0 && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 2, opacity: 0.2 }} />
              <Typography variant="body2" color="text.secondary">
                Start typing to search...
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default EnhancedSearchBar;
