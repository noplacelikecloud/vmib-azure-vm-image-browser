import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SearchFilterProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  placeholder = 'Search...',
  value = '',
  onSearch,
  debounceMs = 300,
  className = '',
  disabled = false,
  showClearButton = true,
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchRef = useRef(onSearch);

  // Keep onSearch ref current
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Stable debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearchRef.current(query);
    }, debounceMs);
  }, [debounceMs]);

  // Update search query when value prop changes (only if different)
  useEffect(() => {
    if (value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value]); // Remove searchQuery from dependencies to avoid loops

  // Trigger debounced search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
    
    // Cleanup on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md
            placeholder-gray-500 text-gray-900 text-sm
            focus:outline-none focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${disabled ? 'opacity-50' : ''}
          `}
          aria-label={placeholder}
        />
        {showClearButton && searchQuery && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 focus:outline-none focus:text-gray-600"
            aria-label="Clear search"
          >
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};