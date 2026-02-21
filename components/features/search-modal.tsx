'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Clock, User, Gamepad2, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { searchService, SearchResult } from '@/lib/firebase/services/search';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(searchService.getRecentSearches());
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await searchService.search(
          searchTerm,
          user?.id || '',
          { type: 'all', limit: 20 }
        );
        setResults(searchResults);
      } catch (err) {
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [user?.id]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleResultClick = (result: SearchResult) => {
    searchService.addRecentSearch(result.title);
    onClose();
  };

  const handleRecentSearchClick = (term: string) => {
    setQuery(term);
  };

  const clearRecentSearches = () => {
    searchService.clearRecentSearches();
    setRecentSearches([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.05]">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground" />
          )}
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search players, games..."
            value={query}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 bg-transparent text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50"
            aria-label="Search"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-elevated border border-white/[0.08] text-[10px] text-muted-foreground rounded">
            <span>ESC</span>
          </kbd>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {error && (
            <div className="p-4 text-center">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(term)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-elevated transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-primary">{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!query && !recentSearches.length && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                Start typing to search for players
              </p>
              <p className="text-muted-foreground/60 text-xs mt-2">
                Try searching by username or display name
              </p>
            </div>
          )}

          {query.length > 0 && query.length < 2 && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Type at least 2 characters to search
              </p>
            </div>
          )}

          {query.length >= 2 && !isLoading && results.length === 0 && !error && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No results found for &quot;{query}&quot;</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Results ({results.length})
                </span>
              </div>
              {results.map((result) => (
                <SearchResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.05] text-xs text-muted-foreground text-center">
          Use <kbd className="px-1.5 py-0.5 bg-elevated border border-white/[0.08] rounded">↑</kbd>{' '}
          <kbd className="px-1.5 py-0.5 bg-elevated border border-white/[0.08] rounded">↓</kbd> to navigate,{' '}
          <kbd className="px-1.5 py-0.5 bg-elevated border border-white/[0.08] rounded">↵</kbd> to select
        </div>
      </div>
    </Modal>
  );
}

// Search Result Item Component
function SearchResultItem({ 
  result, 
  onClick 
}: { 
  result: SearchResult; 
  onClick: () => void;
}) {
  const icon = result.type === 'user' ? User : Gamepad2;
  const href = result.type === 'user' 
    ? `/hub/profile/${result.id}/` 
    : `/game/${result.id}/`;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded transition-colors',
        'hover:bg-elevated focus:bg-elevated focus:outline-none focus:ring-2 focus:ring-accent/50'
      )}
    >
      {result.imageUrl ? (
        <img
          src={result.imageUrl}
          alt={result.title}
          className="w-10 h-10 rounded bg-surface object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-elevated flex items-center justify-center">
          <icon className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground">{result.subtitle}</p>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 bg-elevated rounded">
        {result.type}
      </span>
    </Link>
  );
}

// Debounce utility
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
