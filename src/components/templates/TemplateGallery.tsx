/**
 * Template Gallery Component
 *
 * Displays a grid of available templates with filtering, search,
 * and selection functionality. Integrates with the template registry
 * and provides real-time preview capabilities.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Download,
  Eye,
  Heart,
  TrendingUp,
  Clock,
  Tag,
  ChevronDown,
  X,
  Check,
  Sparkles,
  Zap
} from 'lucide-react';
import { ResumeTemplate, TemplateCategory } from '@/types/resume';
import { templateRegistry } from '@/services/templates/template-registry';
import { templatePreviewGenerator } from '@/services/templates/template-preview-generator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface TemplateGalleryProps {
  onTemplateSelect?: (template: ResumeTemplate) => void;
  selectedTemplateId?: string;
  className?: string;
  showPremiumOnly?: boolean;
  maxVisible?: number;
  enableRecommendations?: boolean;
  userId?: string;
  jobTitle?: string;
  industry?: string;
  experienceLevel?: string;
}

interface FilterState {
  category?: TemplateCategory;
  subcategory?: string;
  sortBy: 'name' | 'rating' | 'downloads' | 'created' | 'updated';
  sortOrder: 'asc' | 'desc';
  premiumOnly: boolean;
  atsOptimized: boolean;
  minRating: number;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onTemplateSelect,
  selectedTemplateId,
  className,
  showPremiumOnly = false,
  maxVisible,
  enableRecommendations = true,
  userId,
  jobTitle,
  industry,
  experienceLevel
}) => {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState<FilterState>({
    sortBy: 'rating',
    sortOrder: 'desc',
    premiumOnly: showPremiumOnly,
    atsOptimized: false,
    minRating: 0
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<ResumeTemplate[]>([]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  // Load recommendations if enabled
  useEffect(() => {
    if (enableRecommendations && userId && jobTitle) {
      loadRecommendations();
    }
  }, [enableRecommendations, userId, jobTitle, industry, experienceLevel]);

  // Apply filters and search
  useEffect(() => {
    applyFiltersAndSearch();
  }, [templates, searchQuery, filterState]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const loadedTemplates = await templateRegistry.listTemplates({
        isActive: true,
        limit: maxVisible || 100
      });
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const loadedCategories = await templateRegistry.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadSubcategories = async (category: string) => {
    try {
      const loadedSubcategories = await templateRegistry.getSubcategories(category);
      setSubcategories(loadedSubcategories);
    } catch (error) {
      console.error('Failed to load subcategories:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const recommendedTemplates = await templateRegistry.getTemplatesByCategory(
        filterState.category as TemplateCategory || 'professional'
      );
      setRecommendations(recommendedTemplates.slice(0, 6));
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const applyFiltersAndSearch = useCallback(() => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.subcategory?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterState.category) {
      filtered = filtered.filter(template => template.category === filterState.category);
    }

    // Apply subcategory filter
    if (filterState.subcategory) {
      filtered = filtered.filter(template => template.subcategory === filterState.subcategory);
    }

    // Apply premium filter
    if (filterState.premiumOnly) {
      filtered = filtered.filter(template => template.isPremium);
    }

    // Apply ATS optimized filter
    if (filterState.atsOptimized) {
      filtered = filtered.filter(template => template.features?.atsOptimized);
    }

    // Apply rating filter
    if (filterState.minRating > 0) {
      filtered = filtered.filter(template => (template.metadata?.rating || 0) >= filterState.minRating);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filterState.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.metadata?.rating || 0;
          bValue = b.metadata?.rating || 0;
          break;
        case 'downloads':
          aValue = a.metadata?.downloadCount || 0;
          bValue = b.metadata?.downloadCount || 0;
          break;
        case 'created':
          aValue = new Date(a.metadata?.created || 0);
          bValue = new Date(b.metadata?.created || 0);
          break;
        case 'updated':
          aValue = new Date(a.metadata?.updated || 0);
          bValue = new Date(b.metadata?.updated || 0);
          break;
        default:
          return 0;
      }

      if (filterState.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, filterState]);

  const handleTemplateSelect = (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handlePreview = async (template: ResumeTemplate) => {
    try {
      setSelectedTemplate(template);
      setPreviewDialogOpen(true);

      // Generate preview if not already cached
      if (!template.previewUrl) {
        await templatePreviewGenerator.generatePreviews(template.templateId);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  const toggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId);
      } else {
        newFavorites.add(templateId);
      }
      return newFavorites;
    });
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilterState({
      sortBy: 'rating',
      sortOrder: 'desc',
      premiumOnly: showPremiumOnly,
      atsOptimized: false,
      minRating: 0
    });
    setSearchQuery('');
  };

  const TemplateCard: React.FC<{ template: ResumeTemplate }> = ({ template }) => {
    const isSelected = selectedTemplateId === template.templateId;
    const isFavorite = favorites.has(template.templateId);

    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-lg",
          isSelected && "ring-2 ring-blue-500 shadow-lg",
          "overflow-hidden"
        )}
        onClick={() => handleTemplateSelect(template)}
      >
        <CardHeader className="p-4">
          <div className="relative">
            {/* Template Preview Image */}
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden mb-3">
              <img
                src={template.previewUrl || '/api/placeholder/300/400'}
                alt={template.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = '/api/placeholder/300/400';
                }}
              />
              {template.isPremium && (
                <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-white bg-blue-500 rounded-full p-2" />
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg line-clamp-1">{template.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
                {template.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {template.subcategory}
                  </Badge>
                )}
                {template.features?.atsOptimized && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    <Zap className="w-3 h-3 mr-1" />
                    ATS Ready
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{(template.metadata?.rating || 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span>{template.metadata?.downloadCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(template.metadata?.updated || 0).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handlePreview(template);
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              className="flex-1"
              variant={isSelected ? "secondary" : "default"}
            >
              {isSelected ? "Selected" : "Use Template"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => toggleFavorite(template.templateId, e)}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Recommendations Section */}
      {enableRecommendations && recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommendations.map(template => (
              <TemplateCard key={template.templateId} template={template} />
            ))}
          </div>
          <Separator className="my-6" />
        </section>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* Category Filter */}
          <Select
            value={filterState.category}
            onValueChange={(value) => {
              handleFilterChange('category', value);
              if (value) loadSubcategories(value);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subcategory Filter */}
          {subcategories.length > 0 && (
            <Select
              value={filterState.subcategory}
              onValueChange={(value) => handleFilterChange('subcategory', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subcategories</SelectItem>
                {subcategories.map(subcategory => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          <Select
            value={`${filterState.sortBy}-${filterState.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
              <SelectItem value="downloads-desc">Most Popular</SelectItem>
              <SelectItem value="created-desc">Newest</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="updated-desc">Recently Updated</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant={filterState.premiumOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('premiumOnly', !filterState.premiumOnly)}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Premium Only
        </Button>
        <Button
          variant={filterState.atsOptimized ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('atsOptimized', !filterState.atsOptimized)}
        >
          <Zap className="w-4 h-4 mr-1" />
          ATS Optimized
        </Button>
        <Select
          value={filterState.minRating.toString()}
          onValueChange={(value) => handleFilterChange('minRating', parseInt(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Min Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Ratings</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="4.5">4.5+ Stars</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || filterState.category || filterState.subcategory ||
          filterState.premiumOnly || filterState.atsOptimized || filterState.minRating > 0) && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredTemplates.length} of {templates.length} templates
        </p>
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <Button onClick={resetFilters}>Clear All Filters</Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {filteredTemplates.map(template => (
            <TemplateCard key={template.templateId} template={template} />
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={selectedTemplate.largePreviewUrl || selectedTemplate.previewUrl || '/api/placeholder/600/800'}
                  alt={selectedTemplate.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Features</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.features?.atsOptimized && (
                      <Badge variant="secondary" className="text-xs">
                        ATS Optimized
                      </Badge>
                    )}
                    {selectedTemplate.features?.mobileOptimized && (
                      <Badge variant="secondary" className="text-xs">
                        Mobile Friendly
                      </Badge>
                    )}
                    {selectedTemplate.features?.printOptimized && (
                      <Badge variant="secondary" className="text-xs">
                        Print Ready
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (selectedTemplate) {
                      handleTemplateSelect(selectedTemplate);
                      setPreviewDialogOpen(false);
                    }
                  }}
                  className="flex-1"
                >
                  Use This Template
                </Button>
                <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateGallery;