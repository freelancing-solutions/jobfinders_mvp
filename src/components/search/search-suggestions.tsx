'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'trending' | 'suggestion';
  count?: number;
}

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  className?: string;
}

// Mock trending searches - in real app, this would come from an API
const TRENDING_SEARCHES = [
  'React Developer',
  'Remote Frontend',
  'Senior Engineer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
];

export function SearchSuggestions({ query, onSelect, className }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent-search-queries');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Generate suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      // Show trending and recent when no query
      const trending: SearchSuggestion[] = TRENDING_SEARCHES.map(text => ({
        text,
        type: 'trending' as const,
      }));
      
      const recent: SearchSuggestion[] = recentSearches.map(text => ({
        text,
        type: 'recent' as const,
      }));
      
      setSuggestions([...trending, ...recent]);
      return;
    }

    // Generate matching suggestions
    const matching: SearchSuggestion[] = [];
    
    // Check recent searches first
    recentSearches.forEach(text => {
      if (text.toLowerCase().includes(query.toLowerCase())) {
        matching.push({ text, type: 'recent' });
      }
    });
    
    // Check trending searches
    TRENDING_SEARCHES.forEach(text => {
      if (text.toLowerCase().includes(query.toLowerCase())) {
        matching.push({ text, type: 'trending' });
      }
    });
    
    // Remove duplicates
    const unique = matching.filter((item, index, arr) => 
      arr.findIndex(i => i.text === item.text) === index
    );
    
    setSuggestions(unique.slice(0, 8));
  }, [query, recentSearches]);

  // Save search to recent
  const saveSearch = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 10);
    setRecentSearches(updated);
    
    try {
      localStorage.setItem('recent-search-queries', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: string) => {
    saveSearch(suggestion);
    onSelect(suggestion);
    setIsOpen(false);
  };

  // Keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex].text);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'recent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get label for suggestion type
  const getSuggestionLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'trending':
        return 'Trending';
      case 'recent':
        return 'Recent';
      default:
        return '';
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className={cn('absolute top-full left-0 right-0 z-50 mt-1', className)}>
      <CardContent className="p-0">
        <div className="max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.text}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors',
                selectedIndex === index && 'bg-muted/50'
              )}
              onClick={() => handleSelect(suggestion.text)}
            >
              {getSuggestionIcon(suggestion.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {suggestion.text}
                </p>
                {suggestion.type !== 'suggestion' && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {getSuggestionLabel(suggestion.type)}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}