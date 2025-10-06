/**
 * Template Gallery Component
 *
 * Displays available resume templates with filtering, search, and preview functionality.
 * Provides an intuitive interface for template selection and comparison.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Grid, List, Eye, Star, Download, ChevronRight } from 'lucide-react';
import { ResumeTemplate, TemplateCategory, TemplateFilters } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface TemplateGalleryProps {
  templates: ResumeTemplate[];
  onTemplateSelect: (template: ResumeTemplate) => void;
  onTemplatePreview: (template: ResumeTemplate) => void;
  selectedTemplateId?: string;
  loading?: boolean;
  className?: string;
}

interface TemplateCardProps {
  template: ResumeTemplate;
  isSelected?: boolean;
  onSelect: (template: ResumeTemplate) => void;
  onPreview: (template: ResumeTemplate) => void;
  compact?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  onPreview,
  compact = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(template);
  };

  const formatDownloads = (downloads: number): string => {
    if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}k`;
    }
    return downloads.toString();
  };

  const getBadgeColor = (category: TemplateCategory): string => {
    switch (category) {
      case TemplateCategory.PROFESSIONAL:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case TemplateCategory.MODERN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case TemplateCategory.INDUSTRY_SPECIFIC:
        return 'bg-green-100 text-green-800 border-green-200';
      case TemplateCategory.ACADEMIC:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case TemplateCategory.CREATIVE:
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          "group flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected && "border-blue-500 bg-blue-50 shadow-sm"
        )}
        onClick={() => onSelect(template)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-16 h-20 bg-gray-100 rounded mr-4 flex-shrink-0 overflow-hidden">
          {!imageError ? (
            <img
              src={template.preview.thumbnail}
              alt={template.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Grid className="w-6 h-6" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            <div className="flex items-center space-x-1 ml-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{template.metadata.rating}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{template.description}</p>
          <div className="flex items-center justify-between">
            <Badge className={getBadgeColor(template.category)} variant="outline">
              {template.category}
            </Badge>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="flex items-center">
                <Download className="w-3 h-3 mr-1" />
                {formatDownloads(template.metadata.downloads)}
              </div>
              {template.features.atsOptimized && (
                <Badge variant="secondary" className="text-xs">ATS</Badge>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handlePreview}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
        isSelected && "ring-2 ring-blue-500 shadow-lg"
      )}
      onClick={() => onSelect(template)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="relative">
          <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
            {!imageError ? (
              <img
                src={isHovered && template.preview.animated ? template.preview.animated : template.preview.large}
                alt={template.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Grid className="w-12 h-12" />
              </div>
            )}
          </div>

          {template.features.atsOptimized && (
            <Badge className="absolute top-2 right-2 bg-green-500 text-white" variant="secondary">
              ATS Optimized
            </Badge>
          )}

          {template.metadata.license.type !== 'free' && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white" variant="secondary">
              Premium
            </Badge>
          )}
        </div>

        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
          {template.name}
        </CardTitle>
        <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <Badge className={getBadgeColor(template.category)} variant="outline">
            {template.category}
          </Badge>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">{template.metadata.rating}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Download className="w-3 h-3 mr-1" />
              {formatDownloads(template.metadata.downloads)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {template.metadata.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.metadata.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.metadata.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center text-xs text-gray-500">
            <span>Updated {new Date(template.metadata.updated).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(template);
              }}
            >
              Select Template
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  onTemplateSelect,
  onTemplatePreview,
  selectedTemplateId,
  loading = false,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<Partial<TemplateFilters>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply additional filters
    if (filters.atsOptimized !== undefined) {
      filtered = filtered.filter(template => template.features.atsOptimized === filters.atsOptimized);
    }

    if (filters.premium !== undefined) {
      filtered = filtered.filter(template => {
        const isPremium = template.metadata.license.type !== 'free';
        return isPremium === filters.premium;
      });
    }

    if (filters.mobileOptimized !== undefined) {
      filtered = filtered.filter(template => template.features.mobileOptimized === filters.mobileOptimized);
    }

    return filtered;
  }, [templates, searchQuery, selectedCategory, filters]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(templates.map(t => t.category)));
    return cats.sort();
  }, [templates]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category as TemplateCategory | 'all');
  };

  const handleFilterChange = (key: keyof TemplateFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory !== 'all' || Object.keys(filters).length > 0 || searchQuery.trim();

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="group cursor-pointer">
              <CardHeader>
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Choose a Template</h1>
          <p className="text-gray-600 mt-1">
            Select a professional template to start building your resume
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {Object.keys(filters).length + (selectedCategory !== 'all' ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category.replace('-', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Features</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ats-optimized"
                      checked={filters.atsOptimized || false}
                      onCheckedChange={(checked) => handleFilterChange('atsOptimized', checked)}
                    />
                    <label htmlFor="ats-optimized" className="text-sm">
                      ATS Optimized
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-optimized"
                      checked={filters.mobileOptimized || false}
                      onCheckedChange={(checked) => handleFilterChange('mobileOptimized', checked)}
                    />
                    <label htmlFor="mobile-optimized" className="text-sm">
                      Mobile Optimized
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">License Type</label>
                <Select
                  value={filters.premium === undefined ? 'all' : filters.premium ? 'premium' : 'free'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      handleFilterChange('premium', undefined);
                    } else {
                      handleFilterChange('premium', value === 'premium');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <div className="px-2">
                  <Slider
                    value={[filters.minRating || 0]}
                    onValueChange={(value) => handleFilterChange('minRating', value[0])}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Any</span>
                    <span>{filters.minRating || 0}+ stars</span>
                  </div>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          {hasActiveFilters && ' with active filters'}
        </p>
        {filteredTemplates.length === 0 && hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <Alert>
          <AlertDescription>
            No templates found matching your criteria. Try adjusting your search or filters.
          </AlertDescription>
        </Alert>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={onTemplateSelect}
              onPreview={onTemplatePreview}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={onTemplateSelect}
              onPreview={onTemplatePreview}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;