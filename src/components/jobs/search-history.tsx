'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Clock, Star, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { SearchFilters } from '@/types/jobs'

interface SearchHistoryItem {
  id: string
  query: string
  filters: SearchFilters
  timestamp: Date
  isSaved: boolean
}

interface SearchHistoryProps {
  onApplySearch: (filters: SearchFilters) => void
  currentFilters: SearchFilters
}

export function SearchHistory({ onApplySearch, currentFilters }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const { toast } = useToast()

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('jobSearchHistory')
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
      } catch (error) {
        console.error('Failed to parse search history:', error)
      }
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('jobSearchHistory', JSON.stringify(history))
    }
  }, [history])

  const addToHistory = (filters: SearchFilters) => {
    if (!filters.query.trim()) return // Don't save empty searches

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: filters.query,
      filters: { ...filters, page: 1 }, // Reset page when saving
      timestamp: new Date(),
      isSaved: false
    }

    // Remove duplicates and add new item to the beginning
    const filteredHistory = history.filter(
      item => item.query !== filters.query || 
      JSON.stringify(item.filters) !== JSON.stringify(newItem.filters)
    )
    
    setHistory([newItem, ...filteredHistory.slice(0, 19)]) // Keep max 20 items
  }

  const saveSearch = (id: string) => {
    setHistory(history.map(item => 
      item.id === id ? { ...item, isSaved: !item.isSaved } : item
    ))
    toast({
      title: "Search saved",
      description: "You can find this search in your saved searches."
    })
  }

  const deleteSearch = (id: string) => {
    setHistory(history.filter(item => item.id !== id))
    toast({
      title: "Search deleted",
      description: "The search has been removed from your history."
    })
  }

  const clearAllHistory = () => {
    setHistory([])
    localStorage.removeItem('jobSearchHistory')
    toast({
      title: "History cleared",
      description: "All search history has been removed."
    })
  }

  const formatFilters = (filters: SearchFilters) => {
    const parts = []
    if (filters.location) parts.push(`📍 ${filters.location}`)
    if (filters.employmentType) parts.push(`💼 ${filters.employmentType}`)
    if (filters.experienceLevel) parts.push(`📊 ${filters.experienceLevel}`)
    if (filters.isRemote) parts.push(`🏠 Remote`)
    if (filters.salaryMin || filters.salaryMax) {
      const salary = []
      if (filters.salaryMin) salary.push(`R${filters.salaryMin.toLocaleString()}`)
      if (filters.salaryMax) salary.push(`R${filters.salaryMax.toLocaleString()}`)
      parts.push(`💰 ${salary.join(' - ')}`)
    }
    return parts
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const recentSearches = history.filter(item => !item.isSaved).slice(0, 5)
  const savedSearches = history.filter(item => item.isSaved)

  if (!showHistory) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(true)}
          className="text-muted-foreground"
        >
          <Clock className="h-4 w-4 mr-2" />
          Recent Searches
        </Button>
        {savedSearches.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {savedSearches.length} saved
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Search History
        </h3>
        <div className="flex gap-2">
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllHistory}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(false)}
          >
            Close
          </Button>
        </div>
      </div>

      {savedSearches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Saved Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedSearches.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onApplySearch(item.filters)}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">{item.query}</div>
                  <div className="flex flex-wrap gap-1">
                    {formatFilters(item.filters).map((filter, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {filter}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      saveSearch(item.id)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSearch(item.id)
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {recentSearches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentSearches.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onApplySearch(item.filters)}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">{item.query}</div>
                  <div className="flex flex-wrap gap-1">
                    {formatFilters(item.filters).map((filter, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {filter}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(item.timestamp)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      saveSearch(item.id)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSearch(item.id)
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {history.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No search history yet</p>
              <p className="text-sm">Start searching for jobs to see your history here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}