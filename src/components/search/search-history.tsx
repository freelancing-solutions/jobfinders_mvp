'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchHistoryItem, SearchFilters } from '@/types/jobs';
import { createSearchQuery } from '@/lib/search-utils';

interface SearchHistoryProps {
  onSelect: (filters: Partial<SearchFilters>) => void;
  className?: string;
}

const STORAGE_KEY = 'job-search-history';

export function SearchHistory({ onSelect, className }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed.slice(0, 10)); // Keep only last 10 items
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save to localStorage
  const saveToHistory = (filters: SearchFilters, resultCount: number) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: filters.query || '',
      filters,
      timestamp: new Date().toISOString(),
      resultCount,
    };

    setHistory(prev => {
      const updated = [newItem, ...prev.filter(item => 
        JSON.stringify(item.filters) !== JSON.stringify(filters)
      )].slice(0, 10);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save search history:', error);
      }
      
      return updated;
    });
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  // Remove single item
  const removeItem = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update search history:', error);
      }
      return updated;
    });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // Get search description
  const getSearchDescription = (item: SearchHistoryItem) => {
    const query = createSearchQuery(item.filters);
    return query || 'All jobs';
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Recent Searches</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        </div>
        
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSelect(item.filters)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getSearchDescription(item)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(item.timestamp)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {item.resultCount} results
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Note: saveToHistory is available as a method within the SearchHistory component